/**
 * The page-settings dialog must sit on the overlay layer, not above the
 * modal layer: its leave guard is a chrome-ui modal whose overlay is on
 * --bk-z-overlay, and at z 91 the dialog hid the guard entirely (found by
 * probe screenshot, design-2l9 board 63:18758).
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "PagesTab.css"), "utf8");
const zOf = (sel: string) => css.match(new RegExp(`\\${sel} \\{[^}]*z-index:\\s*([^;]+);`))?.[1]?.trim();

describe("page settings dialog stacking", () => {
  it("dialog and scrim are on the overlay layer, under the guard", () => {
    expect(zOf(".bd-pg-drawer")).toBe("var(--bk-z-overlay)");
    expect(zOf(".bd-pg-drawer-scrim")).toBe("var(--bk-z-overlay)");
  });
});
