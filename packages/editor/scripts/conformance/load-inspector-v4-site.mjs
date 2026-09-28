/**
 * load-inspector-v4-site — put the Inspector v4 state fixture into a REAL
 * dashboard site, then (optionally) drive the editor into each board's state.
 *
 * The fixture is `e2e/fixtures/inspector-v4-site.json`; the per-board states
 * are `inspector-v4-state.mjs`. Every Inspector v4 lane uses the pair for its
 * live checks (build plan 2026-09-28 §4.3).
 *
 * Needs the dashboard dev server, e.g. on 3110 from packages/dashboard:
 *   NEXT_PUBLIC_APP_URL=http://localhost:3110 AUTH_URL=http://localhost:3110 \
 *   NEXTAUTH_URL=http://localhost:3110 npx next dev --turbopack -p 3110
 * Run from packages/editor (so `@playwright/test` resolves):
 *
 *   # 1. create a NEW site "Inspector v4 fixture" through the dashboard and load it
 *   node scripts/conformance/load-inspector-v4-site.mjs --base http://localhost:3110
 *   #    (or name it: --name "Inspector v4 fixture · integration")
 *   # 2. reload the fixture into that same site (refuses any site whose name
 *   #    does not start with "Inspector v4 fixture" — it overwrites the Home page)
 *   node scripts/conformance/load-inspector-v4-site.mjs --site <id>
 *   # 3. walk boards: fresh editor page per board, run the snippet, print the result
 *   node scripts/conformance/load-inspector-v4-site.mjs --site <id> --no-load --check 1-29
 *   # 4. one board, screenshot at 1440×900 (the live half of the §4.3 loop)
 *   node scripts/conformance/load-inspector-v4-site.mjs --site <id> --no-load --board 7 --out /tmp/insp-07.png
 *
 * Flags: --base (default http://localhost:3110) · --email / --password (default
 * the local QA account qa@buildrik.local; BK_EMAIL / BK_PASSWORD override) ·
 * --name (the site's name; must start with "Inspector v4 fixture") ·
 * --state <storageState path> (default $TMPDIR/insp-v4-auth.json, reused while
 * the session lives) · --headed.
 *
 * HOW THE LOAD WORKS — through the editor, not around it. The page's own
 * composer (read off the canvas's React fiber) does every write, so each one
 * takes the path a user's edit takes and syncs to the server the usual way:
 *   1. CMS: `cms.collections.createCollection` + fields + records, records
 *      published (a binding previews PUBLISHED records only). useCmsSync
 *      mirrors each to the server. Re-running reuses a collection by slug —
 *      only one THIS site owns: an unscoped row from another site shares the
 *      browser store, and the server refuses its fields (the Menu collection
 *      once loaded with none), so that slug gets a new, site-owned collection.
 *   2. Placeholders in the fixture are resolved: `@page:home` / `@root:home` →
 *      the site's own Home page and root ids (a save naming another site's page
 *      is refused, PAGE_NOT_IN_SITE); `@cms:<key>` → collection id;
 *      `@cms:<key>#N` → the record made from the fixture's N-th record (matched
 *      by its display field, oldest first — the store lists newest first).
 *   3. `importProject` (sanitizer + type refinement run as on any load).
 *   4. Components: `components.createComponent` from the fixture element, then
 *      `adoptInstances` makes that element the first instance, then each
 *      override is written with `element.setStyle`, which records it on the
 *      instance exactly as an Inspector edit does.
 *   5. Collections marked `deleteAfterLoad` are deleted AFTER the bindings
 *      exist — "a heading bound to a collection that was deleted" is then the
 *      real state, not a binding to an id that never existed.
 *   6. The editor's own dashboard autosave (not `composer.saveProject()`,
 *      which writes local storage only); then a fresh page reloads the site
 *      and the read-back is taken from what the SERVER returned. A read-back
 *      missing any piece exits 1 with "LOAD INCOMPLETE".
 *
 * Never publishes. Never touches a site other than the one it created or the
 * one named by --site (and that one's name must start with "Inspector v4 fixture").
 *
 * WHAT THE FIXTURE CANNOT HOLD (stated, not faked):
 *   - media-library metadata (board 8 "2400 × 1600 · 428 KB", board 10
 *     "3:42 · 4.8 MB"): the image/audio point at remote URLs; a file name and
 *     size exist only for an uploaded asset, which needs BLOB_READ_WRITE_TOKEN;
 *   - Q5 settings (video URL + "Detected: YouTube", countdown end, progress
 *     value/max): L2-B names those attributes; the elements carry the block
 *     defaults until then;
 *   - the save conflict (board 29) is a session state, not data — the board 29
 *     snippet raises it live.
 *
 * @license BSD-3-Clause
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { snippet, boardMeta } from "./inspector-v4-state.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(HERE, "..", "..", "e2e", "fixtures", "inspector-v4-site.json");

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1] ?? true;
};
const has = (name) => argv.includes(`--${name}`);

const BASE = String(arg("base", "http://localhost:3110")).replace(/\/$/, "");
const EMAIL = arg("email", process.env.BK_EMAIL ?? "qa@buildrik.local");
const PASSWORD = arg("password", process.env.BK_PASSWORD ?? "qa-test-1234");
const STATE = arg("state", join(tmpdir(), "insp-v4-auth.json"));
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
/* The prefix is the guard: the loader overwrites the Home page of the site it
   is pointed at, so it only ever touches a site named as a fixture. */
