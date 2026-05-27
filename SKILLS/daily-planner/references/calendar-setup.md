# Calendar Setup Guide

## Google Calendar

### Prerequisites
- gcloud CLI installed (`brew install google-cloud-sdk` on macOS)
- A Google Cloud project (for API quota routing — Calendar API is free)

### Authentication Setup

```bash
# One-time login with calendar scope
gcloud auth application-default login \
  --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/calendar.readonly

# Verify token works
gcloud auth application-default print-access-token
```

### AGENTS.md Configuration

```markdown
## Daily Planner Configuration

- **Calendar provider**: google
- **Calendar ID**: your.email@company.com
- **Timezone**: Europe/Warsaw
- **Quota project**: your-gcp-project-id
```

### Troubleshooting
- **403 Forbidden**: Check that calendar.readonly scope is in your ADC login
- **404 Not Found**: Calendar ID might be wrong — use "primary" for your main calendar
- **Quota errors**: Set the quota project header (x-goog-user-project)

---

## Microsoft 365 / Outlook

### Prerequisites
- Azure CLI installed (`brew install azure-cli`)
- Microsoft 365 account with calendar access

### Authentication Setup

```bash
# Login to Azure with calendar scope
az login --scope https://graph.microsoft.com/Calendars.Read

# Verify
az account get-access-token --resource https://graph.microsoft.com
```

### API Pattern

```bash
# List today's events
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/me/calendarview" \
  --url-parameters "startdatetime=2026-05-27T00:00:00" "enddatetime=2026-05-27T23:59:59" \
  --headers "Prefer=outlook.timezone=\"Europe/Warsaw\""
```

### AGENTS.md Configuration

```markdown
## Daily Planner Configuration

- **Calendar provider**: microsoft365
- **Timezone**: Europe/Warsaw
```

---

## iCloud Calendar

### Limitations
- No direct API for agent use
- Best approach: export calendar to .ics and read from a synced location

### Setup
- Configure iCloud Calendar to sync to a local folder
- Or use CalDAV protocol (complex, requires app-specific password)

### AGENTS.md Configuration

```markdown
## Daily Planner Configuration

- **Calendar provider**: icloud
- **Calendar path**: ~/Library/Calendars/ (macOS native)
- **Timezone**: Europe/Warsaw
```

---

## Vault Configuration

Regardless of calendar provider, configure vault paths:

```markdown
## Vault Paths

- **People directory**: areas/company/people/
- **Meetings directory**: areas/company/meetings/
- **Daily notes path**: daily/
- **Daily note format**: YYYY-MM-DD.md
```

## Person Matching

The skill matches calendar attendees to vault person profiles by:
1. Display name → folder name (exact or fuzzy)
2. Email address → `email` field in person frontmatter
3. If no match: show attendee name without wiki-link

## Meeting Matching

The skill matches calendar event titles to vault meeting profiles by:
1. Exact title → meeting folder name
2. Fuzzy match (removing common prefixes like "Weekly:", "Bi-weekly:")
3. If no match: show event title without wiki-link (offer to create meeting profile)
