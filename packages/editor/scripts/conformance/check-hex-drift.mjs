#!/usr/bin/env node
/**
 * check-hex-drift — every hex literal in a committed board capture must be a
 * value the token set carries, or be consciously allowlisted.
 *
 * Closes the gap T2 left open: extract.mjs refuses a spec whose literal
 * CONTRADICTS the token it names, but a fill that names NO token sails
 * through as UNKNOWN. That is the exact path #3366f2 took to 95 instances.
 * This gate reads the same `raw-figma/*.json` captures and goes red on any
 * hex outside the palette — so drift is caught at intake, not by a human.
 *
 * Allowlist: `hex-allowlist.txt` (one hex per line, # comments). Adding a
 * line is the conscious act; the diff is the review trail. It is for a colour
 * that is CORRECT and simply absent from the token set.
 *
 * Baseline: `.hex-drift-baseline.json` — one entry per (capture, hex) pair that
 * was already there. Different thing entirely from the allowlist: these are
 * KNOWN DEFECTS, kept visible, allowed to shrink and never to grow. The V1
 * board set carries 116 of them, 23 being the retired `#406ed6` accent the
 * code migrated off on 2026-07-30 — real board drift nobody can fix from here,
 * and not something to bless with an allowlist line. Written up in
 * docs/design-jobs/FIGMA-TO-CODE/BOARD-HEX-DRIFT.md.
 *
 * The gate held 8 captures when it shipped and holds 342 now; a hard zero over
 * a board set this size is a gate that goes red on arrival and gets deleted
 * (see conformance/README.md, "Why known defects are baselined").
 *
 * `--update-baseline` re-records after a deliberate change.
 *
 * Exit: 0 clean · 1 drift found · 64 usage error.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "raw-figma");
const TOKENS_PATH = join(HERE, "..", "tokens", "figma-tokens.json");
const ALLOW_PATH = join(HERE, "hex-allowlist.txt");
const BASELINE_PATH = join(HERE, ".hex-drift-baseline.json");
const UPDATE = process.argv.includes("--update-baseline");

const norm = (hex) => {
  let h = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
  if (/^#[0-9a-f]{8}$/.test(h)) h = h.slice(0, 7); // compare the rgb part
  return h;
};

const allowed = new Set(["#ffffff", "#000000"]);
const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
for (const group of [tokens.palette ?? {}, tokens.semantic ?? {}]) {
  for (const v of Object.values(group)) {
    if (typeof v === "string" && v.startsWith("#")) allowed.add(norm(v));
  }
}
if (existsSync(ALLOW_PATH)) {
  for (const line of readFileSync(ALLOW_PATH, "utf8").split("\n")) {
    const h = line.split("#comment")[0].trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(h)) allowed.add(norm(h));
  }
}

const files = readdirSync(RAW_DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("[hex-drift] no raw-figma captures found — nothing to check");
  process.exit(64);
}

const baseline = new Set(
  existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")).pairs ?? [] : [],
);

const found = new Set();
const fresh = [];
for (const f of files) {
  const text = readFileSync(join(RAW_DIR, f), "utf8");
  const seen = new Map(); // hex -> count
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const h = norm(m[0]);
    if (!allowed.has(h)) seen.set(h, (seen.get(h) ?? 0) + 1);
  }
  for (const [h, count] of seen) {
    const pair = `${f}::${h}`;
    found.add(pair);
    if (!baseline.has(pair)) fresh.push({ f, h, count });
  }
}

if (UPDATE) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ pairs: [...found].sort() }, null, 2) + "\n",
  );
  console.log(`[hex-drift] baseline re-recorded — ${found.size} known (capture, hex) pair(s).`);
  process.exit(0);
}

for (const { f, h, count } of fresh) {
  console.error(`[hex-drift] FAIL ${f}: ${h} x${count} — not a token value and not allowlisted`);
}
if (fresh.length) {
  console.error(`[hex-drift] ${fresh.length} NEW off-palette hex value(s). A board fill drifted, or a`);
  console.error(`[hex-drift] new legitimate colour needs a conscious hex-allowlist.txt line.`);
  process.exit(1);
}

const stale = [...baseline].filter((p) => !found.has(p));
const known = baseline.size - stale.length;
if (stale.length) {
  console.log(`[hex-drift] ${stale.length} baselined pair(s) are gone — re-record with --update-baseline.`);
}
console.log(
  `[hex-drift] PASS — ${files.length} capture(s), 0 new drift, ${known} known defect(s) still standing ` +
    `(see docs/design-jobs/FIGMA-TO-CODE/BOARD-HEX-DRIFT.md).`,
);
