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

/** Properties that actually carry the look. Layout + colour + type + edges. */
const TRACKED = [
  "display", "flex-direction", "align-items", "justify-content", "gap",
  "width", "height", "min-height", "max-width",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "color", "background-color",
  "border-top-width", "border-top-style", "border-top-color",
  "border-bottom-width", "border-bottom-color",
  "border-radius",
  "font-family", "font-size", "font-weight", "line-height",
  "opacity", "box-shadow", "overflow", "text-overflow", "white-space",
] as const;

// ESM: no __dirname. The package is type:module, so derive it.
const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = join(HERE, "baselines");

const CASES = ["content-style-map", "content-root-rows", "folder-context-menu"] as const;

for (const name of CASES) {
  test(`computed-style parity: ${name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`/e2e/probe/probe.html?case=${name}`);

    // A probe that rendered nothing must fail here, not silently compare {} to {}.
    const err = await page.locator("#probe-root").getAttribute("data-probe-error");
    expect(err, "probe reported an unknown case").toBeNull();
    await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", name);

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
