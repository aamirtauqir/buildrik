#!/usr/bin/env node
/**
 * seam-scan — the five cross-cutting scans that found ~25 defects in the
 * 2026-08-13 walk, as a script instead of session knowledge.
 *
 * A "seam" is two halves that both exist, both look implemented, and disagree
 * on a NAME — an emitter and a listener on different event strings, a type
 * declared twice, a prop declared and discarded. Types, tests and gates are
 * all blind to the class because each half is internally valid; in 5 of 11
 * cases a test was asserting the broken half.
 *
 * WARN-mode (eng-review 3A): exits 0 always, prints deltas against
 * .seam-baseline.json. Ratchet to ERROR per-category once a category holds
 * at baseline for a full phase. Update the baseline with --update after
 * triaging every new finding — a quietly raised baseline is not a ratchet.
 *
 * Categories:
 *   listeners-without-emitter  — the killer class (12 defects). Colon-
 *                                namespaced names only; engine-internal
 *                                telemetry emitters with no UI listener are
 *                                NOT flagged (that direction is mostly fine).
 *   emit-literal-drift         — .emit()/.on() name literals that match no
 *                                EVENTS constant value (hand-typed strings —
 *                                four defects were exactly a hand-typed name
 *                                one word off).
 *   duplicate-type-names       — same exported type/interface name declared
 *                                in 2+ files (LintIssue, InteractionTrigger).
 *   discarded-props            — `foo: _foo` destructures + `onX={() => {}}`
 *                                empty handlers.
 *   silent-defaults            — switch `default:` bodies that only devLog/
 *                                console (production no-ops; 11 dead toolbar
 *                                controls hid here).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "..", "src");
const BASELINE_PATH = join(HERE, ".seam-baseline.json");
const UPDATE = process.argv.includes("--update");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SRC);
const read = (p) => readFileSync(p, "utf8");
const rel = (p) => p.slice(SRC.length - 3);

// ---- events registry -------------------------------------------------------
const eventsSrc = read(join(SRC, "shared", "constants", "events.ts"));
const const2val = {};
for (const m of eventsSrc.matchAll(/(\b[A-Z][A-Z0-9_]+)\s*:\s*"([^"]+)"/g)) {
  const2val[m[1]] = m[2];
}
const val2const = Object.fromEntries(Object.entries(const2val).map(([k, v]) => [v, k]));
const knownValues = new Set(Object.values(const2val));

// ---- scan ------------------------------------------------------------------
const emitted = new Map(); // key -> [file]
const listened = new Map();
const emitLiteralDrift = [];
const duplicateTypes = new Map(); // name -> Set(file)
const discardedProps = [];
const silentDefaults = [];

const push = (map, key, file) => {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(file);
};

for (const p of files) {
  const s = read(p);
  const isEvents = p.endsWith("constants/events.ts");

  if (!isEvents) {
    for (const m of s.matchAll(/\.emit\??\(\s*(?:EVENTS\.([A-Z0-9_]+)|"([^"\n]+)"|'([^'\n]+)')/g)) {
      const lit = m[2] ?? m[3];
      const key = m[1] ?? val2const[lit] ?? (lit?.includes(":") ? `LIT:${lit}` : null);
      if (key) push(emitted, key, rel(p));
      if (lit && lit.includes(":") && !knownValues.has(lit)) {
        emitLiteralDrift.push(`${rel(p)} .emit("${lit}") — not an EVENTS value`);
      }
    }
    for (const m of s.matchAll(/\.(?:on|off)\??\(\s*(?:EVENTS\.([A-Z0-9_]+)|"([^"\n]+)"|'([^'\n]+)')/g)) {
      const lit = m[2] ?? m[3];
      const key = m[1] ?? val2const[lit] ?? (lit?.includes(":") ? `LIT:${lit}` : null);
      if (key) push(listened, key, rel(p));
      if (lit && lit.includes(":") && !knownValues.has(lit)) {
        emitLiteralDrift.push(`${rel(p)} .on("${lit}") — not an EVENTS value`);
      }
    }
  }

  for (const m of s.matchAll(/^export (?:type|interface|enum) ([A-Z][A-Za-z0-9_]*)/gm)) {
    if (!duplicateTypes.has(m[1])) duplicateTypes.set(m[1], new Set());
    duplicateTypes.get(m[1]).add(rel(p));
  }

  for (const m of s.matchAll(/(\w+):\s*_(\w+)\s*[,}]/g)) {
    if (m[1].toLowerCase() === m[2].toLowerCase()) {
      discardedProps.push(`${rel(p)} — prop "${m[1]}" destructured and discarded`);
    }
  }
  for (const m of s.matchAll(/(on[A-Z]\w*)=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g)) {
    discardedProps.push(`${rel(p)} — ${m[1]} passed as empty handler`);
  }

  for (const m of s.matchAll(/\n\s*default:\s*\n\s*(devLog|console\.(?:log|warn|debug))\(/g)) {
    silentDefaults.push(`${rel(p)} — default: branch only logs (production no-op)`);
  }
}

// listeners with no emitter — UI-side only (engine files listening to their
// own internals are excluded the same way the hand-run scan excluded them).
const orphanListeners = [];
for (const [key, listenerFiles] of listened) {
  if (emitted.has(key)) continue;
  const uiFiles = listenerFiles.filter((f) => !f.startsWith("src/engine/"));
  if (uiFiles.length > 0) {
    orphanListeners.push(`${key} — listened in ${uiFiles[0]}${uiFiles.length > 1 ? ` (+${uiFiles.length - 1})` : ""}, emitted by nothing`);
  }
}

const dupNames = [...duplicateTypes.entries()].filter(([, v]) => v.size > 1);

const counts = {
  "listeners-without-emitter": orphanListeners.length,
  "emit-literal-drift": emitLiteralDrift.length,
  "duplicate-type-names": dupNames.length,
  "discarded-props": discardedProps.length,
  "silent-defaults": silentDefaults.length,
};

if (UPDATE) {
  writeFileSync(BASELINE_PATH, JSON.stringify(counts, null, 2) + "\n");
  console.log("[seam-scan] baseline updated:", JSON.stringify(counts));
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(read(BASELINE_PATH)) : null;
let regressed = false;
console.log("[seam-scan] WARN-mode (eng-review 3A) — informational until ratcheted");
for (const [cat, n] of Object.entries(counts)) {
  const base = baseline?.[cat];
  const mark = base == null ? "??" : n > base ? "UP" : n < base ? "ok" : "ok";
  if (base != null && n > base) regressed = true;
  console.log(`[seam-scan] ${mark.padEnd(2)}  ${cat.padEnd(28)} ${n}${base != null ? ` (baseline ${base})` : " (no baseline — run --update after triage)"}`);
}
const detail = (title, rows) => {
  if (rows.length === 0) return;
  console.log(`\n  ${title}:`);
  rows.slice(0, 15).forEach((r) => console.log(`    - ${r}`));
  if (rows.length > 15) console.log(`    … ${rows.length - 15} more`);
};
if (regressed || !baseline) {
  detail("listeners without emitter", orphanListeners);
  detail("emit/on literals not in EVENTS", emitLiteralDrift.slice(0, 15));
}
if (regressed) console.log("\n[seam-scan] WARN: growth over baseline — triage before --update. (Exit 0: WARN-mode.)");
process.exit(0);
