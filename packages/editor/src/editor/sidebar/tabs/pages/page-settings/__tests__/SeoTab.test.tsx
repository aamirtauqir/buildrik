// @vitest-environment jsdom
/**
 * SeoTab — pure form renderer. Tests field behavior, counters, slug warning,
 * noIndex banner, and the AI "Write with AI" affordance.
 *
 * Two former defects, now FIXED and asserted here:
 *   - "SEO counter mismatches": the enforced input limits (maxLength/slice)
 *     now match the shown counters — title 60, description 160.
 *   - "score-label lies": the per-check point annotations now mirror
 *     calculateSeoScore's real weights (title/slug +30, desc +40, indexing
 *     an all-or-nothing gate labelled "Required").
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
  it("slices title input to 60 chars on change (matches the /60 counter)", () => {
    const s = makeSettings({ seoTitle: "" });
    render(<SeoTab s={s} page={makePage()} />);
    const input = document.getElementById("seo-title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x".repeat(90) } });
    expect(s.setSeoTitle).toHaveBeenCalledWith("x".repeat(60));
  });

  it("appends the range label to the counter (Ideal at 55 chars)", () => {
    const s = makeSettings({ seoTitle: "a".repeat(55) });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("55/60 · Ideal")).toBeTruthy();
  });

  // FIXED: the title input's maxLength and onChange slice now equal the shown
  // /60 counter, so the enforced limit and the denominator agree.
  it("counter denominator matches the enforced input maxLength (60)", () => {
    const s = makeSettings({ seoTitle: "a".repeat(60) });
    render(<SeoTab s={s} page={makePage()} />);
    const input = document.getElementById("seo-title") as HTMLInputElement;
    expect(input.maxLength).toBe(60);
    expect(screen.getByText(/60\/60/)).toBeTruthy();
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
  it("slices description input to 160 chars on change (matches the /160 counter)", () => {
    const s = makeSettings({ seoDesc: "" });
    render(<SeoTab s={s} page={makePage()} />);
    const ta = document.getElementById("seo-desc") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "y".repeat(250) } });
    expect(s.setSeoDesc).toHaveBeenCalledWith("y".repeat(160));
  });

  // FIXED: the description onChange slice now equals the shown /160 counter, so
  // a value at the enforced cap reads "160/160" — the two agree.
  it("description counter denominator matches the enforced slice limit (160)", () => {
    const s = makeSettings({ seoDesc: "z".repeat(160) });
    render(<SeoTab s={s} page={makePage()} />);
    expect(screen.getByText("160/160")).toBeTruthy();
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

  // FIXED: the per-check point annotations now mirror calculateSeoScore's real
  // max weights — title 20(+10 at ≥30)=30, slug 20(+10)=30, desc 30(+10 at
  // ≥100)=40 (summing to 100), and indexing is an all-or-nothing gate labelled
  // "Required", not the fictional "+40 pts".
  it("check-point annotations reflect calculateSeoScore's real weights", () => {
    const s = makeSettings({ seoScore: 100 });
    render(<SeoTab s={s} page={makePage()} />);
    // title +30 and slug +30 both render this label.
    expect(screen.getAllByText("+30 pts")).toHaveLength(2);
    expect(screen.getByText("+40 pts")).toBeTruthy(); // Meta description
    expect(screen.getByText("Required")).toBeTruthy(); // Allow indexing — a gate, not additive
    // The old fictional labels are gone.
    expect(screen.queryByText("+20 pts")).toBeNull();
    expect(screen.queryByText("+10 pts")).toBeNull();
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
