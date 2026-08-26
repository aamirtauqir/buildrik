#!/usr/bin/env node
/**
 * Walk every editor module in the running app and record what it actually
 * offers: a screenshot plus the interactive controls the panel really renders.
 *
 * Why this exists next to board-walk.mjs: that script drives the editor into a
 * BOARD's state to rank visual drift. This one asks the prior question — what
 * is in each module at all — because the board census only covers the surfaces
 * somebody already drew. `ai`, `components` and the Insert drawer's own states
 * have no board, so drift ranking cannot see them and neither could we.
 *
 * The control dump is the finding, not decoration. A panel that renders a
 * button which is disabled, or renders no controls at all, is a gap; reading
 * that off a screenshot by eye is exactly the "measure, don't eyeball" mistake.
 *
 * Usage: node module-walk.mjs [--only tab1,tab2] [--out <dir>]
 *
 * @license BSD-3-Clause
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { login, openEditor, stripDevOverlays, readToasts, clickMenuRow, resetLoginRateLimit, BASE, FIXTURE_SITE } from "./editor-rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

/* Mirrors packages/editor/src/editor/rail/tabsConfig.ts. Kept as data here so
   a tab that is REMOVED from the rail still gets walked and reported missing,
   rather than silently dropping out of the run. */
const TABS = [
  { id: "add",        label: "Insert",     key: "A",   door: { rail: "add" } },
  { id: "layers",     label: "Layers",     key: "L",   door: { rail: "layers" } },
  { id: "pages",      label: "Pages",      key: "P",   door: { rail: "pages" } },
  { id: "assets",     label: "Media",      key: "M",   door: { rail: "assets" } },
  { id: "content",    label: "Content",    key: "D",   door: { rail: "content" } },
  { id: "design",     label: "Brand",      key: "B",   door: { rail: "design" } },
  /* Seven tabs leave the Figma rail. tabsConfig.ts:358-373 names the door for
     six of them; `review` is missing from that list but does have one — the
     topbar "In review" pill, confirmed live. Doors are recorded here as data so
     a door that DISAPPEARS is reported, not silently walked past. */
  { id: "ai",         label: "AI",         key: "I",   door: { key: "i" } },
  { id: "templates",  label: "Templates",  key: "T",   door: { key: "t" } },
  { id: "components", label: "Components", key: "S-A", door: { key: "A", shift: true } },
  { id: "settings",   label: "Settings",   key: "S",   door: { menu: "Site settings" }, surface: "fullpage" },
  { id: "history",    label: "History",    key: "H",   door: { menu: "Version history" }, accepts: ["Version History", "History"] },
  { id: "publish",    label: "Publish",    key: "U",   door: { topbar: "Publish" } },
  { id: "review",     label: "Review",     key: "R",   door: { topbar: "In review" } },
];

const args = process.argv.slice(2);
const only = (args[args.indexOf("--only") + 1] || "").split(",").filter(Boolean);
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : join(HERE, "..", "..", ".walk", "modules");

/* Scrape the panel, not the window. The rail sits at x<64 and the topbar at
   y<100; a bare document-wide sweep pulls both in and every module's dump then
   looks identical. */
