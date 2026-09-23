/**
 * getSettingsOverview — the editor's Settings Overview (Clone 3397:32915).
 *
 * Every summary line comes from a column that already exists, so the fixture
 * below is the seed (`prisma/seed-settings-clone.ts`) in mock form: the same
 * counts, the same pending TXT record, the same failed 502 delivery. A second
 * fixture is the empty site, so every line's empty form is pinned too. The
 * output is run through the shared Zod contract — the editor reads exactly
 * that shape.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { settingsOverviewSchema } from "@buildrik/shared/schemas/site-detail";
import { INTEGRATION_CATALOG } from "@buildrik/shared/schemas/integrations";

const { db } = vi.hoisted(() => ({
  db: {
    site: { findUnique: vi.fn() },
    page: { findMany: vi.fn() },
    domain: { findFirst: vi.fn() },
    dnsRecord: { findMany: vi.fn() },
    redirect: { findMany: vi.fn() },
    siteAnalytics: { count: vi.fn() },
    formBlock: { count: vi.fn() },
    formSubmission: { count: vi.fn() },
    workspaceIntegration: { count: vi.fn() },
    workspaceWebhook: { findUnique: vi.fn() },
    workspaceMember: { count: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getSettingsOverview } from "@server/services/site-detail.service";

type Site = {
  name: string;
  workspaceId: string;
  defaultLocale: string;
  enabledLocales: string[];
  allowIndexing: boolean;
  robotsTxt: string | null;
  headCode: string | null;
  bodyCode: string | null;
  cspPolicy: string | null;
  hstsMaxAge: number | null;
  projectSettings: unknown;
  workspace: {
    plan: string;
    subscription: { plan: string; price: number; interval: string } | null;
  };
};

type Delivery = { status: string; event: string; httpStatus: number | null; error: string | null; createdAt: Date };

type PageRow = { id: string; name: string; slug: string; isHomePage: boolean; slugHistory: unknown; translations: unknown };

type Rows = {
  pages?: PageRow[];
  primaryDomain?: { domain: string } | null;
  pendingDns?: Array<{ type: string; host: string; domain: { domain: string } }>;
  redirects?: Array<{ fromPath: string }>;
  analyticsDays?: number;
  forms?: number;
  submissions?: number;
  connected?: number;
  webhook?: { deliveries: Delivery[] } | null;
  members?: number;
};

const emptySite: Site = {
  name: "scratch-ver",
  workspaceId: "ws1",
  defaultLocale: "en",
  enabledLocales: ["en"],
  allowIndexing: true,
  robotsTxt: null,
  headCode: "",
  bodyCode: null,
  cspPolicy: null,
  hstsMaxAge: null,
  projectSettings: null,
  workspace: { plan: "FREE", subscription: null },
};

/** The seed's shape: what `seed-settings-clone.ts` puts under the scratch site. */
const seededSite: Site = {
  ...emptySite,
  name: "Bella Cucina",
  enabledLocales: ["en", "ar"],
  robotsTxt: "User-agent: *\nAllow: /",
  headCode: "<script>ga()</script>",
  bodyCode: "<script>chat()</script>",
  cspPolicy: "default-src 'self'",
  hstsMaxAge: 31536000,
  projectSettings: {
    analytics: {
      googleAnalytics: { enabled: true, measurementId: "G-1234567890" },
      facebookPixel: { enabled: false, pixelId: "" },
      cookieConsent: { enabled: true },
    },
    customCode: { headScripts: "", bodyScripts: "", globalCss: "body { margin: 0 }" },
  },
  workspace: { plan: "PRO", subscription: { plan: "PRO", price: 2900, interval: "MONTHLY" } },
};

/** A page row as the overview selects it; `translations` and `slugHistory` default to none. */
const page = (slug: string, over: Partial<PageRow> = {}): PageRow => ({
  id: `p-${slug}`,
  name: slug,
  slug,
  isHomePage: false,
  slugHistory: null,
  translations: null,
  ...over,
});

const seededRows: Rows = {
  pages: [
    page("home", { isHomePage: true }),
    // S3: two renamed pages no redirect covers — the Overview's "2 suggestions".
    page("menu", { slugHistory: [{ slug: "lunch-menu", changedAt: "2026-09-10T09:00:00.000Z" }] }),
    page("about", { slugHistory: [{ slug: "our-story", changedAt: "2026-09-11T09:00:00.000Z" }] }),
    page("contact"),
    page("book"),
    page("gallery"),
  ],
  primaryDomain: { domain: "bellacucina.example" },
  pendingDns: [{ type: "TXT", host: "_buildrick", domain: { domain: "bellacucina.example" } }],
  redirects: [{ fromPath: "/old-menu" }, { fromPath: "/old-about" }, { fromPath: "/old-contact" }],
  analyticsDays: 7,
  forms: 3,
  submissions: 38,
  connected: 2,
  webhook: {
    deliveries: [
      { status: "FAILED", event: "site.publish", httpStatus: 502, error: "502 Bad Gateway", createdAt: new Date(new Date().getFullYear(), 6, 1) },
    ],
  },
  members: 3,
};

