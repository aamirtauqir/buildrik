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
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@/shared/utils/openai", () => ({
  generateContent: vi.fn(async () => "AI Suggested Title"),
}));

import * as React from "react";
import { SeoTab } from "../SeoTab";
import type { UsePageSettingsReturn } from "../usePageSettings";
import type { PageItem } from "../../types";
import type { Composer } from "@/engine";


// ── Factory for the `s` prop (full UsePageSettingsReturn) ────────────────────

function makeSettings(over: Partial<UsePageSettingsReturn> = {}): UsePageSettingsReturn {
  return {
    activeTab: "seo",
    setActiveTab: vi.fn(),
    publishedUrl: null,
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
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    const input = document.getElementById("seo-title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x".repeat(90) } });
    expect(s.setSeoTitle).toHaveBeenCalledWith("x".repeat(60));
  });

  it("appends the range label to the counter (Ideal at 55 chars)", () => {
    const s = makeSettings({ seoTitle: "a".repeat(55) });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    expect(screen.getByText("55/60 · Ideal")).toBeTruthy();
  });

  // FIXED: the title input's maxLength and onChange slice now equal the shown
  // /60 counter, so the enforced limit and the denominator agree.
  it("counter denominator matches the enforced input maxLength (60)", () => {
    const s = makeSettings({ seoTitle: "a".repeat(60) });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    const input = document.getElementById("seo-title") as HTMLInputElement;
    expect(input.maxLength).toBe(60);
    expect(screen.getByText(/60\/60/)).toBeTruthy();
  });

  it('shows "Write with AI" only when the title is under 10 chars, and it calls the AI service', async () => {
    const s = makeSettings({ seoTitle: "Hi" });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    const btn = screen.getByRole("button", { name: /suggest seo title/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    const { generateContent } = await import("@/shared/utils/openai");
    expect(generateContent).toHaveBeenCalled();
  });

  it('hides "Write with AI" once the title reaches 10 chars', () => {
    const s = makeSettings({ seoTitle: "Long Title Here" });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    expect(screen.queryByRole("button", { name: /suggest seo title/i })).toBeNull();
  });
});

// ── Description field ────────────────────────────────────────────────────────

describe("SeoTab meta description field", () => {
  it("slices description input to 160 chars on change (matches the /160 counter)", () => {
    const s = makeSettings({ seoDesc: "" });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    const ta = document.getElementById("seo-desc") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "y".repeat(250) } });
    expect(s.setSeoDesc).toHaveBeenCalledWith("y".repeat(160));
  });

  // FIXED: the description onChange slice now equals the shown /160 counter, so
  // a value at the enforced cap reads "160/160" — the two agree.
  it("description counter denominator matches the enforced slice limit (160)", () => {
    const s = makeSettings({ seoDesc: "z".repeat(160) });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    expect(screen.getByText("160/160")).toBeTruthy();
  });
});

// ── SEO score card ───────────────────────────────────────────────────────────

