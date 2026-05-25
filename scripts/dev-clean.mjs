#!/usr/bin/env node
/**
 * Dev-environment cleanup — kills orphan next-dev / vite processes, frees
 * :3000 + :5050, removes the Next.js dev lockfile that survives kill -9.
 *
 * Saved discoveries from V1 walk Iter 19 + autonomous Sprint 1.5 attempt
 * (.gstack/qa-reports/qa-report-autonomous-walk-attempt-2026-05-25.md):
 *
 *   1. Next.js 16 dev lockfile at packages/dashboard/.next/dev/lock isn't
 *      cleaned on kill -9 of the wrapper. Subsequent `pnpm dev` refuses to
 *      start with "Another next dev server is already running".
 *   2. Orphan webpack-loaders + postcss helper processes survive parent
 *      death and keep ports held / files locked.
 *   3. Multiple wrappers race — :3000 held, next instance binds :3001 — UI
 *      tries :3000, gets stuck dashboard, debugger gets confused.
 *
 * Usage:
 *   pnpm dev:clean
 *
 * Then start normally:
 *   cd packages/dashboard && pnpm dev
 *   cd packages/editor    && pnpm dev
 *
 * Exits 0 always; print summarizes what was killed / removed.
 */

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const summary = { killed: [], freed: [], removed: [], skipped: [] };

/** Run a command via execFile (no shell) and return stdout, or "" on non-zero exit. */
function runCmd(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

/** Kill processes whose command line matches `pattern`. */
function killPattern(pattern, label) {
  const out = runCmd("pgrep", ["-f", pattern]);
  const pids = out.trim().split("\n").filter(Boolean);
  for (const pid of pids) {
    if (Number(pid) === process.pid) continue;
    try {
      execFileSync("kill", ["-9", pid], { stdio: "ignore" });
      summary.killed.push({ pid, label });
    } catch (e) {
      summary.skipped.push({ pid, label, reason: String(e?.message ?? e) });
    }
  }
}

/** Free a port by killing whatever owns it. */
function freePort(port) {
  const out = runCmd("lsof", ["-ti", `:${port}`]);
  const pids = out.trim().split("\n").filter(Boolean);
  for (const pid of pids) {
    if (Number(pid) === process.pid) continue;
    try {
      execFileSync("kill", ["-9", pid], { stdio: "ignore" });
      summary.freed.push({ port, pid });
    } catch (e) {
      summary.skipped.push({ port, pid, reason: String(e?.message ?? e) });
    }
  }
}

/** Remove a path if it exists. */
function removeIfExists(relPath, label) {
  const full = resolve(repoRoot, relPath);
  if (!existsSync(full)) return;
  try {
    rmSync(full, { recursive: true, force: true });
    summary.removed.push({ path: relPath, label });
  } catch (e) {
    summary.skipped.push({ path: relPath, reason: String(e?.message ?? e) });
  }
}

// ─── Step 1: kill orphan next-dev + helpers ──────────────────────────────

killPattern("next dist/bin/next dev", "next-dev wrapper");
killPattern(".next/dev/build/webpack-loaders.js", "webpack-loader worker");
killPattern(".next/dev/build/postcss.js", "postcss worker");

// ─── Step 2: kill orphan vite (editor) ───────────────────────────────────
// Vite is usually well-behaved but tidy up if a previous session left one.

killPattern("packages/editor/node_modules/.bin/vite", "vite editor");

// ─── Step 3: free known dev ports ────────────────────────────────────────

freePort(3000);
freePort(3001); // Next falls back to :3001 when :3000 is taken
freePort(5050); // Vite editor

// ─── Step 4: remove Next dev lockfile that survives kill -9 ──────────────

removeIfExists("packages/dashboard/.next/dev/lock", "Next dev lockfile");

// ─── Print summary ───────────────────────────────────────────────────────

console.log("");
console.log("┌──────────────────────────────────────────────");
console.log("│ dev:clean — repo dev-env reset");
console.log("├──────────────────────────────────────────────");

if (
  summary.killed.length === 0 &&
  summary.freed.length === 0 &&
  summary.removed.length === 0
) {
  console.log("│  already clean — nothing to do");
} else {
  for (const k of summary.killed) console.log(`│  killed  pid=${k.pid}  ${k.label}`);
  for (const f of summary.freed) console.log(`│  freed   :${f.port}     (pid=${f.pid})`);
  for (const r of summary.removed) console.log(`│  removed ${r.path}  (${r.label})`);
}

if (summary.skipped.length) {
  console.log("├──────────────────────────────────────────────");
  for (const s of summary.skipped) console.log(`│  skipped ${JSON.stringify(s)}`);
}

console.log("└──────────────────────────────────────────────");
console.log("");
console.log("Now run:");
console.log("  cd packages/dashboard && pnpm dev    # → http://localhost:3000");
console.log("  cd packages/editor    && pnpm dev    # → http://localhost:5050");
console.log("");