function setup(site: Site, rows: Rows = {}) {
  db.site.findUnique.mockResolvedValue(site);
  db.page.findMany.mockResolvedValue(rows.pages ?? []);
  db.domain.findFirst.mockResolvedValue(rows.primaryDomain ?? null);
  db.dnsRecord.findMany.mockResolvedValue(rows.pendingDns ?? []);
  db.redirect.findMany.mockResolvedValue(rows.redirects ?? []);
  db.siteAnalytics.count.mockResolvedValue(rows.analyticsDays ?? 0);
  db.formBlock.count.mockResolvedValue(rows.forms ?? 0);
  db.formSubmission.count.mockResolvedValue(rows.submissions ?? 0);
  db.workspaceIntegration.count.mockResolvedValue(rows.connected ?? 0);
  db.workspaceWebhook.findUnique.mockResolvedValue(rows.webhook ?? null);
  db.workspaceMember.count.mockResolvedValue(rows.members ?? 0);
}

beforeEach(() => {
  Object.values(db).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset()),
  );
});

describe("getSettingsOverview — the seeded site", () => {
  it("builds every line from the rows and matches the shared contract", async () => {
    setup(seededSite, seededRows);

    const overview = await getSettingsOverview("s1");

    expect(settingsOverviewSchema.safeParse(overview).success).toBe(true);
    expect(overview).toEqual({
      site: { name: "Bella Cucina", defaultLocale: "en", plan: "PRO" },
      general: { siteName: "Bella Cucina", language: "en" },
      localization: { locales: 2, notStarted: ["ar"] },
      seo: { allowIndexing: true, robotsTxtSet: true },
      domains: { primary: "bellacucina.example", pendingDns: 1 },
      redirects: { rules: 3, suggestions: 2 },
      analytics: { providers: ["googleAnalytics"], receiving: true },
      forms: { forms: 3, submissions: 38 },
      customCode: { head: true, body: true, css: true },
      headers: { csp: true, hsts: true },
      integrations: { connected: 2, available: INTEGRATION_CATALOG.length },
      webhooks: { endpoints: 1, lastDelivery: "failed" },
      members: { used: 3, seats: 5 },
      billing: { plan: "PRO", priceMonthly: 29 },
      attention: [
        {
          kind: "locale-not-started",
          title: "Arabic locale has no translated pages",
          detail: "0 of 6 pages · not started",
          section: "localization",
        },
        {
          kind: "dns-pending",
          title: "One DNS record is still pending",
          detail: "TXT _buildrick for bellacucina.example",
          section: "domains",
        },
        {
          kind: "webhook-failed",
          title: "A webhook delivery failed",
          detail: "site.publish · 502 Bad Gateway · 1 Jul",
          section: "webhooks",
        },
      ],
    });
  });

  it("reads the site once and every table once, in one round", async () => {
    setup(seededSite, seededRows);
    await getSettingsOverview("s1");

    expect(db.site.findUnique).toHaveBeenCalledTimes(1);
    for (const model of [
      db.page.findMany, db.domain.findFirst, db.dnsRecord.findMany, db.redirect.findMany,
      db.siteAnalytics.count, db.formBlock.count, db.formSubmission.count,
      db.workspaceIntegration.count, db.workspaceWebhook.findUnique, db.workspaceMember.count,
    ]) expect(model).toHaveBeenCalledTimes(1);
    // One page read serves both the translation count and the suggester (S3).
    expect(db.page.findMany).toHaveBeenCalledWith({
      where: { siteId: "s1" },
      orderBy: { position: "asc" },
      select: { id: true, name: true, slug: true, isHomePage: true, slugHistory: true, translations: true },
    });
    expect(db.workspaceMember.count).toHaveBeenCalledWith({ where: { workspaceId: "ws1", status: "ACTIVE" } });
  });
});

