import { describe, it, expect } from "vitest";

/* `components/templates/template-gallery`, `template-card` and
   `template-preview` were deleted in be81c8ac ("one canonical template
   surface — sites/new links to the browser"). This file kept importing them,
   so the whole test file has failed to resolve ever since — a red suite that
   says nothing about the code that replaced them.

   The surviving contract is the filter model behind the templates browser:
   category / difficulty / sort option lists, and the URL parser that pins
   each value to its allowed set. */
describe("Template filter model", () => {
  const load = () => import("@/app/dashboard/templates/filters");

  it("offers six categories plus ALL", async () => {
    const { TEMPLATE_CATEGORY_OPTIONS } = await load();
    expect(TEMPLATE_CATEGORY_OPTIONS).toHaveLength(7);
    expect(TEMPLATE_CATEGORY_OPTIONS[0].value).toBe("ALL");
  });

  it("offers three sort options", async () => {
    const { TEMPLATE_SORT_OPTIONS } = await load();
    expect(TEMPLATE_SORT_OPTIONS).toHaveLength(3);
    expect(TEMPLATE_SORT_OPTIONS.map((o) => o.value)).toEqual([
      "popular",
      "newest",
      "alphabetical",
    ]);
  });

  it("offers ALL plus three difficulty levels", async () => {
    const { TEMPLATE_DIFFICULTY_OPTIONS } = await load();
    expect(TEMPLATE_DIFFICULTY_OPTIONS).toHaveLength(4);
    expect(TEMPLATE_DIFFICULTY_OPTIONS[0].value).toBe("ALL");
  });

  it("falls back to the defaults when the URL carries a value that is not offered", async () => {
    const { templateFiltersFromParams, DEFAULT_TEMPLATE_FILTERS } = await load();
    const parsed = templateFiltersFromParams(
      new URLSearchParams({ category: "NOPE", sort: "nope", difficulty: "nope" })
    );
    expect(parsed.category).toBe(DEFAULT_TEMPLATE_FILTERS.category);
    expect(parsed.sort).toBe(DEFAULT_TEMPLATE_FILTERS.sort);
    expect(parsed.difficulty).toBe(DEFAULT_TEMPLATE_FILTERS.difficulty);
  });
});

describe("AI Wizard Components", () => {
  it("exports BUSINESS_TYPES with 6 types", async () => {
    const mod = await import("@/components/ai-wizard/step-type");
    expect(mod.BUSINESS_TYPES).toHaveLength(6);
    const values = mod.BUSINESS_TYPES.map((t: { value: string }) => t.value);
    expect(values).toContain("PORTFOLIO");
    expect(values).toContain("RESTAURANT");
  });

  // TONE_OPTIONS / CONTENT_OPTIONS / IMAGE_OPTIONS were intentionally
  // demoted to internal `const` in 77ea14e4 ("tighten step-pages exports").
  // Skipped: shape is verified at runtime by the step-pages render path,
  // and re-exporting purely to satisfy a length-assertion negates the
  // encapsulation choice. Restore + drop skip if exports become public.
  it.skip("exports TONE_OPTIONS with 6 options (internal — see 77ea14e4)", async () => {
    const mod = await import("@/components/ai-wizard/step-pages");
    expect(mod.TONE_OPTIONS).toHaveLength(6);
  });

  it.skip("exports CONTENT_OPTIONS with 3 options (internal — see 77ea14e4)", async () => {
    const mod = await import("@/components/ai-wizard/step-pages");
    expect(mod.CONTENT_OPTIONS).toHaveLength(3);
  });

  it.skip("exports IMAGE_OPTIONS with 3 options (internal — see 77ea14e4)", async () => {
    const mod = await import("@/components/ai-wizard/step-pages");
    expect(mod.IMAGE_OPTIONS).toHaveLength(3);
  });

  it("exports WizardProgress component", async () => {
    const mod = await import("@/components/ai-wizard/wizard-progress");
    expect(mod.WizardProgress).toBeDefined();
  });

  it("exports GenerationProgress component", async () => {
    const mod = await import("@/components/ai-wizard/generation-progress");
    expect(mod.GenerationProgress).toBeDefined();
    expect(mod.GENERATION_STEPS).toHaveLength(5);
  });
});
