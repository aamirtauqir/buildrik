import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ExportModal } from "../ExportModal";
import { resolvePageTitle } from "../../../engine/export/SEOInjector";
import type { PageData } from "../../../shared/types";

/**
 * The download modal seeded its config from DEFAULT_EXPORT_CONFIG, whose
 * pageTitle is the literal "Buildrick Export". Verified end to end through
 * Site menu → Export code → Download: the file came down titled with OUR
 * name, for every customer who did not notice the Options field.
 */
vi.mock("../../../engine/export/ExportEngine", () => ({
  ExportEngine: class {
    private cfg: { pageTitle?: string };
    constructor(_c: unknown, cfg: { pageTitle?: string }) { this.cfg = cfg; }
    async export() {
      return { success: true, html: `<title>${this.cfg.pageTitle}</title>`, css: "", stats: { elementCount: 1, htmlSize: 10, cssSize: 0 } };
    }
  },
}));

function composerWith(page: Partial<PageData>) {
  return {
    elements: { getActivePage: () => page as PageData },
    getProjectSettings: () => ({}),
  } as never;
}

beforeEach(() => vi.clearAllMocks());

describe("the exported file is titled with the site's own name", () => {
  /** The Options tab's field is config.pageTitle, which is what the export uses. */
  const titleField = async () => {
    fireEvent.click(screen.getByText("Options"));
    return (await screen.findByLabelText(/page title/i)) as HTMLInputElement;
  };

  it("seeds the title from the active page", async () => {
    render(<ExportModal isOpen onClose={() => {}} composer={composerWith({ id: "p", name: "Pricing" })} />);
    expect((await titleField()).value).toBe("Pricing");
  });

  it("prefers the page's SEO meta title", async () => {
    const page = { id: "p", name: "Pricing", settings: { seo: { metaTitle: "Plans & Pricing" } } };
    render(<ExportModal isOpen onClose={() => {}} composer={composerWith(page)} />);
    expect((await titleField()).value).toBe("Plans & Pricing");
  });

  it("never falls back to our own brand name", async () => {
    render(<ExportModal isOpen onClose={() => {}} composer={composerWith({ id: "p", name: "Home" })} />);
    expect((await titleField()).value).not.toMatch(/Buildrick/);
  });

  it("keeps a title the user typed", async () => {
    render(<ExportModal isOpen onClose={() => {}} composer={composerWith({ id: "p", name: "Home" })} />);
    const field = await titleField();
    fireEvent.change(field, { target: { value: "My Landing Page" } });
    expect((field as HTMLInputElement).value).toBe("My Landing Page");
  });
});

describe("resolvePageTitle", () => {
  it("is the precedence the multi-page exporter already used", () => {
    const page = { id: "p", name: "Home" } as PageData;
    expect(resolvePageTitle(page)).toBe("Home");
    expect(resolvePageTitle(page, { metaTitle: "Meta" }, { title: "Settings" })).toBe("Meta");
    expect(resolvePageTitle(page, undefined, { title: "Settings" })).toBe("Settings");
    expect(resolvePageTitle({ id: "p" } as PageData)).toBe("Untitled");
  });
});
