---
name: read-meeting-notes
description: "Processes meeting transcripts from configured sources (Zoom, Teams, local files, calendar recordings). Extracts action items, decisions, and key topics, then creates structured call notes in the vault routed to the relevant person or meeting folder. Use when the user says 'process meeting notes', 'read my transcripts', 'import meeting recording', 'download zoom transcript', 'process today's meetings', 'what happened in my meetings', 'create notes from transcript', or mentions meeting recordings or transcripts. Do NOT use for 1:1 prep (use debrief) or manual note-taking."
metadata:
  version: 1.0.0
---

# Read Meeting Notes

Process AI-generated meeting transcripts incrementally. Scan configured sources, identify unprocessed transcripts, extract structured content, and route notes to the correct vault folder.

## Before Starting

1. **Check AGENTS.md** for transcript source configuration:
   - Transcript provider (Zoom, Microsoft Teams, local folder, Google Meet)
   - Download method (API, cloud folder sync, manual path)
   - Vault routing rules (people directory, meetings directory)
   - Calendar integration details (for matching transcripts to calendar events)

2. **Check the vault** for existing call notes to understand:
   - Which meetings have already been processed (avoid duplicates)
   - Folder structure for people and meetings
   - Frontmatter conventions in use

If no configuration exists in AGENTS.md, ask the user:
- Where do transcripts come from? (Zoom cloud, Teams, local folder path)
- Where should notes go? (vault path pattern)
- What's the preferred call note format?

---

## Transcript Sources

### Zoom Cloud Recordings
If configured, use the Zoom API or download transcripts from a synced folder:
- Zoom stores VTT/transcript files alongside recordings
- Typical path: a local folder synced from Zoom cloud, or direct API access
- Match by meeting date + title to calendar events

### Microsoft Teams
- Teams transcripts available via Microsoft Graph API or local export
- Match by meeting subject and attendees

### Google Meet
- Meet transcripts saved to Google Drive (if recording enabled)
- Use Google Drive API or local sync folder

### Local Files
- User drops transcript files (VTT, TXT, SRT, MD) into a configured inbox folder
- Process any unprocessed files found there

### Calendar Matching
To route transcripts to the right vault folder:
1. Get the meeting title and date from the transcript metadata
2. Match against calendar events for that date (by title similarity or exact match)
3. Identify attendees to determine the person/meeting folder
4. For 1:1s: route to the person's folder
5. For group meetings: route to the meeting's folder

---

## Processing Pipeline

### Step 1: Discover Unprocessed Transcripts

Scan the configured source for transcripts. For each found:
- Check if a call note already exists in the vault for that date + meeting combination
- Skip if already processed (idempotent)
- Queue for processing if new

### Step 2: Extract Content

From each transcript, extract:

**Metadata:**
- Meeting date and time
- Duration
- Participants (with names)
- Meeting title/subject

**Structured Content:**
- **Action items**: Tasks assigned to specific people (look for "I'll do X", "can you handle Y", "[Name] will...")
- **Decisions made**: Conclusions reached ("we decided", "let's go with", "agreed to")
- **Key discussion topics**: Main themes covered (2-5 bullet points)
- **Open questions**: Unresolved items that need follow-up
- **Notable quotes**: Important statements worth preserving verbatim (sparingly)

### Step 3: Determine Routing

Route the note to the correct vault folder:

| Meeting Type | Detection | Destination |
|---|---|---|
| 1:1 with direct report | 2 participants, one is the user | Person's folder (`people/{Name}/`) |
| 1:1 with someone else | 2 participants, neither is a report | Person's folder or `meetings/` |
| Recurring team meeting | Matches a known meeting entity | Meeting's folder (`meetings/{Name}/`) |
| Ad-hoc group meeting | 3+ participants, no match | Inbox or meetings folder |

To detect:
- Check vault for person profiles matching participant names
- Check vault for meeting profiles matching meeting title
- Fall back to inbox if no match

### Step 4: Create Call Note

Generate a vault note with proper structure:

**Filename:** `YYYY-MM-DD HH-mm {EntityName} {topic}.md`
- EntityName = person name (for 1:1s) or meeting name (for groups)
- topic = meeting title or "sync" / "1-1" as fallback

**Frontmatter:**
```yaml
tags:
  - call
type: 1-1          # or: sync, standup, planning, retro, ad-hoc
date: YYYY-MM-DD
person: "[[Name]]"       # for 1:1s
meeting: "[[Meeting]]"   # for group meetings
product: "[[Product]]"   # if identifiable from content
project: "[[Project]]"   # if identifiable from content
summary: "One-line summary of the meeting"
```

**Body:**
```markdown
## Notes

- Key discussion point 1
- Key discussion point 2

## Action Items

- [ ] {Person}: Action description
- [ ] {Person}: Another action

## Decisions

- Decision 1: rationale
- Decision 2: rationale

## Open Questions

- Question that needs follow-up
```

### Step 5: Confirm with User

Before writing notes to the vault:
- Show a summary of what will be created (filename, destination, extracted items)
- Let the user adjust routing, add context, or skip
- Write only after confirmation (unless running in batch/auto mode)

---

## Batch Processing

When the user says "process all my meetings" or "catch up on this week":
1. Scan ALL configured sources for the date range
2. Present a summary table: date, title, participants, proposed destination
3. Let the user confirm/adjust the batch
4. Process all confirmed transcripts sequentially
5. Report: N notes created, M action items extracted, any routing failures

---

## Incremental Processing

For daily/scheduled runs:
- Track what's been processed (by checking existing vault notes for matching dates + meetings)
- Only process new transcripts since last run
- No state file needed — the vault itself is the record of what's been processed

---

## Keyword Routing (Advanced)

If AGENTS.md configures project/product keywords, use them to add `product` or `project` frontmatter:
- Score each transcript against configured keyword lists
- Add the highest-scoring match as `product: "[[ProductName]]"` or `project: "[[ProjectName]]"`
- Require a minimum confidence threshold (at least 2 keyword matches)

---

## Error Handling

- **No transcript found**: Report clearly, suggest checking the source configuration
- **Can't identify participants**: Create the note but route to inbox, flag for manual routing
- **Duplicate detection**: If a note already exists for this date + meeting, skip and report
- **Partial transcript**: Process what's available, note that transcript may be incomplete

---

## Output

After processing, report:
- Notes created (with vault paths)
- Action items extracted (total count, per person)
- Routing decisions made
- Any items that need manual attention

---

## Vault Schema

See `references/transcript-sources.md` for supported transcript formats and configuration examples.
