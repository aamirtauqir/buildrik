// @vitest-environment jsdom
/**
 * A published form field must carry a `name`, or the browser submits nothing.
 *
 * An unnamed control is omitted from the payload entirely — the visitor fills
 * it in, presses Submit, and that answer never leaves the page. Only
 * `Radio.tsx` carried a name (it needs one to group), so every other field
 * built from these blocks published as a control the form could not read.
 *
 * Checked through the real export rather than by reading the block source,
 * because what matters is the HTML a visitor's browser receives.
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

/** Controls a browser will not submit without a name. */
const SUBMITTABLE = ["input", "select", "textarea"];

/* DOMPurify strips a `name` whose value collides with a DOM property, because
   `name="name"` inside a form makes `form.name` return the input rather than
   the form's name — DOM clobbering. It is on by default and it is right, but
   it means a plausible default silently vanishes. Measured through
   `sanitizeHTML`: name / id / submit / action / method are STRIPPED; email,
   fullname, message, choice are kept. `name="name"` on a name field is the
   most natural thing a user will type, and it will not survive. */
const CLOBBERING = ["name", "id", "submit", "action", "method"];

describe("published form fields", () => {
  it("every Forms block exports controls that carry a name", () => {
    const defs = getBlockDefinitions().filter((b) => b.category === "Forms");
    expect(defs.length).toBeGreaterThanOrEqual(16);

    const silent: string[] = [];
    for (const def of defs) {
      const composer = createTestComposer();
      const page = composer.elements.createPage("Home");
      insertBlock(composer, def, page.root.id);

      const html = composer.exportHTML().combined;
      const doc = new DOMParser().parseFromString(html, "text/html");
      for (const el of doc.querySelectorAll(SUBMITTABLE.join(","))) {
        /* Formspree's own hidden fields are injected at publish and are not the
           block's business. */
        const name = el.getAttribute("name");
        if (name && name.startsWith("_")) continue;
        if (!name) silent.push(`${def.id}: <${el.tagName.toLowerCase()}${el.getAttribute("type") ? ` type=${el.getAttribute("type")}` : ""}>`);
      }
    }
    expect(silent).toEqual([]);
  });

  it("uses no default name the sanitizer will strip for DOM clobbering", () => {
    const clobbering = getBlockDefinitions()
      .filter((b) => typeof b.content === "string")
      .flatMap((b) =>
        [...String(b.content).matchAll(/name=["']([^"']+)["']/g)]
          .map((m) => m[1])
          .filter((n) => CLOBBERING.includes(n))
          .map((n) => `${b.id}: name="${n}"`)
      );
    expect(clobbering).toEqual([]);
  });
});
