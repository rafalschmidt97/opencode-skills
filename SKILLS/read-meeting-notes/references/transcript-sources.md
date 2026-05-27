# Transcript Sources Configuration

## AGENTS.md Configuration Block

Add this to your AGENTS.md to configure transcript processing:

```markdown
## Meeting Notes Configuration

- **Transcript provider**: zoom | teams | google-meet | local
- **Transcript path**: /path/to/transcripts/folder (for local/synced sources)
- **People directory**: areas/{context}/people/ (vault path)
- **Meetings directory**: areas/{context}/meetings/ (vault path)
- **Calendar provider**: google | microsoft365 | none
- **Auto-route**: true | false (skip confirmation for known patterns)
- **Default meeting type**: sync (fallback when type can't be determined)
```

## Zoom Configuration

### Cloud Recordings (API)
Zoom stores transcripts with recordings. Access via:
- Zoom Developer App with `recording:read` scope
- Or sync via Zoom's cloud recording download to a local folder

### Local Sync Folder
Many users configure Zoom to save recordings locally:
- Default macOS: `~/Documents/Zoom/`
- Transcript files: `.vtt` format alongside `.mp4`

### Matching Strategy
- Filename contains meeting date and topic
- Cross-reference with calendar by timestamp + duration

## Microsoft Teams Configuration

### Graph API
- Requires app registration with `OnlineMeetings.Read` permission
- Transcripts available via `/communications/callRecords/{id}/sessions`

### Local Export
- Teams allows transcript download as `.docx` or `.vtt`
- Place in configured inbox folder

## Google Meet Configuration

### Drive Integration
- Meet saves transcripts to presenter's Google Drive
- Typically in a "Meet Recordings" folder
- Format: Google Doc (can be exported via Drive API)

## Local Files (Universal)

### Supported Formats
| Format | Extension | Parser |
|--------|-----------|--------|
| WebVTT | `.vtt` | Timestamp + speaker labels |
| SubRip | `.srt` | Sequential with timestamps |
| Plain text | `.txt` | Speaker-labeled paragraphs |
| Markdown | `.md` | Already structured |
| Word | `.docx` | Paragraph extraction |

### Inbox Pattern
Configure a watched folder. Drop any transcript file there.
The skill processes and moves/marks as done.

## Person Matching

To route transcripts to the correct person folder, the skill matches participant names against vault person profiles:

1. Exact match on person note filename
2. Fuzzy match on display name in frontmatter
3. Email match if available in both transcript and profile
4. Fall back to manual routing if no match

## Duplicate Detection

A transcript is considered "already processed" if:
- A call note exists in the target folder with matching date AND
- The note's frontmatter `date` matches AND
- The filename contains the same person/meeting name

This makes processing idempotent — safe to re-run without duplicates.