const NAME = String(arg("name", fixture.site.name));
if (!NAME.startsWith(fixture.site.name)) {
  throw new Error(`--name must start with ${JSON.stringify(fixture.site.name)} (got ${JSON.stringify(NAME)})`);
}

/** Wait until React has hydrated the field: typing into the server-rendered
 *  input before that lets the form submit natively (HTTP 400 on /auth). */
async function waitHydrated(page, selector) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return Boolean(el) && Object.keys(el).some((k) => k.startsWith("__reactProps"));
    },
    selector,
    { timeout: 180_000 },
  );
}

const browser = await chromium.launch({ headless: !has("headed"), args: ["--no-proxy-server"] });

/** A context carrying the saved session, or a fresh login through /auth. */
async function authedContext() {
  const opts = { viewport: { width: 1440, height: 900 } };
  const consent = [{
    name: "buildrik_consent",
    value: encodeURIComponent(JSON.stringify({ essential: true, analytics: false })),
    url: BASE,
  }];
  try {
    const ctx = await browser.newContext({ ...opts, storageState: STATE });
    await ctx.addCookies(consent);
    const probe = await ctx.request.get(`${BASE}/api/auth/session`);
    const session = probe.ok() ? await probe.json().catch(() => null) : null;
    if (session?.user) return ctx;
    await ctx.close();
  } catch {
    /* no stored state yet — log in below */
  }
  const ctx = await browser.newContext(opts);
  await ctx.addCookies(consent);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await waitHydrated(page, 'input[placeholder="Your Email"]');
  await page.getByPlaceholder("Your Email").fill(EMAIL);
  await page.getByPlaceholder("Your Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 120_000 });
  await ctx.storageState({ path: STATE });
  await page.close();
  return ctx;
}

/** Create the site through the dashboard's own New-site flow; returns its id. */
async function createSite(ctx) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/sites/new`, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await waitHydrated(page, 'input[placeholder="My New Site"]');
  await page.getByPlaceholder("My New Site").fill(NAME);
  await page.getByRole("button", { name: /Start from Scratch/ }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/edit/"), { timeout: 180_000 });
  const id = new URL(page.url()).pathname.split("/")[2];
  await page.close();
  return id;
}

/** The site's name, from the same tRPC query the dashboard uses. */
async function siteName(ctx, id) {
  const input = encodeURIComponent(JSON.stringify({ 0: { json: { id } } }));
  const res = await ctx.request.get(`${BASE}/api/trpc/sites.get?batch=1&input=${input}`);
  const body = await res.json().catch(() => null);
  return body?.[0]?.result?.data?.json?.name ?? null;
}

/** An editor page on the site with its composer found and published. */
async function openEditor(ctx, siteId) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/edit/${siteId}`, { waitUntil: "domcontentloaded", timeout: 180_000 });
  if (/\/auth/.test(page.url())) throw new Error(`session dead: landed on ${page.url()} — delete ${STATE} and re-run`);
  await page.waitForSelector(".buildrick-canvas", { state: "attached", timeout: 180_000 });
  await page.waitForTimeout(5000);
  /* Strip the agentation dev overlay: it sits over the inspector column and
     answers reads in its place (editor-rig.mjs trap 4). */
  await page.evaluate(() =>
    document.querySelectorAll("[data-agentation],[id*='agentation' i],[class*='agentation' i]").forEach((n) => n.remove()));
  /* No board draws the "Project loaded" toast or the Add panel's first-use
     tip; both sit over the canvas foot. Dismissed through their own buttons. */
  await page.evaluate(() =>
    document.querySelectorAll('[aria-label="Dismiss notification"], [data-testid="insert-first-use-tip-ok"]').forEach((b) => b.click()));
  const found = await page.evaluate(() => {
    const canvas = document.querySelector(".buildrick-canvas");
    let f = null;
    for (const k in canvas) if (k.startsWith("__reactFiber")) f = canvas[k];
    for (let x = f, h = 0; x && h < 60; x = x.return, h++) {
      if (x.memoizedProps?.composer?.elements) { window.__bkComposer = x.memoizedProps.composer; return true; }
    }
    return false;
  });
  if (!found) throw new Error("no composer on the canvas fiber — the editor did not boot");
  return { page, errors };
}

