#!/usr/bin/env node
/**
 * Re-capture the editor's baseline states into the Figma file, so the design
 * file shows the editor as it is TODAY.
 *
 * Every editor frame in `Micuc1rmLcFhjxF1A08Kk2` was captured between
 * 2026-08-21 and 2026-08-23, which is 187-217 commits behind HEAD. A baseline
 * that old does not describe the product; it describes a product.
 *
 * Three things this file exists to remember:
 *
 *  1. `generate_figma_design` MUST be given the target page as `nodeId`.
 *     Without it the capture lands on whichever page happens to be open — the
 *     first run of this pipeline put an editor screen on the Dashboard page and
 *     the editor page's frame count never moved.
 *  2. A capture arrives named after the page <title> ("Buildrick") and parked
 *     at the origin. It is renamed and moved in the SAME pass, because two
 *     unnamed captures are indistinguishable and the second one cannot be
 *     placed.
 *  3. The submit response is not proof. It has reported 200 on a capture that
 *     never landed. Every state here is confirmed by reading the page's frame
 *     count back, and the run stops if it did not move.
 *
 * Usage: node figma-refresh.mjs [--only bl1,bl2] [--dry]
 *
 * @license BSD-3-Clause
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const FILE_KEY = "Micuc1rmLcFhjxF1A08Kk2";
const EDITOR_PAGE = "75:2";
const SITE = "cmrsur1fp000unh3rvmmiq25t";
const PATH_ = `/edit/${SITE}`;
const STATE = join(ROOT, ".walk", "fig-state.json");
const TODAY = "2026-08-26";

/* Doors come from the walk, not from the tab config: `ai` is the bare `i`
   (⌘I does nothing), and seven of the thirteen tabs are not on the rail at
   all. `supersede` is the node currently marked CURRENT for that state; null
   means the state has never been captured and this is its first frame. */
