---
name: markdown-to-gdocs
description: >-
  Upload Markdown files as Google Docs. Use when the user asks to create,
  upload, publish, or push a markdown file to Google Docs/Drive. Supports
  creating new docs and updating existing ones. Converts Markdown to HTML
  then uploads with Google Drive mimeType conversion to native Google Docs.
  Authenticates via gcloud CLI. Supports both user credentials and ADC.
compatibility: Requires Node.js 18+, gcloud CLI. Network access to Google APIs. Run install.js first.
metadata:
  version: "1.0"
allowed-tools: Bash(node:*) Bash(gcloud:*) Read
---

## Overview

This skill uploads Markdown files as native Google Docs documents. It uses
markdown-it to convert Markdown to HTML, then uploads via the Google Drive API
with mimeType conversion (`application/vnd.google-apps.document`). This is the
same mechanism as Google Docs' "paste as Markdown" feature, but via API.

Authentication uses `gcloud` credentials. The CLI prefers user credentials
(`gcloud auth print-access-token`) which don't require a GCP project. If user
credentials are unavailable, it falls back to application-default credentials
(ADC). This makes the skill work out of the box in corporate environments.

All commands go through a Node.js CLI script at `scripts/md2gdocs_cli.js`.

## Prerequisites

1. Node.js 18+ is available
2. `gcloud` CLI installed ([install guide](https://cloud.google.com/sdk/docs/install))
3. Authenticated with Google (see Authentication below)
4. Network access to Google APIs (`googleapis.com`)
5. Skill installed via `install.js` (runs `npm install` for markdown-it)

If the `node_modules` directory does not exist in the skill directory, run the
install script from the skill's root directory:
```bash
node <SKILL_DIR>/install.js
```

## Authentication

**Use the CLI's built-in auth command.** It runs `gcloud auth login` with the
correct scopes (including Google Drive) in one step:

```bash
$CLI auth login
```

This is the recommended method. It works without a GCP project.

**Why not plain `gcloud auth login`?** Because `gcloud auth login` alone does
NOT include Google Drive scope. The upload/update will fail with 403
`ACCESS_TOKEN_SCOPE_INSUFFICIENT`. You must either use `$CLI auth login` or
explicitly pass `--enable-gdrive-access`:

```bash
gcloud auth login --enable-gdrive-access
```

### Fallback: Application Default Credentials (ADC)

If user credentials are unavailable, the CLI falls back to ADC with a quota
project header derived from `gcloud config get-value project` or the
`GOOGLE_CLOUD_QUOTA_PROJECT` environment variable.

```bash
gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive
```

This requires a default gcloud project with Drive API enabled.

### Known limitation: `auth status` does not check scopes

`$CLI auth status` reports `authenticated` if a token exists, even if the token
lacks Drive scope. A successful `auth status` does not guarantee uploads will
work. If uploads fail with 403, re-run `$CLI auth login`.

## CLI Reference

Set the CLI path (adjust `SKILL_DIR` to your installation location):

```bash
SKILL_DIR=~/.config/opencode/skills/agents-skills-catalog/productivity/markdown-to-gdocs
CLI="node $SKILL_DIR/scripts/md2gdocs_cli.js"
```

### Authentication commands

```bash
# Login (opens browser for Google sign-in with Drive access)
$CLI auth login

# Check authentication status
$CLI auth status
```

### Upload command (create new Google Doc)

```bash
# Upload with auto-generated title (from filename)
$CLI upload my-document.md

# Upload with custom title
$CLI upload my-document.md --title "My Document Title"

# Upload to a specific Google Drive folder
$CLI upload my-document.md --title "My Document" --folder FOLDER_ID
```

### Update command (replace content of existing Google Doc)

```bash
# Update by Google Docs URL
$CLI update "https://docs.google.com/document/d/DOC_ID/edit" updated-content.md

# Update by document ID
$CLI update DOC_ID updated-content.md
```

### Output

All commands output JSON to stdout. Progress messages go to stderr.

**Upload output:**
```json
{
  "document_id": "1abc...",
  "title": "My Document",
  "web_link": "https://docs.google.com/document/d/1abc.../edit?usp=drivesdk",
  "source_file": "my-document.md"
}
```

**Update output:**
```json
{
  "document_id": "1abc...",
  "title": "My Document",
  "web_link": "https://docs.google.com/document/d/1abc.../edit?usp=drivesdk",
  "source_file": "updated-content.md",
  "action": "updated"
}
```

## Workflow

When the user asks to upload or create a Google Doc from Markdown:

1. **Ensure auth**: On first use in a session, run `$CLI auth login`. Do NOT
   rely on `auth status` alone — it cannot verify that the token has Drive
   scope (see Authentication above). If a previous upload succeeded in this
   session, you can skip this step.
2. **Identify the file**: The user provides a path to a local `.md` file.
3. **Upload or update**:
   - To **create a new doc**: `upload <file.md> --title "Title"`.
   - To **update an existing doc**: `update <url-or-id> <file.md>`.
4. **Present results**: Show the document title and link.

## Common questions and how to answer them

| User question | Command |
|---|---|
| "Upload this markdown as a Google Doc" | `upload <file.md>` |
| "Create a Google Doc from this file" | `upload <file.md> --title "..."` |
| "Push this to Google Docs" | `upload <file.md>` |
| "Update this Google Doc with new content" | `update <url-or-id> <file.md>` |
| "Replace the content of this doc" | `update <url-or-id> <file.md>` |
| "Save this doc to a specific Drive folder" | `upload <file.md> --folder FOLDER_ID` |

## Error handling

- **403 `ACCESS_TOKEN_SCOPE_INSUFFICIENT`**: Most common error. The gcloud token exists but lacks Drive scope. Fix: run `$CLI auth login` (or `gcloud auth login --enable-gdrive-access`). Plain `gcloud auth login` does NOT include Drive scope.
- **400 "Project not found or deleted"**: The quota project set in `gcloud config` no longer exists or the account lacks `serviceusage.services.use` on it. Fix: run `$CLI auth login` to use user credentials (no quota project needed), or set a valid project with `gcloud config set project PROJECT_ID`.
- **401 Unauthorized**: Credentials expired. Re-run `$CLI auth login`.
- **403 Forbidden (access)**: User lacks write access to the specific Google Doc. Check Google Drive sharing permissions.
- **File not found**: Check the markdown file path.
- **gcloud not found**: Install gcloud CLI from https://cloud.google.com/sdk/docs/install.
- **Network error**: Check internet connectivity.

## What gets converted

The skill uses markdown-it which supports:
- Headings (H1-H6)
- Bold, italic, strikethrough
- Links and images
- Ordered and unordered lists
- Tables (GitHub-flavored Markdown)
- Code blocks (fenced with ```)
- Inline code
- Blockquotes
- Horizontal rules

Google Docs will render these as native Google Docs elements after conversion.
Tables become native Docs tables. Code blocks become monospace-formatted text.

## Tips

- The `--title` flag is optional. Without it, the title is derived from the filename (e.g., `my-doc.md` becomes "my doc")
- Google Docs URLs look like: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
- The CLI extracts the document ID automatically from URLs
- Auth credentials are managed by `gcloud` — same as the gdocs-to-markdown skill
- The `update` command replaces ALL content in the document. There is no merge/append mode.
- Large documents (100KB+ markdown) upload fine — the Drive API handles them without chunked upload
- Companion skill: use `gdocs-to-markdown` to download Google Docs as Markdown
