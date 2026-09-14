/**
 * Settings · Clone S1 — the rows behind the Overview's summary lines that the
 * local app cannot create on its own: a domain needs DNS, submissions need a
 * published form, a webhook delivery needs an event, analytics need traffic.
 * Everything the screens CAN write (custom code, headers, an analytics
 * provider) is left for the walk to set through the real UI.
 *
 * Scoped to the scratch site and its workspace. Every row this writes carries
 * an `sclone-` id, so a re-run is a no-op and `--reset` deletes exactly those
 * rows and nothing else. The non-row changes — `fr` and `ar` joining the
 * site's enabled locales, `translations.fr` on two pages, the Google
 * Analytics entry in projectSettings — are undone the same way (removed,
 * never replaced; each carries a marker only this seed writes).
 *
 *   pnpm tsx prisma/seed-settings-clone.ts           # seed (idempotent)
 *   pnpm tsx prisma/seed-settings-clone.ts --reset   # remove what it seeded
 *
 * What the Overview reads afterwards (site otherwise untouched):
 *   Localization  3 locales · Arabic not started        (attention row)
 *                 S2: en LIVE · fr PENDING (2 of the pages) · ar NOT STARTED
 *   Domains       scratchver.example.com · 1 DNS pending (attention row)
 *                 S2: kind PRIMARY · Force HTTPS on · Namecheap · A + CNAME
 *                 verified, TXT pending
 *   Redirects     3 rules · 2 suggestions
 *   Analytics     receiving (7 daily rows)
 *                 S2: 40 events in the last 24 h + 3 older; Google Analytics
 *                 enabled with G-SCRATCH0001 in projectSettings
 *   Forms         3 forms · 38 submissions
 *   Integrations  +2 connected (mailchimp, zapier — INTEGRATION_CATALOG ids)
 *   Webhooks      1 endpoint · last delivery failed     (attention row)
 */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SITE_ID = "scratchver0000000000000001";
const ID = "sclone-";
// S2 Localization (Clone 3397:32376): `fr` PENDING (2 of the scratch pages
// translated), `ar` NOT STARTED (untouched, as in S1). Order is the frame's.
const LOCALES = ["fr", "ar"];
const TRANSLATED_LOCALE = "fr";
const TRANSLATED_PAGES = 2;
const TRANSLATION_SOURCE = "seed-settings-clone";
const DOMAIN = "scratchver.example.com";
const INTEGRATIONS = ["mailchimp", "zapier"];
// What `connectDomain` writes without a Vercel attachment (domain.service),
// in the shape the dialog draws. The TXT value is a fixture, not the
// service's row-id token — nothing checks it against a real zone here.
const DNS_RECORDS = [
  { id: `${ID}dns-a`, type: "A", host: "@", value: "76.76.21.21", verified: true },
  { id: `${ID}dns-cname`, type: "CNAME", host: "www", value: "cname.vercel-dns.com", verified: true },
  { id: `${ID}dns-txt`, type: "TXT", host: "_buildrick", value: "brk-verify-sclone", verified: false },
];
const REDIRECTS = [
  { id: `${ID}redirect-menu`, fromPath: "/old-menu", toUrl: "/menu", type: "301" },
  { id: `${ID}redirect-about`, fromPath: "/about-us", toUrl: "/about", type: "301" },
  { id: `${ID}redirect-book`, fromPath: "/reservations", toUrl: "/book", type: "302" },
];
// Two renamed slugs no redirect covers — the Overview's "2 suggestions".
// `oldSlug` is globally unique, hence the prefix.
const SLUG_HISTORY = [
  { id: `${ID}slug-lunch`, oldSlug: `${ID}lunch-menu`, newSlug: "menu" },
  { id: `${ID}slug-story`, oldSlug: `${ID}our-story`, newSlug: "about" },
];
const FORMS = [
  { id: `${ID}form-contact`, name: "Contact", submissions: 20 },
  { id: `${ID}form-booking`, name: "Book a table", submissions: 12 },
  { id: `${ID}form-newsletter`, name: "Newsletter", submissions: 6 },
];
const FORM_FIELDS = [
  { name: "name", type: "text" },
  { name: "email", type: "email" },
  { name: "message", type: "textarea" },
];
// S2 Analytics (Clone 3397:32295 "Last received data · <n> events in the last
// 24 hours"): the beacon's own rows, most of them inside the window and a
// few outside it so the count is visibly a window, not a total.
const EVENTS_24H = 40;
const EVENTS_OLDER_DAYS = [2, 3, 5];
const EVENT_PATHS = ["/", "/menu", "/about", "/contact", "/book"];
const GA_MEASUREMENT_ID = "G-SCRATCH0001";

