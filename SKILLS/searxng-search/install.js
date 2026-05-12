#!/usr/bin/env node
// install.js — cross-platform installer for searxng-search skill
// Requires: Node.js 18+, Docker Desktop or Podman
"use strict";

const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SKILL_DIR = process.env.SKILL_DIR || __dirname;

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: opts.stdio || ["pipe", "pipe", "pipe"],
      cwd: opts.cwd || SKILL_DIR,
      timeout: opts.timeout || 30000,
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

// ── Container runtime detection ──────────────────────────────────────────────

function findComposeCmd(config) {
  // Honor explicit COMPOSE_CMD from config.env or environment
  const explicit = (config.COMPOSE_CMD || "").trim();
  if (explicit) {
    const version = run(`${explicit} version`);
    if (version) {
      const runtime = explicit.includes("podman") ? "podman" : "docker";
      return { runtime, cmd: explicit, version: version.trim() };
    }
  }

  // Auto-detect: try docker compose (V2) first, then podman compose
  for (const runtime of ["docker", "podman"]) {
    const version = run(`${runtime} compose version`);
    if (version) {
      return { runtime, cmd: `${runtime} compose`, version: version.trim() };
    }
  }
  return null;
}

// ── Config helpers ───────────────────────────────────────────────────────────

function loadConfig() {
  const configPath = path.join(SKILL_DIR, "config.env");
  const config = {};
  if (fs.existsSync(configPath)) {
    const lines = fs.readFileSync(configPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        config[key] = val;
      }
    }
  }
  // Env overrides
  for (const key of ["SEARXNG_MCP_PORT", "COMPOSE_CMD"]) {
    if (process.env[key]) config[key] = process.env[key];
  }
  return config;
}

// ── SearXNG settings generation ──────────────────────────────────────────────

function generateSettings() {
  const settingsDir = path.join(SKILL_DIR, "searxng");
  const settingsFile = path.join(settingsDir, "settings.yml");

  if (fs.existsSync(settingsFile)) {
    console.log("    SearXNG settings already exist — skipping generation.");
    return;
  }

  // Generate a random secret key
  const secretKey = crypto.randomBytes(32).toString("hex");

  const settings = [
    "use_default_settings: true",
    "",
    "server:",
    `  secret_key: "${secretKey}"`,
    "  limiter: false",
    "  image_proxy: false",
    "",
    "search:",
    "  formats:",
    "    - html",
    "    - json",
    "  safe_search: 0",
    '  autocomplete: "duckduckgo"',
    '  default_lang: "en"',
    "",
  ].join("\n");

  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(settingsFile, settings, "utf-8");
  console.log("    Generated searxng/settings.yml with random secret key.");
}

// ── Podman machine check ─────────────────────────────────────────────────────

function checkPodmanMachine() {
  const output = run("podman machine list --format json");
  if (!output) return { exists: false, running: false };
  try {
    const machines = JSON.parse(output);
    if (!Array.isArray(machines) || machines.length === 0) {
      return { exists: false, running: false };
    }
    const running = machines.some((m) => m.Running === true);
    return { exists: true, running };
  } catch {
    return { exists: false, running: false };
  }
}

// ── MCP auto-registration ────────────────────────────────────────────────────

function findAgentConfigs() {
  const home = os.homedir();
  const configs = [];

  // OpenCode: ~/.config/opencode/opencode.json
  const opencodeConfig = path.join(home, ".config", "opencode", "opencode.json");
  if (fs.existsSync(opencodeConfig)) {
    configs.push({ name: "OpenCode", path: opencodeConfig, mcpKey: "mcp" });
  }

  // Claude Code: ~/.claude.json (if it uses similar MCP config)
  // Claude Code uses ~/.claude/settings.json or similar — only register if
  // we find a known config file with an "mcpServers" key.
  const claudeSettings = path.join(home, ".claude", "settings.json");
  if (fs.existsSync(claudeSettings)) {
    configs.push({
      name: "Claude Code",
      path: claudeSettings,
      mcpKey: "mcpServers",
    });
  }

  return configs;
}

