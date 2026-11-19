// @vitest-environment jsdom
/**
 * AdvancedTab — visibility radios (Live · Hidden), indexing switches, head
 * code. Pure form renderer. Decision #21: Password is gone until the
 * published-site middleware exists; indexing / follow and head code stay.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import * as React from "react";
import { AdvancedTab } from "../AdvancedTab";
import type { UsePageSettingsReturn } from "../usePageSettings";

function makeSettings(over: Partial<UsePageSettingsReturn> = {}): UsePageSettingsReturn {
  return {
    activeTab: "advanced",
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

// ── Visibility ───────────────────────────────────────────────────────────────

describe("AdvancedTab visibility", () => {
  /* design-2l9 board 63:17061: visibility is a select. Re-baseline. */
  it("shows the current visibility in its select", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "hidden" })} />);
    expect((screen.getByTestId("adv-input-visibility") as HTMLSelectElement).value).toBe("hidden");
  });

  it("offers Live and Hidden only — no Password (decision #21)", () => {
    render(<AdvancedTab s={makeSettings()} />);
    const options = Array.from((screen.getByTestId("adv-input-visibility") as HTMLSelectElement).options).map((o) => o.textContent);
    expect(options).toEqual(["Live", "Hidden"]);
    expect(screen.queryByText(/password/i)).toBeNull();
  });

  it("calls setVisibility with the chosen value", () => {
    const s = makeSettings({ visibility: "live" });
    render(<AdvancedTab s={s} />);
    fireEvent.change(screen.getByTestId("adv-input-visibility"), { target: { value: "hidden" } });
    expect(s.setVisibility).toHaveBeenCalledWith("hidden");
  });

  it("shows only the not-published helper text for hidden — no contradicting reachable-via-direct-URL line", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "hidden" })} />);
    expect(
      screen.getByText("Not published. Hidden pages are left out of the deploy.")
    ).toBeTruthy();
    expect(screen.queryByText(/reachable via direct URL/)).toBeNull();
  });

  /* design-2l9 board 63:17061. Re-baseline: Advanced tab copy. */
  it("names Publish visibility and says what Live means", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "live" })} />);
    expect(screen.getByText("Publish visibility")).toBeTruthy();
    expect(screen.getByText("Live means this page is included on the next publish.")).toBeTruthy();
  });
});

// ── Indexing ─────────────────────────────────────────────────────────────────

describe("AdvancedTab indexing switches", () => {
  /* design-2l9 board 63:17061: indexing is switched in SEO; Advanced reads
     it out and links there — one control, one home. */
  it("reads indexing out and sends Change in SEO to the SEO tab", () => {
    const s = makeSettings({ allowIndex: true, allowFollow: false });
    render(<AdvancedTab s={s} />);
    expect(screen.getByTestId("adv-indexing")).toHaveTextContent("Search indexing: Indexed");
    expect(screen.queryByRole("switch", { name: "Allow indexing" })).toBeNull();
    fireEvent.click(screen.getByTestId("adv-indexing-change"));
    expect(s.setActiveTab).toHaveBeenCalledWith("seo");
    expect((screen.getByTestId("adv-input-follow") as HTMLSelectElement).value).toBe("nofollow");
  });

  it("Follow links is a select (63:17061)", () => {
    const s = makeSettings({ allowFollow: false });
    render(<AdvancedTab s={s} />);
    fireEvent.change(screen.getByTestId("adv-input-follow"), { target: { value: "follow" } });
    expect(s.setAllowFollow).toHaveBeenCalledWith(true);
  });
});

// ── Custom head code ─────────────────────────────────────────────────────────

describe("AdvancedTab custom head code", () => {
  it("forwards head-code input to setCustomHead", () => {
    const s = makeSettings();
    render(<AdvancedTab s={s} />);
    fireEvent.change(screen.getByLabelText("Custom head code"), {
      target: { value: "<meta name='x'>" },
    });
    expect(s.setCustomHead).toHaveBeenCalledWith("<meta name='x'>");
  });

  it("shows the head-code error when headCodeError is set", () => {
    render(<AdvancedTab s={makeSettings({ headCodeError: "Unclosed HTML tag detected." })} />);
    expect(screen.getByText("Unclosed HTML tag detected.")).toBeTruthy();
  });

  it("does not render a head-code error when none is set", () => {
    render(<AdvancedTab s={makeSettings({ headCodeError: null })} />);
    expect(screen.queryByText(/Unclosed HTML tag/)).toBeNull();
  });
});
