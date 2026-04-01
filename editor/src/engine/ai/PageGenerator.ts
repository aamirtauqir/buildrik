/**
 * AI Page Generator
 * Generate complete page layouts from text prompts
 *
 * @module engine/ai/PageGenerator
 * @license BSD-3-Clause
 */

import { devWarn } from "../../shared/utils/devLogger";
import { generateLayout, type LayoutStyle } from "../../shared/utils/openai";
import type { Composer } from "../Composer";

// =============================================================================
// TYPES
// =============================================================================

export interface PageGeneratorPrompt {
  /** High-level description of the page */
  description: string;
  /** Visual style preference */
  style?: LayoutStyle;
  /** Color scheme (hex values or named colors) */
  colorScheme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  /** Target industry/niche */
  industry?: string;
  /** Specific sections to include */
  sections?: PageSectionType[];
  /** Brand name for personalization */
  brandName?: string;
}

export type PageSectionType =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "cta"
  | "contact"
  | "about"
  | "team"
  | "faq"
  | "gallery"
  | "stats"
  | "logos"
  | "blog"
  | "footer";

export interface GeneratedSection {
  id: string;
  type: PageSectionType;
  html: string;
  css?: string;
}

export interface GeneratedPage {
  id: string;
  name: string;
  sections: GeneratedSection[];
  globalStyles: Record<string, string>;
  prompt: PageGeneratorPrompt;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  sections: PageSectionType[];
  style: LayoutStyle;
  industry: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    description: "Modern landing page for software products",
    sections: ["hero", "features", "pricing", "testimonials", "faq", "cta"],
    style: "modern",
    industry: "technology",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal or agency portfolio",
    sections: ["hero", "about", "gallery", "testimonials", "contact"],
    style: "creative",
    industry: "creative",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Product showcase and sales",
    sections: ["hero", "features", "gallery", "testimonials", "cta"],
    style: "ecommerce",
    industry: "retail",
  },
  {
    id: "agency",
    name: "Agency",
    description: "Digital agency or consultancy",
    sections: ["hero", "about", "team", "logos", "testimonials", "contact"],
    style: "corporate",
    industry: "business",
  },
  {
    id: "startup",
    name: "Startup",
    description: "Early-stage company pitch",
    sections: ["hero", "stats", "features", "team", "cta"],
    style: "bold",
    industry: "technology",
  },
  {
    id: "blog",
    name: "Blog/Content",
    description: "Content-focused layout",
    sections: ["hero", "blog", "about", "cta"],
    style: "minimal",
    industry: "media",
  },
];

