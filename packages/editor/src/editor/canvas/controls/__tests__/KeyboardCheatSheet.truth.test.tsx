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

/* SC-12 / BD-39 (2): the remapped chords print as bound — CanvasFooterToolbar
   (⇧R, ⌥B, ⌥X, ⇧0/⇧1/⇧2), H for History (useSidebarKeyboard) — and the
   browser's chords are no longer claimed. BD-39 (1): Enter edits text. */
describe("keyboard sheet — SC-12 remaps (BD-39)", () => {
  const byId = (id: string) => rows().find((r) => r.id === id)?.keys;

  it("prints the new canvas chords", () => {
    expect(byId("view-rulers")).toBe("shift+r");
    expect(byId("view-badges")).toBe("alt+b");
    expect(byId("view-xray")).toBe("alt+x");
    expect(byId("view-zoom-fit")).toBe("shift+1");
    expect(byId("view-zoom-selection")).toBe("shift+2");
  });

  it("prints none of the browser's chords", () => {
    for (const k of ["ctrl+h", "ctrl+r", "ctrl+b", "ctrl+shift+x", "ctrl+1", "ctrl+2"]) {
      expect(keysOf().flatMap((keys) => keys.split(" / "))).not.toContain(k);
    }
  });

  it("History is H, once", () => {
    const history = rows().filter((r) => /history/i.test(r.description));
    expect(history.map((r) => r.keys)).toEqual(["H"]);
  });

  it("Enter edits the selected text", () => {
    expect(rows().find((r) => r.keys === "Enter")?.description).toBe("Edit selected text");
  });
});
