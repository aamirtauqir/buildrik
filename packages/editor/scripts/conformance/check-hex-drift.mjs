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
 * line is the conscious act; the diff is the review trail.
 *
 * Exit: 0 clean · 1 drift found · 64 usage error.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "raw-figma");
const TOKENS_PATH = join(HERE, "..", "tokens", "figma-tokens.json");
const ALLOW_PATH = join(HERE, "hex-allowlist.txt");

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

let bad = 0;
for (const f of files) {
  const text = readFileSync(join(RAW_DIR, f), "utf8");
  const seen = new Map(); // hex -> count
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const h = norm(m[0]);
    if (!allowed.has(h)) seen.set(h, (seen.get(h) ?? 0) + 1);
  }
  for (const [h, count] of seen) {
    bad++;
    console.error(`[hex-drift] FAIL ${f}: ${h} x${count} — not a token value and not allowlisted`);
  }
}

if (bad) {
  console.error(`[hex-drift] ${bad} off-palette hex value(s). A board fill drifted, or a new`);
  console.error(`[hex-drift] legitimate colour needs a conscious hex-allowlist.txt line.`);
  process.exit(1);
}
console.log(`[hex-drift] PASS — ${files.length} capture(s), every hex resolves to a token value or the allowlist.`);
