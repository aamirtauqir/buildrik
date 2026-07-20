import { describe, it, expect } from "vitest";
import { initialViewFor } from "../initial-view";

/**
 * Which view /dashboard/sites/new opens on, from its URL params.
 *
 * The regression this guards: the Templates tab linked every card to
 * `?method=template`, which resolves to the full gallery. So clicking one
 * template opened a second page listing all of them — the "aik or page khulta
 * hai" the user reported. The fix reads `?template=<id>` and opens that one
 * template's preview. If someone drops the template-param branch, these fail.
 */

describe("initialViewFor", () => {
  it("opens a specific template's preview when ?template is present", () => {
    expect(initialViewFor({ method: "template", template: "tpl_123" })).toEqual({
      view: "preview",
      previewTemplateId: "tpl_123",
    });
  });

  it("prefers the template deep link even without method=template", () => {
    // A bare ?template=<id> still deep-links; method is not required to be set.
    expect(initialViewFor({ method: null, template: "tpl_123" })).toEqual({
      view: "preview",
      previewTemplateId: "tpl_123",
    });
  });

  it("lands on the gallery for ?method=template with no id", () => {
    expect(initialViewFor({ method: "template", template: null })).toEqual({
      view: "templates",
      previewTemplateId: null,
    });
  });

  it("opens the AI wizard for ?method=ai", () => {
    expect(initialViewFor({ method: "ai", template: null })).toEqual({
      view: "ai-type",
      previewTemplateId: null,
    });
  });

  it("defaults to the choose screen with no params", () => {
    expect(initialViewFor({ method: null, template: null })).toEqual({
      view: "choose",
      previewTemplateId: null,
    });
  });
});
