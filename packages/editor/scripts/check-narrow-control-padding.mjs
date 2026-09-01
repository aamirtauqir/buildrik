#!/usr/bin/env node
/**
 * Gate: a narrow fixed-size control must neutralise flowbite's padding.
 *
 * flowbite's Button ships `tw:px-5` — 20px a side — and chrome elements are
 * `box-sizing: border-box`. Give one a fixed `width: 24` and the content box is
 * 24 - 40 = negative, which clamps to ZERO: the `<svg>` inside gets no width at
 * all and the icon is invisible. The button still MEASURES 40 wide off the
 * padding floor, which is why it looks like a working button in a screenshot.
 * Only the horizontal axis collapses — vertical padding is 0 — so the icon
 * keeps its height and nothing looks broken enough to notice.
 *
 * Measured 2026-08-31: every action icon on the on-canvas selection toolbar
 * rendered at `svg width: 0px`. Fixed with `tw:px-0`, which wins because it is
 * the SAME property, so twMerge drops flowbite's. A different property (a
 * min-width, say) does not conflict and loses — that distinction is the bug.
 *
 * This gate has already found two instances its author had missed, so it earns
 * its keep. It does NOT resolve arbitrary style expressions — that would need a
 * type checker. It catches the exact shape that ships silently.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "src");

/** flowbite's Button default: px-5 => 40px of horizontal padding. */
const FLOWBITE_PX = 40;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (e === "node_modules" || e === "__tests__") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

const files = walk(SRC);

/* 1. Style objects whose fixed width cannot survive flowbite's padding. */
const narrow = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const re = /export const (\w+):\s*React\.CSSProperties\s*=\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const [, name, body] = m;
    const w = body.match(/\bwidth:\s*(\d+)\b/);
    if (w && Number(w[1]) < FLOWBITE_PX) narrow.set(name, { file: f, width: Number(w[1]) });
  }
}

/* 2. Any Button spending one of them must zero its padding.
      BOTH call shapes count:
        style={name}                       — direct
        style={{ ...name, background: x }} — spread into an object literal
      The first cut of this gate only matched the direct form and passed over a
      live instance (the toolbar's "More actions" button), so the spread
      alternative is spelled out rather than assumed. */
const violations = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const [name, info] of narrow) {
    const re = new RegExp(`<Button\\b[^>]*?style=\\{\\{?\\s*(?:\\.\\.\\.)?\\s*${name}\\b[^>]*?>`, "gs");
    let m;
    while ((m = re.exec(src))) {
      if (/tw:px-0|tw:p-0/.test(m[0])) continue;
      violations.push({
        file: f.replace(SRC, "src"),
        line: src.slice(0, m.index).split("\n").length,
        name,
        width: info.width,
      });
    }
  }
}

if (violations.length) {
  console.error(`[narrow-control-padding] FAIL — ${violations.length} control(s) too narrow for flowbite's padding:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    <Button style={${v.name}}> is ${v.width}px wide, but flowbite adds ${FLOWBITE_PX}px of`);
    console.error(`    horizontal padding, so the content box clamps to 0 and the icon inside renders`);
    console.error(`    at width:0 — invisible, while the button still measures ${FLOWBITE_PX}px.`);
    console.error(`    fix: add \`tw:px-0\` to its className (same property, so twMerge drops flowbite's).\n`);
  }
  process.exit(1);
}

console.log(
  `[narrow-control-padding] PASS — ${narrow.size} narrow style object(s) checked, ` +
  `every Button spending them zeroes its padding.`,
);
