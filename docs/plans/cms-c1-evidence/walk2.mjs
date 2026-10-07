import { open, login, openEditor, COMPOSER_JS, OUT, BASE, SITE } from "./helpers.mjs";
import fs from "node:fs";
const prev = JSON.parse(fs.readFileSync(`${OUT}/walk1.json`, "utf8"));
const { team: TEAM, posts: POSTS } = prev.ids;
const report = {};
const flow = (name) => {
  report[name] = { steps: 0, notes: [] };
  return { step: (w) => { report[name].steps += 1; report[name].notes.push(`${report[name].steps}. ${w}`); }, note: (w) => report[name].notes.push(`   ${w}`) };
};
const save = () => fs.writeFileSync(`${OUT}/walk2.json`, JSON.stringify(report, null, 2));
const C = (body) => `(() => { const c = ${COMPOSER_JS}; ${body} })()`;
const { browser, page, published } = await open();
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 600000 });
if (page.url().includes("/auth")) await login(page);
await openEditor(page);
await page.waitForFunction(C(`return c.cms.collections.getCollection(${JSON.stringify(POSTS)}) !== null;`), null, { timeout: 600000, polling: 2000 });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const tid = (id) => page.getByTestId(id);
const canvasEl = (id) => page.locator(`[data-buildrick-id="${id}"]`).first();
const behaviour = async (fl) => { await page.getByRole("tab", { name: "Behaviour" }).click(); fl.step("Behaviour tab"); };