// A JSON column read back, narrowed to an object so it can be spread and
// written again — the same boundary cast page.service makes on `translations`.
function asRecord(value: unknown): Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Prisma.JsonObject) : {};
}

function dayStart(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

async function loadSite() {
  const site = await prisma.site.findUnique({
    where: { id: SITE_ID },
    select: { id: true, workspaceId: true, defaultLocale: true, enabledLocales: true, projectSettings: true },
  });
  if (!site) throw new Error(`Site ${SITE_ID} not found — open it in the editor once, then re-run.`);
  return site;
}

async function seed() {
  const site = await loadSite();
  const { workspaceId } = site;

  const missingLocales = LOCALES.filter((l) => !site.enabledLocales.includes(l));
  if (missingLocales.length > 0) {
    await prisma.site.update({
      where: { id: SITE_ID },
      data: { enabledLocales: [...site.enabledLocales.filter((l) => !LOCALES.includes(l)), ...LOCALES] },
    });
  }

  // `translations[locale]` in the shape `pages.setTranslation` writes
  // (`{ blocks }`), plus a `source` marker so reset removes exactly these and
  // never a translation someone actually wrote. The first pages in site order,
  // so the checklist's pending list is the tail.
  const pages = await prisma.page.findMany({
    where: { siteId: SITE_ID },
    orderBy: { position: "asc" },
    take: TRANSLATED_PAGES,
    select: { id: true, blocks: true, translations: true },
  });
  for (const page of pages) {
    const translations = asRecord(page.translations);
    if (translations[TRANSLATED_LOCALE]) continue;
    await prisma.page.update({
      where: { id: page.id },
      data: { translations: { ...translations, [TRANSLATED_LOCALE]: { blocks: page.blocks, source: TRANSLATION_SOURCE } } },
    });
  }

  // A hostname is globally unique — never adopt one that belongs elsewhere.
  const existingDomain = await prisma.domain.findUnique({ where: { domain: DOMAIN }, select: { id: true, siteId: true } });
  if (existingDomain && existingDomain.siteId !== SITE_ID) {
    throw new Error(`${DOMAIN} belongs to site ${existingDomain.siteId}, not the scratch site.`);
  }
  const currentPrimary = await prisma.domain.findFirst({ where: { siteId: SITE_ID, isPrimary: true }, select: { id: true } });
  // S2 (Clone 3397:32206 / 3737:43669): the dialog's type · provider · Force
  // HTTPS on the row, and the three records it draws — A and CNAME answering,
  // the `_buildrick` TXT still pending (the frame's VERIFIED / VERIFIED /
  // PENDING). The columns are set on re-run too, so an S1-seeded row picks
  // them up. `status` is PENDING — what `check` computes for two-of-three,
  // and what the Overview's "1 DNS pending" row depends on — and is put back
  // on re-run: a walk's `Check DNS` asks the real resolver about
  // scratchver.example.com and honestly records FAILED, which would otherwise
  // outlive the walk.
  const domain = await prisma.domain.upsert({
    where: { domain: DOMAIN },
    update: { kind: "PRIMARY", forceHttps: true, dnsProvider: "namecheap", status: "PENDING", sslStatus: "PENDING", lastCheckedAt: null },
    create: {
      id: `${ID}domain`,
      siteId: SITE_ID,
      domain: DOMAIN,
      status: "PENDING",
      sslStatus: "PENDING",
      isPrimary: currentPrimary === null,
      kind: "PRIMARY",
      forceHttps: true,
      dnsProvider: "namecheap",
    },
  });
  for (const r of DNS_RECORDS) {
    await prisma.dnsRecord.upsert({
      where: { id: r.id },
      update: { type: r.type, host: r.host, value: r.value, verified: r.verified },
      create: { ...r, domainId: domain.id },
    });
  }

  for (const r of REDIRECTS) {
    await prisma.redirect.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, siteId: SITE_ID },
    });
  }
  for (const s of SLUG_HISTORY) {
    await prisma.slugHistory.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, siteId: SITE_ID },
    });
  }

  for (const form of FORMS) {
    await prisma.formBlock.upsert({
      where: { id: form.id },
      update: {},
      create: { id: form.id, siteId: SITE_ID, blockId: form.id, name: form.name, fields: FORM_FIELDS, isActive: true },
    });
    for (let i = 1; i <= form.submissions; i++) {
      const id = `${form.id}-sub-${String(i).padStart(2, "0")}`;
      await prisma.formSubmission.upsert({
        where: { id },
        update: {},
        create: {
          id,
          formBlockId: form.id,
          siteId: SITE_ID,
          data: { name: `Visitor ${i}`, email: `visitor${i}@example.com`, message: `${form.name} enquiry ${i}` },
          sourceUrl: `https://${DOMAIN}/contact`,
          isRead: i % 3 === 0,
          createdAt: new Date(dayStart(i % 14).getTime() + i * 60_000),
        },
      });
    }
  }

  // One webhook per workspace (unique). A workspace that already has one keeps
  // it — only the delivery is ours then, and reset removes only that.
  const webhook = await prisma.workspaceWebhook.upsert({
    where: { workspaceId },
    update: {},
    create: {
      id: `${ID}webhook`,
      workspaceId,
      url: `https://hooks.${DOMAIN}/buildrick`,
      secret: "whsec_sclone_not_a_real_secret",
      events: ["site.publish", "form.submit"],
    },
  });
  await prisma.webhookDelivery.upsert({
    where: { id: `${ID}delivery-failed` },
    // `createdAt` moves to now on every run so this stays the LATEST delivery
    // even after real ones land — "last delivery failed" is what the frame draws.
    update: { createdAt: new Date() },
    create: {
      id: `${ID}delivery-failed`,
      webhookId: webhook.id,
      event: "site.publish",
      status: "FAILED",
      httpStatus: 502,
      error: "502 Bad Gateway",
      createdAt: new Date(),
    },
  });

  for (const provider of INTEGRATIONS) {
    await prisma.workspaceIntegration.upsert({
      where: { workspaceId_provider: { workspaceId, provider } },
      update: {},
      create: { id: `${ID}integration-${provider}`, workspaceId, provider, config: { source: "seed-settings-clone" }, isActive: true },
    });
  }

  // `createdAt` moves on every run (like the webhook delivery above) so the
  // 40 stay inside the last 24 hours however long ago the seed first ran.
  const now = Date.now();
  const events = [
    ...Array.from({ length: EVENTS_24H }, (_, i) => ({ n: i + 1, createdAt: new Date(now - (i + 1) * 30 * 60_000) })),
    ...EVENTS_OLDER_DAYS.map((days, i) => ({ n: EVENTS_24H + i + 1, createdAt: new Date(now - days * 24 * 60 * 60_000) })),
  ];
  for (const ev of events) {
    const id = `${ID}event-${String(ev.n).padStart(2, "0")}`;
    await prisma.analyticsEvent.upsert({
      where: { id },
      update: { createdAt: ev.createdAt },
      create: {
        id,
        siteId: SITE_ID,
        path: EVENT_PATHS[ev.n % EVENT_PATHS.length],
        referrer: ev.n % 4 === 0 ? "https://www.google.com/" : null,
        sessionId: `${ID}session-${String(Math.ceil(ev.n / 3)).padStart(2, "0")}`,
        country: ev.n % 5 === 0 ? "FR" : "GB",
        viewportWidth: ev.n % 3 === 0 ? 390 : 1440,
        createdAt: ev.createdAt,
      },
    });
  }

  // The frame's Google Analytics card reads `projectSettings.analytics
  // .googleAnalytics` (the editor's ProjectSettings JSON). Merged key by key
  // so every other setting the editor wrote survives; reset removes only a
  // googleAnalytics entry carrying the seed's id.
  const current = await prisma.site.findUnique({ where: { id: SITE_ID }, select: { projectSettings: true } });
  const settings = asRecord(current?.projectSettings);
  const analytics = asRecord(settings.analytics);
  await prisma.site.update({
    where: { id: SITE_ID },
    data: {
      projectSettings: {
        ...settings,
        analytics: { ...analytics, googleAnalytics: { enabled: true, measurementId: GA_MEASUREMENT_ID } },
      },
    },
  });

  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    const date = dayStart(daysAgo);
    await prisma.siteAnalytics.upsert({
      where: { siteId_date: { siteId: SITE_ID, date } },
      update: {},
      create: {
        id: `${ID}analytics-${date.toISOString().slice(0, 10)}`,
        siteId: SITE_ID,
        date,
        visitors: 40 + daysAgo * 7,
        uniqueVisitors: 32 + daysAgo * 5,
        pageViews: 120 + daysAgo * 15,
        avgSession: 95,
        bounceRate: 0.42,
      },
    });
  }

  console.log(`Seeded settings-clone rows under ${SITE_ID} (workspace ${workspaceId}).`);
}