describe("getSettingsOverview — the empty site", () => {
  it("gives every line its empty form and no attention rows", async () => {
    setup(emptySite);

    const overview = await getSettingsOverview("s1");

    expect(settingsOverviewSchema.safeParse(overview).success).toBe(true);
    expect(overview).toEqual({
      site: { name: "scratch-ver", defaultLocale: "en", plan: "FREE" },
      general: { siteName: "scratch-ver", language: "en" },
      localization: { locales: 1, notStarted: [] },
      seo: { allowIndexing: true, robotsTxtSet: false },
      domains: { primary: null, pendingDns: 0 },
      redirects: { rules: 0, suggestions: 0 },
      analytics: { providers: [], receiving: false },
      forms: { forms: 0, submissions: 0 },
      customCode: { head: false, body: false, css: false },
      headers: { csp: false, hsts: false },
      integrations: { connected: 0, available: INTEGRATION_CATALOG.length },
      webhooks: { endpoints: 0, lastDelivery: null },
      members: { used: 0, seats: 1 },
      billing: { plan: "FREE", priceMonthly: 0 },
      attention: [],
    });
  });

  it("throws SITE_NOT_FOUND for an unknown site", async () => {
    db.site.findUnique.mockResolvedValue(null);
    await expect(getSettingsOverview("nope")).rejects.toThrow("SITE_NOT_FOUND");
  });
});

describe("localization — not started", () => {
  it("never lists the default locale: its content is Page.blocks, not a translation", async () => {
    setup({ ...emptySite, defaultLocale: "en", enabledLocales: ["en", "fr"] }, {
      pages: [page("home")],
    });
    const overview = await getSettingsOverview("s1");
    expect(overview.localization.notStarted).toEqual(["fr"]);
    expect(overview.attention.map((a) => a.title)).toEqual(["French locale has no translated pages"]);
  });

  it("a locale with one translated page is started", async () => {
    setup({ ...emptySite, enabledLocales: ["en", "fr", "de"] }, {
      pages: [page("home", { translations: { fr: { blocks: [] } } }), page("menu", { translations: {} }), page("about")],
    });
    const overview = await getSettingsOverview("s1");
    expect(overview.localization).toEqual({ locales: 3, notStarted: ["de"] });
    expect(overview.attention[0].detail).toBe("0 of 3 pages · not started");
  });

  it("counts a single page in the singular", async () => {
    setup({ ...emptySite, enabledLocales: ["en", "ar"] }, { pages: [page("home")] });
    const overview = await getSettingsOverview("s1");
    expect(overview.attention[0].detail).toBe("0 of 1 page · not started");
  });

  it("names a tag Intl cannot parse by its code", async () => {
    setup({ ...emptySite, enabledLocales: ["en", "pt_br"] });
    const overview = await getSettingsOverview("s1");
    expect(overview.attention[0].title).toBe("PT_BR locale has no translated pages");
  });
});

describe("redirects — suggestions", () => {
  it("counts the old page slugs no redirect covers — the same rule as redirects.suggestions (S3)", async () => {
    setup(emptySite, {
      redirects: [{ fromPath: "/lunch-menu" }, { fromPath: "/old-about" }],
      pages: [
        page("home"),
        page("menu", { slugHistory: [{ slug: "lunch-menu", changedAt: "2026-09-10T09:00:00.000Z" }] }),
        page("about", { slugHistory: [{ slug: "old-about", changedAt: "2026-09-11T09:00:00.000Z" }, { slug: "our-story", changedAt: "2026-09-12T09:00:00.000Z" }] }),
      ],
    });
    const overview = await getSettingsOverview("s1");
    expect(overview.redirects).toEqual({ rules: 2, suggestions: 1 });
  });
});

describe("analytics — providers", () => {
  it("lists the enabled provider ids and skips the cookie banner", async () => {
    setup({
      ...emptySite,
      projectSettings: {
        analytics: {
          googleAnalytics: { enabled: false, measurementId: "" },
          microsoftClarity: { enabled: true, projectId: "abc" },
          googleTagManager: { enabled: true, containerId: "GTM-1" },
          cookieConsent: { enabled: true },
        },
      },
    });
    const overview = await getSettingsOverview("s1");
    expect(overview.analytics).toEqual({ providers: ["microsoftClarity", "googleTagManager"], receiving: false });
  });

  it("survives a projectSettings that is not an object", async () => {
    setup({ ...emptySite, projectSettings: [1, 2] }, { analyticsDays: 2 });
    const overview = await getSettingsOverview("s1");
    expect(overview.analytics).toEqual({ providers: [], receiving: true });
    expect(overview.customCode.css).toBe(false);
  });
});

describe("custom code, SEO and headers — 'set' means non-blank", () => {
  it("treats whitespace-only code and a zero HSTS age as unset", async () => {
    setup({
      ...emptySite,
      headCode: "   ",
      bodyCode: "<script></script>",
      robotsTxt: "",
      cspPolicy: "  ",
      hstsMaxAge: 0,
      projectSettings: { customCode: { globalCss: "\n" } },
    });
    const overview = await getSettingsOverview("s1");
    expect(overview.customCode).toEqual({ head: false, body: true, css: false });
    expect(overview.seo.robotsTxtSet).toBe(false);
    expect(overview.headers).toEqual({ csp: false, hsts: false });
  });
});

