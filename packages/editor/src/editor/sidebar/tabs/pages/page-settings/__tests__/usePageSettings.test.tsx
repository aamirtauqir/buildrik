// @vitest-environment jsdom
/**
 * usePageSettings — drawer state hook: seed-from-page, dirty tracking, save
 * (calls elements.updatePage), and save guards (slug error, empty password,
 * head-code validation). Also corroborates the score algorithm: indexing is
 * an all-or-nothing gate on the numeric score (SeoTab now labels it "Required",
 * not the former fictional "+40 pts").
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { addToastMock } = vi.hoisted(() => ({ addToastMock: vi.fn() }));

vi.mock("@/editor/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/ui")>()),
  ...{
  useToast: () => ({ addToast: addToastMock, removeToast: vi.fn(), toasts: [] }),
},
}));

import { usePageSettings } from "../usePageSettings";
import {
  createMockComposer,
  type MockComposer,
} from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import type { PageItem } from "../../types";

interface ToastArg {
  description?: string;
  tone?: string;
  action?: { label: string; onClick: () => void };
}
const lastToast = () => addToastMock.mock.calls.at(-1)?.[0] as ToastArg | undefined;

function page(over: Partial<PageItem> = {}): PageItem {
  return { id: "p1", name: "Home", slug: "home", status: "draft", ...over };
}

function setup(composer: MockComposer, p: PageItem, all: PageItem[] = [p]) {
  return renderHook(({ page: pg }) => usePageSettings(composer, pg, all), {
    initialProps: { page: p },
  });
}

beforeEach(() => addToastMock.mockClear());

// ── Seed from page ───────────────────────────────────────────────────────────

describe("usePageSettings seed", () => {
  it("seeds fields from page.seo / page.slug and starts clean + not dirty", () => {
    const composer = createMockComposer({});
    const p = page({
      name: "Home",
      slug: "home",
      seo: { metaTitle: "My Title", metaDescription: "My description", noIndex: true },
    });
    const { result } = setup(composer, p);

    expect(result.current.seoTitle).toBe("My Title");
    expect(result.current.seoDesc).toBe("My description");
    expect(result.current.slug).toBe("home");
    expect(result.current.allowIndex).toBe(false); // noIndex:true → allowIndex:false
    expect(result.current.saveState).toBe("clean");
    expect(result.current.isDirty).toBe(false);
  });

  it("falls back to page.name for the SEO title when no metaTitle is set", () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ name: "About Us", seo: undefined }));
    expect(result.current.seoTitle).toBe("About Us");
  });

  it("maps password status to visibility=password", () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ status: "password" }));
    expect(result.current.visibility).toBe("password");
  });

  it("exposes the project domain from composer metadata", () => {
    const composer = createMockComposer({ projectMetadata: { domain: "acme.dev" } });
    const { result } = setup(composer, page());
    expect(result.current.domain).toBe("acme.dev");
  });
});

// ── Dirty tracking ───────────────────────────────────────────────────────────

describe("usePageSettings dirty tracking", () => {
  it("flips isDirty true after a field change and back false when reverted", () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ seo: { metaTitle: "Original" } }));
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.setSeoTitle("Changed"));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.setSeoTitle("Original"));
    expect(result.current.isDirty).toBe(false);
  });

  it("discard restores the persisted snapshot", () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ seo: { metaTitle: "Original" } }));
    act(() => result.current.setSeoTitle("Changed"));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.discard());
    expect(result.current.seoTitle).toBe("Original");
    expect(result.current.isDirty).toBe(false);
  });
});

// ── setSlug validation ───────────────────────────────────────────────────────

describe("usePageSettings slug validation", () => {
  it("sets a slugError when the slug is emptied", () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page());
    act(() => result.current.setSlug(""));
    expect(result.current.slugError).toBe("URL slug cannot be empty");
  });

  it("flags a duplicate slug against another page", () => {
    const composer = createMockComposer({});
    const p1 = page({ id: "p1", slug: "home" });
    const p2 = page({ id: "p2", name: "About", slug: "about" });
    const { result } = setup(composer, p1, [p1, p2]);
    act(() => result.current.setSlug("about"));
    expect(result.current.slugError).toMatch(/already used by "About"/);
  });
});

// ── save ─────────────────────────────────────────────────────────────────────

describe("usePageSettings save", () => {
  it("calls elements.updatePage with the settings payload and toasts success", async () => {
    const composer = createMockComposer({});
    const p = page({
      slug: "home",
      seo: { metaTitle: "Title", metaDescription: "Desc" },
    });
    const { result } = setup(composer, p);

    await act(async () => {
      await result.current.save();
    });

    expect(composer.elements.updatePage).toHaveBeenCalledTimes(1);
    const [id, patch] = (composer.elements.updatePage as unknown as Mock).mock.calls[0];
    expect(id).toBe("p1");
    expect(patch).toMatchObject({
      slug: "home",
      settings: {
        visibility: "live",
        seo: { metaTitle: "Title", metaDescription: "Desc", noIndex: false, noFollow: false },
      },
    });
    expect(result.current.saveState).toBe("clean");
    expect(lastToast()).toMatchObject({ description: "Page settings saved", tone: "success" });
  });

  it("blocks save and warns when there is a slug error", async () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page());
    act(() => result.current.setSlug("")); // → slugError

    await act(async () => {
      await result.current.save();
    });

    expect(composer.elements.updatePage).not.toHaveBeenCalled();
    expect(lastToast()).toMatchObject({
      description: "Fix slug error before saving",
      tone: "warning",
    });
  });

  it("blocks save and warns when password visibility has no password", async () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ status: "password" }));

    await act(async () => {
      await result.current.save();
    });

    expect(composer.elements.updatePage).not.toHaveBeenCalled();
    expect(lastToast()).toMatchObject({
      description: "Set an access password before saving",
      tone: "warning",
    });
  });

  it("blocks save and sets headCodeError when the head code has an unclosed tag", async () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page());
    act(() => result.current.setCustomHead("<div>unclosed"));

    await act(async () => {
      await result.current.save();
    });

    expect(composer.elements.updatePage).not.toHaveBeenCalled();
    expect(result.current.headCodeError).toMatch(/Unclosed HTML tag/);
    expect(lastToast()).toMatchObject({ tone: "warning" });
  });

  it("sets saveState=error and offers Retry when updatePage rejects", async () => {
    const composer = createMockComposer({});
    (composer.elements.updatePage as unknown as Mock).mockRejectedValueOnce(new Error("boom"));
    const { result } = setup(composer, page());

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => expect(result.current.saveState).toBe("error"));
    const toast = lastToast();
    expect(toast).toMatchObject({ tone: "error" });
    expect(toast?.action?.label).toBe("Retry");
  });
});

// ── seoScore + the "score-label lies" corroboration ──────────────────────────

describe("usePageSettings seoScore", () => {
  it("computes a numeric score from title/desc/slug when indexing is on", () => {
    const composer = createMockComposer({});
    const { result } = setup(
      composer,
      page({
        slug: "about-us",
        seo: {
          metaTitle: "A Great SEO Title For Testing Pages", // 35 chars
          metaDescription: "x".repeat(120), // 100-160
        },
      })
    );
    // title 30(+20/+10) + slug 30(+20/+10) + desc 40(+30/+10) = 100
    expect(result.current.seoScore).toBe(100);
  });

  // Indexing is an all-or-nothing GATE in calculateSeoScore: turning it off
  // zeroes the ENTIRE score (a 100 → 0 drop, not 100 → 60). SeoTab now honestly
  // labels this row "Required" (a gate) instead of the former fictional "+40 pts".
  it("toggling indexing off zeroes the whole score (gate, not +40)", () => {
    const composer = createMockComposer({});
    const { result } = setup(
      composer,
      page({
        slug: "about-us",
        seo: {
          metaTitle: "A Great SEO Title For Testing Pages",
          metaDescription: "x".repeat(120),
        },
      })
    );
    expect(result.current.seoScore).toBe(100);

    act(() => result.current.setAllowIndex(false));
    expect(result.current.seoScore).toBe(0); // not 60 (100 - the advertised 40)
  });
});