const SECTION_PROMPTS: Record<PageSectionType, (context: PageGeneratorPrompt) => string> = {
  hero: (ctx) =>
    `Create a hero section for ${ctx.brandName || "a company"} in the ${ctx.industry || "technology"} industry. ` +
    `${ctx.description}. Include a compelling headline, subtitle, and CTA button. ` +
    `Style: ${ctx.style || "modern"}.`,

  features: (ctx) =>
    `Create a features section showcasing 3-4 key features for ${ctx.brandName || "the product"}. ` +
    `Each feature should have an icon placeholder, title, and description. ` +
    `Industry: ${ctx.industry || "technology"}. Style: ${ctx.style || "modern"}.`,

  pricing: (ctx) =>
    `Create a pricing section with 3 tiers (Basic, Pro, Enterprise) for ${ctx.brandName || "the service"}. ` +
    `Include feature lists and CTA buttons. Style: ${ctx.style || "modern"}.`,

  testimonials: (ctx) =>
    `Create a testimonials section with 3 customer quotes for ${ctx.brandName || "the company"}. ` +
    `Include profile image placeholders, names, titles, and companies. ` +
    `Industry: ${ctx.industry || "technology"}. Style: ${ctx.style || "modern"}.`,

  cta: (ctx) =>
    `Create a call-to-action section for ${ctx.brandName || "the company"}. ` +
    `Include a strong headline, supporting text, and prominent CTA button. ` +
    `Make it compelling and action-oriented. Style: ${ctx.style || "modern"}.`,

  contact: (ctx) =>
    `Create a contact section for ${ctx.brandName || "the company"}. ` +
    `Include a contact form (name, email, message) and contact info. ` +
    `Style: ${ctx.style || "modern"}.`,

  about: (ctx) =>
    `Create an about section for ${ctx.brandName || "the company"}. ` +
    `${ctx.description}. Include company story, mission, and values. ` +
    `Style: ${ctx.style || "modern"}.`,

  team: (ctx) =>
    `Create a team section with 4 team member cards for ${ctx.brandName || "the company"}. ` +
    `Include photo placeholders, names, roles, and social links. ` +
    `Style: ${ctx.style || "modern"}.`,

  faq: (ctx) =>
    `Create an FAQ section with 5 common questions and answers for ${ctx.brandName || "the product"}. ` +
    `Industry: ${ctx.industry || "technology"}. Style accordion format.`,

  gallery: (ctx) =>
    `Create a gallery/portfolio section with 6 image placeholders for ${ctx.brandName || "the portfolio"}. ` +
    `Include captions and hover effects. Style: ${ctx.style || "modern"}.`,

  stats: (ctx) =>
    `Create a statistics section with 4 impressive numbers for ${ctx.brandName || "the company"}. ` +
    `Include metric labels and animated counters style. Industry: ${ctx.industry || "technology"}.`,

  logos: (ctx) =>
    `Create a logo carousel/client section showing 6 company logos for ${ctx.brandName || "partnerships"}. ` +
    `Include a subtle heading like "Trusted by". Style: ${ctx.style || "minimal"}.`,

  blog: (ctx) =>
    `Create a blog preview section with 3 article cards for ${ctx.brandName || "the blog"}. ` +
    `Include featured images, titles, excerpts, dates, and read more links. ` +
    `Style: ${ctx.style || "modern"}.`,

  footer: (ctx) =>
    `Create a footer section for ${ctx.brandName || "the website"}. ` +
    `Include navigation links, social icons, newsletter signup, and copyright. ` +
    `Style: ${ctx.style || "modern"}.`,
};

// =============================================================================
// PAGE GENERATOR CLASS
// =============================================================================

export class PageGenerator {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Generate a complete page from a prompt
   */
  async generatePage(prompt: PageGeneratorPrompt): Promise<GeneratedPage> {
    const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sections: GeneratedSection[] = [];

    // Determine which sections to generate
    const sectionTypes = prompt.sections || this.inferSections(prompt);

    // Generate each section
    for (const sectionType of sectionTypes) {
      try {
        const section = await this.generateSection(sectionType, prompt);
        sections.push(section);
      } catch (error) {
        devWarn("PageGenerator", `Failed to generate ${sectionType}`, error);
        // Add placeholder section on failure
        sections.push(this.createPlaceholderSection(sectionType));
      }
    }

    // Build global styles from color scheme
    const globalStyles = this.buildGlobalStyles(prompt);

    const page: GeneratedPage = {
      id: pageId,
      name: this.generatePageName(prompt),
      sections,
      globalStyles,
      prompt,
    };

    this.composer.emit("ai:page-generated", page);
    return page;
  }

  /**
   * Generate a single section
   */
  async generateSection(
    type: PageSectionType,
    context: PageGeneratorPrompt
  ): Promise<GeneratedSection> {
    const promptBuilder = SECTION_PROMPTS[type];
    if (!promptBuilder) {
      throw new Error(`Unknown section type: ${type}`);
    }

    const sectionPrompt = promptBuilder(context);
    const html = await generateLayout(sectionPrompt, context.style);

    return {
      id: `section-${type}-${Date.now()}`,
      type,
      html,
    };
  }

  /**
   * Generate page from template
   */
  async generateFromTemplate(
    templateId: string,
    customizations: Partial<PageGeneratorPrompt> = {}
  ): Promise<GeneratedPage> {
    const template = PAGE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const prompt: PageGeneratorPrompt = {
      description: customizations.description || template.description,
      style: customizations.style || template.style,
      industry: customizations.industry || template.industry,
      sections: template.sections,
      brandName: customizations.brandName,
      colorScheme: customizations.colorScheme,
    };

    return this.generatePage(prompt);
  }

