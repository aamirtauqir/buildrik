import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

export async function listShareLinks(siteId: string) {
  return prisma.shareLink.findMany({
    where: { siteId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShareLink(
  siteId: string,
  data: { name: string; password?: string; expiresInDays?: number },
  userId?: string
) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true, deletedAt: true } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");
  let plan: PlanName;
  if (userId) {
    const member = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: site.workspaceId, status: "ACTIVE" },
      include: { workspace: { select: { plan: true, sharingSettings: true } } },
    });
    if (!member) throw new Error("NOT_WORKSPACE_MEMBER");
    const settings = member.workspace?.sharingSettings;
    if (member.role === "EDITOR" && settings?.allowEditors === false) {
      throw new Error("EDITORS_CANNOT_CREATE_LINKS");
    }
    plan = (member.workspace?.plan ?? "FREE") as PlanName;
  } else {
    const ws = await prisma.workspace.findUnique({ where: { id: site.workspaceId }, select: { plan: true } });
    plan = (ws?.plan ?? "FREE") as PlanName;
  }
  const limits = PLAN_LIMITS[plan];
  const maxDays = limits.shareLinkExpiryMaxDays as number;
  const allowPasswords = limits.shareLinkPasswords as boolean;

  if (data.expiresInDays && data.expiresInDays > maxDays) {
    throw new Error("EXPIRY_EXCEEDS_PLAN");
  }

  if (data.password && !allowPasswords) {
    throw new Error("PASSWORD_LINKS_NOT_AVAILABLE");
  }

  // FREE plan: max 3 share links per site; PRO/BUSINESS: unlimited
  const shareLinkLimit = plan === "FREE" ? 3 : -1;
  if (shareLinkLimit > 0) {
    const shareLinksOnSite = await prisma.shareLink.count({ where: { siteId, isActive: true } });
    if (shareLinksOnSite >= shareLinkLimit) throw new Error("SHARE_LINK_LIMIT");
  }

  const token = crypto.randomUUID();

  let passwordHash: string | undefined;
  if (data.password) {
    const bcrypt = await import("bcryptjs");
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  let expiresAt: Date | undefined;
  if (data.expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
  }

  return prisma.shareLink.create({
    data: {
      siteId,
      name: data.name,
      token,
      passwordHash,
      expiresAt,
    },
  });
}

export async function revokeShareLink(id: string) {
  return prisma.shareLink.update({
    where: { id },
    data: { isActive: false },
  });
}

// ─── Visitor side: /share/<token> ──────────────────────────────────────────

export type ShareResolution =
  | { state: "unavailable" }
  | { state: "locked" }
  | { state: "open"; linkId: string; siteId: string; siteName: string };

function shareSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return secret;
}

/**
 * The value of the `share_<token>` cookie the password route sets. It used to
 * be the literal "1", which anyone can type into their own cookie jar — harmless
 * while the page only forwarded to a public published URL, a bypass once it
 * serves the draft. An HMAC of the token under the auth secret cannot be forged
 * without the secret.
 */
export function shareUnlockProof(token: string): string {
  return crypto.createHmac("sha256", shareSecret()).update(`share-unlock:${token}`).digest("hex");
}

function isValidProof(token: string, cookie: string | undefined): boolean {
  if (!cookie) return false;
  const expected = Buffer.from(shareUnlockProof(token));
  const given = Buffer.from(cookie);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/**
 * What a share-link visitor may see. Missing, revoked, expired links and links
 * to a deleted site are all "unavailable" — one answer, so the page cannot be
 * used to probe which. A password link without a valid unlock cookie is
 * "locked".
 */
export async function resolveShareLink(
  token: string,
  unlockCookie: string | undefined,
): Promise<ShareResolution> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      id: true,
      isActive: true,
      expiresAt: true,
      passwordHash: true,
      site: { select: { id: true, name: true, deletedAt: true } },
    },
  });
  if (!link || !link.isActive || link.site.deletedAt) return { state: "unavailable" };
  if (link.expiresAt && link.expiresAt < new Date()) return { state: "unavailable" };
  if (link.passwordHash && !isValidProof(token, unlockCookie)) return { state: "locked" };
  return { state: "open", linkId: link.id, siteId: link.site.id, siteName: link.site.name };
}

export async function recordShareView(linkId: string): Promise<void> {
  await prisma.shareLink.update({ where: { id: linkId }, data: { viewCount: { increment: 1 } } });
}

/**
 * The saved draft a share link shows, as the rows the editor's
 * `projectDataFromRows` maps — the same mapping the editor opens a site with,
 * so the preview is built from exactly what was last saved.
 *
 * Only what the publish export would ship leaves the server: pages hidden in
 * Page settings (`settings.visibility` other than unset/"live" — the rule of
 * the export engine's `isPageLive`) are dropped HERE, not just skipped by the
 * exporter, because the rows themselves reach the visitor's browser. The site
 * columns are the ones the editor merges into its settings, minus
 * `publishedPassword`.
 */
export async function getShareDraftRows(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      name: true,
      publishedUrl: true,
      projectStyles: true,
      projectSettings: true,
      dsSchemaVersion: true,
      favicon: true,
      defaultLocale: true,
      enabledLocales: true,
      localeAutoRedirect: true,
      metaTitle: true,
      metaDescription: true,
      metaTitleTemplate: true,
      ogImage: true,
      allowIndexing: true,
      robotsTxt: true,
      headCode: true,
      bodyCode: true,
      socialLinks: true,
      touchIcon: true,
      sitePages: {
        select: {
          id: true,
          name: true,
          slug: true,
          position: true,
          blocks: true,
          isHomePage: true,
          meta: true,
          settings: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!site) throw new Error("SITE_NOT_FOUND");
  const { sitePages, name, publishedUrl, projectStyles, projectSettings, dsSchemaVersion, ...columns } = site;
  const pages = sitePages.filter((p) => {
    const visibility = (p.settings as { visibility?: unknown } | null)?.visibility;
    return visibility === undefined || visibility === "live";
  });
  return {
    site: { name, publishedUrl, projectStyles, projectSettings, dsSchemaVersion },
    pages,
    siteColumns: { name, ...columns },
  };
}