describe("domains — DNS pending", () => {
  it("pluralises the title and lists every pending record", async () => {
    setup(emptySite, {
      primaryDomain: { domain: "shop.example" },
      pendingDns: [
        { type: "A", host: "@", domain: { domain: "shop.example" } },
        { type: "CNAME", host: "www", domain: { domain: "shop.example" } },
      ],
    });
    const overview = await getSettingsOverview("s1");
    expect(overview.domains).toEqual({ primary: "shop.example", pendingDns: 2 });
    expect(overview.attention).toEqual([
      {
        kind: "dns-pending",
        title: "2 DNS records are still pending",
        detail: "A @ for shop.example · CNAME www for shop.example",
        section: "domains",
      },
    ]);
  });
});

describe("webhooks — last delivery", () => {
  const ok: Delivery = { status: "OK", event: "form.submit", httpStatus: 200, error: null, createdAt: new Date() };

  it("an endpoint whose latest delivery succeeded raises nothing", async () => {
    setup(emptySite, { webhook: { deliveries: [ok] } });
    const overview = await getSettingsOverview("s1");
    expect(overview.webhooks).toEqual({ endpoints: 1, lastDelivery: "ok" });
    expect(overview.attention).toEqual([]);
  });

  it("an endpoint that never delivered has no last delivery", async () => {
    setup(emptySite, { webhook: { deliveries: [] } });
    const overview = await getSettingsOverview("s1");
    expect(overview.webhooks).toEqual({ endpoints: 1, lastDelivery: null });
  });

  it("falls back to the HTTP status, then to 'failed', when there is no error text", async () => {
    const createdAt = new Date(new Date().getFullYear(), 2, 9);
    setup(emptySite, { webhook: { deliveries: [{ ...ok, status: "FAILED", httpStatus: 503, error: null, createdAt }] } });
    expect((await getSettingsOverview("s1")).attention[0].detail).toBe("form.submit · 503 · 9 Mar");

    setup(emptySite, { webhook: { deliveries: [{ ...ok, status: "FAILED", httpStatus: null, error: null, createdAt }] } });
    expect((await getSettingsOverview("s1")).attention[0].detail).toBe("form.submit · failed · 9 Mar");
  });

  it("dates a delivery from another year with its year", async () => {
    const createdAt = new Date(2024, 11, 24);
    setup(emptySite, { webhook: { deliveries: [{ ...ok, status: "FAILED", error: "timeout", createdAt }] } });
    expect((await getSettingsOverview("s1")).attention[0].detail).toBe("form.submit · timeout · 24 Dec 2024");
  });
});

describe("billing and members", () => {
  it("reports a yearly subscription as its monthly equivalent", async () => {
    setup({ ...emptySite, workspace: { plan: "PRO", subscription: { plan: "PRO", price: 27600, interval: "YEARLY" } } });
    const overview = await getSettingsOverview("s1");
    expect(overview.billing).toEqual({ plan: "PRO", priceMonthly: 23 });
  });

  it("reads Stripe's own interval spelling", async () => {
    setup({ ...emptySite, workspace: { plan: "BUSINESS", subscription: { plan: "BUSINESS", price: 7900, interval: "month" } } });
    const overview = await getSettingsOverview("s1");
    expect(overview.billing).toEqual({ plan: "BUSINESS", priceMonthly: 79 });
    expect(overview.members.seats).toBe(25);
  });

  it("ignores a subscription row for a plan the workspace no longer has", async () => {
    // customer.subscription.deleted leaves the row (CANCELLED, plan PRO) and drops the workspace to FREE.
    setup({ ...emptySite, workspace: { plan: "FREE", subscription: { plan: "PRO", price: 2900, interval: "MONTHLY" } } });
    const overview = await getSettingsOverview("s1");
    expect(overview.billing).toEqual({ plan: "FREE", priceMonthly: 0 });
  });

  it("falls back to the plan's list price on an interval it cannot read", async () => {
    setup({ ...emptySite, workspace: { plan: "PRO", subscription: { plan: "PRO", price: 2900, interval: "weekly" } } });
    const overview = await getSettingsOverview("s1");
    expect(overview.billing.priceMonthly).toBe(29);
  });

  it("treats an unknown plan string as FREE", async () => {
    setup({ ...emptySite, workspace: { plan: "STARTER", subscription: null } });
    const overview = await getSettingsOverview("s1");
    expect(overview.site.plan).toBe("FREE");
    expect(overview.members.seats).toBe(1);
  });
});
