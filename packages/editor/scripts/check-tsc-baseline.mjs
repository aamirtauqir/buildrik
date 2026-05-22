#!/usr/bin/env node
/**
 * Gate 26: TypeScript error baseline.
 *
 * Pre-push runs `tsc --noEmit` for editor + dashboard pkgs, counts errors,
 * compares against locked baselines. New errors → fail. Existing errors
 * carried over → pass. Drops below baseline → suggest ratchet.
 *
 * Baselines live in scripts/.tsc-baselines.json. Update intentionally by
 * editing that file after fixing real errors (the gate prints exact JSON
 * to write).
 *
 * Why: verify:ds runs grep-only gates today. TS errors slip past push.
 * This closes the gap without forcing every accumulated error to be
 * fixed at once.
 *
 * Uses execFileSync (no shell expansion) per repo security policy. All
 * args are hardcoded literals — no user input flow.
 *
 * @license BSD-3-Clause
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");
const baselinePath = resolve(__dirname, ".tsc-baselines.json");

const baselines = JSON.parse(readFileSync(baselinePath, "utf8"));

const projects = [
  { name: "editor", tsconfig: "packages/editor/tsconfig.json" },
  { name: "dashboard", tsconfig: "packages/dashboard/tsconfig.json" },
];

let failed = false;
const updated = {};

for (const p of projects) {
  let output = "";
  try {
    execFileSync("npx", ["tsc", "--noEmit", "-p", p.tsconfig], {
      cwd: repoRoot,
      stdio: "pipe",
    });
    output = "";
  } catch (e) {
    output = (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "");
  }

  const count = (output.match(/error TS\d+:/g) ?? []).length;
  const baseline = baselines[p.name] ?? 0;
  updated[p.name] = count;

  if (count > baseline) {
    console.error(
      `[tsc gate] FAIL ${p.name}: ${count} errors (baseline ${baseline}, regression +${count - baseline})`,
    );
    failed = true;
  } else if (count < baseline) {
    console.log(
      `[tsc gate] PASS ${p.name}: ${count} errors (baseline ${baseline}, improvement ${baseline - count}). Ratchet baseline.`,
    );
  } else {
    console.log(`[tsc gate] PASS ${p.name}: ${count} errors at baseline`);
  }
}

if (failed) {
  console.error("\n[tsc gate] BLOCK: TypeScript errors regressed past baseline.");
  console.error("Either fix the new errors OR update scripts/.tsc-baselines.json:");
  console.error(JSON.stringify(updated, null, 2));
  process.exit(1);
}

const improved = Object.entries(updated).some(([k, v]) => v < (baselines[k] ?? 0));
if (improved) {
  console.log(`\n[tsc gate] Suggested baseline ratchet:`);
  console.log(JSON.stringify(updated, null, 2));
}

console.log("[tsc gate] all projects at or below baseline");
