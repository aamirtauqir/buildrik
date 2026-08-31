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
 * 320 is a FLOOR, not a preference. Media's asset grid is
 * 16 + 136 + 16 + 136 + 16 = exactly 320 and cannot fit in 280 (Figma board
 * 20:6, "GATE A — does 320 hold?"). A 2026-08-31 measurement pass confirmed it
 * independently: at 300 the Media footer's "Browse stock" wraps to two lines,
 * and at 280 the 136px asset cells overflow their columns. Narrow this and you
 * break Media and Brand before anything else.
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

  it("the token still carries the width the panels were measured against", () => {
    const tokens = JSON.parse(read("scripts/tokens/figma-tokens.json")) as {
      size: Record<string, number>;
    };
    // Not a style preference — see the 320 floor in this file's header.
    expect(tokens.size.drawer).toBe(320);
    expect(tokens.size.inspector).toBe(300);
    expect(tokens.size.rail).toBe(60);
  });
});
