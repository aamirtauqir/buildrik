#!/usr/bin/env node
/**
 * Walk the canvas module: its overlay toggles, its breakpoints, and the
 * right-click menu — the surfaces with no rail door and no panel of their own.
 *
 * Each overlay is toggled ON, captured, and toggled back OFF, and the element
 * count is checked after every step: the canvas is the one module where a
 * mis-aimed click edits the customer's page rather than just reading it.
 *
 * Usage: node canvas-walk.mjs [--out <dir>]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, readToasts, resetLoginRateLimit } from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : join(HERE, "..", "..", ".walk", "canvas");

const OVERLAYS = ["Snap Guides", "Spacing", "Grid", "Rulers", "Badges", "X-Ray"];
/* The breakpoint segments READ as "W D T M" on screen but their accessible
   names are the full labels ("Desktop (>=1024px)"), so matching the visible
   glyph found nothing and reported every breakpoint as missing. Discover them
   instead of naming them — a breakpoint that is added or removed then shows up
   as a change in this walk rather than passing silently. */
async function findBreakpoints(page) {
  return page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const out = [];
    for (const b of document.querySelectorAll("button")) {
      const r = b.getBoundingClientRect();
      if (r.height === 0) continue;
      const label = norm(b.getAttribute("aria-label") || "");
      const title = norm(b.getAttribute("title") || "");
      if (!/px\)|·\s*[<>=≥≤]|\d+\s*px/.test(label + " " + title)) continue;
      out.push({ label, title, glyph: norm(b.textContent).slice(0, 3), x: Math.round(r.x),
                 pressed: b.getAttribute("aria-pressed") });
    }
    return out.sort((a, b) => a.x - b.x);
  });
}

/** Read the canvas frame: its device, its painted width, and the zoom label. */
async function canvasState(page) {
  return page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const c = document.querySelector("[data-buildrick-canvas]");
    const shell = document.querySelector(".layout-shell__canvas");
    const foot = norm(document.querySelector(".bd-studio")?.innerText || "");
    const zoom = (foot.match(/(Desktop|Tablet|Mobile|Wide)\s*·\s*(\d+%)/) || []).slice(1).join(" · ");
    return {
      device: c?.getAttribute("data-device") || null,
      canvasWidth: c ? Math.round(c.getBoundingClientRect().width) : null,
      shellWidth: shell ? Math.round(shell.getBoundingClientRect().width) : null,
      zoom: zoom || null,
    };
  });
}

/** Click a footer control by its visible label; report whether it was found. */
async function clickFooter(page, label) {
  return page.evaluate((t) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const b = [...document.querySelectorAll("button,[role=button]")].find((x) => {
      const r = x.getBoundingClientRect();
      if (r.height === 0 || r.top < 760) return false;      // footer band only
      return norm(x.getAttribute("aria-label") || x.textContent) === t;
    });
    if (!b) return { found: false };
    const pressed = b.getAttribute("aria-pressed");
    b.click();
    return { found: true, wasPressed: pressed, disabled: b.disabled === true };
  }, label);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, page, consoleErrors } = await openEditor({ statePath });
  await stripDevOverlays(page);

  const countEls = () => page.evaluate(() => document.querySelectorAll("[data-buildrick-id]").length);
  const baseline = await countEls();
  console.log(`fixture element count: ${baseline}`);
  console.log(`base canvas: ${JSON.stringify(await canvasState(page))}\n`);

  const results = [];
  const guard = async (what) => {
    const n = await countEls();
    if (n !== baseline) {
      console.error(`\nABORT at ${what}: element count ${baseline} -> ${n}. The walk edited the page.`);
      writeFileSync(join(OUT, "canvas.json"), JSON.stringify({ aborted: what, baseline, n, results }, null, 2));
      await browser.close();
      process.exit(2);
    }
  };

  for (const name of OVERLAYS) {
    const before = consoleErrors.length;
    const on = await clickFooter(page, name);
    await page.waitForTimeout(1500);
    await stripDevOverlays(page);
    const shot = join(OUT, `overlay-${name.toLowerCase().replace(/\s+/g, "-")}.png`);
    await page.screenshot({ path: shot });
    const after = await canvasState(page);
    /* Toggle back so each overlay is measured against the same base state and
       not against whatever the previous one left on the canvas. */
    if (on.found) { await clickFooter(page, name); await page.waitForTimeout(900); }
    await guard(`overlay ${name}`);
    results.push({ kind: "overlay", name, ...on, after, shot, newConsoleErrors: consoleErrors.slice(before) });
    console.log(`overlay ${name.padEnd(11)} ${on.found ? "found" : "NOT-FOUND"}${on.disabled ? " DISABLED" : ""} wasPressed=${on.wasPressed}`);
  }

  const bps = await findBreakpoints(page);
  console.log(`\nbreakpoints found: ${bps.length} — ${bps.map((b) => `${b.glyph}=${b.label}`).join(", ")}`);
  for (const bp of bps.map((b) => b.label)) {
    const hit = await clickFooter(page, bp);
    await page.waitForTimeout(1800);
    await stripDevOverlays(page);
    const st = await canvasState(page);
    const shot = join(OUT, `breakpoint-${bp}.png`);
    await page.screenshot({ path: shot });
    await guard(`breakpoint ${bp}`);
    results.push({ kind: "breakpoint", name: bp, ...hit, after: st, shot });
    console.log(`breakpoint ${bp}  ${hit.found ? "" : "NOT-FOUND "}device=${st.device} canvasW=${st.canvasWidth} zoom=${st.zoom}`);
  }

  /* Right-click an element: the context menu is a whole surface with no door
     anywhere else, and its printed chords are a contract. */
  await clickFooter(page, (bps.find((b) => /Desktop/.test(b.label)) || bps[0]).label);
  await page.waitForTimeout(1500);
  const target = await page.evaluate(() => {
    const el = [...document.querySelectorAll("[data-buildrick-id]")]
      .find((e) => e.getAttribute("data-buildrick-type") === "heading" && e.getBoundingClientRect().height > 0);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  let menu = { rows: [] };
  if (target) {
    await page.mouse.click(target.x, target.y, { button: "right" });
    await page.waitForTimeout(1800);
    await stripDevOverlays(page);
    menu = await page.evaluate(() => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const items = [...document.querySelectorAll('[role=menuitem]')]
        .filter((e) => e.getBoundingClientRect().height > 0)
        .map((e) => ({ label: norm(e.innerText), disabled: e.getAttribute("aria-disabled") === "true" }));
      return { rows: items };
    });
    await page.screenshot({ path: join(OUT, "context-menu.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }
  await guard("context menu");
  results.push({ kind: "context-menu", rows: menu.rows });
  console.log(`\ncontext menu rows: ${menu.rows.length}`);
  menu.rows.forEach((r) => console.log(`   ${r.disabled ? "[dis] " : "      "}${r.label}`));

  writeFileSync(join(OUT, "canvas.json"), JSON.stringify({ ranAt: new Date().toISOString(), baseline, results }, null, 2));
  console.log(`\nwrote ${join(OUT, "canvas.json")}`);
  console.log(`toasts: ${JSON.stringify(await readToasts(page))}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
