#!/usr/bin/env node
/**
 * Local dump of the canonical design file 2L9OTGzBrL6kYmU18yA1c7, one JSON file
 * per page, so parallel agents read boards from disk instead of spending the
 * shared Figma budget (200 calls/day). Plan:
 * docs/superpowers/plans/2026-10-22-implement-2l9-design.md, Task 0.1.
 *
 *   node scripts/design-2l9/dump.mjs <pageId> [<pageId> ...]
 *
 * Each call to Figma walks a slice of one page inside `use_figma` and returns
 * at most ~19 KB (the tool caps returns at 20,000 UTF-8 bytes). Progress is
 * kept in docs/design-2l9/dump/.cursor.json, so a run stopped by the budget or
 * an expired token resumes where it stopped.
 *
 * Only nodes visible through their whole ancestor chain are recorded: the
 * hidden `Legacy ·` shells kept until the owner's cleanup never reach the dump.
 *
 * Exit 0 done · 1 a page's frame count did not match the live count (page file
 * not written) · 3 stopped by budget/401 (cursor kept; resume later).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FILE_KEY = "2L9OTGzBrL6kYmU18yA1c7";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../../docs/design-2l9/dump");
const RETURN_BUDGET = 19_000;

/**
 * Walk one top-level frame. Runs both here (tests) and inside the Figma
 * sandbox (serialized via toString), so it uses only plain property reads.
 */
export function walkFrame(frame) {
  const texts = [];
  const instances = [];
  const boxes = [];
  // Only the outermost instance of each nesting is recorded (once per frame):
  // an instance's own sub-instances belong to its component, not the board.
  // Shell chrome (Shell/Topbar, Shell/BottomBar, …) repeats on almost every
  // board; its texts collapse into one joined string so the per-page
  // dictionary stores each shell variant once.
  let shell = null;
  const visit = (node, depth, insideInstance) => {
    if (node.visible === false) return;
    if (depth === 1 && /^Shell\//.test(node.name)) {
      shell = [];
      for (const child of node.children ?? []) visit(child, depth + 1, node.type === "INSTANCE");
      texts.push(`${node.name}: ${shell.join(" ‖ ")}`);
      shell = null;
      if ("width" in node) boxes.push([node.name, Math.round(node.x), Math.round(node.y), Math.round(node.width), Math.round(node.height)]);
      if (node.type === "INSTANCE") { const n = node.mainComponentName ?? node.name; if (!instances.includes(n)) instances.push(n); }
      return;
    }
    if (node.type === "TEXT" && node.characters) (shell ?? texts).push(node.characters);
    const isInstance = node.type === "INSTANCE";
    if (isInstance && !insideInstance) {
      const name = node.mainComponentName ?? node.name;
      if (!instances.includes(name)) instances.push(name);
    }
    if (depth === 1 && "width" in node) boxes.push([node.name, Math.round(node.x), Math.round(node.y), Math.round(node.width), Math.round(node.height)]);
    for (const child of node.children ?? []) visit(child, depth + 1, insideInstance || isInstance);
  };
  visit(frame, 0, false);
  return { id: frame.id, name: frame.name, w: Math.round(frame.width), h: Math.round(frame.height), texts, instances, boxes };
}

/** UTF-8 byte length; the Figma sandbox has no TextEncoder. */
export function utf8Length(s) {
  let n = 0;
  for (const ch of s) { const c = ch.codePointAt(0); n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; }
  return n;
}

const SCRUB = [/[\w.+-]+@[\w-]+\.[\w.-]+/g, /\b(?:sk|pk|ghp|xox[bp])[-_][A-Za-z0-9_-]{8,}\b/g];
/** Drop email- and credential-shaped text before anything reaches disk. */
export function scrub(text) {
  let hits = 0;
  const out = SCRUB.reduce((t, re) => t.replace(re, () => { hits++; return "[scrubbed]"; }), text);
  return { text: out, hits };
}

/** Dictionary-encode a chunk of frame records: strings shared across boards are stored once. */
export function encode(records) {
  const D = [];
  const index = new Map();
  const ref = (s) => { if (!index.has(s)) { index.set(s, D.length); D.push(s); } return index.get(s); };
  const rows = records.map((r) => ({ ...r, texts: r.texts.map(ref), instances: r.instances.map(ref) }));
  return { D, rows };
}

export function decode({ D, rows }) {
  return rows.map((r) => ({ ...r, texts: r.texts.map((i) => D[i]), instances: r.instances.map((i) => D[i]) }));
}

export function readCursor(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
}

/**
 * Finish one page: refuse to write it unless every live top-level frame was
 * dumped. Returns the exit code for that page.
 */
