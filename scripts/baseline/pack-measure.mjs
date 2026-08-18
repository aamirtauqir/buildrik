#!/usr/bin/env node
/**
 * Turn a measured region into the compact payload the Figma rebuild script
 * loops over. Emits `PAYLOAD` (a JSON array of tuples) plus a summary, so the
 * use_figma call stays a small interpreter over data instead of hundreds of
 * hand-written node creations.
 *
 * Tuple: [parentIndex, x, y, w, h, text, fontSize, fontWeight, colour, bg,
 *         borderWidths, borderColour, radius, opacity]
 * Coordinates are relative to the parent so the tree survives being moved.
 *
 * Usage: node pack-measure.mjs <BL-id> [--max N]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const [id, ...rest] = process.argv.slice(2);
if (!id) { console.error("usage: pack-measure.mjs <BL-id>"); process.exit(3); }
const MAX = rest.includes("--max") ? +rest[rest.indexOf("--max") + 1] : Infinity;
const src = join(homedir(), ".gstack", "projects", "aamirtauqir-buildrik", "measured", `${id}.json`);
const { nodes, region } = JSON.parse(readFileSync(src, "utf8"));

/* Drop nodes that paint nothing a reader would notice: fully transparent boxes
   with no text and no border slipped through the DOM filter when a parent set
   only a radius. */
const kept = nodes.filter((n) => n.text || n.bg || n.border || n.svg);

/* Parent = the nearest earlier node that fully contains this one. The DOM order
   is a pre-order walk, so scanning backwards finds it in one pass. */
const parentOf = kept.map((n, i) => {
  for (let j = i - 1; j >= 0; j--) {
    const p = kept[j];
    if (p.x <= n.x + 0.5 && p.y <= n.y + 0.5 &&
        p.x + p.w >= n.x + n.w - 0.5 && p.y + p.h >= n.y + n.h - 0.5) return j;
  }
  return -1;
});

const r1 = (v) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);
const payload = kept.slice(0, MAX).map((n, i) => {
  const p = parentOf[i];
  const px = p >= 0 ? kept[p].x : 0;
  const py = p >= 0 ? kept[p].y : 0;
  return [p, r1(n.x - px), r1(n.y - py), r1(n.w), r1(n.h), n.text, n.fs, n.fw,
          n.col, n.bg, n.border ? n.border.w.map(r1) : null, n.border ? n.border.c : null,
          n.radius, n.op, n.svg || null];
});

console.log(JSON.stringify(payload));
console.error(`[pack] ${id}: ${nodes.length} measured → ${kept.length} painted → ${payload.length} emitted · region ${region.join(",")}`);
