#!/usr/bin/env node
/**
 * Verify the .ds-green-panels.json allowlist.
 *   1. File is valid JSON.
 *   2. Has a `files` array.
 *   3. Every listed file exists on disk.
 *
 * Exports `verifyGreenPanels(root)` → `{ ok, count?, missing?, parseError?, readError?, missingFilesArray? }`
 * for unit tests. CLI entry prints PASS/FAIL and exits 0/1.
 *
 * Run as CLI: node packages/editor/scripts/verify-green-panels.mjs
 * @license BSD-3-Clause
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function verifyGreenPanels(root) {
  const allowlist = path.join(root, "scripts/.ds-green-panels.json");
  let raw;
  try {
    raw = fs.readFileSync(allowlist, "utf8");
  } catch (err) {
    return { ok: false, readError: err.message };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, parseError: err.message };
  }

  if (!Array.isArray(parsed.files)) {
    return { ok: false, missingFilesArray: true };
  }

  const missing = [];
  for (const rel of parsed.files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) missing.push(rel);
  }
  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true, count: parsed.files.length };
}

const __filename = fileURLToPath(import.meta.url);
const invokedDirectly = process.argv[1] === __filename;
if (invokedDirectly) {
  const root = path.resolve(path.dirname(__filename), "..");
  const result = verifyGreenPanels(root);
  if (result.ok) {
    console.log(`PASS: green-panel allowlist valid (${result.count} files)`);
    process.exit(0);
  }
  if (result.parseError) console.error(`FAIL: malformed JSON — ${result.parseError}`);
  else if (result.readError) console.error(`FAIL: cannot read allowlist — ${result.readError}`);
  else if (result.missingFilesArray) console.error(`FAIL: allowlist missing "files" array`);
  else if (result.missing) console.error(`FAIL: allowlist lists files that do not exist:\n  ${result.missing.join("\n  ")}`);
  process.exit(1);
}
