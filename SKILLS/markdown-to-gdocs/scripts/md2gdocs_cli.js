#!/usr/bin/env node
/**
 * md2gdocs_cli.js - CLI for uploading Markdown files as Google Docs.
 *
 * Converts Markdown to HTML via markdown-it, then uploads to Google Drive
 * with mimeType conversion to native Google Docs format.
 *
 * Authentication priority (same as gdocs-to-markdown):
 *   1. User credentials (gcloud auth print-access-token) — no quota project needed
 *   2. ADC (gcloud auth application-default print-access-token) — needs a quota project
 *
 * Usage:
 *   node md2gdocs_cli.js auth login
 *   node md2gdocs_cli.js auth status
 *   node md2gdocs_cli.js upload <file.md> [--title "Doc Title"] [--folder <folder-id>]
 *   node md2gdocs_cli.js update <url-or-id> <file.md>
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const https = require("https");
const path = require("path");

// ---------------------------------------------------------------------------
// Markdown → HTML
// ---------------------------------------------------------------------------

const markdownIt = require("markdown-it");
const md = markdownIt({ html: true, linkify: true, typographer: false });

function postProcessHtmlForGdocs(html) {
  return html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (match, lang, code) => {
      let text = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
      text = text.replace(/\n$/, '');
      const lines = text.split('\n').map(line => {
        return line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/ /g, '&nbsp;');
      });
      const langRow = lang
        ? `<tr><td style="background-color:#e0e0e0; padding:4px 12px; font-family:Arial,sans-serif; font-size:8pt; color:#555; border:1px solid #ddd; border-bottom:none;"><b>${lang}</b></td></tr>`
        : '';
      return `<table style="width:100%; border-collapse:collapse; margin:10px 0;">\n${langRow}\n<tr><td style="background-color:#f5f5f5; border:1px solid #ddd; padding:12px;">\n<span style="font-family:'Courier New',monospace; font-size:9pt; line-height:1.4;">\n${lines.join('<br>\n')}\n</span>\n</td></tr>\n</table>`;
    }
  );
}

function markdownToHtml(markdown) {
  const body = md.render(markdown);
  return [
    "<html>",
    "<head><meta charset=\"utf-8\"></head>",
    "<body>",
    body,
    "</body>",
    "</html>",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const DOCS_API = "https://docs.googleapis.com/v1";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

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
    const candidates = [
      path.join(process.env.HOME || "", "google-cloud-sdk/bin/gcloud"),
      "/usr/local/bin/gcloud",
      "/opt/homebrew/bin/gcloud",
      "/opt/homebrew/share/google-cloud-sdk/bin/gcloud",
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

function getAccessToken() {
  const gcloud = checkGcloud();

  // Prefer user credentials
  try {
    const token = execSync(
      `${gcloud} auth print-access-token`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 15_000 }
    ).trim();
    if (token) {
      tokenType = "user";
      return token;
    }
  } catch {}

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
  } catch {}

  process.stderr.write(
    "ERROR: No credentials found. Run one of these commands:\n\n" +
    "  Option 1 (recommended — works without a GCP project):\n" +
    "    gcloud auth login --enable-gdrive-access\n\n" +
    "  Option 2 (ADC — requires a GCP project with Drive API enabled):\n" +
    `    gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,${DRIVE_SCOPE}\n\n`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function buildHeaders(token) {
  const headers = { Authorization: `Bearer ${token}` };
  if (tokenType === "adc") {
    const quota = getQuotaProject();
    if (quota) headers["X-Goog-User-Project"] = quota;
  }
  return headers;
}

function httpsRequest(method, reqUrl, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(reqUrl);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const respBody = Buffer.concat(chunks).toString("utf-8");
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(respBody);
        } else {
          reject({ statusCode: res.statusCode, body: respBody });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function handleApiError(err) {
  const code = err.statusCode || 0;
  const body = err.body || "";
  if (code === 401) {
    process.stderr.write(
      "ERROR: Authentication failed. Re-run:\n\n" +
      "  gcloud auth login --enable-gdrive-access\n\n"
    );
  } else if (code === 403) {
    if (body.toLowerCase().includes("quota project") || body.includes("SERVICE_DISABLED")) {
      process.stderr.write(
        "ERROR: Drive API quota project issue.\n" +
        "Run this to authenticate with user credentials (no project needed):\n\n" +
        "  gcloud auth login --enable-gdrive-access\n\n"
      );
    } else {
      process.stderr.write(`ERROR: Access denied (403).\n${body}\n`);
    }
  } else {
    process.stderr.write(`ERROR: Drive API ${code}: ${body}\n`);
  }
  process.exit(1);
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

// ---------------------------------------------------------------------------
// Multipart upload builder
// ---------------------------------------------------------------------------

/**
 * Build a multipart/related body for the Drive API upload.
 * Returns { body: Buffer, contentType: string }.
 */
