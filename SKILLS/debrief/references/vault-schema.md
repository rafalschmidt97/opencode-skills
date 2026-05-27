# Vault Schema for Debrief Skill

## Person Profile

Location: Configured people directory in vault (e.g., `areas/{context}/people/{Name}/{Name}.md`)

### Required Frontmatter
```yaml
tags:
  - person
```

### Optional Frontmatter (enhances debrief quality)
```yaml
context: company-name        # Vault organization context
role: "Job Title"            # Current role
team: "Team Name"            # Team assignment
supervisor: "Manager Name"   # Reporting line
github: "github-username"    # GitHub handle (enables Track B)
board: "https://..."         # Board URL (enables Track C)
email: "user@company.com"   # Contact
mobile: "+1 555 1234"       # Phone
home: "https://..."          # Internal profile URL
```

### Profile Body Sections

| Section | Purpose | Used for |
|---------|---------|----------|
| Mission & Context | What they do, current focus areas | Quick Context |
| Personality & Communication Style | DISC-style notes, directness, pace | Manager Notes |
| Calls (Bases block) | Aggregates call notes from same folder | Navigation |

## Call Notes

Location: Same folder as the person profile.

### Frontmatter
```yaml
tags:
  - call
type: 1-1              # or: standup, sync, retro, ad-hoc
date: YYYY-MM-DD       # Call date
person: "[[Name]]"     # Wikilink to person profile
summary: ""            # Optional one-line summary
```

### Filename Convention
`YYYY-MM-DD HH-mm {PersonName} {topic}.md`

### Body
```markdown
## Notes

- [x] Completed action item
- [ ] Open action item
- Freeform discussion notes
```

## AGENTS.md Configuration (Optional)

The skill reads AGENTS.md for org-specific settings:

```markdown
## Debrief Configuration

- **GitHub org**: `org-name` (scopes searches)
- **People directory**: `areas/context/people/` (vault path to person folders)
- **Board tool**: github-projects | azure-boards | linear | jira
- **Calendar**: google | microsoft365 | none
```

If AGENTS.md doesn't specify these, the skill asks the user or discovers from vault structure.
