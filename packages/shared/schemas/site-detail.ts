import { z } from "zod";

export const siteOverviewSchema = z.object({
  site: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    status: z.string(),
    publishedUrl: z.string().nullable(),
    lastPublishedAt: z.date().nullable(),
    lastPublishedBy: z.string().nullable(),
    createdAt: z.date(),
  }),
  stats: z.object({
    totalPages: z.number(),
    monthlyVisitors: z.number(),
    visitorsChange: z.number(),
    teamMembers: z.number(),
    formSubmissions: z.number(),
    unreadSubmissions: z.number(),
    healthScore: z.number(),
    healthBreakdown: z.object({
      seo: z.number(),
      content: z.number(),
      ssl: z.number(),
      favicon: z.number(),
    }),
  }),
  formBlocks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    _count: z.object({ submissions: z.number() }),
  })),
  /* `actorName` and `count` exist because the surface could not show WHO did
     anything: the query selected id/action/description/createdAt and dropped
     actorId, so "Alex edited the hero" was structurally impossible and every
     row read as if the system did it. Board 817:5114 puts the actor at x=80 on
     every row. `count` collapses consecutive identical entries — the site
     Overview showed "Updated 2 settings" five times in a row because nothing
     de-duplicated them. */
  recentActivity: z.array(z.object({
    id: z.string(),
    action: z.string(),
    description: z.string().nullable(),
    createdAt: z.date(),
    actorName: z.string().nullable(),
    count: z.number().int().positive().default(1),
  })),
});

export const updateSiteSettingsSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(3).max(50).optional(),
  // 2026-05-23: nullable() added on user-clearable fields so the editor
  // can send `null` to clear values (matches Prisma column nullability).
  // Prior `.optional()`-only shape rejected `null` and forced editor to
  // strip null at the boundary, which leaked into BuildrikSyncProvider
  // tRPC mutate-input typecheck failures.
  metaTitle: z.string().max(60).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  metaTitleTemplate: z.string().nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  // Technical SEO (d5)
  canonicalUrl: z.string().max(255).nullable().optional(),
  allowIndexing: z.boolean().optional(),
  robotsTxt: z.string().max(4096).nullable().optional(),
  headCode: z.string().max(10240).nullable().optional(),
  bodyCode: z.string().max(10240).nullable().optional(),
  socialLinks: z.record(z.string()).nullable().optional(),
  publishedPassword: z.string().nullable().optional(),
  touchIcon: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
  cspPolicy: z.string().max(4096).nullable().optional(),
  hstsMaxAge: z.number().int().min(0).max(63072000).nullable().optional(),
  xFrameOptions: z.enum(["DENY", "SAMEORIGIN"]).nullable().optional(),
  referrerPolicy: z.enum([
    "no-referrer",
    "no-referrer-when-downgrade",
    "origin",
    "origin-when-cross-origin",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
    "unsafe-url",
  ]).nullable().optional(),
  permissionsPolicy: z.string().max(2048).nullable().optional(),
  defaultLocale: z.string().min(2).max(10).optional(),
  enabledLocales: z.array(z.string().min(2).max(10)).min(1).max(50).optional(),
  // Settings S2 (Clone 3397:32376) — "Auto-redirect by browser".
  localeAutoRedirect: z.boolean().optional(),
});

/**
 * A redirect destination is a site path (`/new-page`, never `//host`) or a
 * full http(s) URL — the rule the Add-redirect dialog (Clone 4254:75736)
 * states and, since S3, the rule Vercel's `vercel.json` enforces at deploy
 * time: a bare `new-page` there fails the whole publish, so it is refused
 * here first.
 */
export const redirectTargetSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (value) => {
      if (value.startsWith("/")) return !value.startsWith("//");
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "To URL must be a path (/new-page) or a full URL (https://example.com/new)." },
  );

/**
 * Settings S3 (Clone 4254:75736 Add redirect, 4254:75747 Edit redirect).
 * `matchQuery` is the dialog's "Match query strings" toggle, `notes` its
 * free text ("Optional — why this redirect exists."). Both optional so the
 * dashboard's older redirect manager keeps calling `create` unchanged.
 */
