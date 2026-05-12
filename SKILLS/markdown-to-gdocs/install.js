#!/usr/bin/env node
// install.js — installer for markdown-to-gdocs skill
// Requires: Node.js 18+, gcloud CLI
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SKILL_DIR = process.env.SKILL_DIR || __dirname;

function die(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

console.log("==> Installing markdown-to-gdocs skill");
console.log(`    Skill directory: ${SKILL_DIR}`);

// 1. Check Node.js version
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
if (major < 18) {
  die(`Node.js 18+ required, found ${nodeVersion}`);
}
console.log(`    Using: Node.js ${nodeVersion}`);

// 2. Install dependencies
console.log("    Installing npm dependencies (markdown-it)...");
execSync("npm install --no-fund --no-audit", { cwd: SKILL_DIR, stdio: "inherit" });

// 3. Verify
console.log("    Verifying installation...");
try {
  execSync(
    `node -e "require('markdown-it'); console.log('    markdown-it OK');"`,
    { cwd: SKILL_DIR, encoding: "utf-8", stdio: "inherit" }
  );
} catch {
  die("Failed to verify markdown-it installation.");
}

// 4. Make CLI executable (unix only)
if (process.platform !== "win32") {
  const cliScript = path.join(SKILL_DIR, "scripts", "md2gdocs_cli.js");
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
console.log("    2. Authenticate with Google Drive scope:");
console.log("       gcloud auth login --enable-gdrive-access");
console.log("");
console.log("    To test:");
console.log(`      node ${path.join(SKILL_DIR, "scripts", "md2gdocs_cli.js")} --help`);
