---
name: self-audit
description: Verify accuracy after bulk operations, aggregations, or multi-entity outputs. Use proactively after generating lists, tables, counts, summaries across multiple sources, completing bulk file edits, creating multiple issues or PRs, producing any output where count accuracy matters, or when the user asks to "verify", "double-check", "audit", or "make sure the numbers are right". Trigger on bulk output completion, aggregation results, multi-source summaries.
---

# Self-Audit Protocol

You have just produced output that involves multiple entities, counts, or aggregated data. Before presenting results as final, run this verification protocol to catch the data accuracy errors (FM1) that are the most common failure mode in bulk operations.

## When This Applies

Run this protocol after ANY of:
- Producing a list or table aggregating data from multiple sources
- Completing bulk file operations (create, edit, delete across files)
- Creating multiple GitHub issues, PRs, or comments
- Generating counts, statistics, or summaries
- Any operation where you claimed "N items" were processed

## Verification Protocol

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
