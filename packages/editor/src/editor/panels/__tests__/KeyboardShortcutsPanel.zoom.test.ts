/**
 * The zoom rows have to name the chords the canvas actually binds.
 *
 * The panel printed "Ctrl+0 — Fit to view". CanvasFooterToolbar binds ⌘1 to
 * fit, ⌘2 to zoom-to-selection and ⌘0 to 100%, and that is what the running
 * editor does: measured at 1440x900, ⌘0 left the zoom at 100% while ⌘1 took
 * it to 98% on a page wider than the frame. A chord printed under the wrong
 * key is the failure this panel exists to prevent.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const panel = readFileSync(join(__dirname, "..", "KeyboardShortcutsPanel.tsx"), "utf8");
const toolbar = readFileSync(
  join(__dirname, "..", "..", "canvas", "CanvasFooterToolbar.tsx"),
  "utf8"
);
/* Literal search — building the regex from the key string needed two rounds
   of escaping for the "+" and silently matched nothing. */
const descFor = (key: string) => {
  const at = panel.indexOf(`{ key: "${key}", desc: "`);
  return at < 0 ? null : panel.slice(at).match(/desc: "([^"]+)"/)?.[1] ?? null;
};

describe("keyboard shortcuts panel — zoom rows", () => {
  it("gives Ctrl+0 its real job", () => {
    expect(descFor("Ctrl+0")).toBe("Zoom to 100%");
    expect(toolbar).toMatch(/key === "0"[\s\S]{0,80}onZoomChange\(100\)/);
  });

  it("advertises fit under the chord that fits", () => {
    expect(descFor("Ctrl+1")).toBe("Fit to view");
    expect(toolbar).toMatch(/key === "1" && onFitToScreen/);
  });

  it("advertises zoom-to-selection, which was bound and never printed", () => {
    expect(descFor("Ctrl+2")).toBe("Zoom to selection");
    expect(toolbar).toMatch(/key === "2" && onZoomToSelection/);
  });
});