async function dumpSurface(page, want) {
  return page.evaluate((want) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return null;
      return r;
    };
    const name = (el) =>
      norm(el.getAttribute("aria-label") || el.getAttribute("title") ||
           el.getAttribute("placeholder") || el.textContent || el.value || "");

    const out = { container: null, controls: [], headings: [], empty: null, text: "" };

    /* Find the drawer by geometry, not by class: the class name has changed
       three times in this repo and a stale selector reads as an empty panel. */
    const pick = (test) => {
      let best = null;
      for (const el of document.querySelectorAll("div,section,aside,nav,main,form")) {
        const r = vis(el); if (!r) continue;
        if (!test(r, el)) continue;
        const area = r.width * r.height;
        if (!best || r.top < best.r.top - 4 || (Math.abs(r.top - best.r.top) <= 4 && area > best.area)) {
          best = { el, area, r };
        }
      }
      return best;
    };
    /* The live shell names its own parts — `.ls-panel` for a drawer,
       `.layout-shell__canvas` for the canvas. Guessing these by geometry read
       the canvas as a fullpage surface and the inner scroll body as a drawer. */
    let best = null, kind = "";
    const dialog = document.querySelector('[role="dialog"],[aria-modal="true"]');
    if (dialog) {
      let host = vis(dialog) ? dialog : null;
      if (!host) {
        for (const el of dialog.querySelectorAll("*")) {
          const r = vis(el);
          if (r && r.width > 200 && r.height > 80) { host = el; break; }
        }
      }
      if (host) { const r = vis(host); best = { el: host, area: r.width * r.height, r }; kind = "modal"; }
    }
    if (!best) {
      for (const el of document.querySelectorAll(".ls-panel")) {
        const r = vis(el);
        if (r) { best = { el, area: r.width * r.height, r }; kind = "drawer"; break; }
      }
    }
    if (!best && want === "fullpage") {
      const canvas = document.querySelector(".layout-shell__canvas");
      best = pick((r, el) => r.left >= 40 && r.width >= 600 && r.height >= 400 &&
                             !(canvas && (canvas === el || canvas.contains(el) || el.contains(canvas))));
      kind = best && "fullpage";
    }
    if (!best) return { ...out, container: "NOT-FOUND" };
    out.kind = kind;
    const root = best.el;
    out.container = `${root.tagName.toLowerCase()}.${norm(root.className).slice(0, 60)}`;
    out.box = [Math.round(best.r.x), Math.round(best.r.y), Math.round(best.r.width), Math.round(best.r.height)];
    out.text = norm(root.innerText).slice(0, 700);

    for (const el of root.querySelectorAll("button,input,select,textarea,[role=button],[role=tab],[role=switch],a[href]")) {
      if (!vis(el)) continue;
      const n = name(el).slice(0, 60);
      out.controls.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role") || "",
        name: n,
        disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true",
        type: el.getAttribute("type") || "",
      });
    }
    for (const el of root.querySelectorAll("h1,h2,h3,h4,[role=heading],legend")) {
      if (!vis(el)) continue;
      const n = norm(el.textContent).slice(0, 60);
      if (n) out.headings.push(n);
    }
    /* An "empty state" is a real answer, so name it rather than reporting 0
       controls and letting the reader guess whether the panel failed to load. */
    if (out.controls.length === 0) out.empty = out.text.slice(0, 200) || "(no text either)";
    return out;
  }, want);
}

/**
 * Close whatever is open and CONFIRM it closed. One click per pass, never two:
 * clicking the panel's close button and the still-selected rail tab in the same
 * pass shuts the drawer and reopens it, which is why `add` and `ai` came back
 * empty while the panels themselves were fine.
 */