describe("SeoTab score card", () => {
  it('shows "Looks good" when score >= 80', () => {
    const s = makeSettings({ seoScore: 85 });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    expect(screen.getByText("Looks good")).toBeTruthy();
    expect(screen.getByText("85")).toBeTruthy();
  });

  it('shows "Needs work" and the "Reach 80+" banner when score < 80 and indexing on', () => {
    const s = makeSettings({
      seoScore: 40,
      allowIndex: true,
      seoChecks: { titleSet: false, slugClean: true, indexingOn: true, descSet: false },
    });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
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
    render(<SeoTab s={s} page={makePage()} composer={null} />);
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
    render(<SeoTab s={s} page={makePage()} composer={null} />);
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
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    const input = document.getElementById("seo-slug") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "About Page" } });
    expect(s.setSlug).toHaveBeenCalledWith("About Page");
  });

  it("renders the slug error message and marks the input invalid", () => {
    const s = makeSettings({ slug: "bad", slugError: "Slug must be lowercase" });
    render(<SeoTab s={s} page={makePage()} composer={null} />);
    expect(screen.getByText("Slug must be lowercase")).toBeTruthy();
    const input = document.getElementById("seo-slug") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  /* These two asserted the OLD gate — `page.status === "live"` — and so pinned
     the defect they were written beside: status is `settings.visibility ??
     "draft"`, a per-page field nobody sets unless they open the Advanced tab,
     so the warning never fired for a real user while this test proved it did.
     The contract is now the site being reachable. */
  it("warns when the slug changes on a site that is published", () => {
    const s = makeSettings({ slug: "home-v2", slugError: null, publishedUrl: "https://acme.example" });
    render(<SeoTab s={s} page={makePage({ slug: "home", status: "draft" })} composer={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Changing this URL will break existing links/);
  });

  it("stays silent on a site that has never been published, whatever the page status says", () => {
    const s = makeSettings({ slug: "home-v2", slugError: null, publishedUrl: null });
    render(<SeoTab s={s} page={makePage({ slug: "home", status: "live" })} composer={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  /* The negative that keeps the gate honest: publishing a site must not make
     every slug field shout. No pending change, no warning. */
  it("stays silent when the slug has not changed, even on a published site", () => {
    const s = makeSettings({ slug: "home", slugError: null, publishedUrl: "https://acme.example" });
    render(<SeoTab s={s} page={makePage({ slug: "home", status: "live" })} composer={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

/* A grey tick with no reason beside it is a puzzle, not advice. "Clean URL
   slug" goes grey on a slug that LOOKS clean — page-4 is lowercase, hyphenated
   and valid — because it is the shape the app itself generates and it earns
   only 20 of the 30 the panel advertises. The banner has to say so. */
describe("SeoTab — a placeholder slug is explained where it is fixed", () => {
  const settings = (over: Record<string, unknown>) =>
    ({ ...makeSettings(), seoScore: 30, seoChecks: { titleSet: false, slugClean: false, indexingOn: true, descSet: false }, ...over }) as never;

  it("says so under the slug field, naming the slug and what fixing it is worth", () => {
    render(<SeoTab s={settings({ slug: "page-4" })} page={makePage()} composer={null} />);
    const hint = document.getElementById("seo-slug")?.getAttribute("aria-describedby");
    expect(hint).toBe("seo-slug-hint");
    expect(screen.getByText(/is a numbered URL/).textContent).toMatch(/page-4/);
    expect(screen.getByText(/is a numbered URL/).textContent).toMatch(/\+10 pts/);
  });

  /* The banner stays ONE clause. Chaining the slug reason onto it with a
     second em-dash turned a 260px amber box into a two-line run-on — caught by
     looking at the rendered panel, not at the JSX. */
  it("keeps the reason OUT of the reach-80 banner", () => {
    render(<SeoTab s={settings({ slug: "page-4" })} page={makePage()} composer={null} />);
    const note = screen.getByRole("note").textContent ?? "";
    expect(note).not.toMatch(/auto-generated/);
    expect(note.split("—").length).toBeLessThanOrEqual(2);
  });

  it("shows the plain format rule when the slug is a real one", () => {
    render(<SeoTab s={settings({ slug: "pricing", seoChecks: { titleSet: false, slugClean: true, indexingOn: true, descSet: false } })} page={makePage()} composer={null} />);
    expect(screen.queryByText(/is a numbered URL/)).toBeNull();
    expect(screen.getByText(/Lowercase letters/)).toBeTruthy();
  });

  /* An empty or rejected slug also greys the tick, and calling THAT a
     numbered URL would be a second wrong explanation. */
  it("does not call an empty slug a numbered URL", () => {
    render(<SeoTab s={settings({ slug: "", seoScore: 20 })} page={makePage()} composer={null} />);
    expect(screen.queryByText(/is a numbered URL/)).toBeNull();
  });
});

/* Clone 3519:19920's door. A SAVED slug change — `page.slug` moving under the
   same page id, which is the engine's word, not the field's — offers the
   redirect right under the slug field. `Add redirect` leaves for Settings ›
   Redirects through the composer with the draft prefilled; `Not now` answers
   that one change. */
describe("SeoTab — the redirect offer after a saved slug change", () => {
  const about = (over: Partial<PageItem> = {}): PageItem =>
    ({ id: "p-about", name: "About", slug: "about", ...over });
  const OFFER = "page-seo-redirect-offer";
  const composer = () => ({ emit: vi.fn() }) as unknown as Composer & { emit: ReturnType<typeof vi.fn> };

  it("is absent while nothing has been saved — the same slug, or one only typed so far", () => {
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={null} />);
    expect(screen.queryByTestId(OFFER)).toBeNull();
    // The field holds a new slug the autosave has not landed yet.
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about()} composer={null} />);
    expect(screen.queryByTestId(OFFER)).toBeNull();
  });

  it("appears once the saved slug has changed, naming both public paths in one sentence", () => {
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about({ slug: "about-us" })} composer={null} />);
    expect(screen.getByTestId(OFFER)).toHaveTextContent(
      "URL changed from /about to /about-us. Add a redirect so old links keep working?",
    );
    expect(screen.getByTestId("page-seo-redirect-add")).toHaveTextContent("Add redirect");
    expect(screen.getByTestId("page-seo-redirect-later")).toHaveTextContent("Not now");
  });

  /* One emit, `ui:settings-open`: StudioPanels (always mounted) switches the
     tab and hands the draft down. A `ui:switch-tab` first would be harmless
     but is not needed. */
  it("Add redirect asks for Settings › Redirects with the repair draft, then leaves", () => {
    const c = composer();
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={c} />);
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about({ slug: "about-us" })} composer={c} />);
    fireEvent.click(screen.getByTestId("page-seo-redirect-add"));
    expect(c.emit.mock.calls).toEqual([
      [
        "ui:settings-open",
        { screen: "redirects", repair: { pageId: "p-about", pageName: "About", from: "/about", to: "/about-us" } },
      ],
    ]);
    expect(screen.queryByTestId(OFFER)).toBeNull();
  });

  it("Not now dismisses it for that change and it stays dismissed; a further change is a new offer", () => {
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about({ slug: "about-us" })} composer={null} />);
    fireEvent.click(screen.getByTestId("page-seo-redirect-later"));
    expect(screen.queryByTestId(OFFER)).toBeNull();
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about({ slug: "about-us" })} composer={null} />);
    expect(screen.queryByTestId(OFFER)).toBeNull();
    rerender(<SeoTab s={makeSettings({ slug: "about-team" })} page={about({ slug: "about-team" })} composer={null} />);
    expect(screen.getByTestId(OFFER)).toHaveTextContent("from /about to /about-team");
  });

  /* Autosave lands at every 500ms pause. A slug typed in two pauses saves
     twice, and the redirect worth having is from the URL the page HAD, not
     from the half-typed one the first save recorded. */
  it("measures from the slug the tab opened on, across several saves", () => {
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "about-u" })} page={about({ slug: "about-u" })} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about({ slug: "about-us" })} composer={null} />);
    expect(screen.getByTestId(OFFER)).toHaveTextContent("URL changed from /about to /about-us.");
  });

  it("withdraws when the slug is put back to what it was", () => {
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "about-us" })} page={about({ slug: "about-us" })} composer={null} />);
    expect(screen.getByTestId(OFFER)).toBeInTheDocument();
    rerender(<SeoTab s={makeSettings({ slug: "about" })} page={about({ slug: "about" })} composer={null} />);
    expect(screen.queryByTestId(OFFER)).toBeNull();
  });

  /* The home page answers on `/` whatever its slug says, so no URL moved. */
  it("never offers one for the home page", () => {
    const home = (slug: string): PageItem => ({ id: "p-home", name: "Home", slug, isHome: true });
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "home" })} page={home("home")} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "start" })} page={home("start")} composer={null} />);
    expect(screen.queryByTestId(OFFER)).toBeNull();
  });

  it("starts a fresh baseline when the drawer moves to another page", () => {
    const contact = (slug: string): PageItem => ({ id: "p-contact", name: "Contact", slug });
    const { rerender } = render(<SeoTab s={makeSettings({ slug: "about" })} page={about()} composer={null} />);
    rerender(<SeoTab s={makeSettings({ slug: "contact" })} page={contact("contact")} composer={null} />);
    expect(screen.queryByTestId(OFFER)).toBeNull();
    rerender(<SeoTab s={makeSettings({ slug: "contact-us" })} page={contact("contact-us")} composer={null} />);
    expect(screen.getByTestId(OFFER)).toHaveTextContent("from /contact to /contact-us");
  });
});
