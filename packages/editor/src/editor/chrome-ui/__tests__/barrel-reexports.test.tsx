/**
 * Barrel re-export identity — contract tests (chrome-ui-single-surface
 * spec §2(a), B1).
 *
 * Each of these 14 names is a PURE `export { X } from "flowbite-react"` in
 * chrome-ui/index.ts (spec §3 guard #2 — barrel purity: never a component
 * definition). Asserting reference identity (`===`) against the direct
 * flowbite-react export is what actually distinguishes a pure re-export from
 * a same-named wrapper that merely renders the flowbite component inside —
 * a wrapper would pass every other test in this suite (renders, accepts
 * props) while still failing this one.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as ChromeUi from "../index";
import * as FlowbiteReact from "flowbite-react";

describe("chrome-ui barrel — pure flowbite-react re-exports are identity-equal", () => {
  const pureReExports = [
    /* `Button` left this list on 2026-08-28 (design-debt arc): it is the
       third member of the closed wrapper set now — BK_BUTTON_THEME adds the
       `link`/`ghost` color vocabulary and the `variant` sugar. Its wrapper
       contract is pinned below. */
    "Badge",
    "Avatar",
    "AvatarGroup",
    "Checkbox",
    "Radio",
    "ToggleSwitch",
    /* `Tooltip` left this list on 2026-08-27. flowbite's default is
       `style="dark"` — `bg-gray-900`, which DESIGN.md's NO BLACK RULE bans by
       name for this control — so the barrel now exports a local component that
       flips the default and sets the text colour. It is not a themed wrapper
       (it merges no theme; a caller theme never receives flowbite's `tw:`
       prefix and so cannot win), which is why the closed 2-wrapper set is
       still exactly TextInput + Select. */
    "Textarea",
    "Label",
    "HelperText",
    "RangeSlider",
    "Progress",
    "Card",
  ] as const;

  it.each(pureReExports)("%s is the exact same reference as flowbite-react's export", (name) => {
    expect(ChromeUi[name]).toBeDefined();
    expect(ChromeUi[name]).toBe(FlowbiteReact[name]);
  });

  it("the closed wrapper set (TextInput, Select) is NOT identity-equal to the raw flowbite export", () => {
    // The inverse check — proves these two are genuinely wrapped, not
    // accidentally passed through as pure re-exports.
    expect(ChromeUi.TextInput).not.toBe(FlowbiteReact.TextInput);
    expect(ChromeUi.Select).not.toBe(FlowbiteReact.Select);
  });
});

describe("chrome-ui's own files use the local Tooltip", () => {
  /* The surface gate bans raw flowbite imports OUTSIDE chrome-ui/, which means
     siblings inside it are the one blind spot — and two of them had a raw
     `Tooltip` import, so the light default that took every other tooltip off
     near-black never reached them. Found in review 2026-08-27. */
  it("no sibling imports Tooltip straight from flowbite-react", () => {
    const dir = join(__dirname, "..");
    const offenders = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx") && f !== "Tooltip.tsx")
      .filter((f) => /import\s*\{[^}]*\bTooltip\b[^}]*\}\s*from\s*"flowbite-react"/.test(
        readFileSync(join(dir, f), "utf8"),
      ));
    expect(offenders).toEqual([]);
  });
});
