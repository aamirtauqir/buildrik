import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GROUPED_TABS_CONFIG } from "../tabsConfig";

/**
 * Drawer-width lock.
 *
 * REWRITTEN 2026-08-31, second time. The rule it guards has not changed — ONE
 * width for every panel — but WHERE that width lives has.
 *
 * It used to live in `SIDEBAR_WIDE`, a JS constant, applied as an inline
 * `style={{width}}` on the panel element. That inline style beat
 * `--bk-size-drawer`, so the repo carried two independent 320s and the
 * generated token — the one `gate:tokens-generated` protects — was the copy
 * nobody rendered. Editing `figma-tokens.json` and regenerating changed
 * nothing on screen. Measured live 2026-08-31: token 320, shipped panel 320,
 * agreeing by coincidence rather than by wiring.
 *
 * Now `.ls-panel` takes `width: var(--drawer-w, var(--bk-size-drawer))`, so
 * the token is load-bearing and flow-specific widths (Media 560, Templates
 * 700, header-expand 700) set `--drawer-w` instead. `panelWidth` and
 * `getTabWidth` are gone — a field no tab set and a helper that only ever
 * returned a constant.
 *
 * 320 was NOT a floor, and this comment used to say it was. The argument ran:
 * Media's asset grid is 16 + 136 + 16 + 136 + 16 = exactly 320, therefore the
 * drawer cannot narrow. It was circular. Those cells were fixed `w-34`, so the
 * grid needed 320 because the cells were pinned — and that number was then
 * cited as the reason the drawer could not narrow. The founder had asked twice
 * for narrower drawers and been told no on this basis.
 *
 * 2026-09-01: the cells were made fluid (`w-full` in fractional tracks) and the
 * token moved to 280. Measured live: Media grid 279 wide, `overflowX` false,
 * cells reflowed 136 -> 116, Brand with zero overflowing elements. The token
 * ships 280 today, so a comment claiming 320 is a hard minimum would describe
 * a product that does not exist.
 *
 * The tests below assert AGREEMENT BETWEEN SOURCES, never a literal width —
 * which is why they stayed green while this prose was false. Read the token if
 * you want the number.
 */

const EDITOR_ROOT = join(__dirname, "..", "..", "..", "..");
const read = (p: string) => readFileSync(join(EDITOR_ROOT, p), "utf8");

describe("drawer width — one source of truth", () => {
  it("the panel takes its width from the generated token, not from JS", () => {
    // Comments are stripped BEFORE the rule is sliced: `[^}]*` otherwise stops
    // at the first `}` inside a comment, and the note above this very rule
    // contains `style={{width}}`. Same fix the SSOT scanner took in 2026-05-09.
    const css = read("src/editor/sidebar/LeftSidebar.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const rule = css.match(/\.ls-panel\s*\{[^}]*\}/s)?.[0] ?? "";
    expect(rule, ".ls-panel rule not found in LeftSidebar.css").not.toBe("");
    expect(
      rule,
      "`.ls-panel` must size itself from `--bk-size-drawer` (with `--drawer-w` " +
        "as the per-flow override). If this moved back to an inline width, the " +
        "generated token is decorative again.",
    ).toMatch(/width:\s*var\(--drawer-w,\s*var\(--bk-size-drawer\)\)/);
  });

  it("no JS module re-declares a drawer/rail/inspector width", () => {
    const layout = read("src/shared/constants/layout.ts");
    for (const gone of ["SIDEBAR_WIDE", "RAIL_W", "INSPECTOR_W"]) {
      expect(
        new RegExp(`export const ${gone}\\b`).test(layout),
        `${gone} is back in shared/constants/layout.ts. Chrome widths live in ` +
          `the generated tokens — read them with var(--bk-size-*).`,
      ).toBe(false);
    }
  });

  it("no tab declares its own panel width", () => {
    // The field is gone from the type, so this is a guard against it returning:
    // a silently re-added per-tab width is how the superseded two-width rule
    // outlived its own removal for months.
    for (const tab of GROUPED_TABS_CONFIG) {
      expect(
        (tab as unknown as Record<string, unknown>).panelWidth,
        `tab "${tab.id}" declares a panelWidth. Per-flow widths belong on ` +
          `--drawer-w at the call site, not in tabsConfig.`,
      ).toBeUndefined();
    }
  });

  it("the generated CSS carries whatever the token source says", () => {
    /* Asserts AGREEMENT, not a value. An earlier version of this test pinned
       `size.drawer === 320`, which would have failed the moment anyone did the
       thing this whole change exists to enable — edit figma-tokens.json and
       regenerate. That is two places to change, which is the problem, not the
       fix. The 320 floor is a MEASUREMENT (see this file's header), and it
       belongs in the header and in the panels' own tests, not as a lock here. */
    const tokens = JSON.parse(read("scripts/tokens/figma-tokens.json")) as {
      size: Record<string, number>;
    };
    const css = read("src/themes/tokens.generated.css");
    for (const name of ["drawer", "inspector", "rail"]) {
      expect(tokens.size[name], `size/${name} missing from figma-tokens.json`).toBeTypeOf("number");
      expect(
        css,
        `--bk-size-${name} in the generated CSS disagrees with figma-tokens.json ` +
          `(source says ${tokens.size[name]}px). Re-run scripts/tokens/generate.mjs.`,
      ).toContain(`--bk-size-${name}: ${tokens.size[name]}px;`);
    }
  });
});
