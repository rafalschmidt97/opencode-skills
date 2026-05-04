# better-compaction

Replaces OpenCode's default compaction prompt with one that preserves critical context: exact technical values, user-pasted content, behavioral constraints, and debugging state.

Also writes compaction summaries to `.opencode/handoffs/<date>-<topic>.md` for cross-session persistence.

Motivated by: https://github.com/anomalyco/opencode/issues/16512

## What it does

- Custom compaction prompt that instructs the LLM to keep specifics (paths, error messages, config values) instead of generalizing
- Structured output template: Goal, User Instructions, Key Content, Discoveries, Progress, Next Steps, Relevant Files
- Writes each compaction to disk so the next session can pick up where the last one left off

## Setup

Copy `better-compaction.ts` to `~/.config/opencode/plugins/better-compaction.ts`, or use the repo's `install.sh` to symlink.

## Toggle off

```bash
OPENCODE_COMPACTION_DEFAULT=1 opencode
```

Or delete the file to permanently revert to the built-in prompt.
