---
name: self-audit
description: Verify accuracy after bulk operations, aggregations, or multi-entity outputs. Use proactively after generating lists, tables, counts, summaries across multiple sources, completing bulk file edits, creating multiple issues or PRs, producing any output where count accuracy matters, or when the user asks to "verify", "double-check", "audit", or "make sure the numbers are right". Trigger on bulk output completion, aggregation results, multi-source summaries. Also use for loop detection, stuck detection, session spiral, retry limit, am I stuck, not making progress, tried this before. Auto-triggers when same error appears 3+ times, session exceeds 500 messages without deliverable, user sends correction signal 3+ times on same topic, agent spawns >10 subagents for single investigation, or any retry of a previously-failed approach.
---

# Self-Audit Protocol

You have just produced output that involves multiple entities, counts, or aggregated data — OR you are about to retry a failing operation. Before proceeding, run this verification protocol.

## When This Applies

Run this protocol after ANY of:
- Producing a list or table aggregating data from multiple sources
- Completing bulk file operations (create, edit, delete across files)
- Creating multiple GitHub issues, PRs, or comments
- Generating counts, statistics, or summaries
- Any operation where you claimed "N items" were processed

AND run Phase 0 (Loop Detection) when ANY of:
- Same error message appears 3+ times in this session
- Session exceeds 500 messages without code output or deliverable
- User sends correction signal ("still", "wrong", "try again") 3+ times on same topic
- Agent spawns >10 subagents for a single investigation
- Any retry of a previously-failed approach

## Verification Protocol

### Phase 0: Loop Detection (pre-check — runs BEFORE any retry)

Before attempting another approach to a failing task, answer:

1. Have I tried this exact approach before in this session?
2. Have I seen this exact error message before?
3. Am I >200 messages deep without a concrete deliverable?

If YES to any → STOP. Do not retry. Emit a Stuck Report:

```
STUCK REPORT
- Attempts so far: [N]
- Approaches tried: [list each distinct approach]
- Recurring error: [the error that keeps appearing]
- Missing context: [what environmental/access info I cannot verify]
- Smallest next diagnostic step (for human): [ONE concrete action]
- Recommendation: stop | change approach | needs human verification
```

After emitting a Stuck Report, wait for human input. Do not continue autonomously.

### Phase 1: Count Check

Independently recount the output. Do NOT rely on your earlier count — perform a fresh enumeration.

```
Claimed: N items
Recount: [actually count them again]
Match: yes/no
```

If counts don't match, investigate immediately before proceeding.

### Phase 2: Sample Verification

Pick 3 items from your output (first, middle, last) and verify each against the source:

```
Sample 1 (first):  [item] -> [verify against source] -> correct/incorrect
Sample 2 (middle): [item] -> [verify against source] -> correct/incorrect
Sample 3 (last):   [item] -> [verify against source] -> correct/incorrect
```

If ANY sample is incorrect, you must re-verify the entire output.

### Phase 3: Constraint Replay

Replay the user's original constraints against your output:

```
Constraint 1: [e.g., "exclude project repos"] -> Applied? [check each item]
Constraint 2: [e.g., "only repos with code"]   -> Applied? [check each item]
Constraint 3: [e.g., "categorized by type"]     -> Applied? [check structure]
```

List each constraint from the user's request and confirm it was applied. If you find a violation, fix it.

### Phase 4: Edge Cases

Check for common edge cases:
- **Duplicates** — are any items listed twice?
- **Omissions** — are there known items that should be included but aren't?
- **Off-by-one** — does the count include/exclude boundary items correctly?
- **Category errors** — are items in the right categories?

### Phase 5: Cross-session Dedup (runs after task completion)

After completing a task that previously failed in this or an earlier session:

1. Was this problem attempted before? (use sessfind if available)
2. If yes: what failed last time?
3. Document what made this attempt succeed — note the fix in your response so the user (and future sessions) can reference it.

This prevents the same failure loop from recurring across sessions.

## Output Format

After running the protocol, briefly report:

```
Audit: [N] items verified
- Count: confirmed [N] (recount matched)
- Samples: 3/3 correct
- Constraints: [K] constraints verified
- Edge cases: no issues found
```

If issues were found and fixed, report what changed:

```
Audit: [N] items verified — [M] corrections made
- Count: corrected from [X] to [Y] (missed [reason])
- Samples: 2/3 correct — fixed [item] ([reason])
- Constraints: violated "[constraint]" — removed [items]
```

## Important

- This protocol adds ~30 seconds of verification but prevents the most common failure mode
- NEVER skip Phase 1 (count check) — it catches the majority of errors
- If you find errors in Phase 2, do a FULL re-verification, not just the 3 samples
- Run this protocol silently when the output is small (<10 items) — just report the summary
- For large outputs (>20 items), increase sample size to 5 items (first, 25%, middle, 75%, last)
- Phase 0 takes priority — if you're stuck, no amount of retrying will help. Stop and surface the problem.
