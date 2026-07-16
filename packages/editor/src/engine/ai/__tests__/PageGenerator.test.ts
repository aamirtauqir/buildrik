/**
 * PageGenerator Tests
 * Template/heuristic page generation — the AI client boundary
 * (shared/utils/openai generateLayout) is mocked; everything else is real.
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PageGenerator,
  PAGE_TEMPLATES,
  getPageTemplates,
  getSectionTypes,
  type PageGeneratorPrompt,
  type PageSectionType,
  type GeneratedPage,
} from "../PageGenerator";
import { generateLayout } from "../../../shared/utils/openai";
import { EVENTS } from "../../../shared/constants/events";
import type { Composer } from "../../Composer";

vi.mock("../../../shared/utils/openai", () => ({
  generateLayout: vi.fn(),
}));

vi.mock("../../../shared/utils/devLogger", () => ({
  devWarn: vi.fn(),
}));

const mockGenerateLayout = vi.mocked(generateLayout);

function makeComposer() {
  return { emit: vi.fn() } as unknown as Composer;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateLayout.mockResolvedValue('<section data-mock="ok"></section>');
});

describe("PageGenerator.generatePage", () => {
  it("generates one section per explicitly requested type, in order", async () => {
    const composer = makeComposer();
    const gen = new PageGenerator(composer);

    const page = await gen.generatePage({
      description: "A landing page",
      sections: ["hero", "features", "cta"],
    });

    expect(page.sections).toHaveLength(3);
    expect(page.sections.map((s) => s.type)).toEqual(["hero", "features", "cta"]);
    expect(page.sections[0].id).toMatch(/^section-hero-/);
    expect(page.sections[0].html).toBe('<section data-mock="ok"></section>');
    expect(page.id).toMatch(/^page-/);
    expect(mockGenerateLayout).toHaveBeenCalledTimes(3);
  });

  it("builds the section prompt from brandName, industry, description, and style — and forwards style", async () => {
    const gen = new PageGenerator(makeComposer());

    await gen.generatePage({
      description: "Sell handmade rugs",
      sections: ["hero"],
      brandName: "Acme",
      industry: "retail",
      style: "bold",
    });

    const [prompt, style] = mockGenerateLayout.mock.calls[0];
    expect(prompt).toContain("Create a hero section for Acme");
    expect(prompt).toContain("retail");
    expect(prompt).toContain("Sell handmade rugs");
    expect(prompt).toContain("Style: bold");
    expect(style).toBe("bold");
  });

  it("uses generic fallbacks in the prompt when brand/industry/style are omitted", async () => {
    const gen = new PageGenerator(makeComposer());

    await gen.generatePage({ description: "d", sections: ["hero"] });

    const [prompt] = mockGenerateLayout.mock.calls[0];
    expect(prompt).toContain("Create a hero section for a company");
    expect(prompt).toContain("technology");
    expect(prompt).toContain("Style: modern");
  });

  it("emits AI_PAGE_GENERATED with the generated page", async () => {
    const composer = makeComposer();
    const gen = new PageGenerator(composer);

    const page = await gen.generatePage({ description: "d", sections: ["cta"] });

    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_PAGE_GENERATED, page);
  });

  it("falls back to a placeholder section when a section's generation fails", async () => {
    mockGenerateLayout
      .mockRejectedValueOnce(new Error("api down"))
      .mockResolvedValueOnce("<section>real</section>");
    const gen = new PageGenerator(makeComposer());

    const page = await gen.generatePage({ description: "d", sections: ["hero", "cta"] });

    expect(page.sections).toHaveLength(2);
    expect(page.sections[0].id).toBe("section-hero-placeholder");
    expect(page.sections[0].html).toContain("Hero Section");
    expect(page.sections[0].html).toContain("Content generation in progress");
    expect(page.sections[1].html).toBe("<section>real</section>");
  });

  it("names the page from brandName, then industry (capitalized), then a generic fallback", async () => {
    const gen = new PageGenerator(makeComposer());

    const branded = await gen.generatePage({ description: "d", sections: ["cta"], brandName: "Acme" });
    expect(branded.name).toBe("Acme Landing Page");

    const industry = await gen.generatePage({ description: "d", sections: ["cta"], industry: "finance" });
    expect(industry.name).toBe("Finance Page");

    const generic = await gen.generatePage({ description: "d", sections: ["cta"] });
    expect(generic.name).toBe("Generated Page");
  });

  it("builds global CSS variables with defaults and colorScheme overrides", async () => {
    const gen = new PageGenerator(makeComposer());

    const defaults = await gen.generatePage({ description: "d", sections: ["cta"] });
    expect(defaults.globalStyles).toEqual({
      "--primary-color": "#0073E6",
      "--secondary-color": "#7C3AED",
      "--background-color": "#FFFFFF",
      "--text-color": "#1F2937",
    });

    const custom = await gen.generatePage({
      description: "d",
      sections: ["cta"],
      colorScheme: { primary: "#123456", text: "#654321" },
    });
    expect(custom.globalStyles["--primary-color"]).toBe("#123456");
    expect(custom.globalStyles["--text-color"]).toBe("#654321");
    expect(custom.globalStyles["--background-color"]).toBe("#FFFFFF");
  });
});

describe("PageGenerator.previewPageStructure (section inference)", () => {
  const preview = (prompt: PageGeneratorPrompt) =>
    new PageGenerator(makeComposer()).previewPageStructure(prompt);

  it("returns explicit sections untouched with 3s-per-section estimate", () => {
    const result = preview({ description: "d", sections: ["hero", "faq"] });
    expect(result.sections).toEqual(["hero", "faq"]);
    expect(result.estimatedTime).toBe(6);
  });

  it("infers sections from description keywords, hero first, cta last", () => {
    const result = preview({
      description: "Show our features, pricing plans and testimonials with a contact form and FAQ questions",
    });
    expect(result.sections[0]).toBe("hero");
    expect(result.sections).toContain("features");
    expect(result.sections).toContain("pricing");
    expect(result.sections).toContain("testimonials");
    expect(result.sections).toContain("contact");
    expect(result.sections).toContain("faq");
    expect(result.sections[result.sections.length - 1]).toBe("cta");
  });

  it("adds features + pricing for the technology industry without duplicating keyword hits", () => {
    const result = preview({ description: "Great features for teams", industry: "technology" });
    expect(result.sections.filter((s) => s === "features")).toHaveLength(1);
    expect(result.sections).toContain("pricing");
    expect(result.sections[result.sections.length - 1]).toBe("cta");
  });

  it("adds about + logos for the agency industry", () => {
    const result = preview({ description: "Simple page", industry: "agency" });
    expect(result.sections).toContain("about");
    expect(result.sections).toContain("logos");
  });

  it("bare description yields just hero + cta", () => {
    const result = preview({ description: "Something plain" });
    expect(result.sections).toEqual(["hero", "cta"]);
  });
});

describe("PageGenerator.generateSection", () => {
  it("rejects unknown section types", async () => {
    const gen = new PageGenerator(makeComposer());
    await expect(
      gen.generateSection("bogus" as PageSectionType, { description: "x" })
    ).rejects.toThrow("Unknown section type: bogus");
  });
});

describe("PageGenerator.generateFromTemplate", () => {
  it("rejects unknown template ids", async () => {
    const gen = new PageGenerator(makeComposer());
    await expect(gen.generateFromTemplate("nope")).rejects.toThrow("Template not found: nope");
  });

  it("uses the template's sections and merges customizations over template defaults", async () => {
    const gen = new PageGenerator(makeComposer());
    const template = PAGE_TEMPLATES.find((t) => t.id === "saas-landing")!;

    const page = await gen.generateFromTemplate("saas-landing", {
      brandName: "Acme",
      style: "minimal",
    });

    expect(page.sections.map((s) => s.type)).toEqual(template.sections);
    expect(page.name).toBe("Acme Landing Page");
    // customization style overrides the template's "modern"
    expect(mockGenerateLayout.mock.calls[0][0]).toContain("Style: minimal");
    // template industry survives when not customized
    expect(page.prompt.industry).toBe("technology");
  });
});

describe("PageGenerator.applyToCanvas", () => {
  it("emits AI_SECTION_APPLY per section, then AI_PAGE_APPLIED", () => {
    const composer = makeComposer();
    const gen = new PageGenerator(composer);
    const page: GeneratedPage = {
      id: "page-x",
      name: "X",
      globalStyles: {},
      prompt: { description: "d" },
      sections: [
        { id: "s1", type: "hero", html: "<section>1</section>" },
        { id: "s2", type: "cta", html: "<section>2</section>" },
      ],
    };

    gen.applyToCanvas(page);

    const emit = vi.mocked(composer.emit);
    expect(emit).toHaveBeenNthCalledWith(1, EVENTS.AI_SECTION_APPLY, {
      html: "<section>1</section>",
      type: "hero",
    });
    expect(emit).toHaveBeenNthCalledWith(2, EVENTS.AI_SECTION_APPLY, {
      html: "<section>2</section>",
      type: "cta",
    });
    expect(emit).toHaveBeenNthCalledWith(3, EVENTS.AI_PAGE_APPLIED, page);
  });
});

describe("PageGenerator catalog exports", () => {
  it("getPageTemplates exposes the 6 built-in templates", () => {
    const ids = getPageTemplates().map((t) => t.id);
    expect(ids).toEqual(["saas-landing", "portfolio", "ecommerce", "agency", "startup", "blog"]);
  });

  it("getSectionTypes returns 14 unique section types", () => {
    const types = getSectionTypes();
    expect(types).toHaveLength(14);
    expect(new Set(types).size).toBe(14);
    expect(types).toContain("hero");
    expect(types).toContain("footer");
  });
});
