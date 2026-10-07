// @vitest-environment jsdom
/**
 * usePageSettings — drawer state hook: seed-from-page, dirty tracking, save
 * (calls elements.updatePage), and save guards (slug error,
 * head-code validation). Also corroborates the score algorithm: indexing is
 * an all-or-nothing gate on the numeric score (SeoTab now labels it "Required",
 * not the former fictional "+40 pts").
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { addToastMock, api, site } = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  api: {
    siteDetail: {
      settings: { get: { query: vi.fn() } },
      domains: { list: { query: vi.fn() } },
    },
  },
  site: { id: null as string | null },
}));

vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => api }));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  getSiteIdFromUrl: () => site.id,
}));

vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
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

beforeEach(() => {
  addToastMock.mockClear();
  site.id = null;
  api.siteDetail.settings.get.query.mockReset().mockResolvedValue({ canonicalUrl: null });
  api.siteDetail.domains.list.query.mockReset().mockResolvedValue([]);
});

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

  /* D1 (QA 2026-10-05, owner 2026-10-06 "empty field + placeholder"): the
     field used to be seeded with page.name, and save() wrote that back as the
     page's own title — every page the drawer saved opted out of the site's
     default title. The field now holds only the page's OWN title; what the
     page inherits is offered as the placeholder. */
  it("starts the title field EMPTY when the page has no own title, and offers the inherited site default", () => {
    const composer = createMockComposer({ projectSettings: { seo: { metaTitle: "Bella Default Title" } } });
    const { result } = setup(composer, page({ name: "About Us", seo: undefined }));
    expect(result.current.seoTitle).toBe("");
    expect(result.current.inheritedTitle).toBe("Bella Default Title");
    expect(result.current.effectiveTitle).toBe("Bella Default Title");
  });

  it("without a site default, the inherited title is the page name through the site template — as exported", () => {
    const composer = createMockComposer({ projectSettings: { seo: { metaTitleTemplate: "{page_title} | Acme" } } });
    const { result } = setup(composer, page({ name: "Blog Post", seo: undefined }));
    expect(result.current.seoTitle).toBe("");
    expect(result.current.inheritedTitle).toBe("Blog Post | Acme");
  });

  it("a typed title is the effective one (through the template, as exported)", () => {
    const composer = createMockComposer({ projectSettings: { seo: { metaTitle: "Bella Default Title", metaTitleTemplate: "{page_title} | Acme" } } });
    const { result } = setup(composer, page({ name: "About", seo: undefined }));
    act(() => result.current.setSeoTitle("Our story"));
    expect(result.current.effectiveTitle).toBe("Our story | Acme");
    expect(result.current.inheritedTitle).toBe("Bella Default Title");
  });

  /* #21 / #26: a legacy password page arrives as "hidden" (usePages maps it —
     see usePages.test "legacy password pages"); the drawer reads it Hidden. */
  it("reads a hidden page as hidden", () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ status: "hidden" }));
    expect(result.current.visibility).toBe("hidden");
  });

});

// ── The host the previews name (D2) ─────────────────────────────────────────

/* D2 (QA 2026-10-05): the drawer read `metadata.domain`, filled from a
   `sites.get` field that does not exist, so every preview said yoursite.com.
   The host is now the one the publish worker uses (and the robots.txt preview
   since f4f1fbbb4): the typed canonical, else the VERIFIED PRIMARY custom
   domain, else where the site is published. */
