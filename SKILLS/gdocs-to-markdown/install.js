#!/usr/bin/env node
// install.js — installer for gdocs-to-markdown skill
// Requires: Node.js 18+, gcloud CLI
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SKILL_DIR = process.env.SKILL_DIR || __dirname;
const NODE_MODULES = path.join(SKILL_DIR, "node_modules");

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      cwd: SKILL_DIR,
      stdio: opts.stdio || ["pipe", "pipe", "pipe"],
      ...opts,
    }).trim();
  } catch (e) {
    if (opts.throwOnError) throw e;
    return null;
  }
}

function die(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log("==> Installing gdocs-to-markdown skill");
console.log(`    Skill directory: ${SKILL_DIR}`);

// 1. Check Node.js version
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
if (major < 18) {
  die(`Node.js 18+ required, found ${nodeVersion}`);
}
console.log(`    Using: Node.js ${nodeVersion}`);

// 2. Create package.json if not present
const pkgPath = path.join(SKILL_DIR, "package.json");
if (!fs.existsSync(pkgPath)) {
  const pkg = {
    name: "gdocs-to-markdown",
    version: "1.0.0",
    private: true,
    dependencies: {
      turndown: "^7.2.0",
      "turndown-plugin-gfm": "^1.0.2",
    },
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("    Created package.json");
}

// 3. Install dependencies
console.log("    Installing npm dependencies (turndown, turndown-plugin-gfm)...");
execSync("npm install --no-fund --no-audit", { cwd: SKILL_DIR, stdio: "inherit" });

// 4. Verify
console.log("    Verifying installation...");
const verify = run(
  `node -e "const T = require('turndown'); const g = require('turndown-plugin-gfm'); console.log('    turndown OK'); console.log('    turndown-plugin-gfm OK');"`
);
if (verify) {
  console.log(verify);
} else {
  die("Failed to verify turndown installation.");
}

// 5. Make CLI executable (unix only)
if (process.platform !== "win32") {
  const cliScript = path.join(SKILL_DIR, "scripts", "gdocs_cli.js");
  if (fs.existsSync(cliScript)) {
    fs.chmodSync(cliScript, 0o755);
  }
}

console.log("");
console.log("==> Done.");
console.log("");
console.log("    Next steps:");
console.log("    1. Install gcloud CLI if not already installed:");
console.log("       https://cloud.google.com/sdk/docs/install");
console.log("    2. Set a default project (needed for API quota):");
console.log("       gcloud config set project YOUR_PROJECT_ID");
console.log("    3. Authenticate with Google Drive scope:");
console.log("       gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive.readonly");
console.log("");
console.log("    To test:");
console.log(`      node ${path.join(SKILL_DIR, "scripts", "gdocs_cli.js")} --help`);
