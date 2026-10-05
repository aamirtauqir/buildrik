import { open, login, openEditor, COMPOSER_JS, OUT, BASE, SITE } from "./helpers.mjs";
import fs from "node:fs";
fs.mkdirSync(OUT, { recursive: true });
const report = {};
const flow = (name) => {
  report[name] = { steps: 0, notes: [] };
  return {
    step: (what) => { report[name].steps += 1; report[name].notes.push(`${report[name].steps}. ${what}`); },
    note: (what) => report[name].notes.push(`   ${what}`),
  };
};
const save = () => fs.writeFileSync(`${OUT}/walk1.json`, JSON.stringify(report, null, 2));
const C = (body) => `(() => { const c = ${COMPOSER_JS}; ${body} })()`;

const { browser, page } = await open();
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 600000 });
if (page.url().includes("/auth")) await login(page);
await openEditor(page);
await page.waitForFunction(C(`return c.cms.collections.getAllCollections().length > 0;`), null, { timeout: 600000, polling: 2000 });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const tid = (id) => page.getByTestId(id);

async function createCollection(fl, name, rows, pages) {
  if (!(await tid("content-new-collection").isVisible().catch(() => false))) {
    await page.getByLabel(/Collections, records and data sources/).first().click();
    fl.step("rail CMS");
  }
  await tid("content-new-collection").click(); fl.step("+ New collection");
  await tid("cms-setup-name").fill(name); fl.step(`name “${name}”`);
  for (const [i, r] of rows.entries()) {
    if (i > 0) { await tid("cms-add-field").click(); fl.step("+ Add field (row)"); }
    const input = page.getByPlaceholder("field_name").nth(i);
    if ((await input.inputValue()) !== r.name) { await input.fill(r.name); fl.step(`row ${i + 1} name ${r.name}`); }
    if (r.type !== "text") { await page.getByLabel(`Field ${i + 1} type`).selectOption(r.type); fl.step(`row ${i + 1} type ${r.type}`); }
  }
  if (pages) { await page.getByLabel(/generate a page per entry/i).click(); fl.step("Generate a page per entry"); }
  await tid("cms-setup-create").click(); fl.step("Create Collection");
  await tid("cms-ws-title").filter({ hasText: name }).waitFor();
  return page.evaluate(C(`const col = c.cms.collections.getAllCollections().find((x) => x.name === ${JSON.stringify(name)}); return col && { id: col.id, displayField: col.displayField, pattern: col.pageSlugPattern, fields: col.fields.map((f) => f.slug + ":" + f.type) };`));
}

async function addField(fl, type, name, extra = async () => {}) {
  if ((await tid("cms-ws-add-field").count()) === 0) { await page.getByRole("tab", { name: "Fields" }).click(); fl.step("Fields tab"); }
  await tid("cms-ws-add-field").click(); fl.step("+ Add field");
  await tid(`cms-add-field-type-${type}`).click(); fl.step(`type ${type}`);
  await tid("cms-add-field-name").fill(name); fl.step(`name ${name}`);
  await extra();
  await tid("cms-add-field-save").click(); fl.step("Save field");
  await tid("cms-add-field").waitFor({ state: "detached" });
}

try {
  // (a) create a collection — Team first (the Reference target), then Posts
  const a = flow("a_create_collection_team");
  const team = await createCollection(a, "ZZ C1 Team", [{ name: "Name", type: "text" }, { name: "Role", type: "text" }], false);
  a.note(`created ${JSON.stringify(team)}`);
  await shot("a1-team-created");
  const a2 = flow("a_create_collection_posts");
  const posts = await createCollection(a2, "ZZ C1 Posts", [{ name: "Title", type: "text" }, { name: "Body", type: "richtext" }], true);
  a2.note(`created ${JSON.stringify(posts)}`);
  await shot("a2-posts-created");
  report.ids = { team: team.id, posts: posts.id };
  save();

  // (b) add fields — the new types
  const b = flow("b_add_field_reference");
  await addField(b, "reference", "Author", async () => { await tid("cms-add-field-collection").selectOption(team.id); b.step("target collection"); });
  const b2 = flow("b_add_field_multiselect");
  await addField(b2, "multiselect", "Tags", async () => { await tid("cms-add-field-options").fill("Vegan\nSpicy\nNew"); b2.step("options"); });
  const b3 = flow("b_add_field_number");
  await addField(b3, "number", "Price");
  await shot("b-fields");
  report.postsFields = await page.evaluate(C(`return c.cms.collections.getCollection(${JSON.stringify(posts.id)}).fields.map((f) => ({ slug: f.slug, type: f.type, ref: f.referenceCollection, options: f.options }));`));
  save();

  // (c) add records: a Team member, then a Post using every new type
  const c1 = flow("c_add_record_team");
  await page.getByTestId(`content-collection-${team.id}`).click(); c1.step("open Team");
  await tid("cms-ws-add-record").click(); c1.step("+ Add record");
  await page.locator("#cms-field-name").fill("Ada"); c1.step("Name");
  await page.locator("#cms-field-role").fill("Chef"); c1.step("Role");
  await tid("cms-sheet-published").click(); c1.step("Published");
  await tid("cms-sheet-save").click(); c1.step("Save record");
  await tid("cms-sheet").waitFor({ state: "detached" });
  const c2 = flow("c_add_record_post");
  await page.getByTestId(`content-collection-${posts.id}`).click(); c2.step("open Posts");
  await tid("cms-ws-add-record").click(); c2.step("+ Add record");
  await page.locator("#cms-field-title").fill("Hello World"); c2.step("Title (slug follows)");
  const box = page.locator("#cms-field-body");
  await box.click(); await page.keyboard.type("Plain then ");
  await page.getByRole("button", { name: "Bold" }).click(); await page.keyboard.type("bold");
  c2.step("Body (rich text, bold)");
  await page.locator("#cms-field-author").selectOption({ label: "Ada" }); c2.step("Author (reference)");
  await page.getByRole("button", { name: "Vegan" }).click(); await page.getByRole("button", { name: "Spicy" }).click(); c2.step("Tags (2 chips)");
  report.priceBefore = await page.locator("#cms-field-price").inputValue();
  await tid("cms-sheet-published").click(); c2.step("Published");
  await shot("c2-post-sheet");
  await tid("cms-sheet-save").click(); c2.step("Save record");
  await tid("cms-sheet").waitFor({ state: "detached" });
  await shot("c2-post-saved");
  report.postsLocal = await page.evaluate(C(`return c.cms.collections.getContentItems(${JSON.stringify(posts.id)}).then((xs) => xs.map((x) => ({ id: x.id, status: x.status, data: x.data })));`));
  save();
} catch (e) {
  report.error = String(e && e.stack || e);
  await shot("walk1-error");
}
save();
await browser.close();
console.log(JSON.stringify(report, null, 1).slice(0, 6000));
