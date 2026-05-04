# opencode-skills

Personal collection of [Agent Skills](https://agentskills.io) and [OpenCode plugins](https://opencode.ai/docs/plugins/) for AI coding agents.

Skills work with [OpenCode](https://opencode.ai), [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), and [GitHub Copilot CLI](https://docs.github.com/en/copilot).

## Installation

### As an OpenCode skill repo

If you use [OpenCode](https://opencode.ai), ask the agent to install this repo:

```
Install skills from https://github.com/rafalschmidt97/opencode-skills
```

This registers the repo and OpenCode discovers all `SKILL.md` files automatically.

### Plugins

Plugins require an extra step since OpenCode doesn't auto-discover plugins from skill repos.

```bash
# Clone (or use existing skill repo clone)
git clone https://github.com/rafalschmidt97/opencode-skills.git
cd opencode-skills

# Symlink plugins to OpenCode's plugin directory
./install.sh
```

This creates symlinks in `~/.config/opencode/plugins/` pointing back to the repo, so `git pull` keeps them updated.

## Available Skills

### Workflow

| Skill | Description |
|---|---|
| [grill-me](SKILLS/workflow/grill-me/) | Stress-test a plan or design through relentless interviewing |
| [openspec-nudge](SKILLS/workflow/openspec-nudge/) | Detect complex/bulk tasks and nudge toward OpenSpec workflow |
| [self-audit](SKILLS/workflow/self-audit/) | Verify accuracy after bulk operations and aggregations |

### Development

| Skill | Description |
|---|---|
| [tdd](SKILLS/development/tdd/) | Test-driven development with red-green-refactor loop |
| [improve-codebase-architecture](SKILLS/development/improve-codebase-architecture/) | Find architectural improvement opportunities in a codebase |

### Research

| Skill | Description |
|---|---|
| [deep-research](SKILLS/research/deep-research/) | Structured cross-repo or cross-system investigation |
| [opencode-session-search](SKILLS/research/opencode-session-search/) | Search and retrieve OpenCode session history |

### Writing

| Skill | Description |
|---|---|
| [edit-article](SKILLS/writing/edit-article/) | Edit and improve articles by restructuring and tightening prose |
| [write-a-prd](SKILLS/writing/write-a-prd/) | Create a PRD through user interview and codebase exploration |
| [prd-to-issues](SKILLS/writing/prd-to-issues/) | Break a PRD into GitHub issues using vertical slices |

### Tooling

| Skill | Description |
|---|---|
| [install-skill-repo](SKILLS/tooling/install-skill-repo/) | Install, list, update, or remove OpenCode skill repositories |
| [agent-browser](SKILLS/tooling/agent-browser/) | Browser automation CLI for AI agents |

## Plugins

| Plugin | Description |
|---|---|
| [better-compaction](plugins/better-compaction/) | Custom compaction prompt that preserves critical context + writes handoff files to `.opencode/handoffs/` |
| [notify](plugins/notify/) | Time-based notification routing: macOS native during work hours, push via ntfy after hours |

## Repository Structure

```
opencode-skills/
├── SKILLS/
│   ├── workflow/           # Process and quality skills
│   ├── development/        # Code-focused skills
│   ├── research/           # Investigation and search skills
│   ├── writing/            # Content creation and planning skills
│   └── tooling/            # Agent tooling and browser automation skills
├── plugins/
│   ├── better-compaction/  # Custom compaction with handoff files
│   └── notify/             # Push notification routing (ntfy + macOS native)
├── install.sh              # Plugin installer (symlinks to ~/.config/opencode/plugins/)
└── README.md
```
