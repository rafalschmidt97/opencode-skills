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

## How It Works

OpenCode skills live in two directories:

```
~/.config/opencode/
  skills-repos/    # One cloned git repo per directory
    <repo-name>/   # e.g. sessfind/, anthropics-skills/
  skills/          # One symlink per repo, pointing into skills-repos/
    <repo-name> -> ~/.config/opencode/skills-repos/<repo-name>/<skills-subdir>
```

Each entry in `skills/` is a **symlink** whose target is the directory inside the cloned repo
that directly contains skill subdirectories (each with a `SKILL.md`).


## Install a Skill Repo

### Step 1 — Extract repo URL and name

- If the user gives a direct file URL (e.g. `github.com/org/repo/blob/main/skills/foo/SKILL.md`), extract the repo URL: `https://github.com/org/repo.git`
- Use the repo name as the directory name (e.g. `sessfind`, `my-skills`).
- Check if `~/.config/opencode/skills-repos/<name>` already exists. If so, tell the user it's already installed and offer to update (`git pull`) instead.

### Step 2 — Clone

```bash
git clone <repo_url> ~/.config/opencode/skills-repos/<name>
```

### Step 3 — Find the skills root directory

The skills root is the directory that directly contains skill subdirectories (folders with `SKILL.md` inside). Repos have no standard — common patterns are `skills/`, `SKILLS/`, `.github/plugins/*/skills/`, or the repo root itself.

To discover it:

```bash
find ~/.config/opencode/skills-repos/<name> -name "SKILL.md" -not -path "*/.git/*" -maxdepth 6
```

Then determine the **skills root**:

1. For each `SKILL.md` found, note its path relative to the repo root.
2. The skill directory is the **parent** of each `SKILL.md` (e.g. `skills/sessfind/SKILL.md` means `skills/sessfind/` is a skill dir).
3. The skills root is the **deepest common parent** of all skill directories — the directory that contains all of them as children (direct or nested).
4. If `SKILL.md` files sit one level below the repo root (e.g. `<repo>/my-skill/SKILL.md`), the skills root is the repo root itself (`.`).
5. If skills are nested under categories (e.g. `SKILLS/devops/azure-appins/SKILL.md`), the skills root should be the top of that tree (`SKILLS/`), not the category.

**Ask the user to confirm** if there's ambiguity (e.g. multiple candidate directories).

### Step 4 — Create the symlink

Always use **absolute paths**:

```bash
ln -s /absolute/path/to/skills-repos/<name>/<skills-root> ~/.config/opencode/skills/<name>
```

The symlink name in `skills/` should match the directory name in `skills-repos/`.

### Step 5 — Verify

```bash
find -L ~/.config/opencode/skills/<name> -name "SKILL.md"
```

Report to the user:
- How many skills were installed
- Their names (parsed from the SKILL.md frontmatter `name:` field or directory name)

## List Installed Skill Repos

```bash
for link in ~/.config/opencode/skills/*; do
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
git -C ~/.config/opencode/skills-repos/<name> pull --ff-only
```

Update all:

```bash
for repo in ~/.config/opencode/skills-repos/*/; do
  echo "Updating $(basename "$repo")..."
  git -C "$repo" pull --ff-only
done
```

Report which repos had changes.

## Remove a Skill Repo

**Always confirm with the user before deleting.**

```bash
rm ~/.config/opencode/skills/<name>
rm -rf ~/.config/opencode/skills-repos/<name>
```

## Error Handling

- **Clone fails**: Check if the URL is valid and accessible. Suggest HTTPS vs SSH if one fails.
- **No SKILL.md found**: Warn the user the repo doesn't appear to contain skills. Offer to remove it.
- **Name conflict**: If a symlink with that name already exists in `skills/`, ask the user for an alternative name.
- **Single file URL**: If the user pastes a URL to just one SKILL.md file, clone the full repo anyway — this keeps it updatable via `git pull`.
