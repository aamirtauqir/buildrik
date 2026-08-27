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
import * as ChromeUi from "../index";
import * as FlowbiteReact from "flowbite-react";

describe("chrome-ui barrel — pure flowbite-react re-exports are identity-equal", () => {
  const pureReExports = [
    "Button",
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
