---
name: crawl4ai
description: >-
  Crawl and extract content from web pages using Crawl4AI via MCP. Use when the
  user asks to crawl a website, extract content from a URL, scrape a page,
  get a screenshot of a site, generate a PDF from a URL, convert a webpage to
  markdown, extract structured data from a page, or run JavaScript on a remote page.
  USE FOR: web crawling, page scraping, content extraction, webpage screenshots,
  PDF generation, JavaScript execution on pages, converting URLs to markdown,
  deep crawling multiple pages.
  DO NOT USE FOR: web search (use searxng-search), reading a known URL when
  simple fetch suffices (use WebFetch), local file operations.
compatibility: >-
  Requires Podman or Docker. Container image: unclecode/crawl4ai:latest.
metadata:
  version: "1.0"
allowed-tools: Bash(podman:*) Bash(docker:*) Bash(curl:*) Bash(node:*)
---

# Crawl4AI Web Crawler

Crawl and extract content from web pages using Crawl4AI, an open-source
LLM-friendly web crawler. Runs as a Docker/Podman container with a built-in
MCP server exposing crawling tools directly to the agent.

## Prerequisites

- **Podman** (with Podman Desktop for auto-start) or **Docker Desktop**
- Container must be running: `podman start crawl4ai`

## Architecture

```
Podman Container
└── crawl4ai    unclecode/crawl4ai:latest    port 11235 → host
    ├── FastAPI server          http://localhost:11235
    ├── MCP SSE endpoint        http://localhost:11235/mcp/sse
    ├── Monitoring dashboard    http://localhost:11235/dashboard
    └── Playground              http://localhost:11235/playground
```

The agent connects to the MCP server at `http://localhost:11235/mcp/sse` as a
remote MCP endpoint.

## CLI Reference

### Start container

```bash
podman start crawl4ai
```

If the container does not exist, create it:

```bash
podman run -d -p 11235:11235 --name crawl4ai --shm-size=1g --restart unless-stopped docker.io/unclecode/crawl4ai:latest
```

### Stop container

```bash
podman stop crawl4ai
```

### Check status

```bash
podman ps -f name=crawl4ai --format '{{.Names}} {{.Status}}'
```

### Health check

```bash
curl -s http://localhost:11235/health
```

Returns:
```json
{"status": "ok", "timestamp": 1234567890.0, "version": "0.8.6"}
```

### View logs

```bash
podman logs crawl4ai --tail 50
```

## Workflow

Follow these steps when web crawling or content extraction is needed:

1. **Try the MCP tool directly.** Call `crawl4ai_md` or another crawl4ai MCP
   tool. If it responds, skip to step 4.

2. **If the MCP tool fails (connection error):** The container is likely down.
   Start it:
   ```bash
   node "<SKILL_DIR>/scripts/crawl4ai_ctl.js" start
   ```
   Wait ~10 seconds for the browser pool to initialize.

3. **Verify the service is healthy:**
   ```bash
   node "<SKILL_DIR>/scripts/crawl4ai_ctl.js" health
   ```

4. **Use MCP tools.** These are called directly as MCP tools -- not via Bash:

   - **`md`** -- convert a URL to clean markdown
     - `url` (required): the URL to crawl

   - **`html`** -- extract preprocessed HTML from a URL
     - `url` (required): the URL to crawl

   - **`screenshot`** -- capture a full-page PNG screenshot
     - `url` (required): the URL to screenshot
     - `screenshot_wait_for`: delay in seconds before capture (default: 2)

   - **`pdf`** -- generate a PDF document from a URL
     - `url` (required): the URL to convert

   - **`execute_js`** -- run JavaScript on a web page
     - `url` (required): the URL to load
     - `scripts`: list of JavaScript snippets to execute

   - **`crawl`** -- perform multi-URL crawling
     - `urls` (required): list of URLs to crawl
     - Additional crawl configuration options

   - **`ask`** -- query the Crawl4AI library context

5. **Present results** to the user.

> **Note**: MCP tool names may be prefixed by the agent with the server name
> (e.g. `crawl4ai_md`). This depends on the agent implementation.

## Common Questions

| User asks | Agent does |
|---|---|
| "crawl this page" / "extract content from URL" | Call `md` with the URL |
| "get the HTML from this page" | Call `html` with the URL |
| "take a screenshot of this site" | Call `screenshot` with the URL |
| "make a PDF of this page" | Call `pdf` with the URL |
| "run this JavaScript on the page" | Call `execute_js` with URL and scripts |
| "crawl these 5 URLs" | Call `crawl` with list of URLs |
| "is the crawler running?" | Run `node "<SKILL_DIR>/scripts/crawl4ai_ctl.js" status` |
| "start the crawler" | Run `node "<SKILL_DIR>/scripts/crawl4ai_ctl.js" start` |
| "stop the crawler" | Run `node "<SKILL_DIR>/scripts/crawl4ai_ctl.js" stop` |

## Error Handling

| Error | Cause | Fix |
|---|---|---|
| MCP tool connection refused | Container not running | Run `podman start crawl4ai` |
| Container does not exist | Never created | Run `podman run` command from CLI Reference |
| Podman machine not running | Machine stopped | Run `podman machine start` |
| Port 11235 already in use | Another process on that port | Stop the conflicting process or change the port mapping |
| Health check fails after start | Browser pool initializing | Wait 10-15 seconds and retry |
| Out of memory errors | Shared memory too small | Recreate container with larger `--shm-size` |

## Tips

- The container has `restart: unless-stopped` -- it auto-starts when Podman
  Desktop starts the machine at login
- Use `md` for most content extraction -- it returns clean, LLM-ready markdown
- Use `screenshot` for visual debugging or pages with complex layouts
- The dashboard at http://localhost:11235/dashboard shows live system metrics
  and browser pool status
- The playground at http://localhost:11235/playground lets you test crawl
  requests interactively
- Check the MCP schema at http://localhost:11235/mcp/schema for detailed
  tool parameters
- For heavy crawling, increase `--shm-size` (default 1g) when creating the container
