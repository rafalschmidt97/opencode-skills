#!/usr/bin/env node
// searxng_ctl.js — Lifecycle manager for the SearXNG + MCP server containers.
//
// Cross-platform (macOS + Windows). Auto-detects Docker or Podman.
// Outputs JSON to stdout, errors to stderr.
//
// Usage:
//     node searxng_ctl.js start   — start containers
//     node searxng_ctl.js stop    — stop containers
//     node searxng_ctl.js status  — check container status
//     node searxng_ctl.js health  — health-check the MCP endpoint
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const SKILL_DIR = path.resolve(__dirname, "..");
const COMPOSE_FILE = path.join(SKILL_DIR, "compose.yml");
const CONFIG_ENV = path.join(SKILL_DIR, "config.env");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadConfig() {
  const config = {};
  if (fs.existsSync(CONFIG_ENV)) {
    const lines = fs.readFileSync(CONFIG_ENV, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        config[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
  for (const key of ["SEARXNG_MCP_PORT", "COMPOSE_CMD"]) {
    if (process.env[key]) config[key] = process.env[key];
  }
  return config;
}

// ---------------------------------------------------------------------------
// Runtime detection
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      cwd: opts.cwd || SKILL_DIR,
      timeout: opts.timeout || 30000,
      ...opts,
    }).trim();
  } catch {
    return null;
  }
}

function findComposeCmd(config) {
  const explicit = (config.COMPOSE_CMD || "").trim();
  if (explicit) return explicit;

  for (const runtime of ["docker", "podman"]) {
    if (run(`${runtime} compose version`)) {
      return `${runtime} compose`;
    }
  }
  return null;
}

function getRuntimeName(composeCmd) {
  if (composeCmd && composeCmd.includes("podman")) return "podman";
  return "docker";
}

// ---------------------------------------------------------------------------
// Podman machine helpers
// ---------------------------------------------------------------------------

function checkPodmanMachine() {
  const output = run("podman machine list --format json");
  if (!output) return { exists: false, running: false };
  try {
    const machines = JSON.parse(output);
    if (!Array.isArray(machines) || machines.length === 0) {
      return { exists: false, running: false };
    }
    return { exists: true, running: machines.some((m) => m.Running === true) };
  } catch {
    return { exists: false, running: false };
  }
}

