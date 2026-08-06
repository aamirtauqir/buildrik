/**
 * One-shot eye-verification screenshots for the Insert panel states
 * (boards 137:2 / 138:2 / 138:53 / 138:106 / 138:244).
 * Run: node e2e/insert-eye-verify.mjs   (dev server on 5050 must be up)
 * @license BSD-3-Clause
 */
import playwright from "playwright-core";
import { launchPinnedBrowser } from "./lib/measure-lib.mjs";

const OUT = process.env.SCRATCH_DIR ?? "/tmp";
const browser = await launchPinnedBrowser(playwright);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5050/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Open the Insert drawer via the rail if not already open.
if (!(await page.locator(".bld-container").count())) {
  await page.getByLabel("Insert elements and sections into your page").click();
  await page.waitForTimeout(600);
}

const panel = page.locator(".bld-container").first();
const shot = async (name) => {
  await panel.screenshot({ path: `${OUT}/insert-${name}.png` });
  console.log(`shot ${name}`);
};

await shot("default");

// BLOCKS card grid (138:2)
await page.locator('[data-testid="insert-group-blocks"]').click();
await page.waitForTimeout(400);
await shot("blocks-grid");
await page.locator('[data-testid="insert-group-blocks"]').click(); // collapse back

// Searching (138:53)
await page.locator("#bld-search-input").fill("button");
await page.waitForTimeout(500);
await shot("searching");

// No-results (138:106)
await page.locator("#bld-search-input").fill("pizza oven");
await page.waitForTimeout(500);
await shot("no-results");
await page.locator("#bld-search-input").fill("");
await page.waitForTimeout(500);

// Tip-dismissed (138:244)
await page.locator('[aria-label="Hide tips for this session"]').click();
await page.waitForTimeout(300);
await shot("tip-dismissed");

await browser.close();
console.log("done →", OUT);