export function finishPage(outDir, pageId, frames, liveCount) {
  if (frames.length !== liveCount) {
    process.stderr.write(`page ${pageId}: dumped ${frames.length} frames, live count ${liveCount}; page file not written\n`);
    return 1;
  }
  let scrubbed = 0;
  const clean = frames.map((f) => ({
    ...f,
    texts: f.texts.map((t) => { const s = scrub(t); scrubbed += s.hits; return s.text; }),
  }));
  writeFileSync(join(outDir, `page-${pageId.replace(":", "-")}.json`), JSON.stringify({ fileKey: FILE_KEY, pageId, count: clean.length, scrubbed, ...encode(clean) }));
  return 0;
}

/** The script sent to `use_figma`: one slice of one page, starting at frame `from`. */
export function pageScript(pageId, from) {
  return `
const walkFrame = ${walkFrame.toString()};
const utf8Length = ${utf8Length.toString()};
const page = await figma.getNodeByIdAsync(${JSON.stringify(pageId)});
await figma.setCurrentPageAsync(page);
const frames = [];
const visibleChain = (n) => { for (let p = n; p && p.type !== "PAGE"; p = p.parent) if (p.visible === false) return false; return true; };
for (const top of page.children) {
  if (top.type === "FRAME" || top.type === "COMPONENT" || top.type === "COMPONENT_SET") frames.push(top);
  else if (top.type === "SECTION") for (const c of top.children) if (c.type === "FRAME") frames.push(c);
}
const live = frames.filter(visibleChain);
const D = [], index = new Map(), out = [];
const ref = (s) => { if (!index.has(s)) { index.set(s, D.length); D.push(s); bytes += utf8Length(JSON.stringify(s)) + 1; } return index.get(s); };
let bytes = 0, i = ${from};
const plain = (n) => ({ id: n.id, name: n.name, type: n.type, visible: n.visible, x: n.x, y: n.y, width: n.width, height: n.height,
  characters: n.type === "TEXT" ? n.characters : undefined,
  mainComponentName: n.type === "INSTANCE" && n.mainComponent ? n.mainComponent.name : undefined,
  children: "children" in n ? n.children.map(plain) : [] });
for (; i < live.length; i++) {
  const before = bytes, dBefore = D.length;
  const rec = walkFrame(plain(live[i]));
  const row = { ...rec, texts: rec.texts.map(ref), instances: rec.instances.map(ref) };
  bytes += utf8Length(JSON.stringify(row));
  if (bytes > ${RETURN_BUDGET} && out.length) {
    for (const s of D.splice(dBefore)) index.delete(s);
    bytes = before;
    break;
  }
  out.push(row);
}
return { liveCount: live.length, next: i, D, rows: out };`;
}

async function main(pageIds) {
  if (!pageIds.length) { process.stderr.write("usage: dump.mjs <pageId> [...]\n"); return 2; }
  mkdirSync(OUT, { recursive: true });
  const cursorFile = join(OUT, ".cursor.json");
  const cursor = readCursor(cursorFile);
  // Imported here, not at module top: figma-mcp.mjs reads the keychain on import.
  const { connect, rpc } = await import("../../../../scripts/baseline/figma-mcp.mjs");
  await connect();
  let id = 10;
  let calls = 0;
  for (const pageId of pageIds) {
    const state = cursor[pageId] ?? { next: 0, frames: [] };
    if (state.done) continue;
    let liveCount;
    for (;;) {
      let res;
      try {
        res = await rpc("tools/call", { name: "use_figma", arguments: { fileKey: FILE_KEY, code: pageScript(pageId, state.next), skillNames: "figma-use", description: `2L9 design dump, page ${pageId}, from frame ${state.next}` } }, id++);
      } catch (e) {
        writeFileSync(cursorFile, JSON.stringify(cursor));
        process.stderr.write(`stopped on page ${pageId} at frame ${state.next}: ${String(e.message).slice(0, 120)}\n`);
        return 3;
      }
      const text = res?.result?.content?.[0]?.text;
      if (res?.error || res?.result?.isError || !text) {
        cursor[pageId] = state; writeFileSync(cursorFile, JSON.stringify(cursor));
        process.stderr.write(`stopped on page ${pageId} at frame ${state.next}: ${String(text ?? res?.error?.message).slice(0, 120)}\n`);
        return 3;
      }
      const chunk = JSON.parse(text);
      calls++;
      state.frames.push(...decode(chunk));
      state.next = chunk.next;
      liveCount = chunk.liveCount;
      cursor[pageId] = state; writeFileSync(cursorFile, JSON.stringify(cursor));
      if (state.next >= liveCount) break;
    }
    const code = finishPage(OUT, pageId, state.frames, liveCount);
    if (code) return code;
    cursor[pageId] = { done: true, count: liveCount }; writeFileSync(cursorFile, JSON.stringify(cursor));
    process.stdout.write(`page ${pageId}: ${liveCount} frames, ${calls} Figma calls so far\n`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
