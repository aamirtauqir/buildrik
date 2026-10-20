/**
 * REA 2026-10-20 #20: a printed chord is a contract (Panel 18 KS-05). The
 * sheet listed S (Site settings — removed by owner Q4, SC-12) and ⌃, , and it
 * listed R (Review) and C (comment mode) while reviews were off, when neither
 * key is bound (useSidebarKeyboard's disabledTabs, useEditorShortcuts'
 * reviewsEnabled).
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { buildSheetGroups } from "../keyboardSheetRows";

const rows = (opts?: { reviewsEnabled?: boolean }) => buildSheetGroups([], opts).flatMap((g) => g.rows);
const keysOf = (opts?: { reviewsEnabled?: boolean }) => rows(opts).map((r) => r.keys);

describe("keyboard sheet — only keys that are bound", () => {
  it("prints no Site settings chord: neither S nor ⌃,", () => {
    expect(keysOf()).not.toContain("S");
    expect(keysOf()).not.toContain("ctrl+,");
    expect(rows().some((r) => /settings/i.test(r.description))).toBe(false);
  });

  it("prints R and C while reviews are on", () => {
    expect(keysOf({ reviewsEnabled: true })).toEqual(expect.arrayContaining(["R", "C"]));
  });

  it("drops R and C while reviews are off — nothing binds them then", () => {
    expect(keysOf({ reviewsEnabled: false })).not.toContain("R");
    expect(keysOf({ reviewsEnabled: false })).not.toContain("C");
  });
});
