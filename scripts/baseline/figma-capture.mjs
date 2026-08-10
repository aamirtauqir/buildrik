// Drive a generate_figma_design capture of an authed localhost page:
// login via magic token → strip CSP → inject capture.js → submit.
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire("/Users/shahg/Desktop/pencil/buildrik/packages/dashboard/package.json");
const { chromium } = require("@playwright/test");
const [,, TOKEN, PATH, CAPTURE_ID, DELAYMS] = process.argv;
const BASE = "http://localhost:3100";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
if (TOKEN && TOKEN !== "none") {
  const lp = await c.newPage();
  await lp.goto(`${BASE}/auth/callback?token=${TOKEN}`, { waitUntil: "domcontentloaded" });
  await lp.waitForURL(u => !u.pathname.startsWith("/auth/"), { timeout: 30000 });
  await lp.close();
}
const page = await c.newPage();
await page.route("**/*", async (route) => {
  try {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    await route.fulfill({ response, headers });
  } catch { await route.continue().catch(() => {}); }
});
await page.goto(BASE + PATH, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(Number(DELAYMS || 6000));
const r = await page.context().request.get("https://mcp.figma.com/mcp/html-to-design/capture.js");
await page.evaluate((s) => { const el = document.createElement("script"); el.textContent = s; document.head.appendChild(el); }, await r.text());
await page.waitForTimeout(800);
const result = await page.evaluate(async (cid) =>
  await window.figma.captureForDesign({ captureId: cid, endpoint: `https://mcp.figma.com/mcp/capture/${cid}/submit?bindVariables=true`, selector: "body" }), CAPTURE_ID);
console.log(JSON.stringify(result));
await b.close();
