// usage: node shot.mjs <case[&query]> <out.png> [w] [h] [js-to-eval-returning-json]
import { chromium } from "@playwright/test";
const [, , c, out, w = "1440", h = "900", js] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.emulateMedia({ reducedMotion: "reduce" });
p.on("pageerror", (e) => console.error("pageerror", e.message));
await p.goto(`http://localhost:5178/e2e/probe/probe.html?case=${c}`, { timeout: 180000 });
await p.waitForTimeout(1500);
if (process.env.CLICK) { await p.click(process.env.CLICK); await p.waitForTimeout(500); }
await p.screenshot({ path: out });
if (js) console.log(JSON.stringify(await p.evaluate(js), null, 0));
await b.close();
