import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * P0.3 — publishedPassword storage policy.
 *
 * Hashes are bcrypt rounds=10 (consistent with auth.service.ts + account.service.ts).
 * The Site row only ever stores the hash — plaintext never persists past
 * the boundary of updateSiteSettings.
 *
 * Pattern detection: a stored value is treated as already-hashed if it
 * starts with `$2` (bcrypt prefix). Plain strings get re-hashed. This
 * makes the migration self-healing: any pre-existing plaintext row that
 * receives a save (with publishedPassword unchanged or changed) ends
 * up with a proper hash without a separate backfill script.
 *
 * Empty string and null both clear the gate (no password required).
 */
const BCRYPT_ROUNDS = 10;

function isAlreadyHashed(value: string): boolean {
  return value.startsWith("$2");
}

export async function hashPublishedPassword(plain: string | null | undefined): Promise<string | null> {
  if (plain === null || plain === undefined || plain === "") return null;
  if (isAlreadyHashed(plain)) return plain;
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPublishedPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return true;
  return bcrypt.compare(plain, hash);
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
      headCode: true,
      bodyCode: true,
      socialLinks: true,
      publishedPassword: true,
      touchIcon: true,
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

  // P0.3: redact publishedPassword. Client gets a boolean indicator,
  // never the hash. Editor's "password is set" UI works on the boolean.
  const { workspace, publishedPassword, ...rest } = site;
  return {
    ...rest,
    publishedPassword: null, // typed as String? on schema; null = not set or redacted
    hasPublishedPassword: !!publishedPassword,
    plan: workspace.plan,
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
    headCode?: string | null;
    bodyCode?: string | null;
    socialLinks?: Record<string, string> | null;
    publishedPassword?: string | null;
    touchIcon?: string | null;
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
  if (wantsCustomCode || data.slug) {
    const current = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        slug: true,
        deletedAt: true,
        workspace: { select: { plan: true } },
      },
    });
    if (current?.deletedAt) throw new Error("SITE_NOT_FOUND");

    if (wantsCustomCode) {
      const plan = current?.workspace?.plan ?? "FREE";
      if (plan === "FREE") throw new Error("CUSTOM_CODE_NOT_AVAILABLE");
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