export const createRedirectSchema = z.object({
  siteId: z.string(),
  fromPath: z.string().startsWith("/"),
  toUrl: redirectTargetSchema,
  type: z.enum(["301", "302"]),
  matchQuery: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateRedirectSchema = z.object({
  id: z.string(),
  fromPath: z.string().startsWith("/").optional(),
  toUrl: redirectTargetSchema.optional(),
  type: z.enum(["301", "302"]).optional(),
  matchQuery: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

/**
 * `siteDetail.redirects.suggestions` (Clone 3397:32517, the "404 suggester"
 * card). One row per old page slug the site no longer serves and has no
 * redirect for — sourced from `Page.slugHistory`, the `{ slug, changedAt }`
 * entries the editor's PageManager appends on every slug change, not from
 * real 404 hits (the published site sends none). `toUrl` is the page's
 * current path (`/` for the home page); `changedAt` is an ISO string; newest
 * first. `Accept` creates a 301 from exactly these two fields.
 */
export const redirectSuggestionSchema = z.object({
  fromPath: z.string(),
  toUrl: z.string(),
  pageId: z.string(),
  pageName: z.string(),
  changedAt: z.string().datetime(),
});

/** RFC 1123 hostname: 1-63 char labels, alphanumeric + hyphens, no leading
 *  / trailing hyphen per label, total length <= 253. Strips trailing dot.
 *  Rejects protocols, paths, and ports — DNS apex / subdomain only. */
const HOSTNAME_RE = /^(?=.{1,253}\.?$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\.?$/;

/** One hostname rule for `connect` and for the availability check's `invalid`. */
export const domainNameSchema = z
  .string()
  .min(3)
  .max(253)
  .regex(HOSTNAME_RE, "Must be a valid hostname (e.g. example.com or sub.example.com)");

/**
 * Settings S2 (Clone 3737:43669). What a connected domain IS: the one that
 * serves the site, one that 301s to it, or a subdomain of it. `Domain.isPrimary`
 * is a different fact ("which one currently serves") and stays as it was.
 */
export const domainKindSchema = z.enum(["PRIMARY", "REDIRECT", "SUBDOMAIN"]);

/**
 * The DNS providers the Add-a-domain dialog offers, with the nameservers the
 * "Nameservers · Read-only · set at your registrar" block draws. Shared because
 * the editor renders the select and the block from it and the server stores
 * the chosen `id` in `Domain.dnsProvider`. Namecheap's pair is fixed
 * (BasicDNS). Cloudflare assigns two per zone from `<name>.ns.cloudflare.com`
 * and GoDaddy a numbered pair from `nsNN.domaincontrol.com` — the entries name
 * the pattern, not a pair the user will necessarily hold. "Other" lists none.
 */
/**
 * The targets `domains.connect` points a domain at when the workspace has no
 * Vercel attachment — the A apex and the `www` CNAME (Vercel's, which is where
 * every Buildrick site is served from) plus the `_buildrick` verification
 * TXT whose token is minted per row. Shared so the Add-a-domain dialog draws
 * the real values before the row exists (Clone 3737:43669).
 */
export const DNS_TARGETS = {
  apexIp: "76.76.21.21",
  cname: "cname.vercel-dns.com",
  txtHost: "_buildrick",
  txtPrefix: "brk-verify-",
} as const;

export const DNS_PROVIDERS = [
  { id: "namecheap", label: "Namecheap", nameservers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"] },
  { id: "cloudflare", label: "Cloudflare", nameservers: ["<first>.ns.cloudflare.com", "<second>.ns.cloudflare.com"] },
  { id: "godaddy", label: "GoDaddy", nameservers: ["ns01.domaincontrol.com", "ns02.domaincontrol.com"] },
  { id: "other", label: "Other", nameservers: [] },
] as const satisfies ReadonlyArray<{ id: string; label: string; nameservers: ReadonlyArray<string> }>;

export const connectDomainSchema = z.object({
  siteId: z.string(),
  domain: domainNameSchema,
  kind: domainKindSchema.optional(),
  dnsProvider: z.string().min(1).max(40).optional(),
  forceHttps: z.boolean().optional(),
});

/** `siteDetail.domains.checkAvailability` — the dialog's `Available` / `Already connected` tag. */
export const checkDomainAvailabilitySchema = z.object({
  domain: z.string().max(253),
});

/**
 * `available` means no `Domain.domain` in this database matches, compared
 * case-insensitively. Registrar availability is out of scope (external).
 * `invalid` = not a hostname; `connected` = a site here already has it.
 */
export const domainAvailabilitySchema = z.object({
  available: z.boolean(),
  reason: z.enum(["connected", "invalid"]).optional(),
});

/** `siteDetail.domains.update` — the card's Force HTTPS toggle (ADMIN). */
export const updateDomainSchema = z.object({
  id: z.string(),
  forceHttps: z.boolean(),
});

export const createShareLinkSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).optional(),
  expiresInDays: z.number().min(1).max(90).optional(),
});

export const siteAnalyticsQuerySchema = z.object({
  siteId: z.string(),
  range: z.enum(["today", "yesterday", "7d", "30d", "90d"]).default("7d"),
  granularity: z.enum(["hourly", "daily", "weekly", "monthly"]).default("daily"),
});

/**
 * The editor's Settings Overview (Clone frame 3397:32915): one summary line per
 * settings section plus the NEEDS ATTENTION rows. Every field is derived from
 * columns that already exist — there is no migration behind it. Served by
 * `siteDetail.settingsOverview`; the on-screen copy ("English (en-US)",
 * "Indexing allowed · robots.txt set") is built by the editor from these facts.
 */
export const settingsOverviewSchema = z.object({
  site: z.object({ name: z.string(), defaultLocale: z.string(), plan: z.enum(["FREE", "PRO", "BUSINESS"]) }),
  general: z.object({ siteName: z.string(), language: z.string() }),            // "English (en-US)" label built client-side from defaultLocale
  localization: z.object({ locales: z.number(), notStarted: z.array(z.string()) }),
  seo: z.object({ allowIndexing: z.boolean(), robotsTxtSet: z.boolean() }),
  domains: z.object({ primary: z.string().nullable(), pendingDns: z.number() }),
  redirects: z.object({ rules: z.number(), suggestions: z.number() }),
  analytics: z.object({ providers: z.array(z.string()), receiving: z.boolean() }),
  forms: z.object({ forms: z.number(), submissions: z.number() }),
  customCode: z.object({ head: z.boolean(), body: z.boolean(), css: z.boolean() }),
  headers: z.object({ csp: z.boolean(), hsts: z.boolean() }),
  integrations: z.object({ connected: z.number(), available: z.number() }),
  webhooks: z.object({ endpoints: z.number(), lastDelivery: z.enum(["ok", "failed"]).nullable() }),
  members: z.object({ used: z.number(), seats: z.number() }),
  billing: z.object({ plan: z.string(), priceMonthly: z.number() }),
  attention: z.array(z.object({
    kind: z.enum(["locale-not-started", "dns-pending", "webhook-failed"]),
    title: z.string(), detail: z.string(), section: z.string(),               // section = the nav id to open
  })),
});

/**
 * `siteDetail.analyticsStatus` (Clone 3397:32295 "Last received data",
 * 4256:26844 "<n> events arrived in the last 24 hours"). The numbers are OUR
 * tracker's `AnalyticsEvent` rows for the site, not the provider's — GA's own
 * Data API is OAuth and out of scope. `lastEventAt` is an ISO string (tRPC
 * carries it as text; the editor formats the date).
 */
export const analyticsStatusSchema = z.object({
  lastEventAt: z.string().datetime().nullable(),
  events24h: z.number().int().nonnegative(),
});

/**
 * `siteDetail.locales` (Clone 3397:32376 Locales table, 3737:44869 checklist).
 * One row per enabled locale: `path` is `/` for the default locale, else
 * `/<code>`; `translated` counts pages carrying a non-empty
 * `translations[code]`; the default locale is always LIVE (its content is
 * `Page.blocks`); `pending` is the untranslated page names in site order.
 */
export const localeStatusSchema = z.enum(["LIVE", "PENDING", "NOT_STARTED"]);

export const localeSummarySchema = z.object({
  code: z.string(),
  path: z.string(),
  translated: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  status: localeStatusSchema,
  pending: z.array(z.string()),
});

export const localesSummarySchema = z.object({
  locales: z.array(localeSummarySchema),
  total: z.number().int().nonnegative(),
});

export type SiteOverview = z.infer<typeof siteOverviewSchema>;
export type SettingsOverview = z.infer<typeof settingsOverviewSchema>;
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
export type CreateRedirectInput = z.infer<typeof createRedirectSchema>;
export type UpdateRedirectInput = z.infer<typeof updateRedirectSchema>;
export type RedirectSuggestion = z.infer<typeof redirectSuggestionSchema>;
export type ConnectDomainInput = z.infer<typeof connectDomainSchema>;
export type DomainKind = z.infer<typeof domainKindSchema>;
export type DnsProviderId = (typeof DNS_PROVIDERS)[number]["id"];
export type CheckDomainAvailabilityInput = z.infer<typeof checkDomainAvailabilitySchema>;
export type DomainAvailability = z.infer<typeof domainAvailabilitySchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type AnalyticsStatus = z.infer<typeof analyticsStatusSchema>;
export type LocaleStatus = z.infer<typeof localeStatusSchema>;
export type LocaleSummary = z.infer<typeof localeSummarySchema>;
export type LocalesSummary = z.infer<typeof localesSummarySchema>;
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type SiteAnalyticsQuery = z.infer<typeof siteAnalyticsQuerySchema>;
