import bcrypt from "bcryptjs";
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
      workspace: { select: { plan: true } },
    },
  });

  if (!site) throw new Error("SITE_NOT_FOUND");

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
    metaTitle?: string;
    metaDescription?: string;
    metaTitleTemplate?: string;
    ogImage?: string | null;
    headCode?: string;
    bodyCode?: string;
    socialLinks?: Record<string, string>;
    publishedPassword?: string | null;
    touchIcon?: string | null;
    cspPolicy?: string | null;
    hstsMaxAge?: number | null;
    xFrameOptions?: "DENY" | "SAMEORIGIN" | null;
    referrerPolicy?: string | null;
    permissionsPolicy?: string | null;
  }
) {
  if (data.headCode !== undefined || data.bodyCode !== undefined || data.slug) {
    const current = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        slug: true,
        workspace: { select: { plan: true } },
      },
    });

    if (data.headCode !== undefined || data.bodyCode !== undefined) {
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
  const persistData = { ...data };
  if (data.publishedPassword !== undefined) {
    persistData.publishedPassword = await hashPublishedPassword(data.publishedPassword);
  }

  return prisma.site.update({
    where: { id: siteId },
    data: persistData,
  });
}
