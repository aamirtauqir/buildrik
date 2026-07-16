// @vitest-environment jsdom
/**
 * SocialTab — Open Graph fields + preview card. Pure form renderer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import * as React from "react";
import { SocialTab } from "../SocialTab";
import type { UsePageSettingsReturn } from "../usePageSettings";
import type { PageItem } from "../../types";

function makeSettings(over: Partial<UsePageSettingsReturn> = {}): UsePageSettingsReturn {
  return {
    activeTab: "social",
    setActiveTab: vi.fn(),
    seoTitle: "",
    setSeoTitle: vi.fn(),
    seoDesc: "",
    setSeoDesc: vi.fn(),
    slug: "home",
    setSlug: vi.fn(),
    slugError: null,
    seoScore: 100,
    seoChecks: { titleSet: true, slugClean: true, indexingOn: true, descSet: true },
    ogTitle: "",
    setOgTitle: vi.fn(),
    ogDesc: "",
    setOgDesc: vi.fn(),
    ogImageUrl: null,
    setOgImageUrl: vi.fn(),
    visibility: "live",
    setVisibility: vi.fn(),
    password: "",
    setPassword: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    allowIndex: true,
    setAllowIndex: vi.fn(),
    allowFollow: true,
    setAllowFollow: vi.fn(),
    customHead: "",
    setCustomHead: vi.fn(),
    headCodeError: null,
    copyPassword: vi.fn(),
    domain: null,
    saveState: "clean",
    isDirty: false,
    save: vi.fn(),
    discard: vi.fn(),
    showDiscardConfirm: false,
    setShowDiscardConfirm: vi.fn(),
    pendingTabChange: null,
    confirmTabChange: vi.fn(),
    cancelTabChange: vi.fn(),
    ...over,
  };
}

function makePage(over: Partial<PageItem> = {}): PageItem {
  return { id: "p1", name: "Home", slug: "home", status: "draft", ...over };
}

beforeEach(() => vi.clearAllMocks());

describe("SocialTab OG fields", () => {
  it("forwards OG title / description input to their setters", () => {
    const s = makeSettings();
    render(<SocialTab s={s} page={makePage()} />);
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
    render(<SocialTab s={s} page={makePage()} />);
    const img = document.getElementById("og-image") as HTMLInputElement;
    expect(img.value).toBe("https://img.example/pic.png");
    fireEvent.change(img, { target: { value: "" } });
    expect(s.setOgImageUrl).toHaveBeenCalledWith(null);
  });

  it("passes a non-empty image URL straight through", () => {
    const s = makeSettings();
    render(<SocialTab s={s} page={makePage()} />);
    fireEvent.change(document.getElementById("og-image") as HTMLInputElement, {
      target: { value: "https://img.example/new.png" },
    });
    expect(s.setOgImageUrl).toHaveBeenCalledWith("https://img.example/new.png");
  });

  it("shows OG title/description char counters", () => {
    const s = makeSettings({ ogTitle: "abc", ogDesc: "de" });
    render(<SocialTab s={s} page={makePage()} />);
    expect(screen.getByText("3/60")).toBeTruthy();
    expect(screen.getByText("2/160")).toBeTruthy();
  });
});

describe("SocialTab preview card fallbacks", () => {
  it("falls back to seoTitle then page.name when ogTitle is empty", () => {
    const withSeo = makeSettings({ ogTitle: "", seoTitle: "SEO Fallback Title" });
    const { rerender } = render(<SocialTab s={withSeo} page={makePage({ name: "Home" })} />);
    expect(screen.getByText("SEO Fallback Title")).toBeTruthy();

    const noSeo = makeSettings({ ogTitle: "", seoTitle: "" });
    rerender(<SocialTab s={noSeo} page={makePage({ name: "Landing Page" })} />);
    expect(screen.getByText("Landing Page")).toBeTruthy();
  });

  it("prefers ogTitle over seoTitle in the preview", () => {
    const s = makeSettings({ ogTitle: "OG Wins", seoTitle: "SEO Loses" });
    render(<SocialTab s={s} page={makePage()} />);
    expect(screen.getByText("OG Wins")).toBeTruthy();
    expect(screen.queryByText("SEO Loses")).toBeNull();
  });

  it("shows the placeholder description prompt when no description is available", () => {
    const s = makeSettings({ ogDesc: "", seoDesc: "" });
    render(<SocialTab s={s} page={makePage()} />);
    expect(screen.getByText("Add a description to preview here")).toBeTruthy();
  });

  it("renders the OG image in the preview when an image URL is set", () => {
    const s = makeSettings({ ogImageUrl: "https://img.example/pic.png" });
    const { container } = render(<SocialTab s={s} page={makePage()} />);
    const img = container.querySelector('img[src="https://img.example/pic.png"]');
    expect(img).toBeTruthy();
    // Placeholder dimensions text is not shown when an image exists
    expect(screen.queryByText("1200 × 630")).toBeNull();
  });

  it("shows the 1200 × 630 placeholder when no image is set", () => {
    const s = makeSettings({ ogImageUrl: null });
    render(<SocialTab s={s} page={makePage()} />);
    expect(screen.getByText("1200 × 630")).toBeTruthy();
  });

  it("uses the custom domain in the preview when provided", () => {
    const s = makeSettings({ domain: "acme.com" });
    render(<SocialTab s={s} page={makePage()} />);
    expect(screen.getByText("acme.com")).toBeTruthy();
  });
});
