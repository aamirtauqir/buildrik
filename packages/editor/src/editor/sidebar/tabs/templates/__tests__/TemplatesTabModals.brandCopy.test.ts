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

  it("says the template brings its own colours (2L9 223:44891)", () => {
    expect(modals).toContain("has its own colors and fonts — your Brand is not changed.");
  });

  /* L4-024 moved the built-in templates onto the Brand tokens, so the copy a
     built-in template gets is the brand sentence (the raw-colour sentence is
     left for an older saved template that still carries literals). */
  it("…and the built-in templates are on the Brand tokens, so they get the brand sentence", () => {
    expect(data).toContain("var(--buildrick-design-");
    expect(modals).toContain('template.html?.includes("var(--buildrick-design-")');
  });
});

/* G2-098 / Q2b: templates never touch Brand — the replace confirm has no
   "Reset global styles" option (it cleared the project's styles outright). */
describe("ReplaceModal — no global-styles reset", () => {
  it("offers no Reset global styles option", () => {
    expect(modals).not.toMatch(/Reset global styles/);
  });
});
