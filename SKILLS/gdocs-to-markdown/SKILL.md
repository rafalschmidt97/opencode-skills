---
name: gdocs-to-markdown
description: >-
  Convert Google Docs files to Markdown. Use when the user asks to convert,
  export, or read a Google Doc as markdown. Also fetches open comments from a
  Google Doc (comments command). Supports Google Docs URLs, document IDs, and
  searching for documents by name on Google Drive.
  Authenticates via gcloud CLI. Supports both user credentials and ADC.
compatibility: Requires Node.js 18+, gcloud CLI. Network access to Google APIs. Run install.js first.
metadata:
  version: "2.4"
allowed-tools: Bash(node:*) Bash(gcloud:*) Read
---

## Overview

This skill converts Google Docs documents to Markdown format. It uses the
Google Drive API to export documents as HTML and then converts the HTML to
clean Markdown using turndown (the industry-standard HTML→Markdown library).

Authentication uses `gcloud` credentials. The CLI prefers user credentials
(`gcloud auth print-access-token`) which don't require a GCP project — Google
bills API quota against the caller's implicit project. If user credentials are
unavailable, the CLI falls back to application-default credentials (ADC), which
require a project with Drive API enabled. This makes the skill work out of the
box in corporate environments where users don't own a GCP project.

All commands go through a Node.js CLI script at `scripts/gdocs_cli.js`.

## Prerequisites

