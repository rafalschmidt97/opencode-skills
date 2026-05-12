#!/usr/bin/env node
/**
 * gdocs_cli.js - CLI for converting Google Docs to Markdown.
 *
 * Uses Google Drive API with gcloud credentials (user or ADC).
 * Exports Google Docs as HTML and converts to Markdown using turndown.
 *
 * Authentication priority:
 *   1. User credentials (gcloud auth print-access-token) — no quota project needed
 *   2. ADC (gcloud auth application-default print-access-token) — needs a quota project
 *
 * Usage:
 *   node gdocs_cli.js auth login
 *   node gdocs_cli.js auth status
 *   node gdocs_cli.js convert <url-or-id> [--output <file>]
 *   node gdocs_cli.js search <query> [--limit <n>]
 *   node gdocs_cli.js list [--limit <n>]
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const https = require("https");
const path = require("path");
const url = require("url");

// ---------------------------------------------------------------------------
// Turndown (HTML → Markdown)
// ---------------------------------------------------------------------------

const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");

function htmlToMarkdown(html) {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.use(gfm);
  // Remove <style> blocks (Google Docs adds a huge one)
  td.remove("style");
  const markdown = td.turndown(html);
  return markdown.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

// ---------------------------------------------------------------------------
// Quota project
// ---------------------------------------------------------------------------

function getQuotaProject() {
  const envProject = process.env.GOOGLE_CLOUD_QUOTA_PROJECT;
  if (envProject) return envProject;
  try {
    return execSync("gcloud config get-value project", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10_000,
    }).trim() || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Authentication via gcloud CLI
// ---------------------------------------------------------------------------

// Which token type is in use: "user" or "adc".
// User tokens don't need a quota project header — Google bills quota against
// the caller's implicit project. ADC tokens require an explicit quota project
// with Drive API enabled and serviceusage.services.use permission.
let tokenType = null;

function checkGcloud() {
  try {
    execSync("gcloud --version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10_000,
    });
    return "gcloud";
  } catch {
    // Try common paths
    const candidates = [
      path.join(process.env.HOME || "", "google-cloud-sdk/bin/gcloud"),
      "/usr/local/bin/gcloud",
      "/opt/homebrew/bin/gcloud",
      "/tmp/google-cloud-sdk/bin/gcloud",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    process.stderr.write(
      "ERROR: gcloud CLI not found.\nInstall it from: https://cloud.google.com/sdk/docs/install\n"
    );
    process.exit(1);
  }
}

/**
 * Get an access token. Prefers user credentials over ADC.
 *
 * User tokens work with Drive API without any GCP project configuration.
 * ADC tokens require a quota project with Drive API enabled — which many
 * corporate users don't have. By preferring user tokens, the common case
 * works without extra setup.
 */
