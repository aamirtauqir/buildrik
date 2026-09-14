/**
 * Settings · Clone S1 — the rows behind the Overview's summary lines that the
 * local app cannot create on its own: a domain needs DNS, submissions need a
 * published form, a webhook delivery needs an event, analytics need traffic.
 * Everything the screens CAN write (custom code, headers, an analytics
 * provider) is left for the walk to set through the real UI.
 *
 * Scoped to the scratch site and its workspace. Every row this writes carries
 * an `sclone-` id, so a re-run is a no-op and `--reset` deletes exactly those
 * rows and nothing else. The one non-row change — `ar` joining the site's
 * enabled locales — is undone the same way (removed, never replaced).
 *
 *   pnpm tsx prisma/seed-settings-clone.ts           # seed (idempotent)
 *   pnpm tsx prisma/seed-settings-clone.ts --reset   # remove what it seeded
 *
 * What the Overview reads afterwards (site otherwise untouched):
 *   Localization  2 locales · Arabic not started        (attention row)
 *   Domains       scratchver.example.com · 1 DNS pending (attention row)
 *   Redirects     3 rules · 2 suggestions
 *   Analytics     receiving (7 daily rows; provider set in the UI)
 *   Forms         3 forms · 38 submissions
 *   Integrations  +2 connected (mailchimp, zapier — INTEGRATION_CATALOG ids)
 *   Webhooks      1 endpoint · last delivery failed     (attention row)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SITE_ID = "scratchver0000000000000001";
const ID = "sclone-";
const LOCALE = "ar";
const DOMAIN = "scratchver.example.com";
const INTEGRATIONS = ["mailchimp", "zapier"];
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

function dayStart(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

async function loadSite() {
  const site = await prisma.site.findUnique({
    where: { id: SITE_ID },
    select: { id: true, workspaceId: true, defaultLocale: true, enabledLocales: true },
  });
  if (!site) throw new Error(`Site ${SITE_ID} not found — open it in the editor once, then re-run.`);
  return site;
}

async function seed() {
  const site = await loadSite();
  const { workspaceId } = site;

  if (!site.enabledLocales.includes(LOCALE)) {
    await prisma.site.update({
      where: { id: SITE_ID },
      data: { enabledLocales: [...site.enabledLocales, LOCALE] },
    });
  }

  // A hostname is globally unique — never adopt one that belongs elsewhere.
  const existingDomain = await prisma.domain.findUnique({ where: { domain: DOMAIN }, select: { id: true, siteId: true } });
  if (existingDomain && existingDomain.siteId !== SITE_ID) {
    throw new Error(`${DOMAIN} belongs to site ${existingDomain.siteId}, not the scratch site.`);
  }
  const currentPrimary = await prisma.domain.findFirst({ where: { siteId: SITE_ID, isPrimary: true }, select: { id: true } });
  const domain = await prisma.domain.upsert({
    where: { domain: DOMAIN },
    update: {},
    create: {
      id: `${ID}domain`,
      siteId: SITE_ID,
      domain: DOMAIN,
      status: "PENDING",
      sslStatus: "PENDING",
      isPrimary: currentPrimary === null,
    },
  });
  await prisma.dnsRecord.upsert({
    where: { id: `${ID}dns-txt` },
    update: {},
    create: { id: `${ID}dns-txt`, domainId: domain.id, type: "TXT", host: "_buildrick", value: "buildrick-verify=sclone", verified: false },
  });

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

  if (site.enabledLocales.includes(LOCALE) && site.defaultLocale !== LOCALE) {
    await prisma.site.update({
      where: { id: SITE_ID },
      data: { enabledLocales: site.enabledLocales.filter((l) => l !== LOCALE) },
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
