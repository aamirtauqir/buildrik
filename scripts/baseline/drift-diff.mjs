#!/usr/bin/env node
/**
 * Baseline drift diff — how far a stored reference render has moved from today.
 *
 * The baseline file is pinned at meta.pinnedCommit. When the app moves on, a
 * frame drawn from an old render silently stops describing the product; the
 * census cannot see this (it compares ids and widths, not pixels). This does:
 * recapture the same screen with `state` suffixed "__drift" so the stored PNG
 * is never overwritten, then compare the two pixel buffers.
 *
 * Reports the share of differing pixels. Judgement stays with the reader —
 * antialiasing and live data (relative timestamps, counts) move a few tenths
 * of a percent on screens that have not actually changed, which is exactly why
 * this prints a number instead of a verdict.
 *
 * Usage: node drift-diff.mjs <BL-id> <state>   (after capturing <state>__drift)
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "..", "..", "packages", "dashboard", "package.json"));
const sharp = require("sharp");
const SHOTS = join(homedir(), ".gstack", "projects", "aamirtauqir-buildrik", "baseline-shots");

const [id, state] = process.argv.slice(2);
if (!id || !state) { console.error("usage: drift-diff.mjs <BL-id> <state>"); process.exit(3); }
const before = join(SHOTS, id, `${state}.png`);
const after = join(SHOTS, id, `${state}__drift.png`);
for (const f of [before, after]) if (!existsSync(f)) { console.error(`missing ${f}`); process.exit(3); }

const load = async (f) => {
  const img = sharp(f).ensureAlpha();
  const { width, height } = await img.metadata();
  return { buf: await img.raw().toBuffer(), width, height };
};
const a = await load(before);
const b = await load(after);

/* A page that grew or shrank by a few px is real drift, but it is SHELL drift:
   it shows up identically on every editor row and would drown the per-panel
   signal this tool exists to give. Compare the region both renders share and
   report the size delta separately. */
const W = Math.min(a.width, b.width);
const H = Math.min(a.height, b.height);
const sizeNote = a.width === b.width && a.height === b.height
  ? ""
  : ` · size ${a.width}x${a.height} -> ${b.width}x${b.height}`;
const at = (img, x, y, c) => img.buf[(y * img.width + x) * 4 + c];
let differing = 0;
const TOL = 12; // per-channel tolerance: font hinting and subpixel noise, not layout
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (Math.abs(at(a, x, y, 0) - at(b, x, y, 0)) > TOL ||
        Math.abs(at(a, x, y, 1) - at(b, x, y, 1)) > TOL ||
        Math.abs(at(a, x, y, 2) - at(b, x, y, 2)) > TOL) differing++;
  }
}
const total = W * H;
console.log(`${id} ${state}: ${((differing / total) * 100).toFixed(2)}% differ (${differing}/${total})${sizeNote}`);
