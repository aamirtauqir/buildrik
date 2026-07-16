// @vitest-environment jsdom
/**
 * SeoTab — pure form renderer. Tests field behavior, counters, slug warning,
 * noIndex banner, and the AI "Write with AI" affordance.
 *
 * Two KNOWN defects are pinned here (assert-current, do NOT fix):
 *   - "SEO counter mismatches": the char counters cap at 60/160 while the
 *     inputs actually accept 80/200.
 *   - "score-label lies": the per-check point annotations (+20/+30/+10/+40)
 *     are hardcoded and do not correspond to calculateSeoScore's real weights.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render as rtlRender, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@/shared/utils/openai", () => ({
  generateContent: vi.fn(async () => "AI Suggested Title"),
}));

import * as React from "react";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { SeoTab } from "../SeoTab";
import type { UsePageSettingsReturn } from "../usePageSettings";
import type { PageItem } from "../../types";

// SeoTab mounts a Radix Tooltip (info icon on the description field), which
// requires a TooltipProvider ancestor.
const render = (ui: React.ReactElement) =>
  rtlRender(<TooltipProvider>{ui}</TooltipProvider>);

// ── Factory for the `s` prop (full UsePageSettingsReturn) ────────────────────

function makeSettings(over: Partial<UsePageSettingsReturn> = {}): UsePageSettingsReturn {
  return {
    activeTab: "seo",
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

// ── Title field ──────────────────────────────────────────────────────────────

describe("SeoTab title field", () => {
  it("slices title input to 80 chars on change", () => {
    const s = makeSettings({ seoTitle: "" });
    render(<SeoTab s={s} page={makePage()} />);
    const input = document.getElementById("seo-title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x".repeat(90) } });
    expect(s.setSeoTitle).toHaveBeenCalledWith("x".repeat(80));
  });

  it("appends the range label to the counter (Ideal at 55 chars)", () => {
    const s = makeSettings({ seoTitle: "a".repeat(55) });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("55/60 · Ideal")).toBeTruthy();
  });

  // KNOWN (pin): "SEO counter mismatches" — the title input's maxLength is 80
  // and onChange slices to 80, but the counter denominator is hardcoded 60.
  // A 70-char title is accepted yet the counter reads "70/60" (over its own cap).
  it("KNOWN (pin): counter caps at /60 while the input accepts up to 80", () => {
    const s = makeSettings({ seoTitle: "a".repeat(70) });
    render(<SeoTab s={s} page={makePage()} />);
    const input = document.getElementById("seo-title") as HTMLInputElement;
    expect(input.maxLength).toBe(80); // real limit is 80…
    expect(screen.getByText(/70\/60/)).toBeTruthy(); // …but counter says /60
  });

  it('shows "Write with AI" only when the title is under 10 chars, and it calls the AI service', async () => {
    const s = makeSettings({ seoTitle: "Hi" });
    render(<SeoTab s={s} page={makePage()} />);
    const btn = screen.getByRole("button", { name: /suggest seo title/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    const { generateContent } = await import("@/shared/utils/openai");
    expect(generateContent).toHaveBeenCalled();
  });

  it('hides "Write with AI" once the title reaches 10 chars', () => {
    const s = makeSettings({ seoTitle: "Long Title Here" });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.queryByRole("button", { name: /suggest seo title/i })).toBeNull();
  });
});

// ── Description field ────────────────────────────────────────────────────────

describe("SeoTab meta description field", () => {
  it("slices description input to 200 chars on change", () => {
    const s = makeSettings({ seoDesc: "" });
    render(<SeoTab s={s} page={makePage()} />);
    const ta = document.getElementById("seo-desc") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "y".repeat(250) } });
    expect(s.setSeoDesc).toHaveBeenCalledWith("y".repeat(200));
  });

  // KNOWN (pin): "SEO counter mismatches" — description onChange slices to 200
  // but the counter denominator is hardcoded 160. A 180-char description is
  // accepted yet the counter reads "180/160".
  it("KNOWN (pin): description counter caps at /160 while input accepts up to 200", () => {
    const s = makeSettings({ seoDesc: "z".repeat(180) });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("180/160")).toBeTruthy();
  });
});

// ── SEO score card ───────────────────────────────────────────────────────────

describe("SeoTab score card", () => {
  it('shows "Looks good" when score >= 80', () => {
    const s = makeSettings({ seoScore: 85 });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("Looks good")).toBeTruthy();
    expect(screen.getByText("85")).toBeTruthy();
  });

  it('shows "Needs work" and the "Reach 80+" banner when score < 80 and indexing on', () => {
    const s = makeSettings({
      seoScore: 40,
      allowIndex: true,
      seoChecks: { titleSet: false, slugClean: true, indexingOn: true, descSet: false },
    });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("Needs work")).toBeTruthy();
    expect(screen.getByRole("note")).toHaveTextContent(/Reach 80\+ before publishing/);
    // descSet false → banner suggests adding a meta description
    expect(screen.getByRole("note")).toHaveTextContent(/add a meta description/);
  });

  // KNOWN (pin): "score-label lies" — the per-check point annotations are
  // hardcoded (+20 title / +30 desc / +10 slug / +40 indexing, summing to 100)
  // and do NOT match calculateSeoScore's real weighting (title 10-or-20 +10 at
  // >=30; slug 20 +10; desc 15-or-30 +10 at >=100; indexing gates to 0 rather
  // than awarding 40). These strings render regardless of the numeric score.
  it("KNOWN (pin): check-point annotations are hardcoded and unrelated to the real score", () => {
    const s = makeSettings({ seoScore: 100 });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("+20 pts")).toBeTruthy(); // Page title
    expect(screen.getByText("+30 pts")).toBeTruthy(); // Meta description
    expect(screen.getByText("+10 pts")).toBeTruthy(); // Clean URL slug
    expect(screen.getByText("+40 pts")).toBeTruthy(); // Allow indexing — never awarded by calculateSeoScore
  });

  it("hides the score card and shows the noIndex alert when allowIndex is false", () => {
    const s = makeSettings({ allowIndex: false });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/noIndex is ON/);
    // Turn-on affordance flips indexing back on
    fireEvent.click(screen.getByRole("button", { name: /turn indexing on/i }));
    expect(s.setAllowIndex).toHaveBeenCalledWith(true);
  });
});

// ── Slug field ───────────────────────────────────────────────────────────────

describe("SeoTab slug field", () => {
  it("forwards raw slug input to setSlug", () => {
    const s = makeSettings({ slug: "home" });
    render(<SeoTab s={s} page={makePage()} />);
    const input = document.getElementById("seo-slug") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "About Page" } });
    expect(s.setSlug).toHaveBeenCalledWith("About Page");
  });

  it("renders the slug error message and marks the input invalid", () => {
    const s = makeSettings({ slug: "bad", slugError: "Slug must be lowercase" });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("Slug must be lowercase")).toBeTruthy();
    const input = document.getElementById("seo-slug") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("shows the destructive-change warning when slug changes on a live page", () => {
    const s = makeSettings({ slug: "home-v2", slugError: null });
    render(<SeoTab s={s} page={makePage({ slug: "home", status: "live" })} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Changing this URL will break existing links/);
  });

  it("does not show the destructive warning when the page is not live", () => {
    const s = makeSettings({ slug: "home-v2", slugError: null });
    render(<SeoTab s={s} page={makePage({ slug: "home", status: "draft" })} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
