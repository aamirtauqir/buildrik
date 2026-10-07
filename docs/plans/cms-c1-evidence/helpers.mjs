import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const { chromium } = require("/Users/shahg/Desktop/buildrik-worktrees/earlier-arcs/buildrik-code-gap-A/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.js");
/** The live composer, found through React's fiber props. */
export const COMPOSER_JS = `(() => {
  if (window.__c1c && window.__c1c.elements.getAllPages().length) return window.__c1c;
  for (const el of document.querySelectorAll("*")) {
    const k = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
    if (!k) continue;
    for (let f = el[k]; f; f = f.return) {
      const c = f.memoizedProps && f.memoizedProps.composer;
      if (c && c.cms && c.elements) return (window.__c1c = c);
    }
  }
  return null;
})()`;
export const BASE = "http://localhost:3370";
export const SITE = "cmugopwzg005nnvjysp00b3pf";
export const OUT = "/private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/efcd568a-31ce-48ec-862b-20a9e7baaa9e/scratchpad/live/out";

export const STATE = "/private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/efcd568a-31ce-48ec-862b-20a9e7baaa9e/scratchpad/live/state.json";
export async function open() {
  const fs = await import("node:fs");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(fs.existsSync(STATE) ? { storageState: STATE } : {}) });
  context.setDefaultTimeout(120000);
  const published = [];
  /* Never publish: capture the body, abort the request. */
  await context.route((u) => /\/api\/trpc\/([^?]*,)?sites\.(publish|rollback)(,|\?|$)/.test(u.toString()), async (route) => {
    const r = route.request(); published.push(r.postDataBuffer()?.toString("utf8") ?? r.url());
    await route.abort();
  });
  const page = await context.newPage();
  page.on("dialog", (d) => d.accept());
  return { browser, context, page, published };
}

export async function login(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded", timeout: 300000 });
  await page.waitForTimeout(4000);
  await page.getByPlaceholder(/email/i).fill("qa@buildrik.local");
  await page.getByPlaceholder(/password/i).fill("qa-test-1234");
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 300000 });
  await page.context().storageState({ path: STATE });
}

export async function openEditor(page) {
  await page.goto(`${BASE}/edit/${SITE}`, { waitUntil: "domcontentloaded", timeout: 600000 });
  await page.waitForFunction(`(() => { const c = ${COMPOSER_JS}; return !!c && c.elements.getAllPages().length > 0; })()`, null, { timeout: 900000, polling: 2000 });
  await page.waitForTimeout(5000);
}


