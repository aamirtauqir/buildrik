import { chromium } from "playwright-core";
const b = await chromium.launch();
for (const c of process.argv.slice(2)) {
  const p = await b.newPage({ viewport: { width: 320, height: 812 } });
  await p.goto(`http://localhost:5051/e2e/probe/probe.html?case=${c}`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(`#probe-root[data-probe-ready="${c}"]`, { timeout: 20000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${process.env.OUT}/${c}.png` });
  console.log("shot", c); await p.close();
}
await b.close();
