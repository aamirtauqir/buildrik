#!/usr/bin/env node
/**
 * How many shapes does a button come in?
 *
 * Every hand-rolled `<button>` in a screen invents its own height, radius,
 * weight and padding. Nothing catches that: it compiles, it renders, it just
 * looks slightly different from the button beside it. On 2026-08-27 the Team
 * screen's Select/Invite pair sat at 38px and 36px while the identical pair on
 * the Sites screen — built from the `Button` primitive — sat at 40px.
 *
 * This measures the real thing in a real browser. jsdom cannot do it: it does
 * not apply Tailwind's stylesheets, so `getComputedStyle` there returns the
 * defaults and every button looks identical. That is why this is a script
 * against a running dev server and not a vitest case.
 *
 *   pnpm run gate:button-variants          # needs the dev server on :3000
 *
 * Two deliberate exclusions, both learned the hard way:
 *
 *  1. **Dev overlays.** Claude's devtools and the agentation overlay render
 *     their own buttons into the page. Counting them produced "24 variants"
 *     when the product's own count was 9 — the number went into a committed
 *     audit before anyone noticed. Everything outside <main> is dropped, and
 *     the overlay roots are removed first.
 *  2. **Non-buttons.** A menu row, a nav-rail item and an icon-only trigger are
 *     not the Button shape and should not be forced onto it. Only elements that
 *     carry a fill or a border — i.e. read as a button — are counted.
 *
 * @license BSD-3-Clause
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const STATE = process.env.BK_STATE ?? "";

const ROUTES = [
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/media",
  "/dashboard/settings",
  "/dashboard/settings/team",
  "/dashboard/settings/workspace",
  "/dashboard/agency",
  "/dashboard/marketplace",
];

/**
 * The shapes a dashboard button is allowed to have, as
 * `height|radius|fontSize|weight|hasBorder`. Each is a distinct ROLE, not a
 * variation on one: adding a row here means claiming a new role exists.
 */
const ALLOWED_SHAPES = {
  "40|8px|14px|500|border": "Button variant=ghost — secondary action (Select, New folder)",
  "40|8px|14px|500|fill": "Button variant=primary — primary action (New site, Invite, Upload)",
  "36|8px|14px|500|fill": "Button size=sm variant=primary — primary action in a dense bar",
  "36|8px|14px|500|border": "Button size=sm variant=ghost — secondary action in a dense bar",
  "26|9999px|12px|500|border": "FilterChip — a pick-one-of-N list filter",
  "32|8px|13px|600|fill": "FilterTabs — the active segment of a track control",
  "64|8px|16px|400|border": "Avatar / logo upload trigger — a drop target, not a button",
  // Caught by this gate on its first run. It is a <nav> rail item on the media
  // screen, not a button — it just paints a fill when active, which is what the
  // shape check sees. Declared rather than converted: forcing a nav item onto
  // the Button primitive would be the wrong fix.
  "36|8px|13.5px|600|fill": "Media folder rail — the active item in a nav list",
};

function shapeKey(b) {
  return [b.h, b.radius, b.fontSize, b.weight, b.bordered ? "border" : "fill"].join("|");
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext(
  STATE && fs.existsSync(STATE)
    ? { storageState: STATE, viewport: { width: 1440, height: 900 } }
    : { viewport: { width: 1440, height: 900 } },
);

const found = new Map();
let reachable = 0;

for (const route of ROUTES) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(9000);
    if (/\/auth(\/|$)/.test(new URL(page.url()).pathname)) {
      console.log(`  skip ${route} — redirected to auth (set BK_STATE to a storageState file)`);
      await page.close();
      continue;
    }
    reachable++;
    const rows = await page.evaluate(() => {
      document
        .querySelectorAll('nextjs-portal,[class*="styles-module"],[class*="agentation"],[data-nextjs-toast]')
        .forEach((n) => n.remove());
      const scope = document.querySelector("main") ?? document.body;
      const out = [];
      for (const el of scope.querySelectorAll("button")) {
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 20) continue;
        const cs = getComputedStyle(el);
        const label = (el.innerText || "").trim();
        if (!label || label.length > 40) continue;
        const bordered = parseFloat(cs.borderWidth) > 0;
        const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)";
        if (!bordered && !filled) continue; // a text link, not a button
        out.push({
          h: Math.round(r.height), radius: cs.borderRadius, fontSize: cs.fontSize,
          weight: cs.fontWeight, bordered, label,
        });
      }
      return out;
    });
    for (const b of rows) {
      const key = shapeKey(b);
      if (!found.has(key)) found.set(key, { n: 0, where: new Set(), examples: new Set() });
      const v = found.get(key);
      v.n++; v.where.add(route);
      if (v.examples.size < 3) v.examples.add(b.label);
    }
  } catch (e) {
    console.log(`  skip ${route} — ${String(e).split("\n")[0].slice(0, 90)}`);
  }
  await page.close();
}
await browser.close();

if (reachable === 0) {
  console.log("FAIL — no route was reachable. Start the dev server:");
  console.log("  cd packages/dashboard && npm run dev");
  console.log("Signed-in routes also need BK_STATE=<playwright storageState json>.");
  process.exit(1);
}

const unknown = [...found.entries()].filter(([k]) => !(k in ALLOWED_SHAPES));
console.log(`button-variant gate — ${reachable}/${ROUTES.length} routes, ${found.size} distinct shapes`);
for (const [k, v] of [...found.entries()].sort((a, b) => b[1].n - a[1].n)) {
  const known = k in ALLOWED_SHAPES;
  console.log(`  ${known ? "ok " : "NEW"} ${String(v.n).padStart(3)}x  ${k.padEnd(30)} ${known ? ALLOWED_SHAPES[k] : [...v.examples].join(", ")}`);
}

if (unknown.length) {
  console.log("\nFAIL — button shapes with no declared role:");
  for (const [k, v] of unknown) {
    console.log(`  ${k}  e.g. ${[...v.examples].join(", ")}  on ${[...v.where].join(", ")}`);
  }
  console.log(
    "\nEither build it from the Button primitive so it takes an existing shape,\n" +
      "or add the shape to ALLOWED_SHAPES here with the role it plays.\n" +
      "Overriding a flowbite base needs the tw: prefix — see AGENTS.md.",
  );
  process.exit(1);
}

console.log("PASS — every button shape has a declared role.");
process.exit(0);
