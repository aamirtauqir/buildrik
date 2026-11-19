// @vitest-environment jsdom
/**
 * L2-024 (owner 2026-10-10): the default Form arrived unstyled — borderless
 * inputs, a plain-text Submit. A form block's children now get Brand-token
 * defaults (inputs, labels, button, spacing) — and no literal colour.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockDefinitions } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function insertAndExport(blockId: string) {
  const def = getBlockDefinitions().find((b) => b.id === blockId)!;
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const id = insertBlock(composer, def, page.root.id);
  const form = composer.elements.getElement(String(id))!;
  const html = composer.exportHTML().combined;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return { composer, form, doc };
}

describe.each(["form", "contact-form"])("%s block — Brand-token defaults (L2-024)", (blockId) => {
  it("styles its children from Brand tokens — no literal colours", () => {
    const { form } = insertAndExport(blockId);
    const all = form.getDescendants();
    const inputs = all.filter((el) => ["input", "textarea"].includes(el.getTagName().toLowerCase()));
    expect(inputs.length).toBeGreaterThan(0);
    for (const el of inputs) {
      expect(el.getStyle("border")).toContain("var(--buildrick-design-input-border)");
      expect(el.getStyle("border-radius")).toBe("var(--buildrick-design-input-radius)");
    }
    const button = all.find((el) => el.getTagName().toLowerCase() === "button")!;
    expect(button.getStyle("background-color")).toBe("var(--buildrick-design-color-primary)");
    expect(button.getStyle("color")).toBe("var(--buildrick-design-color-on-primary)");
    for (const el of [form, ...all]) {
      for (const [prop, value] of Object.entries(el.getStyles() ?? {})) {
        expect(`${prop}: ${value}`).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
      }
    }
  });
});
