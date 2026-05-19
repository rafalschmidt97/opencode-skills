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

Plugins require an extra step since OpenCode doesn't auto-discover plugins from skill repos. The install script creates symlinks pointing back to the clone, so **the clone must be in a persistent location** (not a temp directory).

```bash
# Clone into a persistent location (e.g. the OpenCode skills directory)
git clone https://github.com/rafalschmidt97/opencode-skills.git \
  ~/.config/opencode/skills/opencode-skills

# Symlink plugins to OpenCode's plugin directory
~/.config/opencode/skills/opencode-skills/install.sh
```

This creates symlinks in `~/.config/opencode/plugins/` pointing back to the repo, so `git pull` keeps them updated. If you delete or move the clone, the symlinks will break.

## Available Skills

| Skill | Description |
|---|---|
| [agent-browser](SKILLS/agent-browser/) | Browser automation CLI for AI agents |
| [crawl4ai](SKILLS/crawl4ai/) | Crawl and extract content from web pages |
| [deep-research](SKILLS/deep-research/) | Structured cross-repo or cross-system investigation |
| [edit-article](SKILLS/edit-article/) | Edit and improve articles by restructuring and tightening prose |
| [excalidraw-diagrams](SKILLS/excalidraw-diagrams/) | Create and export Excalidraw architecture diagrams |
| [gdocs-to-markdown](SKILLS/gdocs-to-markdown/) | Convert Google Docs to Markdown |
| [grill-me](SKILLS/grill-me/) | Stress-test a plan or design through relentless interviewing |
| [handoff](SKILLS/handoff/) | Compact conversation into a handoff document for next session |
| [humanize-text](SKILLS/humanize-text/) | Rewrite AI-generated text to sound naturally human-written |
| [humanize-text-pl](SKILLS/humanize-text-pl/) | Rewrite AI-generated Polish text to sound human |
| [improve-codebase-architecture](SKILLS/improve-codebase-architecture/) | Find architectural improvement opportunities in a codebase |
| [install-skill-repo](SKILLS/install-skill-repo/) | Install, list, update, or remove OpenCode skill repositories |
| [markdown-to-gdocs](SKILLS/markdown-to-gdocs/) | Upload Markdown files as Google Docs |
| [opencode-session-search](SKILLS/opencode-session-search/) | Search and retrieve OpenCode session history |
| [openspec-nudge](SKILLS/openspec-nudge/) | Detect complex/bulk tasks and nudge toward OpenSpec workflow |
| [pdf-to-markdown](SKILLS/pdf-to-markdown/) | Convert PDF files to clean, structured Markdown |
| [prd-to-issues](SKILLS/prd-to-issues/) | Break a PRD into GitHub issues using vertical slices |
| [searxng-search](SKILLS/searxng-search/) | Search the web using a local SearXNG metasearch engine |
| [self-audit](SKILLS/self-audit/) | Verify accuracy after bulk operations and aggregations |
| [sessfind](SKILLS/sessfind/) | Search past AI sessions across Copilot, Claude Code, OpenCode, Cursor |
| [skill-creator](SKILLS/skill-creator/) | Create, test, and optimize skill descriptions (multi-backend LLM support) |
| [tdd](SKILLS/tdd/) | Test-driven development with red-green-refactor loop |
| [write-a-prd](SKILLS/write-a-prd/) | Create a PRD through user interview and codebase exploration |

## Plugins

| Plugin | Description |
|---|---|
| [better-compaction](plugins/better-compaction/) | Custom compaction prompt that preserves critical context + writes handoff files to `.opencode/handoffs/` |
| [notify](plugins/notify/) | Time-based notification routing: macOS native during work hours, push via ntfy after hours |

## Repository Structure

```
opencode-skills/
├── SKILLS/              # All skills (flat structure, one dir per skill)
├── plugins/
│   ├── better-compaction/  # Custom compaction with handoff files
│   └── notify/             # Push notification routing (ntfy + macOS native)
├── install.sh              # Plugin installer (symlinks to ~/.config/opencode/plugins/)
└── README.md
```