const RECIPES = [
  { bl: "BL-0101", state: "panel-layers",        supersede: "316:2", actions: [{ openTab: "layers" }] },
  { bl: "BL-0102", state: "panel-pages",         supersede: "318:2", actions: [{ openTab: "pages" }] },
  { bl: "BL-0103", state: "panel-media",         supersede: "319:2", actions: [{ openTab: "assets" }] },
  { bl: "BL-0104", state: "panel-content",       supersede: "321:2", actions: [{ openTab: "content" }] },
  { bl: "BL-0105", state: "panel-brand",         supersede: "322:2", actions: [{ openTab: "design" }] },
  { bl: "BL-0300", state: "panel-ai",            supersede: null,    actions: [{ press: "i" }, { waitMs: 3000 }] },
  { bl: "BL-0220", state: "panel-templates",     supersede: "360:2", actions: [{ press: "t" }, { waitMs: 3000 }] },
  { bl: "BL-0301", state: "panel-components",    supersede: null,    actions: [{ press: "Shift+A" }, { waitMs: 3000 }] },
  { bl: "BL-0113", state: "panel-version-history", supersede: "78:2", actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Version history/]' }, { waitMs: 3500 }] },
  { bl: "BL-0218", state: "panel-review",        supersede: "357:2", actions: [{ click: 'button:has-text("In review")' }, { waitMs: 3500 }] },
  { bl: "BL-0112", state: "modal-site-settings", supersede: "77:2",  actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Site settings/]' }, { waitMs: 3000 }] },
  { bl: "BL-0176", state: "modal-publish-confirm", supersede: "323:2", actions: [{ click: 'button:text-is("Publish")' }, { waitMs: 4000 }] },

  { bl: "BL-0302", state: "inspector-none",      supersede: null,    actions: [{ press: "Escape" }, { waitMs: 1500 }] },
  { bl: "BL-0125", state: "inspector-container", supersede: "332:2", actions: [{ selectType: "container" }, { waitMs: 2000 }] },
  { bl: "BL-0123", state: "inspector-paragraph", supersede: "330:2", actions: [{ selectType: "paragraph" }, { waitMs: 2000 }] },
  { bl: "BL-0129", state: "inspector-heading",   supersede: "96:2",  actions: [{ selectType: "heading" }, { waitMs: 2000 }] },
  { bl: "BL-0126", state: "inspector-grid",      supersede: "93:2",  actions: [{ selectType: "grid" }, { waitMs: 2000 }] },
  { bl: "BL-0127", state: "inspector-flex",      supersede: "94:2",  actions: [{ selectType: "flex" }, { waitMs: 2000 }] },
  { bl: "BL-0128", state: "inspector-input",     supersede: "95:2",  actions: [{ selectType: "input" }, { waitMs: 2000 }] },
  { bl: "BL-0124", state: "inspector-button",    supersede: "331:2", actions: [{ selectType: "button" }, { waitMs: 2000 }] },

  { bl: "BL-0303", state: "canvas-breakpoint-wide",   supersede: null, actions: [{ click: 'button[aria-label^="Wide"]' }, { waitMs: 2500 }] },
  { bl: "BL-0304", state: "canvas-breakpoint-tablet", supersede: null, actions: [{ click: 'button[aria-label^="Tablet"]' }, { waitMs: 2500 }] },
  { bl: "BL-0305", state: "canvas-breakpoint-mobile", supersede: null, actions: [{ click: 'button[aria-label^="Mobile"]' }, { waitMs: 2500 }] },
  { bl: "BL-0213", state: "canvas-overlay-grid",   supersede: "336:2", actions: [{ click: 'button:text-is("Grid")' }, { waitMs: 2000 }] },
  { bl: "BL-0214", state: "canvas-overlay-rulers", supersede: "337:2", actions: [{ click: 'button:text-is("Rulers")' }, { waitMs: 2000 }] },
  { bl: "BL-0215", state: "canvas-overlay-badges", supersede: "338:2", actions: [{ click: 'button:text-is("Badges")' }, { waitMs: 2000 }] },
  { bl: "BL-0216", state: "canvas-xray",           supersede: "339:2", actions: [{ click: 'button:text-is("X-Ray")' }, { waitMs: 2000 }] },

  /* Second pass — the sub-states behind a panel or a menu row. Every door here
     was opened by hand in the module walk first; none is guessed from a name. */
  { bl: "BL-0122", state: "site-menu-open",       supersede: "87:2",  actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 2000 }] },
  { bl: "BL-0107", state: "comments-open",        supersede: "329:2", actions: [{ click: 'button[aria-label^="Comments"]' }, { waitMs: 2500 }] },
  { bl: "BL-0108", state: "notifications-open",   supersede: "326:2", actions: [{ click: 'button[aria-label^="Notifications"]' }, { waitMs: 2500 }] },
  { bl: "BL-0111", state: "cmdk-open",            supersede: "328:2", actions: [{ press: "Meta+k" }, { waitMs: 2500 }] },
  { bl: "BL-0106", state: "publish-panel",        supersede: "71:2",  actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Publish panel/]' }, { waitMs: 3500 }] },
  { bl: "BL-0114", state: "sitemenu-publish-history", supersede: "79:2", actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Publish history/]' }, { waitMs: 3500 }] },
  { bl: "BL-0115", state: "sitemenu-export-code", supersede: "80:2",  actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Export code/]' }, { waitMs: 3500 }] },
  { bl: "BL-0118", state: "sitemenu-design-system", supersede: "83:2", actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Design system/]' }, { waitMs: 3500 }] },
  { bl: "BL-0119", state: "sitemenu-plugins",     supersede: "84:2",  actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Plugins/]' }, { waitMs: 3500 }] },
  { bl: "BL-0120", state: "sitemenu-invite-teammates", supersede: "85:2", actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Invite teammates/]' }, { waitMs: 3500 }] },
  { bl: "BL-0121", state: "sitemenu-keyboard-shortcuts", supersede: "86:2", actions: [{ click: 'button[aria-label="Site menu"]' }, { waitMs: 1500 }, { click: 'role=menuitem[name=/Keyboard shortcuts/]' }, { waitMs: 3500 }] },

  { bl: "BL-0161", state: "media-fullpage-library", supersede: "120:2", actions: [{ openTab: "assets" }, { click: 'button[aria-label="Expand Media"]' }, { waitMs: 4000 }] },
  /* The drawer's List view is disabled, so this state is only reachable from
     the full-page library — and the drawer's dead buttons are still in the DOM
     behind it and come first, so the enabled one must be named by position. */
  { bl: "BL-0162", state: "media-list-view",      supersede: "121:2", actions: [{ openTab: "assets" }, { click: 'button[aria-label="Expand Media"]' }, { waitMs: 4000 }, { click: 'button[aria-label="List view"]:not([disabled])' }, { waitMs: 2500 }] },
  { bl: "BL-0159", state: "media-stock-browser",  supersede: "118:2", actions: [{ openTab: "assets" }, { click: 'button:has-text("Stock")' }, { waitMs: 3500 }] },
  { bl: "BL-0160", state: "media-icon-picker",    supersede: "119:2", actions: [{ openTab: "assets" }, { click: 'button:has-text("Icons")' }, { waitMs: 3500 }] },

  { bl: "BL-0164", state: "pages-add-page",       supersede: "123:2", actions: [{ openTab: "pages" }, { click: 'button[aria-label="Add new page"]' }, { waitMs: 3000 }] },
  { bl: "BL-0166", state: "pages-more-add-options", supersede: "126:2", actions: [{ openTab: "pages" }, { click: 'button[aria-label="More add options"]' }, { waitMs: 2500 }] },
  { bl: "BL-0167", state: "pages-fullpage",       supersede: "127:2", actions: [{ openTab: "pages" }, { click: 'button[aria-label="Expand Pages"]' }, { waitMs: 4000 }] },
  { bl: "BL-0163", state: "pages-context-menu",   supersede: "122:2", actions: [{ openTab: "pages" }, { rightClick: 'role=treeitem[name=/About/]' }, { waitMs: 2500 }] },
  { bl: "BL-0168", state: "layers-context-menu",  supersede: "128:2", actions: [{ openTab: "layers" }, { rightClick: '.ls-panel [role=treeitem] >> nth=1' }, { waitMs: 2500 }] },

  { bl: "BL-0169", state: "brand-pro-mode",       supersede: "129:2", actions: [{ openTab: "design" }, { click: 'button:has-text("Full power")' }, { waitMs: 3000 }] },
  { bl: "BL-0171", state: "brand-starter-themes", supersede: "271:2", actions: [{ openTab: "design" }, { click: 'button:has-text("Starters")' }, { waitMs: 3500 }] },
  { bl: "BL-0174", state: "brand-components-tab", supersede: "132:2", actions: [{ openTab: "design" }, { click: 'button:has-text("Components")' }, { waitMs: 3500 }] },
  { bl: "BL-0175", state: "content-create-collection", supersede: "133:2", actions: [{ openTab: "content" }, { click: 'button:has-text("Create a collection")' }, { waitMs: 3500 }] },
  { bl: "BL-0217", state: "canvas-cheat-sheet",   supersede: "340:2", actions: [{ click: 'button[aria-label*="hortcut"]' }, { waitMs: 2500 }] },
  { bl: "BL-0306", state: "canvas-context-menu",  supersede: null,    actions: [{ selectType: "heading" }, { waitMs: 1200 }, { rightClick: '[data-buildrick-type="heading"]' }, { waitMs: 2500 }] },
];

