---
name: install-skill-repo
description: >-
  Install, list, update, or remove OpenCode skill repositories. Use this skill whenever the user
  wants to add a new skill repo, install skills from a GitHub URL, add a skills repository, set up
  a new skill source, or mentions a GitHub repo containing SKILL.md files that they want available
  in OpenCode. Also use when the user asks to list, update, or remove installed skill repos.
  Trigger phrases: "add this skill repo", "install skills from", "add skill", "remove skill repo",
  "update skill repos", "list skill repos".
---

# install-skill-repo — Manage OpenCode Skill Repositories

Manages installation, listing, updating, and removal of OpenCode skill repositories.

## Background

OpenCode discovers skills from `SKILL.md` files in specific directories (see [docs](https://opencode.ai/docs/skills/)). For **global** skills, the primary location is:

```
<opencode-config>/skills/<skill-name>/SKILL.md
```

Where `<opencode-config>` is the OpenCode configuration directory. Determine it by checking the environment variable `XDG_CONFIG_HOME` or falling back to `~/.config/opencode`. You can verify the actual path by looking at the working directory shown in the session environment info.

## Convention: skills-repos

To keep skill repositories manageable and updatable via `git pull`, this skill uses a convention of two sibling directories inside the OpenCode config:

```
<opencode-config>/
  skills-repos/          # One cloned git repo per directory
    <repo-name>/         # Full clone of the skills repository
  skills/                # One symlink per repo, pointing into skills-repos
    <repo-name> -> <opencode-config>/skills-repos/<repo-name>/<skills-subdir>
```

- `skills-repos/` holds the raw git clones — one directory per repository.
- `skills/` holds **symlinks** — one per repo — pointing to the directory inside the clone that contains the skill subdirectories (each with a `SKILL.md`).

This means skills stay up to date with a simple `git pull` in the cloned repo — no need to copy files around.

## Install a Skill Repo

### Step 1 — Determine the OpenCode config directory

Check the session environment for the working directory or config path. Common locations:

- Linux / macOS: `~/.config/opencode`
- Windows (WSL): `~/.config/opencode`
- Custom: `$XDG_CONFIG_HOME/opencode`

Verify `skills/` and `skills-repos/` exist. Create them if they don't:

```bash
mkdir -p <opencode-config>/skills-repos
mkdir -p <opencode-config>/skills
```

### Step 2 — Extract repo URL and name

- If the user gives a direct file URL (e.g. `github.com/org/repo/blob/main/skills/foo/SKILL.md`), extract the repo URL: `https://github.com/org/repo.git`
- Use the repo name as the directory name (e.g. `sessfind`, `my-skills`).
- Check if `<opencode-config>/skills-repos/<name>` already exists. If so, tell the user it's already installed and offer to update (`git pull`) instead.

### Step 3 — Clone

```bash
git clone <repo_url> <opencode-config>/skills-repos/<name>
```

### Step 4 — Find the skills root directory

The skills root is the directory that directly contains skill subdirectories (folders with `SKILL.md` inside). There is no standard layout across repos — common patterns include:

| Pattern | Description |
|---------|------------|
| `skills/` | Lowercase skills directory |
| `SKILLS/` | Uppercase skills directory |
| `.github/plugins/*/skills/` | Nested under .github |
| `.` (repo root) | Skills at the top level |

To discover it:

```bash
find <opencode-config>/skills-repos/<name> -name "SKILL.md" -not -path "*/.git/*" -maxdepth 6
```

Then determine the **skills root**:

1. For each `SKILL.md` found, note its path relative to the repo root.
2. The skill directory is the **parent** of each `SKILL.md` (e.g. `skills/sessfind/SKILL.md` means `skills/sessfind/` is a skill dir).
3. The skills root is the **deepest common parent** of all skill directories — the directory that contains all of them as children (direct or nested).
4. If `SKILL.md` files sit one level below the repo root (e.g. `<repo>/my-skill/SKILL.md`), the skills root is the repo root itself.
5. If skills are nested under categories (e.g. `SKILLS/devops/azure-appins/SKILL.md`), the skills root should be the top of that tree (`SKILLS/`), not the category.

**Ask the user to confirm** if there's ambiguity (e.g. multiple candidate directories).

### Step 5 — Create the symlink

Always use **absolute paths**:

```bash
ln -s <opencode-config>/skills-repos/<name>/<skills-root> <opencode-config>/skills/<name>
```

The symlink name in `skills/` should match the directory name in `skills-repos/`.

### Step 6 — Verify

```bash
find -L <opencode-config>/skills/<name> -name "SKILL.md"
```

Report to the user:
- How many skills were installed
- Their names (parsed from the SKILL.md frontmatter `name:` field or directory name)

## List Installed Skill Repos

```bash
for link in <opencode-config>/skills/*; do
  name=$(basename "$link")
  target=$(readlink "$link")
  count=$(find -L "$link" -name "SKILL.md" 2>/dev/null | wc -l)
  echo "$name -> $target ($count skills)"
done
```

Show a table with: name, symlink target, skill count.

## Update Skill Repos

Update one:

```bash
git -C <opencode-config>/skills-repos/<name> pull --ff-only
```

Update all:

```bash
for repo in <opencode-config>/skills-repos/*/; do
  echo "Updating $(basename "$repo")..."
  git -C "$repo" pull --ff-only
done
```

Report which repos had changes.

## Remove a Skill Repo

**Always confirm with the user before deleting.**

```bash
rm <opencode-config>/skills/<name>
rm -rf <opencode-config>/skills-repos/<name>
```

## Error Handling

- **Clone fails**: Check if the URL is valid and accessible. Suggest HTTPS vs SSH if one fails.
- **No SKILL.md found**: Warn the user the repo doesn't appear to contain skills. Offer to remove it.
- **Name conflict**: If a symlink with that name already exists in `skills/`, ask the user for an alternative name.
- **Single file URL**: If the user pastes a URL to just one SKILL.md file, clone the full repo anyway — this keeps it updatable via `git pull`.
- **skills-repos/ doesn't exist**: Create it. This is the first time using this convention.
