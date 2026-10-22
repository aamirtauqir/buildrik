// @vitest-environment jsdom
/**
 * BD-39 (7): the Form block inserts with visible labels, each tied to its
 * control by wrapping it (no ids — two Form blocks on one page would collide
 * on a `for`/`id` pair). Placeholders are not labels: they vanish on typing
 * and are not reliably announced. Existing forms are not touched — this is
 * the catalog markup only.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockById } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("Form block — visible labels", () => {
  it("names every field with a visible label that wraps it", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const id = insertBlock(composer, getBlockById("form")!, page.root.id);
    const host = document.createElement("div");
    host.innerHTML = composer.elements.getElement(id!)!.toHTML();
    const fields = [...host.querySelectorAll("input, textarea, select")].filter(
      (f) => (f as HTMLInputElement).type !== "submit",
    );
    expect(fields.length).toBeGreaterThanOrEqual(2);
    for (const field of fields) {
      const label = field.closest("label");
      expect(label, field.outerHTML).not.toBeNull();
      expect(label!.textContent!.trim().length, field.outerHTML).toBeGreaterThan(0);
    }
    expect([...host.querySelectorAll("label")].map((l) => l.textContent!.trim())).toEqual(["Name", "Email"]);
  });
});