const args = process.argv.slice(2);
/* `indexOf` returns -1 when the flag is absent, so `args[-1 + 1]` reads
   args[0] — with only `--dry` passed, every recipe was filtered out and the
   run reported "0 states to refresh". Only read the value if the flag is there. */
const only = args.includes("--only") ? (args[args.indexOf("--only") + 1] || "").split(",").filter(Boolean) : [];
const DRY = args.includes("--dry");

const mcp = await import("./figma-mcp.mjs");
await mcp.connect();

const call = async (name, argsObj, id) => {
  const r = await mcp.rpc("tools/call", { name, arguments: argsObj }, id);
  return (r.result?.content ?? []).map((c) => c.text ?? "").join("\n");
};
const runFigma = (code, description) => call("use_figma", { fileKey: FILE_KEY, code, description }, 90);

/** Frames on the editor page — the only honest signal that a capture landed. */
async function pageFrames() {
  const out = await runFigma(
    `const p = figma.root.children.find(x => x.id === "${EDITOR_PAGE}");
     if (p.children.length === 0) await p.loadAsync();
     return { n: p.children.length, unnamed: p.children.filter(k => k.name === "Buildrick").map(k => k.id) };`,
    "count editor page frames"
  );
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`could not read frame count: ${out.slice(0, 200)}`);
  return JSON.parse(m[0]);
}