function startPodmanMachine() {
  console.error("Starting Podman machine...");
  try {
    execSync("podman machine start", {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Compose wrapper
// ---------------------------------------------------------------------------

function runCompose(composeCmd, args, config = {}, timeout = 120000) {
  const cmd = `${composeCmd} -f "${COMPOSE_FILE}" ${args.join(" ")}`;
  try {
    const stdout = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      cwd: SKILL_DIR,
      timeout,
      env: { ...process.env, ...config },
    });
    return { ok: true, stdout: stdout.trim(), stderr: "" };
  } catch (e) {
    return {
      ok: false,
      stdout: (e.stdout || "").toString().trim(),
      stderr: (e.stderr || "").toString().trim(),
    };
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdStart(composeCmd, config) {
  const runtime = getRuntimeName(composeCmd);

  // Podman machine check
  if (runtime === "podman") {
    const machine = checkPodmanMachine();
    if (machine.exists && !machine.running) {
      if (!startPodmanMachine()) {
        console.log(JSON.stringify({ ok: false, error: "Failed to start Podman machine." }));
        return 1;
      }
    } else if (!machine.exists) {
      console.log(
        JSON.stringify({
          ok: false,
          error: "No Podman machine found. Run: podman machine init && podman machine start",
        })
      );
      return 1;
    }
  }

  // Check settings exist
  const settingsFile = path.join(SKILL_DIR, "searxng", "settings.yml");
  if (!fs.existsSync(settingsFile)) {
    console.log(
      JSON.stringify({
        ok: false,
        error: `SearXNG settings not found at ${settingsFile}. Run install.js first.`,
      })
    );
    return 1;
  }

  const result = runCompose(composeCmd, ["up", "-d"], config, 180000);
  if (!result.ok) {
    console.log(
      JSON.stringify({ ok: false, error: result.stderr || "Failed to start containers." })
    );
    return 1;
  }

  console.log(
    JSON.stringify({
      ok: true,
      runtime,
      message: "Containers started. MCP server will be available shortly.",
      mcp_port: parseInt(config.SEARXNG_MCP_PORT || "32123", 10),
    })
  );
  return 0;
}

function cmdStop(composeCmd, config) {
  const result = runCompose(composeCmd, ["down"], config);
  if (!result.ok) {
    console.log(
      JSON.stringify({ ok: false, error: result.stderr || "Failed to stop containers." })
    );
    return 1;
  }
  console.log(JSON.stringify({ ok: true, message: "Containers stopped." }));
  return 0;
}

function cmdStatus(composeCmd, config) {
  const result = runCompose(composeCmd, ["ps", "--format", "json"], config);
  if (!result.ok) {
    console.log(
      JSON.stringify({
        ok: false,
        error: result.stderr || result.stdout || "Failed to get container status.",
      })
    );
    return 1;
  }

  let containers = [];
  const raw = (result.stdout || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      containers = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Some compose versions output one JSON object per line
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          containers.push(JSON.parse(trimmed));
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }

  const running =
    containers.length > 0 &&
    containers.every((c) => {
      const state = (c.State || "").toLowerCase();
      const status = (c.Status || "").toLowerCase();
      return state === "running" || state === "up" || status.includes("up");
    });

  console.log(
    JSON.stringify({
      ok: true,
      running,
      container_count: containers.length,
      containers: containers.map((c) => ({
        name: c.Name || c.Names || "unknown",
        state: c.State || c.Status || "unknown",
        image: c.Image || "",
      })),
      mcp_port: parseInt(config.SEARXNG_MCP_PORT || "32123", 10),
    })
  );
  return 0;
}

function cmdHealth(config) {
  const port = parseInt(config.SEARXNG_MCP_PORT || "32123", 10);
  const url = `http://127.0.0.1:${port}/`;

  return new Promise((resolve) => {
    const req = http.get(
      url,
      { headers: { Accept: "application/json" }, timeout: 10000 },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          console.log(
            JSON.stringify({
              ok: true,
              healthy: res.statusCode >= 200 && res.statusCode < 500,
              status_code: res.statusCode,
              url,
              response_preview: body.slice(0, 500),
            })
          );
          resolve(0);
        });
      }
    );

    req.on("error", (err) => {
      console.log(
        JSON.stringify({
          ok: true,
          healthy: false,
          url,
          error: err.message,
          message: "MCP server is not responding. Containers may be stopped.",
        })
      );
      resolve(1);
    });

    req.on("timeout", () => {
      req.destroy();
      console.log(
        JSON.stringify({
          ok: true,
          healthy: false,
          url,
          error: "Request timed out",
          message: "MCP server is not responding. Containers may be stopped.",
        })
      );
      resolve(1);
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const COMMANDS = ["start", "stop", "status", "health"];

async function main() {
  const command = (process.argv[2] || "").toLowerCase();

  if (!command || command === "--help" || command === "-h") {
    console.error(`Usage: node ${path.basename(__filename)} <${COMMANDS.join("|")}>`);
    process.exit(command ? 0 : 1);
  }

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}. Choose from: ${COMMANDS.join(", ")}`);
    process.exit(1);
  }

  const config = loadConfig();

  // Health check doesn't need compose
  if (command === "health") {
    const code = await cmdHealth(config);
    process.exit(code);
  }

  const composeCmd = findComposeCmd(config);
  if (!composeCmd) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "No container runtime found. Install Docker Desktop or Podman.",
      })
    );
    process.exit(1);
  }

  let code = 0;
  switch (command) {
    case "start":
      code = cmdStart(composeCmd, config);
      break;
    case "stop":
      code = cmdStop(composeCmd, config);
      break;
    case "status":
      code = cmdStatus(composeCmd, config);
      break;
  }
  process.exit(code);
}

main();
