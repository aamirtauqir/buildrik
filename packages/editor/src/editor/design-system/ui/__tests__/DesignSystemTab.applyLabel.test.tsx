/**
 * The first-load hint must name the button that exists.
 *
 * It told people to click "Review & Apply" — the name the footer's action had
 * before it was renamed. It is "Save" since 2026-08-27, from board 154:78.
 * Walked live: the Brand panel's
 * Tokens screen printed the instruction in bold, and no such control was on
 * screen. Both now read one constant, so the next rename moves them together.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { APPLY_CHANGES_LABEL } from "../DesignTabFooter";

const here = dirname(fileURLToPath(import.meta.url));

describe("Brand — the apply action is named once", () => {
  it("the tokens hint points at the footer's real label", () => {
    const tab = readFileSync(join(here, "..", "DesignSystemTab.tsx"), "utf8");
    const hint = tab.match(/default design tokens[\s\S]{0,220}?to go live/);
    expect(hint, "the first-load tokens hint").not.toBeNull();
    /* It must interpolate the constant, not spell a name of its own. */
    expect(hint![0]).toContain("{APPLY_CHANGES_LABEL}");
    expect(hint![0]).not.toMatch(/Review\s*&(amp;)?\s*Apply/);
  });

  it("the footer renders that same constant", () => {
    const footer = readFileSync(join(here, "..", "DesignTabFooter.tsx"), "utf8");
    expect(footer).toContain("{APPLY_CHANGES_LABEL}");
    /* Board 154:78 names this button "Save". Copy on screen is the board's
       call (CLAUDE.md precedence), and the census row for that board was
       literally `open:footer-copy`. */
    expect(APPLY_CHANGES_LABEL).toBe("Save");
  });
});
