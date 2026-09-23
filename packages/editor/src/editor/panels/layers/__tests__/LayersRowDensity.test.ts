/**
 * C4 #18 / QA 2026-09-24: "Compact rows" had no effect — `.bdc-lr` was 28 and
 * the compact rule was 28 too, so the display option toggled a class that
 * changed nothing. Compact (the default, board 1082:4527) is the dense 28
 * (`--bk-size-row-dense`); switched off, rows take the standard 32
 * (`--bk-size-row`).
 *
 * Asserted on the stylesheet: jsdom computes no layout, and the two rules are
 * the contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(HERE, "..", "styles", "layers-v2.css"), "utf8");

const heightIn = (selector: string) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`${esc}\\s*\\{[^}]*?height:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

describe("Layers row density", () => {
  it("compact rows are the dense 28", () => {
    expect(heightIn(".bdc-layers-tree.bdc-layers-tree-compact .bdc-lr")).toBe("var(--bk-size-row-dense)");
  });

  it("comfortable rows are the standard 32 — a different height", () => {
    expect(heightIn(".bdc-layers-tree:not(.bdc-layers-tree-compact) .bdc-lr")).toBe("var(--bk-size-row)");
  });
});
