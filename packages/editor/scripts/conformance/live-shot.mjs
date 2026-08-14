/**
 * live-shot — drive the running editor and capture what it actually renders.
 *
 * Replaces the browse daemon for this arc's board-vs-live checks: it wedged
 * after long sessions, and every recovery attempt cost more than the check.
 * This is the same browser the e2e harness uses, launched per run, so there is
 * no daemon to wedge.
 *
 * Two lessons are baked in, both learned the hard way:
 *   - navigate to 127.0.0.1, never `localhost`: Vite listens on IPv4 and
 *     Chromium resolves `localhost` to ::1, so `goto` times out against a
 *     server `curl` reaches in 7ms.
 *   - launch with the proxy bypassed: Chromium routes even loopback through
 *     the macOS system proxy, which is what made the browse daemon appear to
 *     wedge at random for a whole session.
 *   - wait for the canvas ATTACHED, not visible: it mounts before its wrapper
 *     has measured itself, so a visibility wait times out on a healthy boot.
 *
 * Usage:
 *   node scripts/conformance/live-shot.mjs --out shot.png [--clip x,y,w,h]
 *        [--eval "<js run before the shot>"] [--wait 6000] [--full]
 *
 * `--eval` is an EXPRESSION evaluated in the page (Playwright's string form),
 * so write `(() => { ...; return x })()`, not a bare `return`. Its value is
 * printed as JSON, so one run can both act and report.
 *
 * @license BSD-3-Clause
 */
import { chromium } from "@playwright/test";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1] ?? true;
};
const has = (name) => argv.includes(`--${name}`);

const url = arg("url", "http://127.0.0.1:5050/");
const out = arg("out");
const clip = arg("clip");
const evalSrc = arg("eval");
const settle = Number(arg("wait", 6000));

/* Chromium honours the macOS system proxy even for loopback, so `goto`
   times out against a dev server `curl` reaches in milliseconds — the same
   failure that made the browse daemon look "wedged" for hours. Bypass it. */
const browser = await chromium.launch({
  args: ["--no-proxy-server", "--proxy-bypass-list=<-loopback>"],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".buildrick-canvas", { state: "attached", timeout: 30_000 });
await page.waitForTimeout(settle);

let evalResult;
if (evalSrc) {
  /* Playwright evaluates a string expression directly — no `new Function`
     built by concatenation. The source is this script's own argv on a
     developer machine, never network input, and it still goes through the
     page's normal evaluation path. */
  evalResult = await page.evaluate(String(evalSrc));
  await page.waitForTimeout(1200);
}

if (out) {
  const opts = { path: out };
  if (clip) {
    const [x, y, width, height] = String(clip).split(",").map(Number);
    opts.clip = { x, y, width, height };
  } else if (has("full")) {
    opts.fullPage = true;
  }
  await page.screenshot(opts);
}

console.log(JSON.stringify({ out, evalResult, pageErrors }, null, 2));
await browser.close();
