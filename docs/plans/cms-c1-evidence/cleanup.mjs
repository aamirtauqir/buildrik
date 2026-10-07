import { open, login, openEditor, COMPOSER_JS, OUT, BASE } from "./helpers.mjs";
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(`${OUT}/walk1.json`, "utf8")).ids;
const report = {};
const C = (body) => `(() => { const c = ${COMPOSER_JS}; ${body} })()`;
const { browser, page } = await open();
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 600000 });
if (page.url().includes("/auth")) await login(page);
await openEditor(page);
await page.waitForFunction(C(`return c.cms.collections.getCollection(${JSON.stringify(ids.posts)}) !== null;`), null, { timeout: 600000, polling: 2000 });
const tid = (id) => page.getByTestId(id);
async function deleteViaUi(colId) {
  if (!(await tid(`content-collection-${colId}`).isVisible().catch(() => false))) await page.getByLabel(/Collections, records and data sources/).first().click();
  await tid(`content-collection-${colId}`).click();
  await tid("cms-ws-more").click(); await tid("cms-ws-menu-settings").click();
  const consequence = await tid("cms-settings-danger").textContent();
  await tid("cms-settings-delete").click();
  await tid("cms-delete-collection-input").fill("DELETE");
  await tid("cms-delete-collection-confirm").click();
  await page.waitForTimeout(4000);
  return consequence;
}
try {
  report.boundBefore = await page.evaluate(C(`const ex = c.cms.bindings.export(); return Object.entries(ex).filter(([, l]) => l.some((b) => b.collectionId === ${JSON.stringify(ids.posts)})).map(([id]) => id).concat(c.cms.bindings.getAllCollectionBindings().filter((b) => b.collectionId === ${JSON.stringify(ids.posts)}).map((b) => b.elementId));`));
  report.postsConsequence = await deleteViaUi(ids.posts);
  report.teamConsequence = await deleteViaUi(ids.team);
  report.boundAfter = await page.evaluate(C(`const ex = c.cms.bindings.export(); return Object.entries(ex).filter(([, l]) => l.some((b) => b.collectionId === ${JSON.stringify(ids.posts)})).map(([id]) => id);`));
  // stale binding left on the Temp element from walk5's pre-fix run: the Inspector's Unbind
  await page.evaluate(C(`const pg = c.elements.getAllPages().find((p) => p.name === "ZZ C1 Page"); if (pg) c.elements.deletePage(pg.id); for (const id of Object.keys(c.cms.bindings.export())) if (!c.elements.getElement(id)) c.cms.bindings.unbindAll(id);`));
  await page.keyboard.press("Meta+s");
  await page.waitForTimeout(20000);
  report.left = await page.evaluate(C(`return { cols: c.cms.collections.getAllCollections().filter((x) => x.name.startsWith("ZZ C1")).map((x) => x.name), pages: c.elements.getAllPages().map((p) => p.name) };`));
} catch (err) { report.error = String(err && err.stack || err); await page.screenshot({ path: `${OUT}/cleanup-error.png` }); }
fs.writeFileSync(`${OUT}/cleanup.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report, null, 1));