function buildMultipartBody(metadata, htmlContent) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const parts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
    `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${htmlContent}`,
    `--${boundary}--`,
  ];
  return {
    body: parts.join("\r\n"),
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

// ---------------------------------------------------------------------------
// Set document to pageless mode via Docs API
// ---------------------------------------------------------------------------

async function setDocumentPageless(docId, token) {
  const body = JSON.stringify({
    requests: [{
      updateDocumentStyle: {
        documentStyle: {
          documentFormat: {
            documentMode: "PAGELESS",
          },
        },
        fields: "documentFormat",
      },
    }],
  });

  const headers = {
    ...buildHeaders(token),
    "Content-Type": "application/json; charset=UTF-8",
    "Content-Length": Buffer.byteLength(body),
  };

  try {
    await httpsRequest(
      "POST",
      `${DOCS_API}/documents/${docId}:batchUpdate`,
      headers,
      body
    );
    process.stderr.write("Set document to pageless mode.\n");
  } catch (err) {
    // Non-fatal: document was created successfully, just couldn't set pageless
    const code = err.statusCode || 0;
    const errBody = err.body || "";
    process.stderr.write(
      `WARNING: Could not set pageless mode (${code}): ${errBody.slice(0, 200)}\n`
    );
  }
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

  try {
    const out = execSync(
      `${gcloud} auth print-access-token`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 15_000 }
    ).trim();
    if (out) result.user = "authenticated";
  } catch {}

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

async function cmdUpload(mdFile, title, folderId) {
  if (!fs.existsSync(mdFile)) {
    process.stderr.write(`ERROR: File not found: ${mdFile}\n`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(mdFile, "utf-8");
  let html = markdownToHtml(markdown);
  html = postProcessHtmlForGdocs(html);

  const docTitle = title || path.basename(mdFile, path.extname(mdFile)).replace(/[-_]/g, " ");

  const metadata = {
    name: docTitle,
    mimeType: "application/vnd.google-apps.document",
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const { body, contentType } = buildMultipartBody(metadata, html);
  const token = getAccessToken();
  const headers = {
    ...buildHeaders(token),
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
  };

  process.stderr.write(`Uploading "${docTitle}" (${html.length} bytes HTML)...\n`);

  try {
    const resp = await httpsRequest(
      "POST",
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`,
      headers,
      body
    );
    const doc = JSON.parse(resp);
    await setDocumentPageless(doc.id, token);
    console.log(JSON.stringify({
      document_id: doc.id,
      title: doc.name,
      web_link: doc.webViewLink,
      source_file: mdFile,
    }));
  } catch (err) {
    handleApiError(err);
  }
}

async function cmdUpdate(urlOrId, mdFile) {
  const docId = extractDocId(urlOrId);

  if (!fs.existsSync(mdFile)) {
    process.stderr.write(`ERROR: File not found: ${mdFile}\n`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(mdFile, "utf-8");
  let html = markdownToHtml(markdown);
  html = postProcessHtmlForGdocs(html);

  // Drive API: update file content with media upload + mimeType conversion
  // PATCH https://www.googleapis.com/upload/drive/v3/files/{fileId}?uploadType=media
  // But for conversion, we need multipart with mimeType set.
  //
  // Actually, updating an existing Google Doc by re-uploading HTML replaces all content.
  // Use PATCH with uploadType=media and Content-Type: text/html.

  const token = getAccessToken();
  const headers = {
    ...buildHeaders(token),
    "Content-Type": "text/html; charset=UTF-8",
    "Content-Length": Buffer.byteLength(html),
  };

  process.stderr.write(`Updating document ${docId} (${html.length} bytes HTML)...\n`);

  try {
    const resp = await httpsRequest(
      "PATCH",
      `${DRIVE_UPLOAD_API}/files/${docId}?uploadType=media&fields=id,name,webViewLink`,
      headers,
      html
    );
    const doc = JSON.parse(resp);
    await setDocumentPageless(doc.id, token);
    console.log(JSON.stringify({
      document_id: doc.id,
      title: doc.name,
      web_link: doc.webViewLink,
      source_file: mdFile,
      action: "updated",
    }));
  } catch (err) {
    handleApiError(err);
  }
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
      "  node md2gdocs_cli.js auth login|status\n" +
      "  node md2gdocs_cli.js upload <file.md> [--title \"Doc Title\"] [--folder <folder-id>]\n" +
      "  node md2gdocs_cli.js update <url-or-id> <file.md>\n"
    );
    return;
  }

  function getFlag(flag, defaultVal) {
    const idx = args.indexOf(flag);
    if (idx === -1) return defaultVal;
    return args[idx + 1] || defaultVal;
  }

  if (command === "auth") {
    const action = args[1];
    if (action === "login") return cmdAuthLogin();
    if (action === "status") return cmdAuthStatus();
    process.stderr.write("Usage: node md2gdocs_cli.js auth login|status\n");
    process.exit(1);
  }

  if (command === "upload") {
    const mdFile = args[1];
    if (!mdFile) {
      process.stderr.write("Usage: node md2gdocs_cli.js upload <file.md> [--title \"...\"] [--folder <id>]\n");
      process.exit(1);
    }
    const title = getFlag("--title", null) || getFlag("-t", null);
    const folder = getFlag("--folder", null) || getFlag("-f", null);
    return cmdUpload(mdFile, title, folder);
  }

  if (command === "update") {
    const docRef = args[1];
    const mdFile = args[2];
    if (!docRef || !mdFile) {
      process.stderr.write("Usage: node md2gdocs_cli.js update <url-or-id> <file.md>\n");
      process.exit(1);
    }
    return cmdUpdate(docRef, mdFile);
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`ERROR: ${err.message || err}\n`);
  process.exit(1);
});
