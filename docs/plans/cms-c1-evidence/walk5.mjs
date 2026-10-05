import { open, login, openEditor, COMPOSER_JS, OUT, BASE } from "./helpers.mjs";
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(`${OUT}/walk1.json`, "utf8")).ids;
const w2 = JSON.parse(fs.readFileSync(`${OUT}/walk2.json`, "utf8"));
const report = { nav: [] };
const flow = (name) => { report[name] = { steps: 0, notes: [] }; return { step: (w) => { report[name].steps += 1; report[name].notes.push(`${report[name].steps}. ${w}`); }, note: (w) => report[name].notes.push(`   ${w}`) }; };
const save = () => fs.writeFileSync(`${OUT}/walk5.json`, JSON.stringify(report, null, 2));
const C = (body) => `(() => { const c = ${COMPOSER_JS}; ${body} })()`;
const { browser, page } = await open();
page.on("framenavigated", (f) => { if (f === page.mainFrame()) report.nav.push(`${new Date().toISOString()} ${f.url()}`); });
page.on("console", (m) => { if (m.type() === "error") (report.console ??= []).push(m.text().slice(0, 300)); });
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 600000 });
if (page.url().includes("/auth")) await login(page);
await openEditor(page);
await page.waitForFunction(C(`return c.cms.collections.getCollection(${JSON.stringify(ids.posts)}) !== null;`), null, { timeout: 600000, polling: 2000 });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const tid = (id) => page.getByTestId(id);
try {
  report.navBeforeSetup = report.nav.length;
  // setup through the UI: Temp collection + one record
  await page.getByLabel(/Collections, records and data sources/).first().click();
  for (const old of await page.evaluate(C(`return c.cms.collections.getAllCollections().filter((x) => x.name.startsWith("ZZ C1 Temp")).map((x) => x.id);`))) {
    await page.evaluate(C(`return c.cms.collections.deleteCollection(${JSON.stringify(old)});`));
  }
  await tid("content-new-collection").click();
  await tid("cms-setup-name").fill("ZZ C1 Temp");
  await tid("cms-setup-create").click();
  await tid("cms-ws-title").filter({ hasText: "ZZ C1 Temp" }).waitFor();
  const tempId = await page.evaluate(C(`return c.cms.collections.getAllCollections().find((x) => x.name === "ZZ C1 Temp").id;`));
  await tid("cms-ws-add-record").click();
  await page.locator("#cms-field-title").fill("Tempy");
  await tid("cms-sheet-published").click();
  await tid("cms-sheet-save").click();
  await tid("cms-sheet").waitFor({ state: "detached" });
  report.navAfterCreate = report.nav.length;
  // bind the temp paragraph through the inspector
  await tid("cms-ws-back-to-canvas").click().catch(() => {});
  await page.getByLabel(/Add elements, blocks and components/).first().click();
  await page.evaluate(C(`const pg = c.elements.getAllPages().find((p) => p.name === "ZZ C1 Page"); c.elements.setActivePage(pg.id);`));
  await page.waitForTimeout(2000);
  await page.locator(`[data-buildrick-id="${w2.setup.temp}"]`).first().click();
  await page.getByRole("tab", { name: "Behaviour" }).click();
  await page.getByRole("radio", { name: "From CMS" }).click();
  await page.getByLabel("Collection", { exact: true }).first().selectOption(tempId);
  await page.getByLabel("Field", { exact: true }).selectOption("title");
  await page.waitForTimeout(2000);
  report.tempBinding = await page.evaluate(C(`return c.cms.bindings.getBindings(${JSON.stringify(w2.setup.temp)});`));

  const f3 = flow("f3_delete_collection_in_use");
  await page.getByLabel(/Collections, records and data sources/).first().click(); f3.step("rail CMS");
  await tid(`content-collection-${tempId}`).click(); f3.step("open Temp");
  await tid("cms-ws-more").click(); f3.step("⋯");
  await tid("cms-ws-menu-settings").click(); f3.step("Settings");
  report.f3Consequence = await tid("cms-settings-danger").textContent();
  await tid("cms-settings-delete").click(); f3.step("Delete collection…");
  await tid("cms-delete-collection-input").fill("DELETE"); f3.step("type DELETE");
  await tid("cms-delete-collection-confirm").click(); f3.step("Delete collection");
  await page.waitForTimeout(4000);
  report.f3After = await page.evaluate(C(`return { bindings: c.cms.bindings.getBindings(${JSON.stringify(w2.setup.temp)}), text: c.elements.getElement(${JSON.stringify(w2.setup.temp)})?.getContent(), exists: !!c.cms.collections.getCollection(${JSON.stringify(tempId)}) };`));
  await shot("f3-deleted");
  await tid(`content-collection-${ids.team}`).click();
  await tid("cms-ws-more").click(); await tid("cms-ws-menu-settings").click();
  report.teamDeleteBlocked = { note: await tid("cms-settings-referenced").textContent().catch(() => null), disabled: await tid("cms-settings-delete").isDisabled() };
  await shot("team-delete-blocked");
} catch (err) { report.error = String(err && err.stack || err); await shot("walk5-error"); }
save();
await browser.close();
console.log(JSON.stringify(report, null, 1).slice(0, 6000));
