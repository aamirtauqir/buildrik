import { open, login, openEditor, COMPOSER_JS, OUT, BASE, SITE } from "./helpers.mjs";
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(`${OUT}/walk1.json`, "utf8")).ids;
const w2 = JSON.parse(fs.readFileSync(`${OUT}/walk2.json`, "utf8"));
const report = {};
const flow = (name) => { report[name] = { steps: 0, notes: [] }; return { step: (w) => { report[name].steps += 1; report[name].notes.push(`${report[name].steps}. ${w}`); }, note: (w) => report[name].notes.push(`   ${w}`) }; };
const save = () => fs.writeFileSync(`${OUT}/walk4.json`, JSON.stringify(report, null, 2));
const C = (body) => `(() => { const c = ${COMPOSER_JS}; ${body} })()`;
const { browser, page, published } = await open();
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 600000 });
if (page.url().includes("/auth")) await login(page);
await openEditor(page);
await page.waitForFunction(C(`return c.cms.collections.getCollection(${JSON.stringify(ids.posts)}) !== null;`), null, { timeout: 600000, polling: 2000 });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const tid = (id) => page.getByTestId(id);
const trpc = (path, input) => page.evaluate(async ([path, input]) => {
  const r = await fetch(`/api/trpc/${path}?batch=1`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ 0: { json: input } }) });
  return r.json();
}, [path, input]);
const openCms = async (fl) => { await page.getByLabel(/Collections, records and data sources/).first().click(); fl?.step("rail CMS"); };
try {
  // Server record pages from the exported template (the publish worker's own render, no deploy)
  const payload = JSON.parse(fs.readFileSync(`${OUT}/aborted-publish-payload.json`, "utf8"));
  const tpl = payload["0"].json.pages.find((p) => p.path === "zz-c1-page.html");
  const gen = await trpc("cms.generateDynamicPages", { siteId: SITE, collectionId: ids.posts, templateHtml: tpl.html });
  const pages = gen?.[0]?.result?.data?.json ?? gen;
  report.recordPages = Array.isArray(pages) ? pages.map((p) => ({ path: p.path, title: /<title>(.*?)<\/title>/.exec(p.content)?.[1], h1: /<h1[^>]*>(.*?)<\/h1>/.exec(p.content)?.[1], list: /<h3[^>]*>(.*?)<\/h3>/.exec(p.content)?.[1], og: /og:title" content="([^"]*)"/.exec(p.content)?.[1] })) : pages;
  if (Array.isArray(pages) && pages[0]) fs.writeFileSync(`${OUT}/record-page.html`, pages[0].content);
  save();

  // (g) find where a field is used
  const g = flow("g_find_usage");
  await openCms(g);
  await tid(`content-collection-${ids.posts}`).click(); g.step("open Posts");
  await tid("cms-ws-tabs").getByRole("tab", { name: "Fields" }).click(); g.step("Fields tab");
  const titleId = await page.evaluate(C(`return c.cms.collections.getCollection(${JSON.stringify(ids.posts)}).fields.find((f) => f.slug === "title").id;`));
  report.usedByCell = await tid(`cms-field-used-${titleId}`).textContent();
  await tid(`cms-field-${titleId}`).click(); g.step("title row → field inspector");
  report.usedByList = await tid("cms-fi-uses").textContent().catch(() => null);
  await shot("g-used-by");

  // (f1) rename a field in use (name is free; key + type locked while bound)
  const f1 = flow("f1_rename_field_in_use");
  f1.note("starts in the open field inspector");
  await tid("cms-fi-name").fill("Headline"); f1.step("Name → Headline");
  await tid("cms-fi-name").press("Enter"); f1.step("Enter");
  report.f1KeyDisabled = await tid("cms-fi-key").isDisabled();
  await page.waitForTimeout(1500);
  report.f1Name = await page.evaluate(C(`return c.cms.collections.getCollection(${JSON.stringify(ids.posts)}).fields.find((f) => f.slug === "title").name;`));

  // (f2) delete a field in use → the lock names its uses
  const f2 = flow("f2_delete_field_in_use");
  await tid("cms-fi-delete").click(); f2.step("Delete field");
  await page.waitForTimeout(1500);
  await shot("f2-delete-lock");
  report.f2Dialog = await page.locator('#bk-overlay-root [role="dialog"], #bk-overlay-root [role="alertdialog"]').last().textContent().catch(() => null);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);

  // CMS-07 live: a second record with the same slug can't publish
  const v = flow("cms07_duplicate_slug");
  await tid("cms-ws-tabs").getByRole("tab", { name: "Records" }).click(); v.step("Records tab");
  await tid("cms-ws-add-record").click(); v.step("+ Add record");
  await page.locator("#cms-field-title").fill("Hello World"); v.step("Title (slug follows → hello-world)");
  await tid("cms-sheet-published").click(); v.step("Published");
  await tid("cms-sheet-save").click(); v.step("Save");
  await page.waitForTimeout(3000);
  report.cms07State = await tid("cms-sheet-state").textContent().catch(() => null);
  await shot("cms07-duplicate-slug");

  // UI-02 live: the sheet is dirty; a drawer collection click asks first
  const u = flow("ui02_drawer_guard");
  await tid(`content-collection-${ids.team}`).click(); u.step("drawer: Team");
  report.ui02Dialog = await page.getByText("Discard record changes?").isVisible({ timeout: 10000 }).catch(() => false);
  await shot("ui02-guard");
  await tid("cms-discard-confirm").click(); u.step("Discard and leave");
  await page.waitForTimeout(1500);
  report.ui02After = await tid("cms-ws-title").textContent();
  save();

  // (f3) delete a collection in use — setup: a Temp collection bound to an element
  const temp = await page.evaluate(C(`
    const els = c.elements; const pg = els.getAllPages().find((p) => p.name === "ZZ C1 Page");
    const el = els.getElement(${JSON.stringify(w2.setup.temp)});
    return c.cms.collections.createCollection("ZZ C1 Temp", undefined, undefined, { fields: [{ id: "t1", name: "Name", slug: "name", type: "text", order: 0 }], displayField: "name" })
      .then(async (col) => { const it = await c.cms.collections.createContentItem(col.id, { name: "Tempy" }, { status: "published" });
        if (el) c.cms.bindings.bindToField(el.getId(), col.id, it.id, "name", "content", undefined, "Bind");
        return { col: col.id, el: el?.getId() ?? null }; });`));
  report.f3Setup = temp;
  await page.waitForTimeout(3000);
  const f3 = flow("f3_delete_collection_in_use");
  await tid(`content-collection-${temp.col}`).click(); f3.step("open Temp");
  await tid("cms-ws-more").click(); f3.step("⋯");
  await tid("cms-ws-menu-settings").click(); f3.step("Settings");
  report.f3Consequence = await tid("cms-settings-danger").textContent();
  await tid("cms-settings-delete").click(); f3.step("Delete collection…");
  await tid("cms-delete-collection-input").fill("DELETE"); f3.step("type DELETE");
  await tid("cms-delete-collection-confirm").click(); f3.step("Delete collection");
  await page.waitForTimeout(3000);
  report.f3After = await page.evaluate(C(`return { bindings: c.cms.bindings.getBindings(${JSON.stringify(temp.el)}), text: c.elements.getElement(${JSON.stringify(temp.el)})?.getContent(), exists: !!c.cms.collections.getCollection(${JSON.stringify(temp.col)}) };`));
  await shot("f3-deleted");
  // Posts is referenced? Team is referenced by Posts.Author — its delete is blocked
  await tid(`content-collection-${ids.team}`).click();
  await tid("cms-ws-more").click(); await tid("cms-ws-menu-settings").click();
  report.teamDeleteBlocked = { note: await tid("cms-settings-referenced").textContent().catch(() => null), disabled: await tid("cms-settings-delete").isDisabled() };
  await shot("team-delete-blocked");
} catch (err) { report.error = String(err && err.stack || err); await shot("walk4-error"); }
save();
await browser.close();
console.log(JSON.stringify(report, null, 1).slice(0, 9000));
