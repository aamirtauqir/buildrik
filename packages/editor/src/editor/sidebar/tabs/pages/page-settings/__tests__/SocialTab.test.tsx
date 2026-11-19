// @vitest-environment jsdom
/**
 * SocialTab — Open Graph fields + preview card. Pure form renderer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import * as React from "react";
import { SocialTab } from "../SocialTab";
import type { UsePageSettingsReturn } from "../usePageSettings";

function makeSettings(over: Partial<UsePageSettingsReturn> = {}): UsePageSettingsReturn {
  return {
    activeTab: "social",
    setActiveTab: vi.fn(),
    publishedUrl: null,
    seoTitle: "",
    inheritedTitle: "Home",
    effectiveTitle: "Home",
    setSeoTitle: vi.fn(),
    seoDesc: "",
    setSeoDesc: vi.fn(),
    slug: "home",
    setSlug: vi.fn(),
    slugError: null,
    siteOgImage: null,
    keyphrase: "",
    setKeyphrase: vi.fn(),
    xCustomized: false,
    setXCustomized: vi.fn(),
    xTitle: "",
    setXTitle: vi.fn(),
    xDesc: "",
    setXDesc: vi.fn(),
    xImageUrl: null,
    setXImageUrl: vi.fn(),
    canonicalUrl: "",
    setCanonicalUrl: vi.fn(),
    canonicalError: null,
    schemaType: "WebPage",
    setSchemaType: vi.fn(),
    articleAuthor: "",
    setArticleAuthor: vi.fn(),
    articleDate: "",
    setArticleDate: vi.fn(),
    siteAuthor: "",
    ogTitle: "",
    setOgTitle: vi.fn(),
    ogDesc: "",
    setOgDesc: vi.fn(),
    ogImageUrl: null,
    setOgImageUrl: vi.fn(),
    visibility: "live",
    setVisibility: vi.fn(),
    allowIndex: true,
    setAllowIndex: vi.fn(),
    allowFollow: true,
    setAllowFollow: vi.fn(),
    customHead: "",
    setCustomHead: vi.fn(),
    headCodeError: null,
    domain: null,
    servesCleanUrls: false,
    saveState: "clean",
    isDirty: false,
    save: vi.fn(),
    discard: vi.fn(),
    showDiscardConfirm: false,
    setShowDiscardConfirm: vi.fn(),
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("SocialTab OG fields", () => {
  it("forwards OG title / description input to their setters", () => {
    const s = makeSettings();
    render(<SocialTab s={s} />);
    fireEvent.change(document.getElementById("og-title") as HTMLInputElement, {
      target: { value: "Share Title" },
    });
    expect(s.setOgTitle).toHaveBeenCalledWith("Share Title");
    fireEvent.change(document.getElementById("og-desc") as HTMLTextAreaElement, {
      target: { value: "Share Desc" },
    });
    expect(s.setOgDesc).toHaveBeenCalledWith("Share Desc");
  });

  it("sets ogImageUrl to null when the image field is cleared", () => {
    const s = makeSettings({ ogImageUrl: "https://img.example/pic.png" });
    render(<SocialTab s={s} />);
    const img = document.getElementById("og-image") as HTMLInputElement;
    expect(img.value).toBe("https://img.example/pic.png");
    fireEvent.change(img, { target: { value: "" } });
    expect(s.setOgImageUrl).toHaveBeenCalledWith(null);
  });

  it("passes a non-empty image URL straight through", () => {
    const s = makeSettings();
    render(<SocialTab s={s} />);
    fireEvent.change(document.getElementById("og-image") as HTMLInputElement, {
      target: { value: "https://img.example/new.png" },
    });
    expect(s.setOgImageUrl).toHaveBeenCalledWith("https://img.example/new.png");
  });

  it("shows OG title/description char counters", () => {
    const s = makeSettings({ ogTitle: "abc", ogDesc: "de" });
    render(<SocialTab s={s} />);
    /* design-2l9 63:16507: the title count rides in its label. */
    expect(screen.getByTestId("social-label-title")).toHaveTextContent("Social title · 3 / 60");
    expect(screen.getByTestId("social-count-desc")).toHaveTextContent("2 / 160");
  });
});

/* design-2l9 board 63:16507 draws the image preview alone (the share-card
   title/description/domain mock is gone). Re-baseline: Social tab. */
describe("SocialTab image preview", () => {
  it("the title field's placeholder is the title that ships when it is empty", () => {
    const inherited = makeSettings({ ogTitle: "", seoTitle: "", inheritedTitle: "Bella Default Title", effectiveTitle: "Bella Default Title" });
    render(<SocialTab s={inherited} />);
    expect((document.getElementById("og-title") as HTMLInputElement).placeholder).toBe("Bella Default Title");
  });

  it("renders the OG image in the preview when an image URL is set", () => {
    const s = makeSettings({ ogImageUrl: "https://img.example/pic.png" });
    const { container } = render(<SocialTab s={s} />);
    const img = container.querySelector('img[src="https://img.example/pic.png"]');
    expect(img).toBeTruthy();
    // Placeholder dimensions text is not shown when an image exists
    expect(screen.queryByText("1200 × 630")).toBeNull();
  });

  it("shows the 1200 × 630 placeholder when no image is set", () => {
    const s = makeSettings({ ogImageUrl: null });
    render(<SocialTab s={s} />);
    expect(screen.getByText("1200 × 630")).toBeTruthy();
  });

  /* design-2l9 board 63:16507. Re-baseline: Social tab copy. */
  it("explains the fallbacks and names the fields as the board does", () => {
    render(<SocialTab s={makeSettings()} />);
    expect(screen.getByTestId("social-explainer")).toHaveTextContent("Empty social title uses SEO title; empty description uses the SEO description.");
    expect(screen.getByTestId("social-label-title")).toHaveTextContent("Social title");
    expect(screen.getByTestId("social-label-desc")).toHaveTextContent("Social description");
    expect(screen.getByTestId("social-label-image")).toHaveTextContent("Social image URL");
    expect(screen.getByText("Recommended: 1200 × 630. Clear the URL to remove the image.")).toBeInTheDocument();
  });
});
