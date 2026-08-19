import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The replace-page confirm said "Your brand tokens are applied automatically."
 *
 * Measured: `templatesData.ts` holds zero `var(--buildrick-design-*)`
 * references and over a hundred hardcoded hex values. A user who set a brand
 * colour and applied a template got the template's palette instead, and the
 * dialog told them the opposite while asking them to confirm.
 *
 * The copy is honest now. If the templates are ever moved onto tokens, this
 * test is the reminder that the sentence has to move with them.
 *
 * @license BSD-3-Clause
 */
const here = dirname(fileURLToPath(import.meta.url));
const modals = readFileSync(resolve(here, "../TemplatesTabModals.tsx"), "utf8");
const data = readFileSync(resolve(here, "../templatesData.ts"), "utf8");

describe("the template confirm says what applying one actually does", () => {
  it("does not claim brand tokens are applied", () => {
    const body = modals.split("<div className=\"tw:mb-3\">")[1] ?? "";
    expect(body).not.toContain("brand tokens are applied automatically");
  });

  it("says the template brings its own colours", () => {
    expect(modals).toContain("brand tokens are not");
  });

  it("…and that is still true of the built-in templates", () => {
    // The claim and the data have to be checked together: if this stops being
    // true, the copy above is the thing to change.
    expect(data).not.toContain("var(--buildrick-design-");
    expect(data).toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});
