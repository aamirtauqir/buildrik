/**
 * Computed-style parity — the safety net for the inline-style drain.
 *
 * The drain rewrites `style={{...}}` and hoisted `style={S.foo}` into `tw:`
 * utility classes across ~190 files. vitest cannot see that: jsdom loads no
 * stylesheet, so `getComputedStyle` on `tw:text-blue-700` returns
 * rgb(0, 0, 0). 7738 tests would stay green while the editor rendered wrong.
 *
 * So parity is asserted here, in a real browser, against a committed baseline
 * of computed values. Convert a file, re-run, and any pixel or colour that
 * moved shows up as a diff. Refresh a baseline ONLY when the change is
 * intended, and say why in the commit.
 *
 * @license BSD-3-Clause
 */
import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// The tracked-property list and the font gate are shared with
// scripts/conformance/measure.mjs — same mechanics, different question. See
// e2e/lib/measure-lib.mjs for what is shared and what deliberately is not.
import { TRACKED, fontsLoadedStatus, stylesheetsSettled } from "./lib/measure-lib.mjs";

// ESM: no __dirname. The package is type:module, so derive it.
const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = join(HERE, "baselines");

const CASES = ["content-collection-rows", "content-field-rows", "content-root-rows", "onboarding-steps", "canvas-footer-toolbar", "toast-catalog", "panel-frame-header",
  // T6 — the Media drawer's data states, none of them reachable by hovering.
  "media-drawer-grid", "media-drawer-single", "media-drawer-loading", "media-drawer-load-error", "media-drawer-empty", "media-drawer-no-results",
  "content-loading", "content-load-error", "media-drawer-folder-scoped", "media-drawer-bulk-select", "media-drawer-uploading", "media-drawer-upload-failed", "media-drawer-quota-full"] as const;

for (const name of CASES) {
  test(`computed-style parity: ${name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    /* Explicit, not config: Playwright 1.61's runner silently drops the
       `use.reducedMotion` context option (verified — matchMedia stayed false
       under both config use and test.use, while this API works). Without it
       the skeleton pulse runs and every opacity is a mid-cycle lottery. The
       assertion below keeps this from regressing silently again. */
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/e2e/probe/probe.html?case=${name}`);

    expect(
      await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
      "reduced-motion emulation must be active before measuring"
    ).toBe(true);

    // A probe that rendered nothing must fail here, not silently compare {} to {}.
    const err = await page.locator("#probe-root").getAttribute("data-probe-error");
    expect(err, "probe reported an unknown case").toBeNull();
    await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", name);

    // Fonts must be resolved BEFORE anything is measured — width, height,
    // line-height and everything laid out from them are wrong if the read
    // happens while a fallback face is painted. Until 2026-08-03 this probe
    // loaded no webfont at all, which is why 106 baseline entries recorded
    // `font-family: "Times"`. The gate asserts rather than assumes; see
    // measure-lib.mjs for why the obvious one-liner degrades to a no-op.
    expect(
      await fontsLoadedStatus(page),
      "fonts must be fully loaded before measuring"
    ).toBe("loaded");

    // And the CASCADE must be complete too: nested CSS @imports (a11y.css and
    // the rest of default.css's chain) fetch async after the <style> tag
    // lands. Measuring early reads a page where reduced-motion never applied
    // — the skeleton pulse mid-cycle — or no chrome CSS at all.
    await stylesheetsSettled(page);

    const actual = await page.evaluate((props) => {
      const out: Record<string, Record<string, string>> = {};
      // Portalled surfaces (menus, modals) leave the [data-probe] subtree for
      // #bk-overlay-root, so a [data-probe]-only walk measures the empty
      // wrapper and passes against nothing. That already happened once here.
      const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-probe]"));
      const overlay = document.getElementById("bk-overlay-root");
      const nodes = new Set<HTMLElement>();
      for (const r of roots) {
        nodes.add(r);
        for (const d of Array.from(r.querySelectorAll<HTMLElement>("*"))) nodes.add(d);
      }
      if (overlay) for (const d of Array.from(overlay.querySelectorAll<HTMLElement>("*"))) nodes.add(d);
      for (const el of Array.from(nodes)) {
        // Key by probe name + position so keys stay stable across a rewrite
        // that changes tag names or class strings but not structure.
        const host = el.closest("[data-probe]") as HTMLElement | null;
        let key: string;
        if (host) {
          const label = host.getAttribute("data-probe")!;
          const idx = Array.from(host.querySelectorAll("*")).indexOf(el);
          key = el === host ? label : `${label}>${idx}`;
        } else {
          // Portalled: key by position under the overlay root.
          const idx = Array.from(overlay!.querySelectorAll("*")).indexOf(el);
          key = `overlay>${idx}`;
        }
        const cs = getComputedStyle(el);
        const rec: Record<string, string> = {};
        for (const p of props) rec[p] = cs.getPropertyValue(p);
        out[key] = rec;
      }
      return out;
    }, TRACKED as unknown as string[]);

    expect(Object.keys(actual).length, "probe rendered no measurable nodes").toBeGreaterThan(0);
    expect(errors, "page threw while rendering the probe").toEqual([]);

    const file = join(BASELINE_DIR, `${name}.json`);
    if (!existsSync(file) || process.env.UPDATE_PARITY === "true") {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(actual, null, 2) + "\n");
      test.info().annotations.push({ type: "baseline", description: `wrote ${file}` });
      return;
    }
    expect(actual).toEqual(JSON.parse(readFileSync(file, "utf8")));
  });
}
