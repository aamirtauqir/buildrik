import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * publishedPassword storage policy.
 *
 * Stored AES-256-GCM **encrypted** (reversible), not bcrypt-hashed, because the
 * publish path must hand the plaintext to Vercel's deployment password
 * protection — which is what actually enforces the password on the live
 * `<project>.vercel.app` URL. A one-way hash could never be pushed to Vercel.
 *
 * Format detection: `v1:` prefix = our AES ciphertext; `$2` prefix = a legacy
 * bcrypt hash (irreversible — verify still works, but it can't be pushed to
 * Vercel until the owner re-sets the password). Empty/null = no gate.
 */
function isEncrypted(value: string): boolean {
  return value.startsWith("v1:");
}
function isLegacyBcrypt(value: string): boolean {
  return value.startsWith("$2");
}

export async function hashPublishedPassword(plain: string | null | undefined): Promise<string | null> {
  if (plain === null || plain === undefined || plain === "") return null;
  // Already a stored form (re-saved unchanged) → keep as-is.
  if (isEncrypted(plain) || isLegacyBcrypt(plain)) return plain;
  return encrypt(plain);
}

export async function verifyPublishedPassword(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) return true;
  if (isEncrypted(stored)) {
    try {
      return decrypt(stored) === plain;
    } catch {
      return false;
    }
  }
  return bcrypt.compare(plain, stored); // legacy bcrypt rows
}

/**
 * Plaintext for pushing to Vercel deployment protection. Null when unset or a
 * legacy bcrypt hash (irreversible — owner must re-set to enable enforcement).
 */
export function decryptPublishedPassword(stored: string | null): string | null {
  if (!stored || !isEncrypted(stored)) return null;
  try {
    return decrypt(stored);
  } catch {
    return null;
  }
}

export async function getSiteSettings(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      metaTitleTemplate: true,
      ogImage: true,
      canonicalUrl: true,
      allowIndexing: true,
      robotsTxt: true,
      headCode: true,
      bodyCode: true,
      socialLinks: true,
      publishedPassword: true,
      touchIcon: true,
      favicon: true,
      cspPolicy: true,
      hstsMaxAge: true,
      xFrameOptions: true,
      referrerPolicy: true,
      permissionsPolicy: true,
      defaultLocale: true,
      enabledLocales: true,
      deletedAt: true,
      workspace: { select: { plan: true } },
    },
  });

  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  /* What the editor actually writes. The SEO tab says "SEO content is edited in
     the editor. This is a live preview", but it read the SITE columns —
     `sites.metaTitle` / `metaDescription` — which no screen in the product
     writes: 0 of 52 rows in this database have one. The editor's SEO panel
     writes the PAGE's own settings JSON (`pages.settings.seo`), so the preview
     was permanently "Not set" no matter what anyone typed. Read the home page's
     SEO here and let the tab prefer it. */
  const homePage = await prisma.page.findFirst({
    where: { siteId },
    orderBy: [{ isHomePage: "desc" }, { position: "asc" }],
    select: { name: true, seoTitle: true, seoDescription: true, settings: true },
  });
  const pageSeoJson =
    homePage && typeof homePage.settings === "object" && homePage.settings !== null
      ? ((homePage.settings as { seo?: Record<string, unknown> }).seo ?? {})
      : {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  const pageSeo = homePage
    ? {
        pageName: homePage.name,
        metaTitle: str(pageSeoJson.metaTitle) ?? homePage.seoTitle ?? null,
        metaDescription: str(pageSeoJson.metaDescription) ?? homePage.seoDescription ?? null,
        ogImage: str(pageSeoJson.ogImage),
      }
    : null;

  // P0.3: redact publishedPassword. Client gets a boolean indicator,
  // never the hash. Editor's "password is set" UI works on the boolean.
  const { workspace, publishedPassword, ...rest } = site;
  return {
    ...rest,
    publishedPassword: null, // typed as String? on schema; null = not set or redacted
    hasPublishedPassword: !!publishedPassword,
    plan: workspace.plan,
    pageSeo,
  };
}

