#!/usr/bin/env node
// crawl4ai_ctl.js — Lifecycle manager for the Crawl4AI container.
//
// Cross-platform (macOS + Windows). Auto-detects Docker or Podman.
// Outputs JSON to stdout, errors to stderr.
//
// Usage:
//     node crawl4ai_ctl.js start   — start container
//     node crawl4ai_ctl.js stop    — stop container
//     node crawl4ai_ctl.js status  — check container status
//     node crawl4ai_ctl.js health  — health-check the API endpoint
"use strict";

const { execSync } = require("child_process");
const http = require("http");
const path = require("path");

const CONTAINER_NAME = "crawl4ai";
const IMAGE = "docker.io/unclecode/crawl4ai:latest";
const PORT = 11235;
const SHM_SIZE = "1g";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: opts.timeout || 30000,
      ...opts,
    }).trim();
  } catch {
    return null;
  }
}

function findRuntime() {
  for (const rt of ["podman", "docker"]) {
    if (run(`${rt} version`)) return rt;
  }
  return null;
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
// Container helpers
// ---------------------------------------------------------------------------

function containerExists(rt) {
  const output = run(`${rt} ps -a --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`);
  return output === CONTAINER_NAME;
}

function containerRunning(rt) {
  const output = run(`${rt} ps --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`);
  return output === CONTAINER_NAME;
}

function containerStatus(rt) {
  const output = run(
    `${rt} ps -a --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}|{{.Status}}|{{.Image}}"`
  );
  if (!output) return null;
  const [name, status, image] = output.split("|");
  return { name, status, image };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdStart(rt) {
  // Podman machine check
  if (rt === "podman") {
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

  if (containerRunning(rt)) {
    console.log(
      JSON.stringify({
        ok: true,
        runtime: rt,
        message: "Container is already running.",
        port: PORT,
      })
    );
    return 0;
  }

  if (containerExists(rt)) {
    // Container exists but stopped — start it
    const result = run(`${rt} start ${CONTAINER_NAME}`, { timeout: 60000 });
    if (result === null) {
      console.log(
        JSON.stringify({ ok: false, error: "Failed to start existing container." })
      );
      return 1;
    }
  } else {
    // Create and start container
    const cmd = [
      rt, "run", "-d",
      "-p", `${PORT}:${PORT}`,
      "--name", CONTAINER_NAME,
      "--shm-size=" + SHM_SIZE,
      "--restart", "unless-stopped",
      IMAGE,
    ].join(" ");

    const result = run(cmd, { timeout: 180000 });
    if (result === null) {
      console.log(
        JSON.stringify({ ok: false, error: "Failed to create and start container." })
      );
      return 1;
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      runtime: rt,
      message: "Container started. Server will be available shortly (~10s for browser pool init).",
      port: PORT,
    })
  );
  return 0;
}

function cmdStop(rt) {
  if (!containerRunning(rt)) {
    console.log(JSON.stringify({ ok: true, message: "Container is not running." }));
    return 0;
  }

  const result = run(`${rt} stop ${CONTAINER_NAME}`, { timeout: 30000 });
  if (result === null) {
    console.log(JSON.stringify({ ok: false, error: "Failed to stop container." }));
    return 1;
  }

  console.log(JSON.stringify({ ok: true, message: "Container stopped." }));
  return 0;
}

function cmdStatus(rt) {
  const info = containerStatus(rt);
  if (!info) {
    console.log(
      JSON.stringify({
        ok: true,
        running: false,
        exists: false,
        message: "Container does not exist.",
        port: PORT,
      })
    );
    return 0;
  }

  const running = containerRunning(rt);
  console.log(
    JSON.stringify({
      ok: true,
      running,
      exists: true,
      container: info,
      port: PORT,
    })
  );
  return 0;
}

function cmdHealth() {
  const url = `http://127.0.0.1:${PORT}/health`;

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
          let parsed = {};
          try {
            parsed = JSON.parse(body);
          } catch {}

          console.log(
            JSON.stringify({
              ok: true,
              healthy: res.statusCode === 200 && parsed.status === "ok",
              status_code: res.statusCode,
              url,
              version: parsed.version || "unknown",
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
          message: "Crawl4AI server is not responding. Container may be stopped.",
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
          message: "Crawl4AI server is not responding. Container may be stopped.",
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

  // Health check doesn't need runtime detection
  if (command === "health") {
    const code = await cmdHealth();
    process.exit(code);
  }

  const rt = findRuntime();
  if (!rt) {
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
      code = cmdStart(rt);
      break;
    case "stop":
      code = cmdStop(rt);
      break;
    case "status":
      code = cmdStatus(rt);
      break;
  }
  process.exit(code);
}

main();
