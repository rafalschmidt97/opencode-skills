---
name: debrief
description: "Generates a personalized 1:1 prep/debrief by reading a person's vault profile, recent call notes, GitHub activity (PRs, commits, issues), and project board status. Produces an agenda with context, talking points, and follow-ups. Use when the user says 'prepare my 1:1', 'debrief for [name]', '1:1 prep', 'what should I discuss with [name]', 'catch me up on [name]', 'prep for my meeting with [name]', or mentions preparing for a direct report conversation. Do NOT use for delivering feedback (use feedback skill) or processing meeting transcripts (use read-meeting-notes)."
metadata:
  version: 1.0.0
---

# 1:1 Debrief & Prep

Generate a personalized, data-rich 1:1 preparation by pulling context from the vault and external tools.

## Before Starting

1. **Identify the person.** The user must name a person. Search the vault for their profile note (tagged `person` in frontmatter).
2. **Read the person's profile.** Extract from frontmatter: `role`, `team`, `github`, `board`, `supervisor`, and any other fields.
3. **Read recent call notes.** List files in the person's folder, sorted by date DESC. Read the last 3-5 call notes to understand recent conversation history, open action items, and themes.
4. **Check AGENTS.md** for any org-specific configuration (GitHub org name, board tool, additional context sources).

If the person's profile doesn't exist in the vault, ask the user for: name, role, GitHub handle, and board URL — then proceed with what's available.

---

## Data Gathering (Parallel Tracks)

Once you have the person's profile, gather data from these independent sources IN PARALLEL:

### Track A: Vault Context
- Person profile (mission, personality, blind spots)
- Last 3-5 call notes (action items, open threads, themes)
- Any linked project notes

### Track B: GitHub Activity (requires `github` field in profile)
Use `gh` CLI to pull activity for the person's GitHub handle:
- **Recent PRs** (last 7-14 days): `gh search prs --author={handle} --sort=updated --limit=10`
- **Recent commits**: Use GitHub Search API or `gh` to find commits in the org
- **Issues assigned**: `gh search issues --assignee={handle} --state=open --sort=updated --limit=10`
- **Reviews given**: `gh search prs --reviewed-by={handle} --sort=updated --limit=5`

If a GitHub org is configured in AGENTS.md, scope searches to that org.

### Track C: Board Status (requires `board` field in profile)
- If `board` is a GitHub Projects URL: extract the project number and use `gh project item-list` to get items assigned to this person, grouped by status
- If `board` is another URL: note it for the user to check manually
- Focus on: items In Progress, items with no recent updates (stalled), items recently completed

---

## Report Structure

Produce the debrief in this order:

### 1. Quick Context
One paragraph summary: who this person is, what they're working on, and the current dynamic (from profile + recent notes).

### 2. Since Last Time
- Open action items from previous call notes (checkbox items marked incomplete)
- Commitments YOU made to them that need follow-up
- Themes or concerns that surfaced across recent conversations

### 3. Their Recent Work (from GitHub/Board)
- Key PRs merged or in review (with links)
- Issues completed vs still open
- Board items: what moved, what's stalled
- Any notable patterns (e.g., lots of reviews but few own PRs, or concentrated in one repo)

### 4. Suggested Agenda
5-7 ordered talking points. Structure:
1. **Their topics first** — leave space for what they bring
2. **Follow-ups** — action items from last time
3. **Work check-in** — based on GitHub/board data (not status updates, but depth questions)
4. **Growth/career** — based on personality profile and recent themes
5. **Your topics** — anything you need to communicate

For each talking point, include a suggested question or opener (concrete wording, not abstract).

### 5. Manager Notes (Private)
- Communication style reminders (from personality profile)
- Blind spots to watch for
- Things NOT to say or patterns to avoid with this person

---

## Output Format

- Use markdown with clear headers
- Link to specific PRs, issues, board items where relevant
- Keep it concise — this is a prep doc, not an essay
- If data is unavailable (no GitHub handle, no board), skip that section gracefully and note what's missing

---

## Progressive Disclosure

Start with a concise debrief (sections 1-4). Only expand into full detail if the user asks for more on a specific section. Don't dump everything at once.

---

## After the 1:1

If the user says "log this" or "save notes" after the 1:1, help create a new call note in the person's vault folder:
- Filename: `YYYY-MM-DD HH-mm {PersonName} 1-1.md`
- Frontmatter: `tags: [call]`, `type: 1-1`, `date: YYYY-MM-DD`, `person: "[[PersonName]]"`, `summary: ""`
- Body: `## Notes` followed by the action items and notes from the conversation

---

## Vault Schema

The skill expects person profiles to have this frontmatter structure (all fields optional except `tags`):

```yaml
tags:
  - person
role: "Senior Engineer"
team: "Platform"
supervisor: "Manager Name"
github: "github-username"
board: "https://github.com/orgs/org/projects/N/views/1?..."
email: "person@company.com"
```

Call notes use:
```yaml
tags:
  - call
type: 1-1
date: YYYY-MM-DD
person: "[[Person Name]]"
summary: ""
```

See `references/vault-schema.md` for full schema details.
