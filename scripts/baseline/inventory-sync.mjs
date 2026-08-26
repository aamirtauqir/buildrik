#!/usr/bin/env node
/**
 * Reconcile `inventory.json` with what is actually in the Figma file.
 *
 * The census is the SSOT for which node id belongs to which state, and it goes
 * stale the moment a capture lands: `figma-refresh.mjs` creates a new frame and
 * marks the old one SUPERSEDED, but nothing told the inventory. A census that
 * still points at a superseded frame is how a dead frame gets read as the
 * design — the failure this repo has already recorded twice.
 *
 * Figma is the artefact, so Figma is what this reads. Frame names carry the
 * contract: `BL-0100 / edit/:id / <state> / 1440 — CURRENT 2026-08-26`.
 *
 * Usage: node inventory-sync.mjs [--write]   (default is a dry report)
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const INV = join(HERE, "inventory.json");
const FILE_KEY = "Micuc1rmLcFhjxF1A08Kk2";
const EDITOR_PAGE = "75:2";
const WRITE = process.argv.includes("--write");

const mcp = await import("./figma-mcp.mjs");
await mcp.connect();
const res = await mcp.rpc("tools/call", {
  name: "use_figma",
  arguments: {
    fileKey: FILE_KEY,
    description: "list editor frames for census reconciliation",
    code: `const p = figma.root.children.find(x => x.id === "${EDITOR_PAGE}");
           if (p.children.length === 0) await p.loadAsync();
           return p.children.map(k => ({ id: k.id, name: k.name }));`,
  },
}, 80);
const text = (res.result?.content ?? []).map((c) => c.text ?? "").join("\n");
const m = text.match(/\[[\s\S]*\]/);
if (!m) { console.error("could not read frames:", text.slice(0, 300)); process.exit(2); }
const frames = JSON.parse(m[0]);

/* Only frames that say CURRENT count. A file where two frames claim the same
   state is exactly what the census must not copy. */
const current = new Map();
for (const f of frames) {
  const bl = (f.name.match(/^(BL-\d+)/) || [])[1];
  if (!bl || !/— CURRENT/.test(f.name)) continue;
  const date = (f.name.match(/CURRENT (\d{4}-\d{2}-\d{2})/) || [])[1] || null;
  const prev = current.get(bl);
  if (prev && prev.date >= (date ?? "")) continue;   // keep the newest claim
  current.set(bl, { id: f.id, name: f.name, date, state: (f.name.split(" / ")[2] || "").trim() });
}

const inv = JSON.parse(readFileSync(INV, "utf8"));
const rows = Array.isArray(inv) ? inv : inv.rows;
const byId = new Map(rows.map((r) => [r.id, r]));

const changed = [], added = [], dupes = [];
const seenBl = new Set();
for (const f of frames) {
  const bl = (f.name.match(/^(BL-\d+)/) || [])[1];
  if (!bl || !/— CURRENT/.test(f.name)) continue;
  if (seenBl.has(bl)) dupes.push(bl);
  seenBl.add(bl);
}

for (const [bl, c] of current) {
  const row = byId.get(bl);
  if (!row) {
    added.push({ bl, node: c.id, state: c.state });
    rows.push({
      id: bl, kind: "editor-state", route: "/edit/[siteId]", statusClass: 1, flow: "editor",
      state: c.state, viewport: "1440x900", requires: "session",
      figmaFileKey: FILE_KEY, figmaNodeId: c.id,
      pipelineState: "captured-current", capturedFrom: `localhost@${c.date}`,
    });
    continue;
  }
  if (row.figmaNodeId !== c.id) {
    changed.push({ bl, from: row.figmaNodeId, to: c.id });
    row.figmaNodeId = c.id;
    row.pipelineState = "captured-current";
    row.capturedFrom = `localhost@${c.date}`;
  }
}

/* A row whose node is SUPERSEDED or CAPTURE INCOMPLETE is the failure this
   census exists to prevent: it points the next reader at a frame the file has
   already disowned. sync cannot fix those — a state with no CURRENT frame has
   nothing to point AT — so it names them instead of leaving them silent. */
const byNode = new Map(frames.map((f) => [f.id, f.name]));
const orphaned = [];
for (const r of rows) {
  if (r.flow !== "editor" || !r.figmaNodeId) continue;
  const name = byNode.get(r.figmaNodeId);
  if (!name) { orphaned.push({ bl: r.id, node: r.figmaNodeId, why: "node not on the editor page" }); continue; }
  if (/SUPERSEDED/.test(name)) orphaned.push({ bl: r.id, node: r.figmaNodeId, why: "points at a SUPERSEDED frame" });
  else if (/CAPTURE INCOMPLETE/.test(name)) orphaned.push({ bl: r.id, node: r.figmaNodeId, why: "points at a CAPTURE INCOMPLETE frame" });
}

console.log(`frames on the editor page: ${frames.length}`);
console.log(`states claiming CURRENT:   ${current.size}`);
if (dupes.length) console.log(`!! ${dupes.length} state(s) with MORE THAN ONE current frame: ${[...new Set(dupes)].join(", ")}`);
console.log(`\nnode id moved: ${changed.length}`);
changed.forEach((c) => console.log(`   ${c.bl}  ${c.from} -> ${c.to}`));
console.log(`rows pointing at a frame the file disowned: ${orphaned.length}`);
orphaned.forEach((o) => console.log(`   ${o.bl}  ${o.node}  ${o.why}`));
console.log(`new rows: ${added.length}`);
added.forEach((a) => console.log(`   ${a.bl}  ${a.node}  ${a.state}`));

if (WRITE && (changed.length || added.length)) {
  writeFileSync(INV, JSON.stringify(inv, null, 2) + "\n");
  console.log(`\nwrote ${INV}`);
} else if (!WRITE) {
  console.log("\n(dry run — pass --write to apply)");
}
