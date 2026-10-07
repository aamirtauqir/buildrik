import { open, login, openEditor, COMPOSER_JS, OUT, BASE } from "./helpers.mjs";
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(`${OUT}/walk1.json`, "utf8")).ids;
const w2 = JSON.parse(fs.readFileSync(`${OUT}/walk2.json`, "utf8"));
const report = {};
const flow = (name) => { report[name] = { steps: 0, notes: [] }; return { step: (w) => { report[name].steps += 1; report[name].notes.push(`${report[name].steps}. ${w}`); }, note: (w) => report[name].notes.push(`   ${w}`) }; };
const save = () => fs.writeFileSync(`${OUT}/walk3.json`, JSON.stringify(report, null, 2));
const C = (body) => `(() => { const c = ${COMPOSER_JS}; ${body} })()`;
const { browser, page, published } = await open();
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 600000 });
if (page.url().includes("/auth")) await login(page);
await openEditor(page);
await page.waitForFunction(C(`return c.cms.collections.getCollection(${JSON.stringify(ids.posts)}) !== null;`), null, { timeout: 600000, polling: 2000 });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const tid = (id) => page.getByTestId(id);
try {
  if (process.env.SKIP_EXPORT !== "1") {
    const x = flow("export");
    await page.getByRole("button", { name: /^Publish/ }).first().click(); x.step("Publish");
    for (let round = 0; round < 4 && published.length === 0; round++) {
      await page.waitForTimeout(5000);
      const dlg = page.locator('#bk-overlay-root [role="dialog"], #bk-overlay-root [role="alertdialog"]').last();
      if (!(await dlg.isVisible().catch(() => false))) continue;
      const btn = dlg.getByRole("button", { name: /Publish anyway|Publish now|Publish to production|^Publish$/ }).last();
      if (await btn.isVisible().catch(() => false)) { x.note(`dialog: ${await btn.textContent()}`); await btn.click(); x.step("dialog"); }
    }
    for (let i = 0; i < 60 && published.length === 0; i++) await page.waitForTimeout(2000);
    if (published[0]) fs.writeFileSync(`${OUT}/aborted-publish-payload.json`, published[0]);
    report.captured = published.length;
    await page.keyboard.press("Escape");
    save();
  }
} catch (err) { report.error = String(err && err.stack || err); await shot("walk3-error"); }
save();
await browser.close();
console.log(JSON.stringify(report, null, 1).slice(0, 4000));
