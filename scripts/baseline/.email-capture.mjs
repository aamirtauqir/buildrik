// Drive a generate_figma_design capture of a static localhost page (no auth):
// node .email-capture.mjs <url> <captureId> <delayMs>
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "..", "..", "packages", "dashboard", "package.json"));
const { chromium } = require("@playwright/test");

const [, , URL_, CID, DELAY = "3000"] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(Number(DELAY));
const r = await page.context().request.get("https://mcp.figma.com/mcp/html-to-design/capture.js");
await page.evaluate((s) => { const el = document.createElement("script"); el.textContent = s; document.head.appendChild(el); }, await r.text());
await page.waitForTimeout(600);
const result = await Promise.race([
  page.evaluate((cid) => window.figma.captureForDesign({ captureId: cid, endpoint: `https://mcp.figma.com/mcp/capture/${cid}/submit?bindVariables=true`, selector: "body" }), CID),
  new Promise((res) => setTimeout(() => res({ timedOutLocally: true }), 150000)),
]);
console.log(JSON.stringify(result));
await page.waitForTimeout(15000);
await browser.close();
