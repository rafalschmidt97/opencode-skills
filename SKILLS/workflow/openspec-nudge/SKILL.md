---
name: openspec-nudge
description: Detect complex or bulk tasks and nudge toward OpenSpec workflow. Use proactively when user asks to do something across multiple repos, migrate or refactor a large surface area, create many issues or PRs at once, do bulk operations on 5+ entities, implement a multi-step feature touching several files or systems, or when single-shotting has already produced corrections. Trigger phrases include "for each repo", "across all", "migrate", "bulk", "batch", "rollout", "for every", "update all repos".
---

# OpenSpec Nudge

You have detected a task that is likely too complex or broad for a single-shot approach. Before proceeding, help the user make a deliberate choice about their workflow.

## Detection Criteria

This skill triggers when the user's request matches ANY of:

1. **Multi-entity scope** — the task targets 5+ repos, files, services, issues, or PRs
2. **Cross-repo intent** — the task mentions "across repos", "for each repo", "all repositories", "every service"
3. **Migration/refactoring** — large-surface changes like "migrate from X to Y", "upgrade all", "refactor across"
4. **Bulk creation** — "create issues for each", "open PRs for all", "add file to every repo"
5. **Repeated corrections** — the user has already corrected you 2+ times on the current task, suggesting the task is more complex than initially assumed

## What To Do

**Step 1: Acknowledge the complexity**

Briefly explain WHY this task benefits from structured planning:
- Multiple entities = higher risk of data accuracy errors (FM1)
- Cross-repo = needs constraint extraction and dry-run verification
- Bulk operations = need the 4-phase protocol to avoid partial failures

**Step 2: Present options**

Use the Question tool to ask the user:

```
This looks like a complex task that touches multiple [repos/entities/systems].
Based on analysis of past sessions, these tasks have a higher correction rate
when single-shotted. Would you like to:
```

Options:
- **Explore first** — Use `/opsx-explore` to think through the approach, investigate unknowns, and clarify requirements before committing to a plan
- **Propose a change** — Use `/opsx-propose` to generate a complete proposal with design decisions, specs, and implementation tasks
- **Continue as-is** — Proceed with the current approach (you know what you're doing)

**Step 3: Follow the user's choice**

- If **Explore**: Invoke the openspec-explore skill
- If **Propose**: Invoke the openspec-propose skill
- If **Continue**: Proceed normally, but consider loading the `bulk-ops` or `self-audit` skill if the task involves bulk operations or aggregation

## Important

- NEVER block the user — always offer "continue as-is" as an option
- NEVER be preachy — one short sentence explaining why, then present options
- If the user has already started an OpenSpec change for this task, don't nudge again
- If the user explicitly says "just do it" or "skip planning", respect that immediately
