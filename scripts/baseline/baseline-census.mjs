#!/usr/bin/env node
/**
 * Baseline census — reconciles inventory.json (SSOT) against figma-census.json
 * (a fresh dump of the 6 baseline Figma files, produced by an agent via MCP —
 * same regeneration model as packages/editor/scripts/conformance/boards.json:
 * no FIGMA_TOKEN, no REST; the dump step is an agent step by design).
 *
 * Checks (each maps to a planted-violation class from the plan's Phase 0):
 *   DUP      — a BL- id appears on more than one Figma frame        (violation 1)
 *   WIDTH    — frame width differs from the row's expectedWidth     (violation 2)
 *   MISSING  — a row's figmaNodeId is absent from the dump          (violation 3)
 *   ORPHAN   — a BL- frame in Figma has no inventory row (unmanaged write)
 *   STATE    — row claims readback-verified+ but carries no figmaNodeId
 *
 * Exit codes: 0 clean · 1 violations (printed one per line) · 3 input missing.
 * A gate must be watched to FAIL: plant all three violation classes once and
 * see them here before trusting a green run.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const INV = join(HERE, "inventory.json");
const DUMP = join(HERE, "figma-census.json");

if (!existsSync(INV) || !existsSync(DUMP)) {
  console.error("[census] missing inventory.json or figma-census.json");
  process.exit(3);
}
const inv = JSON.parse(readFileSync(INV, "utf8"));
const dump = JSON.parse(readFileSync(DUMP, "utf8"));
// dump shape: { generated, files: { <fileKey>: [{nodeId, name, page, width, height}] } }

const violations = [];
const blId = (name) => (name.match(/^(BL-\d{4})\b/) || [])[1] || null;

// Index every BL- frame across all dumped files
const framesById = new Map(); // BL-id -> [{fileKey, nodeId, name, width}]
for (const [fileKey, frames] of Object.entries(dump.files)) {
  for (const f of frames) {
    const id = blId(f.name);
    if (!id) continue;
    if (!framesById.has(id)) framesById.set(id, []);
    framesById.get(id).push({ fileKey, ...f });
  }
}

// DUP — same BL- id on >1 frame
for (const [id, frames] of framesById) {
  if (frames.length > 1)
    violations.push(`DUP      ${id} on ${frames.length} frames: ${frames.map((f) => `${f.fileKey}#${f.nodeId}`).join(", ")}`);
}

const advanced = new Set(["readback-verified", "diffed", "done"]);
for (const row of inv.rows) {
  const frames = framesById.get(row.id) || [];
  // MISSING — row points at a node the dump does not contain
  if (row.figmaNodeId) {
    const hit = frames.find((f) => f.nodeId === row.figmaNodeId && f.fileKey === row.figmaFileKey);
    if (!hit) violations.push(`MISSING  ${row.id} → ${row.figmaFileKey}#${row.figmaNodeId} not in dump`);
    // WIDTH — recorded expectation vs dumped reality (±1px per diff gate)
    else if (row.expectedWidth != null && Math.abs(hit.width - row.expectedWidth) > 1)
      violations.push(`WIDTH    ${row.id} expected ${row.expectedWidth}, dump has ${hit.width}`);
  }
  // STATE — claims evidence-bearing state without a node reference
  if (advanced.has(row.pipelineState) && !row.figmaNodeId)
    violations.push(`STATE    ${row.id} is ${row.pipelineState} but has no figmaNodeId`);
}

// ORPHAN — Figma frame with a BL- id no row owns
const owned = new Set(inv.rows.map((r) => r.id));
for (const [id, frames] of framesById)
  if (!owned.has(id)) violations.push(`ORPHAN   ${id} (${frames[0].fileKey}#${frames[0].nodeId}) has no inventory row`);

if (violations.length) {
  console.error(`[census] ${violations.length} violation(s):`);
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log(`[census] PASS — ${inv.rows.length} rows, ${framesById.size} managed frames, dump ${dump.generated}`);
