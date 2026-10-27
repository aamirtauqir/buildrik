// usage: node shot2.mjs <case> <out.png> <clicks comma-sep> <js>
import { chromium } from "@playwright/test";
const [, , c, out, clicks, js] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.emulateMedia({ reducedMotion: "reduce" });
await p.goto(`http://localhost:5178/e2e/probe/probe.html?case=${c}`, { timeout: 180000 });
await p.waitForTimeout(1200);
for (const s of clicks.split(",").filter(Boolean)) { await p.click(s); await p.waitForTimeout(400); }
await p.screenshot({ path: out });
if (js) console.log(JSON.stringify(await p.evaluate(js)));
await b.close();