async function captureOne(rec) {
  const before = await pageFrames();
  if (before.unnamed.length) {
    throw new Error(`page already holds ${before.unnamed.length} un-renamed capture(s) (${before.unnamed.join(", ")}) — name them before adding another`);
  }

  const gen = await call("generate_figma_design", { fileKey: FILE_KEY, nodeId: EDITOR_PAGE }, 91);
  const captureId = (gen.match(/Capture ID generated: `([0-9a-f-]+)`/) || [])[1];
  if (!captureId) throw new Error(`no capture id in response: ${gen.slice(0, 200)}`);

  execFileSync(
    "node",
    [join(HERE, "figma-capture-live.mjs"), captureId, PATH_, "15000", JSON.stringify(rec.actions)],
    { env: { ...process.env, BK_STATE: STATE }, encoding: "utf8", timeout: 300000, stdio: "pipe" }
  );

  const after = await pageFrames();
  if (after.n !== before.n + 1 || after.unnamed.length !== 1) {
    /* The submit response has reported 200 on a capture that never landed.
       This is the check that catches it, on the state that caused it. */
    throw new Error(`capture did not land: frames ${before.n} -> ${after.n}, unnamed ${after.unnamed.length}`);
  }

  const name = `${rec.bl} / edit/:id / ${rec.state} / 1440 — CURRENT ${TODAY}`;
  const res = await runFigma(
    `const page = figma.root.children.find(p => p.id === "${EDITOR_PAGE}");
     if (page.children.length === 0) await page.loadAsync();
     const fresh = page.children.filter(k => k.name === "Buildrick");
     if (fresh.length !== 1) return { error: "expected 1 fresh frame, found " + fresh.length };
     const frame = fresh[0];
     let maxY = 0;
     for (const k of page.children) if (k !== frame) maxY = Math.max(maxY, k.y + k.height);
     frame.x = 200; frame.y = Math.round(maxY + 400);
     frame.name = ${JSON.stringify(name)};
     let superseded = null;
     ${rec.supersede ? `
     const old = page.children.find(k => k.id === "${rec.supersede}");
     if (old && !/SUPERSEDED/.test(old.name)) {
       old.name = old.name.replace(/ — CURRENT [0-9-]+.*$/, "") + " — SUPERSEDED ${TODAY} by " + frame.id;
       superseded = old.name;
     }` : ""}
     return { id: frame.id, name: frame.name, y: frame.y, superseded };`,
    `name and park ${rec.bl}`
  );
  const j = res.match(/\{[\s\S]*\}/);
  return j ? JSON.parse(j[0]) : { raw: res.slice(0, 200) };
}

const list = only.length ? RECIPES.filter((r) => only.includes(r.bl)) : RECIPES;
console.log(`${list.length} states to refresh${DRY ? " (dry run)" : ""}\n`);
if (DRY) { list.forEach((r) => console.log(`  ${r.bl}  ${r.state.padEnd(26)} supersede=${r.supersede ?? "(new)"}`)); process.exit(0); }

const done = [], failed = [];
for (const rec of list) {
  process.stdout.write(`${rec.bl} ${rec.state.padEnd(26)} `);
  try {
    const r = await captureOne(rec);
    console.log(`→ ${r.id} @y=${r.y}${r.superseded ? "  superseded" : "  (new)"}`);
    done.push({ ...rec, ...r });
  } catch (e) {
    console.log(`FAILED: ${String(e.message).slice(0, 160)}`);
    failed.push({ bl: rec.bl, error: String(e.message).slice(0, 300) });
  }
}
console.log(`\ndone ${done.length}/${list.length}${failed.length ? `, failed ${failed.length}` : ""}`);
failed.forEach((f) => console.log(`  ${f.bl}: ${f.error}`));