export async function updateSiteSettings(
  siteId: string,
  data: {
    name?: string;
    slug?: string;
    // Nullable user-clearable fields — editor sends `null` to wipe a
    // value. Prisma columns are nullable; writing null updates the
    // column to NULL (matches the shared schema's `.nullable()`).
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaTitleTemplate?: string | null;
    ogImage?: string | null;
    canonicalUrl?: string | null;
    allowIndexing?: boolean;
    robotsTxt?: string | null;
    headCode?: string | null;
    bodyCode?: string | null;
    socialLinks?: Record<string, string> | null;
    publishedPassword?: string | null;
    touchIcon?: string | null;
    favicon?: string | null;
    cspPolicy?: string | null;
    hstsMaxAge?: number | null;
    xFrameOptions?: "DENY" | "SAMEORIGIN" | null;
    referrerPolicy?: string | null;
    permissionsPolicy?: string | null;
    defaultLocale?: string;
    enabledLocales?: string[];
  }
) {
  // Gate Pro-only fields on actual content, not field presence. Editor
  // auto-save sends headCode="" / bodyCode="" on every tick because the
  // editor's customCode settings default to empty strings; gating on
  // !== undefined blocked all Free-tier saves (P0-8, iter 10).
  const wantsCustomCode =
    (data.headCode != null && data.headCode !== "") ||
    (data.bodyCode != null && data.bodyCode !== "");
  /* The published-site password is a Pro feature, and the only thing enforcing
     that was the dashboard's own <ProGate> — a disabled toggle. Verified live
     from a FREE workspace: posting `publishedPassword` to
     siteDetail.settings.update returned 200 and the site came back with a
     password set. Clearing one (null) stays free — nobody should be locked
     out of removing a gate they can no longer manage. */
  const wantsPublishedPassword = data.publishedPassword != null && data.publishedPassword !== "";
  if (wantsCustomCode || wantsPublishedPassword || data.slug) {
    const current = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        slug: true,
        deletedAt: true,
        workspace: { select: { plan: true } },
      },
    });
    if (current?.deletedAt) throw new Error("SITE_NOT_FOUND");

    const plan = current?.workspace?.plan ?? "FREE";
    if (wantsCustomCode && plan === "FREE") throw new Error("CUSTOM_CODE_NOT_AVAILABLE");
    if (wantsPublishedPassword && plan === "FREE") {
      throw new Error("SITE_PASSWORD_NOT_AVAILABLE");
    }

    if (data.slug && current && current.slug !== data.slug) {
      await prisma.slugHistory.create({
        data: {
          siteId,
          oldSlug: current.slug,
          newSlug: data.slug,
        },
      }).catch(() => {});
    }
  }

  // P0.3: hash publishedPassword before persisting. Plaintext never reaches DB.
  // Cast at the Prisma boundary: 2026-05-23 widening of input data to allow
  // `null` on user-clearable fields (metaTitle/headCode/socialLinks/etc) so
  // editor can wipe them. Prisma's Json column update type (socialLinks)
  // uses `Prisma.DbNull` rather than raw null; we send null through as a
  // shorthand and rely on Prisma's runtime to interpret it. The cast is
  // safe because the column is nullable in schema.prisma and the data has
  // already been validated by updateSiteSettingsSchema upstream.
  const persistData = { ...data } as Prisma.SiteUpdateInput;
  if (data.publishedPassword !== undefined) {
    persistData.publishedPassword = data.publishedPassword === null
      ? null
      : await hashPublishedPassword(data.publishedPassword);
  }

  // Localization invariant: defaultLocale MUST be in enabledLocales.
  // The naive read-then-write isn't atomic — two concurrent updates can each
  // read the current row, validate against their own snapshot, and commit
  // back-to-back, leaving `defaultLocale ∉ enabledLocales`. Phase D routing
  // depends on this invariant, so we serialize via a SELECT … FOR UPDATE
  // row lock inside an interactive transaction. Codex pass-1 P2-L2.
  const needsLocaleGuard =
    data.defaultLocale !== undefined || data.enabledLocales !== undefined;

  if (needsLocaleGuard) {
    return prisma.$transaction(async (tx) => {
      // Pessimistic lock — concurrent updates of locale fields on the same
      // site block here until the holder commits. Postgres-only syntax;
      // the editor stack is Postgres per CLAUDE.md.
      // Physical table name is "sites" — Site model carries `@@map("sites")`
      // in prisma/schema.prisma. Using the model name in raw SQL would raise
      // `relation "Site" does not exist` on Postgres.
      await tx.$executeRaw(Prisma.sql`SELECT id FROM "sites" WHERE id = ${siteId} FOR UPDATE`);
      const current = await tx.site.findUnique({
        where: { id: siteId },
        select: { defaultLocale: true, enabledLocales: true },
      });
      const nextDefault = data.defaultLocale ?? current?.defaultLocale ?? "en";
      const nextEnabled = data.enabledLocales ?? current?.enabledLocales ?? ["en"];
      if (!nextEnabled.includes(nextDefault)) {
        throw new Error("DEFAULT_LOCALE_NOT_ENABLED");
      }
      return tx.site.update({
        where: { id: siteId },
        data: persistData,
      });
    });
  }

  return prisma.site.update({
    where: { id: siteId },
    data: persistData,
  });
}