/** Steps 1–6 of the header, inside the page. */
async function loadFixture(page, fx, siteId) {
  return page.evaluate(async ({ fx, siteId }) => {
    const c = window.__bkComposer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cms = c.cms.collections;
    const home = c.elements.getAllPages().find((p) => p.isHome) ?? c.elements.getAllPages()[0];
    const subs = { "@page:home": home.id, "@root:home": home.root.id };

    /* 1. CMS */
    const created = {};
    for (const col of fx.cms.collections) {
      /* Reuse only a row this site owns; an unscoped (siteId-less) row from
         another site is visible here too, and the server refuses its writes. */
      const bySlug = cms.getCollectionBySlug(col.slug);
      const ours = bySlug && bySlug.siteId === siteId ? bySlug : null;
      let row = ours ?? (await cms.createCollection(col.name, bySlug ? `${col.slug}-${siteId.slice(-6).toLowerCase()}` : col.slug));
      row = await cms.updateCollection(row.id, {
        fields: col.fields.map((f) => ({ id: `${col.key}-${f.slug}`, ...f })),
        displayField: col.displayField,
      }) ?? row;
      let items = await cms.getContentItems(row.id);
      for (const rec of col.records.slice(items.length)) await cms.createContentItem(row.id, rec);
      items = await cms.getContentItems(row.id);
      for (const it of items) if (it.status !== "published") await cms.updateContentItem(it.id, { status: "published" });
      subs[`@cms:${col.key}`] = row.id;
      /* `#N` is the fixture's N-th record, whatever order the store lists in
         (newest first): matched by display field, else oldest first. */
      const oldestFirst = [...items].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      const taken = new Set();
      col.records.forEach((rec, i) => {
        const match =
          oldestFirst.find((it) => !taken.has(it.id) && it.data?.[col.displayField] === rec[col.displayField]) ??
          oldestFirst.find((it) => !taken.has(it.id));
        if (!match) return;
        taken.add(match.id);
        subs[`@cms:${col.key}#${i}`] = match.id;
      });
      created[col.key] = { id: row.id, records: items.length };
    }

    /* 2. Placeholders — longest first so "@cms:menu#0" is not eaten by "@cms:menu". */
    let text = JSON.stringify(fx.project);
    for (const key of Object.keys(subs).sort((a, b) => b.length - a.length)) text = text.split(key).join(subs[key]);
    const project = JSON.parse(text);
    const unresolved = text.match(/@(page|root|cms):[\w#-]+/g);
    if (unresolved) return { error: "unresolved placeholders: " + [...new Set(unresolved)].join(", ") };

    /* 3. Import */
    c.importProject(project);
    await sleep(500);

    /* 4. Components */
    const components = {};
    for (const comp of fx.components) {
      const existing = c.components.getAllComponents().find((d) => d.name === comp.name);
      const def = existing ?? (await c.components.createComponent(comp.name, comp.element));
      if (!def) return { error: "createComponent refused " + comp.element };
      c.components.adoptInstances(def.id, [comp.element]);
      const el = c.elements.getElement(comp.element);
      for (const [prop, value] of Object.entries(comp.overrides)) el.setStyle(prop, value);
      components[comp.key] = { id: def.id, overrides: Object.keys(c.components.getOverridesForElement(comp.element)) };
    }

    /* 5. Deleted-source collections */
    for (const col of fx.cms.collections) {
      if (col.deleteAfterLoad) created[col.key].deleted = await cms.deleteCollection(subs[`@cms:${col.key}`]);
    }

    /* 6. Save. NOT `composer.saveProject()` — that writes `composer.storage`
       (local), and the shipping editor never persists through it. The
       dashboard save is useComposerInit's autosave (project:changed → 1s
       debounce → BuildrikSyncProvider.saveProject → markSaved), so ask for it
       the way an edit does and wait for its project:saved. */
    await sleep(1500); // let the autosaves the writes above already queued settle
    const saved = new Promise((resolve) => {
      const t = setTimeout(() => resolve("timeout"), 30_000);
      c.on("project:saved", () => { clearTimeout(t); resolve("saved"); });
      window.addEventListener("buildrik:save-conflict", () => { clearTimeout(t); resolve("conflict"); }, { once: true });
    });
    c.markDirty();
    const saveResult = await saved;
    await sleep(2000); // the CMS/component mirrors are fire-and-forget
    return { homePageId: home.id, collections: created, components, saveError: saveResult === "saved" ? null : saveResult };
  }, { fx, siteId });
}

/** What the server gave back, read off a freshly loaded editor. */
async function readBack(page, fx) {
  return page.evaluate((fx) => {
    const c = window.__bkComposer;
    const all = c.elements.getAllElements();
    const hero = c.elements.getElement("i4-hero");
    const wanted = JSON.stringify(fx.project.pages).match(/"id":"(i4-[\w-]+)"/g).map((s) => s.slice(6, -1));
    const missing = wanted.filter((id) => !c.elements.getElement(id));
    const typeOf = (id) => c.elements.getElement(id)?.getType();
    const bindings = c.exportProject().cmsBindings ?? {};
    const collections = c.cms.collections.getAllCollections().map((col) => col.name);
    return {
      elements: all.length,
      heroChildren: hero?.getChildren().length ?? 0,
      missingIds: missing,
      types: { grid: typeOf("i4-grid"), checkbox: typeOf("i4-checkbox"), videoEmbed: typeOf("i4-video-embed"), audio: typeOf("i4-audio") },
      locked: c.elements.getElement("i4-heading-locked")?.isLocked(),
      tabletOverride: c.styles.getBreakpointStyle("i4-heading-tablet", "tablet"),
      hoverRule: c.styles.getRule('[data-buildrick-id="i4-button-hover"]:hover')?.properties ?? null,
      instance: Boolean(c.components.getInstance("i4-banner")),
      instanceOverrides: c.components.getOverridesForElement("i4-banner"),
      fieldBindings: Object.keys(bindings.field ?? {}),
      collectionBindings: Object.keys(bindings.collection ?? {}),
      collections,
    };
  }, fx);
}

function range(spec) {
  return String(spec).split(",").flatMap((part) => {
    const [a, b] = part.split("-").map(Number);
    return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
  });
}

try {
  const ctx = await authedContext();
  let siteId = arg("site");
  if (siteId) {
    const name = await siteName(ctx, siteId);
    if (typeof name !== "string" || !name.startsWith(fixture.site.name)) {
      throw new Error(`refusing site ${siteId}: it is called ${JSON.stringify(name)}, which does not start with ${JSON.stringify(fixture.site.name)}. The loader overwrites the Home page.`);
    }
  } else {
    siteId = await createSite(ctx);
    console.log(`created site "${NAME}": ${siteId}`);
  }

  if (!has("no-load")) {
    const { page, errors } = await openEditor(ctx, siteId);
    const result = await loadFixture(page, fixture, siteId);
    console.log("load:", JSON.stringify(result, null, 2));
    if (errors.length) console.log("page errors:", errors);
    await page.close();
    const again = await openEditor(ctx, siteId);
    const back = await readBack(again.page, fixture);
    console.log("read-back after reload:", JSON.stringify(back, null, 2));
    await again.page.close();
    const complete = !result.error && !result.saveError && back.missingIds.length === 0 && back.instance &&
      back.fieldBindings.length === 2 && back.collectionBindings.length === 1 && back.hoverRule && back.locked;
    if (!complete) {
      process.exitCode = 1;
      console.log("LOAD INCOMPLETE — the server copy does not hold the whole fixture; nothing below is a finding. Re-run with --site " + siteId);
    }
  }

  const boards = arg("check") ? range(arg("check")) : arg("board") ? [Number(arg("board"))] : [];
  const meta = boardMeta();
  for (const n of boards) {
    const { page, errors } = await openEditor(ctx, siteId);
    const r = await page.evaluate(snippet(n));
    if (arg("out") && boards.length === 1) await page.screenshot({ path: arg("out") });
    const failed = (r.steps ?? []).filter((s) => !s.ok).map((s) => `${s.step}${s.note ? ` (${s.note})` : ""}`);
    const verdict = r.error ? `ERROR ${r.error}` : r.selectionOk ? "selected" : `WRONG selection [${r.selected}]`;
    const fallbacks = (r.steps ?? []).filter((s) => s.ok && s.via === "pre-v4").map((s) => s.step);
    console.log(
      `${String(n).padStart(2)} ${(meta[n]?.name ?? "").padEnd(34)} ${verdict.padEnd(10)} needs=[${r.needs ?? ""}]` +
        ` inspector="${r.inspector ?? ""}"` +
        (fallbacks.length ? `  pre-v4 door: ${fallbacks.join(", ")}` : "") +
        (failed.length ? `  not reached: ${failed.join("; ")}` : ""),
    );
    if (has("verbose")) console.log(JSON.stringify(r, null, 2), errors);
    await page.close();
  }
  console.log(`site: ${siteId}  editor: ${BASE}/edit/${siteId}`);
} finally {
  await browser.close();
}