function registerMcpServer(configInfo, port) {
  const { name, path: configPath, mcpKey } = configInfo;
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw);

    // Ensure the MCP section exists
    if (!config[mcpKey]) {
      config[mcpKey] = {};
    }

    // Check if already registered
    if (config[mcpKey].searxng) {
      console.log(`    ${name}: MCP server "searxng" already registered — skipping.`);
      return;
    }

    // Add the MCP server entry
    config[mcpKey].searxng = {
      type: "remote",
      url: `http://localhost:${port}/`,
      enabled: true,
    };

    // Write back with same formatting (2-space indent)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
    console.log(`    ${name}: Registered MCP server "searxng" at http://localhost:${port}/`);
  } catch (e) {
    console.error(
      `    WARNING: Could not update ${name} config at ${configPath}: ${e.message}`
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log("==> Installing searxng-search skill");
console.log(`    Skill directory: ${SKILL_DIR}`);
console.log(`    Platform: ${os.platform()} (${os.arch()})`);
console.log("");

// 1. Detect container runtime
console.log("==> Detecting container runtime...");
const config = loadConfig();
const compose = findComposeCmd(config);
if (!compose) {
  die(
    "No container runtime found.\n" +
      "    Install Docker Desktop (https://www.docker.com/products/docker-desktop/)\n" +
      "    or Podman (https://podman.io/getting-started/installation)."
  );
}
console.log(`    Found: ${compose.cmd}`);
console.log(`    Version: ${compose.version}`);

// 2. If Podman, check machine status
if (compose.runtime === "podman") {
  console.log("");
  console.log("==> Checking Podman machine...");
  const machine = checkPodmanMachine();
  if (!machine.exists) {
    console.log(
      "    WARNING: No Podman machine found. You will need to create one:"
    );
    console.log("      podman machine init");
    console.log("      podman machine start");
  } else if (!machine.running) {
    console.log("    WARNING: Podman machine exists but is not running.");
    console.log("    Start it before using the skill:");
    console.log("      podman machine start");
  } else {
    console.log("    Podman machine is running.");
  }
}

// 3. Generate SearXNG settings
console.log("");
console.log("==> Generating SearXNG configuration...");
generateSettings();

// 4. Pull container images
console.log("");
console.log("==> Pulling container images (this may take a minute)...");
try {
  run(`${compose.cmd} -f "${path.join(SKILL_DIR, "compose.yml")}" pull`, {
    stdio: "inherit",
    timeout: 300000,
    throwOnError: true,
  });
} catch (e) {
  console.error("");
  die(
    `Failed to pull container images.\n` +
      `    Please resolve the ${compose.runtime} error above and re-run the installer.`
  );
}

// 5. Register MCP server in agent configs
const port = config.SEARXNG_MCP_PORT || "32123";

console.log("");
console.log("==> Registering MCP server in agent configurations...");
const agentConfigs = findAgentConfigs();
if (agentConfigs.length === 0) {
  console.log("    No agent config files found — skipping MCP registration.");
  console.log("    To register manually, add this to your agent's MCP config:");
  console.log("");
  console.log('      "searxng": {');
  console.log('        "type": "remote",');
  console.log(`        "url": "http://localhost:${port}/",`);
  console.log('        "enabled": true');
  console.log("      }");
} else {
  for (const agentConfig of agentConfigs) {
    registerMcpServer(agentConfig, port);
  }
}

// 6. Done
console.log("");
console.log("==> Done. SearXNG search skill is installed.");
console.log("");
console.log("    To start the service:");
console.log(`      node ${path.join(SKILL_DIR, "scripts", "searxng_ctl.js")} start`);
console.log("");
console.log("    To verify:");
console.log(`      node ${path.join(SKILL_DIR, "scripts", "searxng_ctl.js")} health`);
console.log("");
console.log(
  "    NOTE: Restart your AI agent (OpenCode, Claude Code) to pick up the new MCP server."
);
