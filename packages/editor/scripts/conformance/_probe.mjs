import * as pw from "playwright-core";
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:5050/", { waitUntil: "networkidle" });
await p.waitForSelector('[data-testid="topbar"]', { timeout: 20000 });
const r = await p.evaluate(() => {
  const de = document.documentElement, bd = document.body;
  const studio = document.querySelector(".bd-studio");
  const over = [...document.querySelectorAll("body *")]
    .filter((e) => e.getBoundingClientRect().bottom > 900.5)
    .slice(0, 6)
    .map((e) => {
      const r = e.getBoundingClientRect();
      const chain = [];
      for (let n = e; n && n !== document.body; n = n.parentElement)
        chain.push(n.dataset?.testid ? `[${n.dataset.testid}]` : n.tagName);
      return `${e.tagName} testid=${e.dataset?.testid || "-"} h=${Math.round(r.height)} bottom=${Math.round(r.bottom)} :: ${chain.slice(0, 6).join(" < ")} :: ${(e.className||"").toString().slice(0,70)}`;
    });
  return { docScroll: de.scrollHeight, docClient: de.clientHeight,
           bodyScroll: bd.scrollHeight, bodyH: Math.round(bd.getBoundingClientRect().height),
           studioH: studio ? Math.round(studio.getBoundingClientRect().height) : null,
           bodyMargin: getComputedStyle(bd).margin, over };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
