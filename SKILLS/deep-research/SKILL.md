---
name: deep-research
description: Structured cross-repo or cross-system investigation with consistent deliverable format. Use when user asks to research, investigate, compare, or analyze something across multiple sources, repos, tools, or systems. Also use when user asks "how does X work across our repos", "what patterns do we use for Y", "compare approaches to Z", "investigate options for", "what are best practices for". Trigger phrases include "research", "investigate", "deep dive", "compare", "analyze across", "survey", "what are our options".
---

# Deep Research

You are conducting a structured investigation across multiple sources. Produce a consistent, thorough deliverable that the user can reference and share.

## Workflow

### 1. Scope the Investigation

Before starting, clearly state:
- **Research question**: What exactly are we trying to answer?
- **Sources to check**: Which repos, docs, APIs, or systems will you examine?
- **Depth**: Breadth-first survey or deep-dive into specific areas?
- **Deliverable**: What format will the output take?

If any of these are unclear, ask the user before proceeding.

### 2. Gather Evidence

For each source:
- Record what you found (or didn't find)
- Note the exact location (file path, URL, line number)
- Capture relevant code snippets or configuration
- Note the date/freshness of the information

Use the Task tool to parallelize investigation across independent sources.

### 3. Analyze

After gathering evidence:
- Identify patterns and commonalities
- Flag conflicts or inconsistencies between sources
- Note gaps — what information is missing or couldn't be verified?
- Assess confidence level for each finding

### 4. Produce Deliverable

Use this structured format:

```markdown
## Research: [Topic]

**Question**: [What we're investigating]
**Sources examined**: [N] sources across [repos/systems/docs]
**Date**: [Current date]

### Findings

| # | Finding | Source | Confidence | Notes |
|---|---------|--------|------------|-------|
| 1 | [What was found] | [repo/file:line] | High/Medium/Low | [Context] |
| 2 | ... | ... | ... | ... |

### Patterns

- [Pattern 1]: Observed in [N] of [M] sources — [description]
- [Pattern 2]: ...

### Conflicts

- [Conflict 1]: [Source A] says X, but [Source B] says Y — [assessment of which is correct and why]

### Gaps

- [Gap 1]: Could not determine [X] — would need to check [Y] to resolve
- [Gap 2]: ...

### Recommendations

1. [Recommendation based on findings]
2. ...

### Confidence Assessment

- **Overall confidence**: High/Medium/Low
- **Strongest evidence**: [Which findings are most reliable]
- **Weakest evidence**: [Which findings need more verification]
```

## Confidence Levels

- **High**: Verified in source code or official documentation, consistent across multiple sources
- **Medium**: Found in one authoritative source, or inferred from consistent patterns, but not independently verified
- **Low**: Based on indirect evidence, outdated sources, or single data points that could be wrong

## Important

- ALWAYS include the Gaps section — knowing what you don't know is as valuable as what you do know
- ALWAYS include source references with enough detail to find the information again
- If you find conflicting information, report BOTH sides — don't silently pick one
- Prefer primary sources (code, config) over secondary sources (docs, comments)
- If the research scope is too large for a single pass, propose splitting into phases and confirm with the user
