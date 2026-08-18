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
 * Usage: node drift-diff.mjs <BL-id> <state> [--region x,y,w,h]
 *   (after capturing <state>__drift)
 *
 * --region confines the comparison to one band of the frame. The editor's left
 * drawer is `--region 60,56,320,844`: everything the panel rows are actually
 * about, with the topbar, canvas and inspector left out. Without it every
 * editor row reads ~13% because they all contain the same shell, and the shell
 * gained a ReviewBar row on 2026-08-17 (board 200:213).
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

const argv = process.argv.slice(2);
const [id, state] = argv;
const regionArg = argv.includes("--region") ? argv[argv.indexOf("--region") + 1] : null;
const region = regionArg ? regionArg.split(",").map(Number) : null;
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

/* One chrome change that moves everything down by a few pixels makes EVERY row
   read ~13% different, including surfaces with zero commits since the pin —
   measured: six panel roots landed in a 12.6-14.6% band that said nothing.
   A pure translation is not drift in the panel, so score the best vertical
   alignment in a small window and report that; the offset is printed, because
   a non-zero one is itself a finding about the shell. */
/* Wide enough to swallow a whole inserted row: ReviewBar is ~48px, so a panel
   that did not change still sits 48px lower than it used to. Searching only a
   few px would score that as total change. */
const OFFSETS = [];
for (let i = 0; i <= 64; i++) { OFFSETS.push(i); if (i) OFFSETS.push(-i); }
const [rx, ry, rw, rh] = region ?? [0, 0, W, H];
const X0 = Math.max(0, rx), X1 = Math.min(W, rx + rw);
const scoreAt = (dy) => {
  let n = 0;
  const y0 = Math.max(ry, -dy);
  const y1 = Math.min(Math.min(H, ry + rh), H - dy);
  for (let y = y0; y < y1; y++) {
    for (let x = X0; x < X1; x++) {
      if (Math.abs(at(a, x, y, 0) - at(b, x, y + dy, 0)) > TOL ||
          Math.abs(at(a, x, y, 1) - at(b, x, y + dy, 1)) > TOL ||
          Math.abs(at(a, x, y, 2) - at(b, x, y + dy, 2)) > TOL) n++;
    }
  }
  return { n, rows: Math.max(0, y1 - y0) };
};
let best = null, bestDy = 0;
for (const dy of OFFSETS) {
  const r = scoreAt(dy);
  if (r.rows <= 0) continue;
  const share = r.n / (r.rows * (X1 - X0));
  if (best === null || share < best) { best = share; bestDy = dy; }
}
const shift = bestDy === 0 ? "" : ` · aligned at dy=${bestDy}px`;
const where = region ? ` · region ${regionArg}` : "";
console.log(`${id} ${state}: ${(best * 100).toFixed(2)}% differ${shift}${where}${sizeNote}`);