async function resetShell(page) {
  /* A reload, not a close. The drawer is a drill-in stack: closing a panel
     returns to its PARENT rather than to an empty shell, so "is anything open"
     is never false and no click sequence reaches a clean state. Four harness
     revisions argued with that before measuring it. The cost is ~14s a module;
     the alternative is every door that quietly does nothing reporting the
     previous module's panel as its own. */
  await page.goto(`${BASE}/edit/${FIXTURE_SITE}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(12000);
  return true;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const statePath = join(OUT, "state.json");
  /* Repeated runs trip the login rate limiter, and its failure page is the
     same 'expired-link' screen a dead token shows — trap 3. */
  await resetLoginRateLimit();
  await login({ statePath });
  const { browser, ctx, page, consoleErrors } = await openEditor({ statePath });

  const results = [];
  const tabs = only.length ? TABS.filter((t) => only.includes(t.id)) : TABS;

  for (const tab of tabs) {
    const before = consoleErrors.length;

    /* Every module is re-approached from a clean shell. Escape alone does NOT
       close a rail drawer — three modules in the first run scraped the PREVIOUS
       module's panel and reported it as their own (ai read Brand, settings read
       Components, publish read History, byte-identical boxes and all). */
    await resetShell(page);

    let status;
    const d = tab.door;
    if (d.rail) {
      status = await page.evaluate(async (t) => {
        const b = document.querySelector(`.ls-rail [data-tab="${t}"]`);
        if (!b) return "NO-RAIL-BUTTON";
        const painted = () => [...document.querySelectorAll(".ls-panel")]
          .some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        b.click();
        await wait(1200);
        return painted() ? "opened" : "opened(empty)";
      }, d.rail);
    } else if (d.topbar) {
      status = await page.evaluate((label) => {
        const b = [...document.querySelectorAll("button,[role=button]")].find((x) => {
          const r = x.getBoundingClientRect();
          if (r.height === 0 || r.top > 100) return false;   // topbar band only
          const n = (x.getAttribute("aria-label") || x.textContent || "").replace(/\s+/g, " ").trim();
          return n === label || n.startsWith(label);
        });
        if (!b) return "NO-TOPBAR-BUTTON";
        if (b.disabled) return "TOPBAR-DISABLED";
        b.click();
        return "opened";
      }, d.topbar);
    } else if (d.menu) {
      const r = await clickMenuRow(page, ctx, d.menu);
      status = r.found ? "opened" : "NO-MENU-ROW";
    } else if (d.key) {
      const mods = [];
      if (d.meta) mods.push("Meta");
      if (d.shift) mods.push("Shift");
      await page.keyboard.press([...mods, d.key].join("+"));
      status = "key-pressed";
    }
    await page.waitForTimeout(4500);
    await stripDevOverlays(page);

    let panel = /^NO-|DISABLED/.test(status) ? { container: status } : await dumpSurface(page, tab.surface);

    /* The rail restores whichever panel was last open, so the first click can
       CLOSE the panel we came for rather than open it — `add`, the default-open
       tab, emptied itself on every run this way, and the rail still drew Insert
       as selected while no drawer was on screen. Retry once, then believe it. */
    if (tab.door.rail && panel.container === "NOT-FOUND") {
      await page.evaluate((t) => document.querySelector(`.ls-rail [data-tab="${t}"]`)?.click(), tab.door.rail);
      await page.waitForTimeout(3500);
      await stripDevOverlays(page);
      panel = await dumpSurface(page, tab.surface);
      status = `${status}+retry`;
    }

    /* Identity check. Without it a door that quietly does nothing returns the
       panel that happened to be on screen, and the run reports that panel's
       controls as this module's features — a wrong finding that looks complete. */
    if (panel.controls) {
      const head = ((panel.headings || [])[0] || (panel.text || "").split(/[\n✕]/)[0] || "").toLowerCase();
      const want = tab.label.toLowerCase();
      const ok = tab.accepts ? tab.accepts.some((a) => head.includes(a.toLowerCase())) : head.includes(want);
      if (!ok) {
        const found = (panel.headings || [])[0] || (panel.text || "").slice(0, 40);
        panel = { ...panel, identity: `MISMATCH wanted="${tab.label}" got="${found}"` };
        status = `MISMATCH(${status})`;
      }
    }
    const toasts = await readToasts(page);
    const shot = join(OUT, `${tab.id}.png`);
    await page.screenshot({ path: shot });

    results.push({
      ...tab, status, ...panel, toasts,
      newConsoleErrors: consoleErrors.slice(before),
      shot,
    });
    const nc = panel.controls ? panel.controls.length : 0;
    console.log(
      `${tab.id.padEnd(11)} ${String(status).padEnd(22)} ${String(panel.kind||"-").padEnd(8)} controls=${String(nc).padStart(3)}` +
      ` headings=${String((panel.headings || []).length).padStart(2)}` +
      `${panel.empty ? "  EMPTY: " + panel.empty.slice(0, 60) : ""}` +
      `${consoleErrors.length > before ? "  ERR+" + (consoleErrors.length - before) : ""}`
    );
  }

  writeFileSync(join(OUT, "modules.json"), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nwrote ${join(OUT, "modules.json")}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