async function reset() {
  const site = await loadSite();
  const { workspaceId } = site;
  const ours = { startsWith: ID };

  const deleted = {
    events: (await prisma.analyticsEvent.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
    analytics: (await prisma.siteAnalytics.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
    integrations: (await prisma.workspaceIntegration.deleteMany({ where: { workspaceId, id: ours } })).count,
    deliveries: (await prisma.webhookDelivery.deleteMany({ where: { id: ours, webhook: { workspaceId } } })).count,
    webhooks: (await prisma.workspaceWebhook.deleteMany({ where: { workspaceId, id: ours } })).count,
    submissions: (await prisma.formSubmission.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
    forms: (await prisma.formBlock.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
    slugHistory: (await prisma.slugHistory.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
    redirects: (await prisma.redirect.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
    dns: (await prisma.dnsRecord.deleteMany({ where: { id: ours, domain: { siteId: SITE_ID } } })).count,
    domains: (await prisma.domain.deleteMany({ where: { siteId: SITE_ID, id: ours } })).count,
  };

  const settings = asRecord(site.projectSettings);
  const analytics = asRecord(settings.analytics);
  if (asRecord(analytics.googleAnalytics).measurementId === GA_MEASUREMENT_ID) {
    const { googleAnalytics: _seeded, ...rest } = analytics;
    await prisma.site.update({
      where: { id: SITE_ID },
      data: { projectSettings: { ...settings, analytics: rest } },
    });
  }

  const translated = await prisma.page.findMany({
    where: { siteId: SITE_ID, translations: { path: [TRANSLATED_LOCALE, "source"], equals: TRANSLATION_SOURCE } },
    select: { id: true, translations: true },
  });
  for (const page of translated) {
    const { [TRANSLATED_LOCALE]: _seeded, ...rest } = asRecord(page.translations);
    await prisma.page.update({
      where: { id: page.id },
      data: { translations: Object.keys(rest).length === 0 ? Prisma.JsonNull : rest },
    });
  }

  const removable = LOCALES.filter((l) => site.enabledLocales.includes(l) && site.defaultLocale !== l);
  if (removable.length > 0) {
    await prisma.site.update({
      where: { id: SITE_ID },
      data: { enabledLocales: site.enabledLocales.filter((l) => !removable.includes(l)) },
    });
  }

  console.log(`Removed settings-clone rows from ${SITE_ID}:`, deleted);
}

(process.argv.includes("--reset") ? reset() : seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