describe("usePageSettings domain — the publish worker's host order", () => {
  const primary = { domain: "qa-seo-dns.example", status: "VERIFIED", isPrimary: true };

  it("names the typed canonical domain first", async () => {
    site.id = "s1";
    api.siteDetail.settings.get.query.mockResolvedValue({ canonicalUrl: "https://www.typed.example/" });
    api.siteDetail.domains.list.query.mockResolvedValue([primary]);
    const { result } = setup(createMockComposer({}), page());
    await waitFor(() => expect(result.current.domain).toBe("www.typed.example"));
    expect(api.siteDetail.settings.get.query).toHaveBeenCalledWith({ siteId: "s1" });
    expect(api.siteDetail.domains.list.query).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("else the verified primary custom domain", async () => {
    site.id = "s1";
    api.siteDetail.domains.list.query.mockResolvedValue([
      { domain: "other.example", status: "VERIFIED", isPrimary: false },
      primary,
    ]);
    const { result } = setup(createMockComposer({ projectMetadata: { publishedUrl: "https://proj.vercel.app" } }), page());
    await waitFor(() => expect(result.current.domain).toBe("qa-seo-dns.example"));
  });

  it("else the host the site is published on — never an unverified or non-primary domain", async () => {
    site.id = "s1";
    api.siteDetail.domains.list.query.mockResolvedValue([
      { domain: "pending.example", status: "PENDING", isPrimary: true },
      { domain: "other.example", status: "VERIFIED", isPrimary: false },
    ]);
    const { result } = setup(createMockComposer({ projectMetadata: { publishedUrl: "https://proj.vercel.app/" } }), page());
    await waitFor(() => expect(api.siteDetail.domains.list.query).toHaveBeenCalled());
    await waitFor(() => expect(result.current.domain).toBe("proj.vercel.app"));
  });

  it("is null when nothing is known (the tabs then say yoursite.com)", () => {
    const { result } = setup(createMockComposer({ projectMetadata: { domain: "stale.example" } }), page());
    expect(result.current.domain).toBeNull();
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

  /* SEO-P2-4: the form owns only some SEO fields. Saving used to replace
     settings.seo wholesale and erase the rest (canonical URL, structured
     data, Twitter card) — fields the exporter ships. */
  it("keeps the SEO fields the form does not own", async () => {
    const composer = createMockComposer({});
    const p = page({
      seo: {
        metaTitle: "Old title",
        canonicalUrl: "https://example.com/about",
        structuredData: { "@type": "Organization", name: "Bella" },
        twitterCard: "summary_large_image",
      },
    });
    const { result } = setup(composer, p);
    act(() => result.current.setSeoTitle("New title"));
    await act(async () => {
      await result.current.save();
    });
    const [, patch] = (composer.elements.updatePage as unknown as Mock).mock.calls[0];
    expect(patch.settings.seo).toMatchObject({
      metaTitle: "New title",
      canonicalUrl: "https://example.com/about",
      structuredData: { "@type": "Organization", name: "Bella" },
      twitterCard: "summary_large_image",
    });
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

  /* D1: editing only the description must not stamp the page name in as the
     page's own title (live: "Blog Post | Acme" shipped instead of the site
     default). */
  it("saves NO own title when the page had none and only the description was edited", async () => {
    const composer = createMockComposer({ projectSettings: { seo: { metaTitle: "Bella Default Title" } } });
    const { result } = setup(composer, page({ name: "Blog Post", seo: undefined }));
    act(() => result.current.setSeoDesc("A post about bread."));
    await act(async () => {
      await result.current.save();
    });
    const [, patch] = (composer.elements.updatePage as unknown as Mock).mock.calls[0];
    expect(patch.settings.seo.metaTitle).toBeUndefined();
    expect(patch.settings.seo.metaDescription).toBe("A post about bread.");
  });

  it("clearing a saved own title saves no own title (the page inherits again)", async () => {
    const composer = createMockComposer({});
    const { result } = setup(composer, page({ seo: { metaTitle: "Old title" } }));
    act(() => result.current.setSeoTitle(""));
    await act(async () => {
      await result.current.save();
    });
    const [, patch] = (composer.elements.updatePage as unknown as Mock).mock.calls[0];
    expect(patch.settings.seo.metaTitle).toBeUndefined();
  });

  /* #20: Done is the retry — the failure toast carries no Retry action. */
  it("sets saveState=error, resolves false and offers no Retry when updatePage rejects", async () => {
    const composer = createMockComposer({});
    (composer.elements.updatePage as unknown as Mock).mockRejectedValueOnce(new Error("boom"));
    const { result } = setup(composer, page());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.save();
    });

    await waitFor(() => expect(result.current.saveState).toBe("error"));
    expect(ok).toBe(false);
    const toast = lastToast();
    expect(toast).toMatchObject({ tone: "error" });
    expect(toast?.action).toBeUndefined();
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

  /* D1: an empty field is not a missing title — the page ships the inherited
     one, so the score and the "Page title" check grade that. */
  it("grades the inherited title when the field is empty", () => {
    const composer = createMockComposer({ projectSettings: { seo: { metaTitle: "Bella Cucina — handmade pasta daily" } } });
    const { result } = setup(composer, page({ slug: "about-us", seo: undefined }));
    expect(result.current.seoTitle).toBe("");
    expect(result.current.seoChecks.titleSet).toBe(true);
    // title 30 (35 chars) + slug 30 + desc 0 = 60
    expect(result.current.seoScore).toBe(60);
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