function getAccessToken() {
  const gcloud = checkGcloud();

  // Prefer user credentials — works without a quota project
  try {
    const token = execSync(
      `${gcloud} auth print-access-token`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 15_000 }
    ).trim();
    if (token) {
      tokenType = "user";
      return token;
    }
  } catch {
    // No user credentials — try ADC
  }

  // Fall back to ADC
  try {
    const token = execSync(
      `${gcloud} auth application-default print-access-token`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 15_000 }
    ).trim();
    if (token) {
      tokenType = "adc";
      return token;
    }
  } catch {
    // No ADC either
  }

  process.stderr.write(
    "ERROR: No credentials found. Run one of these commands:\n\n" +
    "  Option 1 (recommended — works without a GCP project):\n" +
    `    gcloud auth login --enable-gdrive-access\n\n` +
    "  Option 2 (ADC — requires a GCP project with Drive API enabled):\n" +
    `    gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,${DRIVE_SCOPE}\n\n`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function httpsGet(reqUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(reqUrl);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers,
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject({ statusCode: res.statusCode, body });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function handleApiError(err) {
  const code = err.statusCode || 0;
  const body = err.body || "";
  if (code === 401) {
    process.stderr.write(
      "ERROR: Authentication failed. Re-run:\n\n" +
      `  gcloud auth login --enable-gdrive-access\n\n`
    );
  } else if (code === 403) {
    if (body.toLowerCase().includes("quota project") || body.includes("SERVICE_DISABLED")) {
      process.stderr.write(
        "ERROR: Drive API quota project issue.\n" +
        "Run this to authenticate with user credentials (no project needed):\n\n" +
        "  gcloud auth login --enable-gdrive-access\n\n"
      );
    } else {
      process.stderr.write(`ERROR: Access denied (403). Check document sharing settings.\n${body}\n`);
    }
  } else if (code === 404) {
    process.stderr.write("ERROR: Document not found (404). Check the URL or ID.\n");
  } else {
    process.stderr.write(`ERROR: Drive API ${code}: ${body}\n`);
  }
  process.exit(1);
}

/**
 * Build request headers. Only includes the quota project header for ADC tokens.
 * User tokens don't need it — they use the caller's implicit quota.
 */
function buildHeaders(token) {
  const headers = { Authorization: `Bearer ${token}` };
  if (tokenType === "adc") {
    const quota = getQuotaProject();
    if (quota) headers["X-Goog-User-Project"] = quota;
  }
  return headers;
}

async function driveRequest(apiPath, params = {}) {
  const token = getAccessToken();
  const qs = new URLSearchParams(params).toString();
  const reqUrl = `${DRIVE_API}/${apiPath}${qs ? "?" + qs : ""}`;
  const headers = buildHeaders(token);

  try {
    const body = await httpsGet(reqUrl, headers);
    return JSON.parse(body);
  } catch (err) {
    handleApiError(err);
  }
}

async function driveExport(fileId, mimeType) {
  const token = getAccessToken();
  const qs = new URLSearchParams({ mimeType }).toString();
  const reqUrl = `${DRIVE_API}/files/${fileId}/export?${qs}`;
  const headers = buildHeaders(token);

  try {
    return await httpsGet(reqUrl, headers);
  } catch (err) {
    handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDocId(urlOrId) {
  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = urlOrId.match(re);
    if (m) return m[1];
  }
  return urlOrId.trim();
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeCommentText(text) {
  return decodeHtmlEntities(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sanitizeForMarkdown(text) {
  return decodeHtmlEntities(String(text || ""))
    .replace(/\r\n/g, " ")
    .replace(/[\r\n]/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDefaultExtension(format) {
  if (format === "markdown") return ".md";
  if (format === "jsonl") return ".jsonl";
  return ".json";
}

function formatCommentsAsMarkdown(result) {
  const lines = [
    `# Google Doc Comments`,
    "",
    `- Document ID: ${result.document_id}`,
    `- Open comments: ${result.open_comments}`,
    "",
  ];

  if (result.comments.length === 0) {
    lines.push("No open comments.", "");
    return lines.join("\n");
  }

  result.comments.forEach((comment, index) => {
    lines.push(`## ${index + 1}. ${sanitizeForMarkdown(comment.content)}`, "");
    lines.push(`- Author: ${comment.author}`);
    if (comment.quoted_text) lines.push(`- Quoted text: ${decodeHtmlEntities(comment.quoted_text)}`);
    if (comment.replies.length > 0) {
      lines.push("- Replies:");
      comment.replies.forEach((reply) => {
        lines.push(`  - ${reply.author}: ${sanitizeForMarkdown(reply.content)}`);
      });
    }
    lines.push("");
  });

  return lines.join("\n");
}

function formatCommentsAsJsonl(result) {
  return result.comments.map((comment) => JSON.stringify({
    document_id: result.document_id,
    ...comment,
  })).join("\n") + (result.comments.length > 0 ? "\n" : "");
}

function renderCommentsOutput(result, format) {
  if (format === "markdown") return formatCommentsAsMarkdown(result);
  if (format === "jsonl") return formatCommentsAsJsonl(result);
  return JSON.stringify(result, null, 2);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdAuthLogin() {
  const gcloud = checkGcloud();

  process.stderr.write("Opening browser for Google authentication...\n");
  try {
    execSync(`${gcloud} auth login --enable-gdrive-access`, {
      stdio: "inherit",
      timeout: 120_000,
    });
    console.log(JSON.stringify({ status: "authenticated", type: "user" }));
  } catch {
    console.log(JSON.stringify({ status: "failed", error: "gcloud login failed" }));
    process.exit(1);
  }
}

function cmdAuthStatus() {
  const gcloud = checkGcloud();
  const result = { adc: "not_authenticated", user: "not_authenticated" };

  // Check user credentials
  try {
    const out = execSync(
      `${gcloud} auth print-access-token`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 15_000 }
    ).trim();
    if (out) result.user = "authenticated";
  } catch {}

  // Check ADC
  try {
    const out = execSync(
      `${gcloud} auth application-default print-access-token`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 15_000 }
    ).trim();
    if (out) result.adc = "authenticated";
  } catch {}

  result.status = (result.user === "authenticated" || result.adc === "authenticated")
    ? "authenticated"
    : "not_authenticated";

  console.log(JSON.stringify(result));
}

async function cmdConvert(urlOrId, outputFile) {
  const docId = extractDocId(urlOrId);

  const metadata = await driveRequest(`files/${docId}`, {
    fields: "id,name,modifiedTime,owners,webViewLink",
    supportsAllDrives: "true",
  });

  const html = await driveExport(docId, "text/html");
  const markdown = htmlToMarkdown(html);

  const result = {
    document_id: docId,
    title: metadata.name || "",
    modified_time: metadata.modifiedTime || "",
    web_link: metadata.webViewLink || "",
    output_file: null,
  };

  if (outputFile) {
    let outPath = outputFile;
    if (!path.extname(outPath)) outPath += ".md";
    fs.writeFileSync(outPath, markdown, "utf-8");
    result.output_file = outPath;
  } else {
    result.markdown = markdown;
  }

  console.log(JSON.stringify(result));
}

async function cmdSearch(query, limit) {
  const q = `mimeType='application/vnd.google-apps.document' and name contains '${query}' and trashed=false`;
  const data = await driveRequest("files", {
    q,
    fields: "files(id,name,modifiedTime,owners,webViewLink)",
    pageSize: String(limit),
    orderBy: "modifiedTime desc",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const items = (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    modified_time: f.modifiedTime || "",
    owners: (f.owners || []).map((o) => o.displayName || ""),
    web_link: f.webViewLink || "",
  }));

  console.log(JSON.stringify({ items, total: items.length }));
}

async function cmdComments(urlOrId, includeStale = false, format = "json", outputFile = null) {
  const docId = extractDocId(urlOrId);
  const currentDocText = normalizeCommentText(
    await driveExport(docId, "text/plain")
  );

  // Drive API v3 — comments endpoint
  // pageSize max is 100; loop via nextPageToken for docs with many comments
  // Request `deleted` field too so we can filter it client-side as a safety net
  const fields = "comments(id,content,anchor,quotedFileContent,author,resolved,deleted,replies),nextPageToken";

  let allComments = [];
  let pageToken = null;

  do {
    const page = await driveRequest(`files/${docId}/comments`, {
      fields,
      pageSize: "100",
      supportsAllDrives: "true",
      ...(pageToken ? { pageToken } : {}),
    });
    allComments = allComments.concat(page.comments || []);
    pageToken = page.nextPageToken || null;
  } while (pageToken);

  // By default exclude stale comments whose quoted text no longer exists.
  // `--all` keeps all unresolved comments from the API, even if their quote is stale.
  const open = allComments.filter((c) => {
    if (c.resolved || c.deleted) return false;
    if (!c.content || c.content.trim() === "") return false;
    if (includeStale) return true;

    const quotedText = c.quotedFileContent ? c.quotedFileContent.value : null;
    if (!quotedText) return true;

    return currentDocText.includes(normalizeCommentText(quotedText));
  });

  const items = open.map((c) => ({
    id: c.id,
    author: c.author ? c.author.displayName : "unknown",
    content: c.content,
    quoted_text: c.quotedFileContent ? c.quotedFileContent.value : null,
    replies: (c.replies || []).map((r) => ({
      author: r.author ? r.author.displayName : "unknown",
      content: r.content,
    })),
  }));

  const result = { document_id: docId, open_comments: items.length, comments: items };

  if (outputFile) {
    let outPath = outputFile;
    if (!path.extname(outPath)) outPath += getDefaultExtension(format);
    fs.writeFileSync(outPath, renderCommentsOutput(result, format), "utf-8");
    console.log(JSON.stringify({
      document_id: docId,
      open_comments: items.length,
      format,
      output_file: outPath,
    }, null, 2));
    return;
  }

  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Wrap non-JSON formats in a JSON envelope so agents can parse stdout
    console.log(JSON.stringify({
      document_id: docId,
      open_comments: items.length,
      format,
      content: renderCommentsOutput(result, format),
    }, null, 2));
  }
}

async function cmdList(limit) {
  const q = "mimeType='application/vnd.google-apps.document' and trashed=false";
  const data = await driveRequest("files", {
    q,
    fields: "files(id,name,modifiedTime,viewedByMeTime,owners,webViewLink)",
    pageSize: String(limit),
    orderBy: "viewedByMeTime desc",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const items = (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    modified_time: f.modifiedTime || "",
    viewed_by_me_time: f.viewedByMeTime || "",
    owners: (f.owners || []).map((o) => o.displayName || ""),
    web_link: f.webViewLink || "",
  }));

  console.log(JSON.stringify({ items, total: items.length }));
}

// ---------------------------------------------------------------------------
// CLI parser
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(
      "Usage:\n" +
      "  node gdocs_cli.js auth login|status\n" +
      "  node gdocs_cli.js convert <url-or-id> [--output <file>]\n" +
      "  node gdocs_cli.js comments <url-or-id> [--all] [--format json|jsonl|markdown] [--output <file>]\n" +
      "  node gdocs_cli.js search <query> [--limit <n>]\n" +
      "  node gdocs_cli.js list [--limit <n>]\n"
    );
    return;
  }

  function getFlag(flag, defaultVal) {
    const idx = args.indexOf(flag);
    if (idx === -1) return defaultVal;
    const val = args[idx + 1];
    // Reject values that look like another flag (e.g. --format --output)
    if (!val || val.startsWith("-")) return defaultVal;
    return val;
  }

  if (command === "auth") {
    const action = args[1];
    if (action === "login") return cmdAuthLogin();
    if (action === "status") return cmdAuthStatus();
    process.stderr.write("Usage: node gdocs_cli.js auth login|status\n");
    process.exit(1);
  }

  if (command === "convert") {
    const doc = args[1];
    if (!doc) {
      process.stderr.write("Usage: node gdocs_cli.js convert <url-or-id> [--output <file>]\n");
      process.exit(1);
    }
    const output = getFlag("--output", null) || getFlag("-o", null);
    return cmdConvert(doc, output);
  }

  if (command === "comments") {
    const doc = args[1];
    if (!doc) {
      process.stderr.write("Usage: node gdocs_cli.js comments <url-or-id> [--all] [--format json|jsonl|markdown] [--output <file>]\n");
      process.exit(1);
    }
    const includeStale = args.includes("--all");
    const format = getFlag("--format", "json");
    const SUPPORTED_FORMATS = ["json", "jsonl", "markdown"];
    if (!SUPPORTED_FORMATS.includes(format)) {
      process.stderr.write(
        `ERROR: Unsupported format "${format}". Supported: ${SUPPORTED_FORMATS.join(", ")}\n`
      );
      process.exit(1);
    }
    const output = getFlag("--output", null) || getFlag("-o", null);
    return cmdComments(doc, includeStale, format, output);
  }

  if (command === "search") {
    const query = args[1];
    if (!query) {
      process.stderr.write("Usage: node gdocs_cli.js search <query> [--limit <n>]\n");
      process.exit(1);
    }
    const limit = parseInt(getFlag("--limit", "10"), 10);
    return cmdSearch(query, limit);
  }

  if (command === "list") {
    const limit = parseInt(getFlag("--limit", "10"), 10);
    return cmdList(limit);
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`ERROR: ${err.message || err}\n`);
  process.exit(1);
});
