#!/usr/bin/env node
// install.js — cross-platform installer for excalidraw-diagrams skill
// Requires: Node.js 18+
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

console.log("==> Installing excalidraw-diagrams skill");
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
    name: "excalidraw-diagrams",
    version: "1.0.0",
    private: true,
    dependencies: {
      "@swiftlysingh/excalidraw-cli": "latest",
    },
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("    Created package.json");
}

// 3. Install dependencies
console.log("    Installing npm dependencies (@swiftlysingh/excalidraw-cli)...");
execSync("npm install --no-fund --no-audit", { cwd: SKILL_DIR, stdio: "inherit" });

// 4. Verify
console.log("    Verifying installation...");
const verify = run(
  `npx --prefix "${SKILL_DIR}" excalidraw-cli --version`
);
if (verify) {
  console.log(`    excalidraw-cli ${verify} OK`);
} else {
  die("Failed to verify excalidraw-cli installation.");
}

console.log("");
console.log("==> Done. excalidraw-cli is ready.");
console.log("");
console.log("    Usage:");
console.log(`      npx --prefix "${SKILL_DIR}" excalidraw-cli convert DIAGRAM.excalidraw --format svg`);
