/**
 * Pixel comparison for two renders of the same screen.
 *
 * Extracted from drift-diff.mjs 2026-08-23 so board-diff.mjs can reuse it
 * rather than grow a second copy that drifts from this one. Both callers want
 * exactly this: the share of differing pixels, with the two corrections that
 * make the number mean something.
 *
 *  1. TOLERANCE. Font hinting and subpixel noise move channels by a few units
 *     on screens that did not change. Anything under TOL is not a difference.
 *
 *  2. VERTICAL ALIGNMENT. One chrome change that moves everything down a few
 *     pixels makes EVERY row read ~13% different — measured: six panel roots
 *     landed in a 12.6-14.6% band that said nothing at all. A pure translation
 *     is not a difference in the panel, so the best alignment inside a window
 *     is searched and reported; a non-zero offset is itself the finding.
 *     The window is ±64px because a ReviewBar is ~48px tall, so a panel that
 *     did not change still sits 48px lower than it used to.
 *
 * `region` ([x, y, w, h]) confines the comparison to one band. Without it every
 * editor row reads ~13% because they all contain the same shell.
 *
 * @license BSD-3-Clause
 */
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "..", "..", "packages", "dashboard", "package.json"));
const sharp = require("sharp");

const TOL = 12;

const load = async (f) => {
  const img = sharp(f).ensureAlpha();
  const { width, height } = await img.metadata();
  return { buf: await img.raw().toBuffer(), width, height };
};

/**
 * @returns {{share:number, dy:number, a:{width:number,height:number}, b:{width:number,height:number}}}
 *          share is 0..1 over the compared region at its best vertical alignment.
 */
export async function compareImages(pathA, pathB, region = null) {
  const a = await load(pathA);
  const b = await load(pathB);

  /* A page that grew or shrank by a few px is real drift, but it is SHELL
     drift: it shows up identically on every row and would drown the per-panel
     signal. Compare the region both renders share; the caller reports size. */
  const W = Math.min(a.width, b.width);
  const H = Math.min(a.height, b.height);
  const at = (img, x, y, c) => img.buf[(y * img.width + x) * 4 + c];

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

  /* An offset that slides the region almost out of frame leaves a handful of
     rows overlapping and scores near zero on them. On the tall drawer region
     (844px) ±64 cannot do that, which is why drift-diff never hit it; on a
     56px topbar strip it reported 0.00% at dy=-44, comparing about twelve
     rows. An alignment is only admissible if most of the region still
     overlaps. */
  const regionRows = Math.min(H, ry + rh) - ry;
  const MIN_OVERLAP = Math.max(1, Math.floor(regionRows * 0.75));

  let best = null, bestDy = 0;
  for (const dy of OFFSETS) {
    const r = scoreAt(dy);
    if (r.rows < MIN_OVERLAP) continue;
    const share = r.n / (r.rows * (X1 - X0));
    if (best === null || share < best) { best = share; bestDy = dy; }
  }
  return { share: best ?? 0, dy: bestDy, a: { width: a.width, height: a.height }, b: { width: b.width, height: b.height } };
}
