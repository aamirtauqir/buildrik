/**
 * Build the editor's cross-module dependency map from the composer event bus.
 *
 * The bus is the editor's actual wiring: 304 events in shared/constants/events.ts
 * that modules emit and subscribe to. This resolves every reference to the module
 * owning the file, so "which module triggers which" is measured, not asserted.
 *
 * Two matching traps, both found the hard way, both worth knowing when reading
 * the output:
 *   - Optional chaining hides an emit. `composer?.emit?.(EVENTS.X)` is invisible
 *     to a `.emit(` pattern; that produced a false "no emitter" for
 *     BRAND_DIRTY_CHANGED, which IS emitted at DesignSystemTab.tsx:371.
 *   - Indirect emits hide too. StudioFooter.tsx:249 fires
 *     `emitZoom(EVENTS.ZOOM_SELECTION)` through a curried helper, so the call
 *     site matches nothing.
 * An orphan is therefore only STRONG when the constant is NAMED in exactly one
 * module — no indirect wiring is possible then. Named more widely, it is
 * reported separately as needing a look.
 *
 * THE BIGGEST CAVEAT: this measures ONE wiring style. A module can be perfectly
 * well connected through direct method calls or its OWN emitter and still show
 * as isolated here. panel:content is the worked example — it reads
 * `composer.cms.collections` directly and ContentTab.tsx:89 says in as many
 * words, "CollectionManager is its own emitter - subscribe there, not on
 * composer." So "isolated" from this tool means "not on the composer bus", which
 * is a question, not a verdict. Check for direct calls before believing it.
 *
 * Usage: node scripts/audit/event-graph.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "packages/editor/src";

function moduleOf(p) {
  p = p.replace(/\\/g, "/");
  let m = p.match(/\/src\/engine\/([a-zA-Z]+)\//);
  if (m) return "engine:" + m[1];
  if (p.includes("/src/engine/")) return "engine:core";
  m = p.match(/\/src\/editor\/sidebar\/tabs\/([a-zA-Z-]+)\//);
  if (m) return "panel:" + m[1];
  m = p.match(/\/src\/editor\/([a-zA-Z-]+)\//);
  if (m) return "editor:" + m[1];
  if (p.includes("/src/services")) return "service";
  return null;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/__tests__|__fixtures__/.test(e.name)) walk(p, out); }
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const eventsSrc = fs.readFileSync(path.join(ROOT, "shared/constants/events.ts"), "utf8");
const names = [...eventsSrc.matchAll(/^\s+([A-Z_]{3,}):/gm)].map((m) => m[1]);

const mention = new Map(), emits = new Map(), listens = new Map();
const add = (map, k, v) => { if (!map.has(k)) map.set(k, new Set()); map.get(k).add(v); };

for (const file of walk(ROOT)) {
  const mod = moduleOf(file);
  if (!mod || file.endsWith("events.ts")) continue;
  const src = fs.readFileSync(file, "utf8");
  for (const n of names) if (new RegExp("\\bEVENTS\\." + n + "\\b").test(src)) add(mention, n, mod);
  for (const m of src.matchAll(/\.emit\??\.?\(\s*(?:EVENTS\.)?([A-Z_]{3,})/g)) add(emits, m[1], mod);
  for (const m of src.matchAll(/\.(?:on|once|off)\??\.?\(\s*(?:EVENTS\.)?([A-Z_]{3,})/g)) add(listens, m[1], mod);
}

const used = names.filter((n) => mention.has(n));
const never = names.filter((n) => !mention.has(n));
const strong = used.filter((n) => emits.has(n) && !listens.has(n) && mention.get(n).size === 1);
const weak = used.filter((n) => emits.has(n) && !listens.has(n) && mention.get(n).size > 1);

const edges = new Map();
for (const n of used)
  for (const a of emits.get(n) ?? [])
    for (const b of listens.get(n) ?? [])
      if (a !== b) edges.set(a + ">" + b, (edges.get(a + ">" + b) ?? 0) + 1);

const mods = new Set();
for (const s of mention.values()) for (const m of s) mods.add(m);
const degree = (m) => [...edges].reduce(
  (a, [k, v]) => a + (k.startsWith(m + ">") || k.endsWith(">" + m) ? v : 0), 0);
const isolated = [...mods].filter((m) => degree(m) === 0).sort();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ strong, weak, never, isolated, edges: Object.fromEntries(edges) }, null, 1));
} else {
  console.log("events declared " + names.length + " · named in src " + used.length + " · never named " + never.length);
  console.log("strong orphans (emitted, no listener, named in one module) " + strong.length);
  console.log("needs a look (no direct listener but named elsewhere)      " + weak.length);
  console.log("modules " + mods.size + " · fully isolated " + isolated.length + ": " + isolated.join(", "));
}
