/**
 * Regression: the default element palette must carry the CURRENT accent.
 *
 * `THEME.primary` in defaultStyles.ts is what a newly-created button, link,
 * blockquote rule or form control is given, and what the Inspector shows as its
 * fallback swatch. It kept the retired cobalt `#2D6DFF` through the 2026-07-21
 * migration to `#406ED6`, so every element a user created was still being
 * painted the old brand blue. Found by the design-book gap investigation.
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_ELEMENT_STYLES, getDefaultStyles } from "../defaultStyles";

const RETIRED_ACCENTS = /#2d6dff|#406ed6/i;
const ACCENT = "#1A56DB";

describe("default element styles carry the current accent", () => {
  it("paints a new button and link with the accent, not a retired blue", () => {
    expect(DEFAULT_ELEMENT_STYLES.button?.["background-color"]).toBe(ACCENT);
    expect(DEFAULT_ELEMENT_STYLES.link?.color).toBe(ACCENT);
  });

  it("has no retired accent anywhere in the default palette", () => {
    const offenders: string[] = [];
    for (const [type, styles] of Object.entries(DEFAULT_ELEMENT_STYLES)) {
      for (const [prop, value] of Object.entries(styles)) {
        if (RETIRED_ACCENTS.test(value)) offenders.push(`${type}.${prop} = ${value}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("serves the same accent through the public getter", () => {
    expect(getDefaultStyles("button")["background-color"]).toBe(ACCENT);
  });
});