try {
  /* Setup (not a user flow): a page for this run, made through the composer. */
  const setup = await page.evaluate(C(`
    const els = c.elements;
    for (const old of els.getAllPages().filter((p) => p.name.startsWith("ZZ C1 Page"))) els.deletePage?.(old.id) ?? c.elements.removePage?.(old.id);
    const pg = els.createPage("ZZ C1 Page");
    els.setActivePage(pg.id);
    const root = els.getElement(pg.root.id);
    const h = els.createElement("heading", { content: "Static heading", tagName: "h2" });
    const tplH = els.createElement("heading", { content: "Template title", tagName: "h1" });
    const tmp = els.createElement("paragraph", { content: "Temp bound" });
    els.addElement(h, root.getId()); els.addElement(tplH, root.getId()); els.addElement(tmp, root.getId());
    return { page: pg.id, heading: h.getId(), tplHeading: tplH.getId(), temp: tmp.getId() };`));
  report.setup = setup;
  await page.waitForTimeout(3000);

  // (d1) bind an element (outside a list / template → a specific record)
  const d1 = flow("d1_bind_element");
  await canvasEl(setup.heading).click(); d1.step("select heading on canvas");
  await behaviour(d1);
  await page.getByRole("radio", { name: "From CMS" }).click(); d1.step("Source · From CMS");
  await page.getByLabel("Collection", { exact: true }).first().selectOption(POSTS); d1.step("Collection · Posts");
  await page.getByLabel("Field", { exact: true }).selectOption("title"); d1.step("Field · title");
  await page.waitForTimeout(3000);
  await shot("d1-bound");
  report.d1 = await page.evaluate(C(`return { binding: c.cms.bindings.getBindings(${JSON.stringify(setup.heading)}), canvasText: document.querySelector('[data-buildrick-id="${setup.heading}"]')?.textContent };`));
  d1.note(`binding itemId=${report.d1.binding[0]?.itemId} canvas="${report.d1.canvasText}"`);
  save();

  // (d2) a Collection list over Posts, its template reading every new type
  const d2 = flow("d2_collection_list");
  /* Nothing selected: an insert with the heading selected nests the list
     INSIDE the heading (RT-12, Add panel), and the heading's binding then
     replaces it on export. */
  await page.evaluate(C(`c.selection.clear();`));
  await page.waitForTimeout(1000);
  if (!(await page.getByPlaceholder(/Search elements/).isVisible().catch(() => false))) {
    await page.getByLabel(/Add elements, blocks and components/).first().click(); d2.step("rail Add");
  }
  await page.getByPlaceholder(/Search elements/).fill("Collection list"); d2.step("search");
  const row = page.getByRole("button", { name: /Collection list/ }).filter({ visible: true }).first();
  if (await row.isVisible({ timeout: 20000 }).catch(() => false)) {
    await row.click(); d2.step("insert Collection list (Add panel)");
  } else {
    report.d2Insert = "Add-panel row not clickable headless; inserted through the composer with the block's own shape";
    await page.evaluate(C(`const els = c.elements; const pg = els.getActivePage(); const list = els.createElement("collection-list", { styles: { display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "16px" } }); const card = els.createElement("container", {}); card.addChild(els.createElement("heading", { content: "{{item.name}}", tagName: "h3" })); card.addChild(els.createElement("paragraph", { content: "{{item.description}}" })); list.addChild(card); els.addElement(list, pg.root.id); c.selection.select(list);`));
    d2.step("insert Collection list (composer)");
  }
  await page.waitForTimeout(3000);
  const listId = await page.evaluate(C(`const s = c.selection.getSelected?.() ?? c.selection.getAllSelected?.()[0]; return s?.getType?.() === "collection-list" ? s.getId() : (c.elements.getAllElements().filter((e) => e.getType() === "collection-list").pop()?.getId() ?? null);`));
  report.listId = listId;
  await canvasEl(listId).click({ position: { x: 4, y: 4 } }).catch(() => {});
  await behaviour(d2);
  await page.getByLabel("Collection", { exact: true }).first().selectOption(POSTS); d2.step("Collection · Posts");
  await page.waitForTimeout(2000);
  /* Template text set through the composer (typing into canvas text is not
     what this flow measures): every new type, through the reference too. */
  await page.evaluate(C(`
    const list = c.elements.getElement(${JSON.stringify(listId)});
    const card = list.getChildren()[0];
    const texts = card.getDescendants().filter((e) => ["heading","paragraph"].includes(e.getType()));
    texts[0].setContent("{{item.title}} by {{item.author}} ({{item.author.role}})");
    texts[1].setContent("{{item.body}} | tags: {{item.tags}} | link: {{item.url}}");
    c.markDirty();`));
  await page.waitForTimeout(4000);
  await shot("d2-list-canvas");
  report.d2Canvas = await page.evaluate(`document.querySelector('[data-buildrick-id="${listId}"]')?.innerHTML.slice(0, 1500)`);
  save();

  // (e) template page: Dynamic pages for Posts → template ZZ C1 Page, SEO; bind its heading
  const e = flow("e_template_page");
  await page.getByLabel(/Collections, records and data sources/).first().click(); e.step("rail CMS");
  await tid(`content-collection-${POSTS}`).click(); e.step("open Posts");
  await tid("cms-ws-more").click(); e.step("⋯");
  await tid("cms-ws-menu-dynamic").click(); e.step("Dynamic pages");
  const opts = await tid("cms-dp-template").locator("option").allTextContents();
  e.note(`template options: ${opts.join(" | ")}`);
  await tid("cms-dp-template").selectOption({ label: "ZZ C1 Page" }); e.step("Template page");
  await tid("cms-dp-seo-title").fill("{title} · Posts"); e.step("SEO title pattern");
  await tid("cms-dp-save").click(); e.step("Generate");
  await page.waitForTimeout(2000);
  await shot("e-dynamic-pages");
  // back to canvas, bind the template heading (this page's record)
  await tid("cms-ws-back-to-canvas").click().catch(async () => { await page.getByLabel(/Add elements, blocks/).first().click(); });
  e.step("back to canvas");
  await page.evaluate(C(`c.elements.setActivePage(${JSON.stringify(setup.page)});`));
  await page.waitForTimeout(2000);
  await canvasEl(setup.tplHeading).click(); e.step("select template heading");
  await behaviour(e);
  await page.getByRole("radio", { name: "From CMS" }).click(); e.step("From CMS");
  await page.getByLabel("Collection", { exact: true }).first().selectOption(POSTS); e.step("Collection");
  report.eContext = await page.getByTestId("cms-record-context").textContent().catch(() => null);
  await page.getByLabel("Field", { exact: true }).selectOption("title"); e.step("Field");
  await page.waitForTimeout(2000);
  report.eBinding = await page.evaluate(C(`return c.cms.bindings.getBindings(${JSON.stringify(setup.tplHeading)});`));
  await shot("e-template-bound");
  save();

  // temp binding for (f3) — a collection that is deleted with its element bound
  await page.evaluate(C(`return Promise.all(c.cms.collections.getAllCollections().filter((x) => x.name === "ZZ C1 Temp").map((x) => c.cms.collections.deleteCollection(x.id)));`));
  await page.evaluate(C(`return c.cms.collections.createCollection("ZZ C1 Temp", undefined, undefined, { fields: [{ id: "t1", name: "Name", slug: "name", type: "text", order: 0 }], displayField: "name" }).then(async (col) => {
      const it = await c.cms.collections.createContentItem(col.id, { name: "Tempy" }, { status: "published" });
      c.cms.bindings.bindToField(${JSON.stringify(setup.temp)}, col.id, it.id, "name", "content", undefined, "Bind");
      window.__tempCol = col.id; return col.id; });`));
  await page.waitForTimeout(4000);
  // save the project so the server holds the bindings
  await page.keyboard.press("Meta+s");
  await page.waitForTimeout(15000);

} catch (err) {
  report.error = String(err && err.stack || err);
  await shot("walk2-error");
}
save();
await browser.close();
console.log(JSON.stringify(report, null, 1).slice(0, 8000));