1. Node.js 18+ is available
2. `gcloud` CLI installed ([install guide](https://cloud.google.com/sdk/docs/install))
3. Authenticated with Google (see Authentication below)
4. Network access to Google APIs (`googleapis.com`)
5. Skill installed via `install.js` (runs `npm install` for turndown)

If the `node_modules` directory does not exist in the skill directory, run the
install script from the skill's root directory:
```bash
node <SKILL_DIR>/install.js
```

## Authentication

The skill supports two authentication methods with automatic fallback:

### Option 1: User credentials (recommended — works without a GCP project)

```bash
gcloud auth login --enable-gdrive-access
```

This is the simplest option. It opens a browser for Google sign-in and grants
Drive read access. No GCP project configuration needed — Google bills API quota
against the user's implicit project.

### Option 2: Application Default Credentials (ADC)

```bash
gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive.readonly
```

This requires a default gcloud project with Drive API enabled and the user
having `serviceusage.services.use` permission on that project. Set the project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Fallback behavior

The CLI prefers user credentials. If unavailable, it falls back to ADC with a
quota project header derived from `gcloud config get-value project` or the
`GOOGLE_CLOUD_QUOTA_PROJECT` environment variable.

For most users, `gcloud auth login --enable-gdrive-access` is all that's needed.

Or use the skill's built-in auth command:
```bash
$CLI auth login
```

## CLI Reference

Set the CLI path (adjust `SKILL_DIR` to your installation location):

```bash
SKILL_DIR=~/.config/opencode/skills/agents-skills-catalog/productivity/gdocs-to-markdown
CLI="node $SKILL_DIR/scripts/gdocs_cli.js"
```

### Authentication commands

```bash
# Login (opens browser for Google sign-in with Drive access)
$CLI auth login

# Check authentication status (shows both ADC and user credential status)
$CLI auth status
```

### Convert command

```bash
# Convert by Google Docs URL
$CLI convert "https://docs.google.com/document/d/DOC_ID/edit"

# Convert by document ID
$CLI convert DOC_ID

# Convert and save to file
$CLI convert DOC_ID --output my-document.md
$CLI convert DOC_ID -o my-document
```

### Search command

```bash
# Search for documents by name
$CLI search "project proposal" --limit 10
```

### Comments command

```bash
# Fetch open (unresolved) comments from a document
$CLI comments "https://docs.google.com/document/d/DOC_ID/edit"
$CLI comments DOC_ID

# Include stale comments (quoted text no longer present in document)
$CLI comments DOC_ID --all

# Output as Markdown (default: JSON)
$CLI comments DOC_ID --format markdown

# Output as JSONL (one comment per line)
$CLI comments DOC_ID --format jsonl

# Save to file (extension auto-added based on format)
$CLI comments DOC_ID --format markdown --output my-doc.comments.md
$CLI comments DOC_ID --format jsonl -o my-doc.comments
```

By default, stale comments are filtered out — a comment is considered stale if its
quoted text no longer exists in the current document body. Use `--all` to include them.

### List command

```bash
# List recent Google Docs
$CLI list --limit 20
```

### Output

All commands output JSON to stdout. Errors go to stderr.

**Convert output (without --output):**
```json
{
  "document_id": "1abc...",
  "title": "My Document",
  "modified_time": "2025-01-15T10:30:00.000Z",
  "web_link": "https://docs.google.com/document/d/1abc.../edit",
  "markdown": "# My Document\n\nContent here...\n",
  "output_file": null
}
```

**Convert output (with --output):** markdown is saved to the file, NOT included in JSON:
```json
{
  "document_id": "1abc...",
  "title": "My Document",
  "modified_time": "2025-01-15T10:30:00.000Z",
  "web_link": "https://docs.google.com/document/d/1abc.../edit",
  "output_file": "my-document.md"
}
```

**Search/List output:**
```json
{
  "items": [
    {
      "id": "1abc...",
      "name": "My Document",
      "modified_time": "2025-01-15T10:30:00.000Z",
      "owners": ["John Doe"],
      "web_link": "https://docs.google.com/document/d/1abc.../edit"
    }
  ],
  "total": 1
}
```

**Comments output (JSON, without --output):**
```json
{
  "document_id": "1abc...",
  "open_comments": 2,
  "comments": [
    {
      "id": "AAAABc...",
      "author": "Jane Doe",
      "content": "Should we add more detail here?",
      "quoted_text": "brief overview",
      "replies": [
        { "author": "John Smith", "content": "Yes, expanding in the next section." }
      ]
    }
  ]
}
```

**Comments output (Markdown/JSONL, without --output):**
Non-JSON formats are wrapped in a JSON envelope so agents can parse stdout:
```json
{
  "document_id": "1abc...",
  "open_comments": 2,
  "format": "markdown",
  "content": "# Google Doc Comments\n\n- Document ID: 1abc...\n..."
}
```

**Comments output (Markdown/JSONL, with --output):**
Saved to file; JSON summary printed to stdout:
```json
{
  "document_id": "1abc...",
  "open_comments": 2,
  "format": "markdown",
  "output_file": "my-doc.comments.md"
}
```

## Workflow

When the user asks to convert or read a Google Doc:

1. **Check auth**: Run `auth status`. If not authenticated, run `auth login` first.
   This opens a browser window for the user to sign in with Google.
2. **Identify the document**: If the user provides a URL or ID, use it directly
   with `convert`. If they give a document name, use `search` to find it first.
3. **Convert**: 
   - To **save to file** (preferred): `convert <url-or-id> --output <filename>`.
     The markdown is written directly to the file. Use this when the user asks
     to save, export, or download a document.
   - To **display inline**: `convert <url-or-id>` (no --output). The markdown
     is returned in the JSON `markdown` field. Use this only when the user wants
     to read/preview the content without saving.
4. **Present results**: Show the document title, link, and (if saved) the output file path.

## Common questions and how to answer them

| User question | Command |
|---|---|
| "Convert this Google Doc to markdown" (with URL) | `convert <url>` |
| "Export doc X as markdown" | `search "X"`, then `convert <id>` |
| "Save this doc as markdown file" | `convert <url> --output <filename>` |
| "What Google Docs do I have?" | `list --limit 20` |
| "Find a doc about X" | `search "X"` |
| "Read this Google Doc" | `convert <url>`, then display the markdown field |
| "Show me comments on this doc" | `comments <url>` |
| "Export comments as markdown" | `comments <url> --format markdown --output <file>` |
| "Get all comments including stale ones" | `comments <url> --all` |

## Error handling

- **Not authenticated**: Run `auth login`. This runs `gcloud auth login --enable-gdrive-access`.
- **401 Unauthorized**: Credentials expired. Re-run `auth login`.
- **403 Forbidden (quota project)**: You're using ADC without a valid quota project. Run `gcloud auth login --enable-gdrive-access` to switch to user credentials (no project needed).
- **403 Forbidden (access)**: User lacks access to the document. Verify sharing settings in Google Drive.
- **404 Not Found**: Document doesn't exist or ID is wrong. Check the URL/ID spelling.
- **gcloud not found**: Install gcloud CLI from https://cloud.google.com/sdk/docs/install. The CLI also checks common paths like `/usr/local/bin/gcloud`, `/opt/homebrew/bin/gcloud`, and `/tmp/google-cloud-sdk/bin/gcloud`.
- **Network error**: Check internet connectivity. Google APIs require direct HTTPS access.

## Tips

- Google Docs URLs look like: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
- The CLI extracts the document ID automatically from URLs
- Auth credentials are managed by `gcloud` — user credentials at `~/.config/gcloud/` and ADC at `~/.config/gcloud/application_default_credentials.json`
- No OAuth app or API key configuration needed — user credentials don't even need a gcloud project
- Uses turndown for high-quality HTML→Markdown conversion (handles Google Docs quirks)
- The `--output` flag auto-appends `.md` extension if not provided
- Search queries match against document names (not content)
- turndown handles headings, bold, italic, links, lists, tables (GFM), images, and code blocks
- Images in Google Docs are referenced by URL — these URLs may expire over time
