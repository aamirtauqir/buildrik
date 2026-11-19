#!/usr/bin/env node
/**
 * Class-first computed-style sweep (CLASS-FIRST-SPEC §5.3, P0 acceptance 2).
 *
 * Reads getComputedStyle for every [data-buildrick-id] element of a page at
 * three viewport widths, plain and hovered, so the same page can be compared
 * before and after a site switches style model — on the canvas (editor URL),
 * Preview or the published URL. Zero diffs is the gate.
 *
 *   node scripts/class-first/computed-style-sweep.mjs capture <url> <out.json> [--root <css selector>]
 *   node scripts/class-first/computed-style-sweep.mjs diff <before.json> <after.json>
 *
 * `--root` limits the sweep to elements inside one container (the editor
 * canvas, e.g. `.buildrick-canvas`). Pages that need a session (the editor)
 * take a storage state via PLAYWRIGHT_STORAGE_STATE=<auth.json>. Read-only:
 * it never clicks anything but hovers, and never publishes.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const WIDTHS = [1440, 900, 500];
const PROPS = [
  "display", "position", "top", "right", "bottom", "left", "z-index", "box-sizing",
  "width", "height", "min-width", "max-width", "min-height", "max-height",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top", "border-right", "border-bottom", "border-left", "border-radius", "outline",
  "color", "background-color", "background-image", "opacity", "box-shadow", "transform",
  "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing",
  "text-align", "text-decoration-line", "text-transform", "white-space",
  "flex-direction", "flex-wrap", "justify-content", "align-items", "gap", "grid-template-columns",
  "overflow-x", "overflow-y", "visibility", "cursor",
];

async function capture(url, out, root) {
  const browser = await chromium.launch();
  const context = await browser.newContext(process.env.PLAYWRIGHT_STORAGE_STATE ? { storageState: process.env.PLAYWRIGHT_STORAGE_STATE } : {});
  const page = await context.newPage();
  const result = {};
  try {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url, { waitUntil: "networkidle" });
      const sel = `${root ? `${root} ` : ""}[data-buildrick-id]`;
      const read = (state) =>
        page.$$eval(sel, (els, props) => els.map((el) => {
          const cs = getComputedStyle(el);
          return [el.getAttribute("data-buildrick-id"), Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]))];
        }), PROPS).then((rows) => { for (const [id, v] of rows) result[`${id} ${width} ${state}`] = v; });
      await read("normal");
      const ids = await page.$$eval(sel, (els) => els.map((el) => el.getAttribute("data-buildrick-id")));
      for (const id of ids) {
        const handle = await page.$(`[data-buildrick-id="${id}"]`);
        if (!handle || !(await handle.isVisible())) continue;
        await handle.hover({ force: true }).catch(() => undefined);
        const v = await handle.evaluate((el, props) => {
          const cs = getComputedStyle(el);
          return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
        }, PROPS);
        result[`${id} ${width} hover`] = v;
      }
      await page.mouse.move(0, 0);
    }
  } finally {
    await browser.close();
  }
  writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(`captured ${Object.keys(result).length} element×width×state rows → ${out}`);
}

function diff(a, b) {
  const before = JSON.parse(readFileSync(a, "utf8"));
  const after = JSON.parse(readFileSync(b, "utf8"));
  const lines = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!before[key] || !after[key]) { lines.push(`${key}: only in ${before[key] ? "before" : "after"}`); continue; }
    for (const p of PROPS) if (before[key][p] !== after[key][p]) lines.push(`${key} ${p}: ${before[key][p]} → ${after[key][p]}`);
  }
  if (lines.length === 0) { console.log("0 computed-style diffs"); return; }
  console.log(lines.join("\n"));
  console.log(`\n${lines.length} diff(s)`);
  process.exitCode = 1;
}

const [cmd, x, y, ...rest] = process.argv.slice(2);
const rootIdx = rest.indexOf("--root");
if (cmd === "capture" && x && y) await capture(x, y, rootIdx >= 0 ? rest[rootIdx + 1] : undefined);
else if (cmd === "diff" && x && y) diff(x, y);
else {
  console.error("usage: capture <url> <out.json> [--root <selector>] | diff <before.json> <after.json>");
  process.exitCode = 2;
}