  /**
   * Preview page generation (returns structure without full HTML)
   */
  previewPageStructure(prompt: PageGeneratorPrompt): {
    sections: PageSectionType[];
    estimatedTime: number;
  } {
    const sections = prompt.sections || this.inferSections(prompt);
    return {
      sections,
      estimatedTime: sections.length * 3, // ~3 seconds per section
    };
  }

  /**
   * Apply generated page to canvas
   */
  applyToCanvas(page: GeneratedPage): void {
    // Apply each section's HTML to the page via events
    // Canvas components listen for these events and handle insertion
    page.sections.forEach((section) => {
      this.composer.emit("ai:section-apply", {
        html: section.html,
        type: section.type,
      });
    });

    this.composer.emit("ai:page-applied", page);
  }

  /**
   * Infer sections based on description and industry
   */
  private inferSections(prompt: PageGeneratorPrompt): PageSectionType[] {
    const description = prompt.description.toLowerCase();
    const industry = prompt.industry?.toLowerCase() || "";

    const sections: PageSectionType[] = ["hero"];

    // Add sections based on keywords
    if (description.includes("feature") || description.includes("benefit")) {
      sections.push("features");
    }
    if (description.includes("price") || description.includes("plan")) {
      sections.push("pricing");
    }
    if (description.includes("testimonial") || description.includes("review")) {
      sections.push("testimonials");
    }
    if (description.includes("team") || description.includes("people")) {
      sections.push("team");
    }
    if (description.includes("contact") || description.includes("form")) {
      sections.push("contact");
    }
    if (description.includes("portfolio") || description.includes("gallery")) {
      sections.push("gallery");
    }
    if (description.includes("faq") || description.includes("question")) {
      sections.push("faq");
    }
    if (description.includes("blog") || description.includes("article")) {
      sections.push("blog");
    }

    // Industry-specific defaults
    if (industry === "saas" || industry === "technology") {
      if (!sections.includes("features")) sections.push("features");
      if (!sections.includes("pricing")) sections.push("pricing");
    }
    if (industry === "agency" || industry === "consulting") {
      if (!sections.includes("about")) sections.push("about");
      if (!sections.includes("logos")) sections.push("logos");
    }

    // Always add CTA at the end
    if (!sections.includes("cta")) {
      sections.push("cta");
    }

    return sections;
  }

  /**
   * Build global CSS variables from color scheme
   */
  private buildGlobalStyles(prompt: PageGeneratorPrompt): Record<string, string> {
    const colors = prompt.colorScheme || {};
    return {
      "--primary-color": colors.primary || "#0073E6",
      "--secondary-color": colors.secondary || "#7C3AED",
      "--background-color": colors.background || "#FFFFFF",
      "--text-color": colors.text || "#1F2937",
    };
  }

  /**
   * Generate a name for the page
   */
  private generatePageName(prompt: PageGeneratorPrompt): string {
    if (prompt.brandName) {
      return `${prompt.brandName} Landing Page`;
    }
    if (prompt.industry) {
      return `${prompt.industry.charAt(0).toUpperCase() + prompt.industry.slice(1)} Page`;
    }
    return "Generated Page";
  }

  /**
   * Create placeholder section for failed generation
   */
  private createPlaceholderSection(type: PageSectionType): GeneratedSection {
    return {
      id: `section-${type}-placeholder`,
      type,
      html: `
        <section data-section="${type}" style="padding: 80px 20px; text-align: center; background: #f5f5f5;">
          <h2 style="color: #666;">${type.charAt(0).toUpperCase() + type.slice(1)} Section</h2>
          <p style="color: #999;">Content generation in progress...</p>
        </section>
      `.trim(),
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const getPageTemplates = (): PageTemplate[] => PAGE_TEMPLATES;

export const getSectionTypes = (): PageSectionType[] => [
  "hero",
  "features",
  "pricing",
  "testimonials",
  "cta",
  "contact",
  "about",
  "team",
  "faq",
  "gallery",
  "stats",
  "logos",
  "blog",
  "footer",
];
