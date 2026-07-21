import { describe, it, expect } from "vitest";
import { initialViewFor, isTemplateRedirect } from "../initial-view";

/**
 * Templates moved out of this page into the full browser at /dashboard/templates.
 * So a template-shaped URL no longer opens a view here — it redirects. These
 * tests pin that: initialViewFor never returns a template view, and
 * isTemplateRedirect flags exactly the URLs the entry points still produce
 * (?method=template, ?template=<id>).
 */
describe("initialViewFor", () => {
  it("opens the AI wizard for ?method=ai", () => {
    expect(initialViewFor("ai")).toBe("ai-type");
  });

  it("lands on the chooser for no method", () => {
    expect(initialViewFor(null)).toBe("choose");
  });

  it("lands on the chooser for a template method (no template view exists here)", () => {
    expect(initialViewFor("template")).toBe("choose");
  });
});

describe("isTemplateRedirect", () => {
  it("redirects ?method=template", () => {
    expect(isTemplateRedirect("template", null)).toBe(true);
  });

  it("redirects a bare ?template=<id>", () => {
    expect(isTemplateRedirect(null, "tpl_123")).toBe(true);
  });

  it("does not redirect the AI or chooser paths", () => {
    expect(isTemplateRedirect("ai", null)).toBe(false);
    expect(isTemplateRedirect(null, null)).toBe(false);
  });
});
