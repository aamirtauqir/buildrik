/**
 * The Publish footer's links are distinguishable without colour.
 *
 * axe on the live panel: "The link has insufficient color contrast of 1.27:1
 * with the surrounding text (minimum 3:1)" for both Privacy policy and Terms
 * of service — they were `tw:no-underline` blue inside gray-500 prose, so
 * colour was the only cue and it wasn't even a strong one (WCAG 1.4.1).
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "../PublishTab.tsx"), "utf8");
const footer = src.slice(src.indexOf("Privacy & Terms footer"), src.indexOf("<PublishWizard"));

describe("publish footer links", () => {
  it("underlines both links", () => {
    expect(footer.match(/tw:underline/g) ?? []).toHaveLength(2);
    expect(footer).not.toMatch(/tw:no-underline/);
  });

  /* The gray ladder became the ink tokens 2026-08-29 (value-identical:
     ink-soft IS gray-600, ink-muted IS gray-500). The contract is unchanged —
     the prose sits one step darker than muted, which is what clears AA. */
  it("darkens the surrounding prose to clear AA", () => {
    expect(footer).toMatch(/tw:text-\[var\(--bk-ink-soft\)\]/);
    expect(footer).not.toMatch(/tw:text-\[var\(--bk-ink-muted\)\]/);
    expect(footer).not.toMatch(/tw:text-gray-500/);
  });
});
