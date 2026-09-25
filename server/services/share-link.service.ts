import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

// The link token IS the bearer credential for the draft it unlocks — a
// VIEWER should not be able to read it off the list, only an EDITOR+ who
// could also create one. passwordHash never leaves the server at all — a
// `hasPassword` boolean replaces it (controller review round 1: an earlier
// "set"/null STRING placeholder was still typed `passwordHash: string` on
// the consuming UI, so nothing forced callers to stop treating it as the
// real hash's presence-or-shape; a boolean field with its own name is
// harder to misuse that way, and matches what the UI actually needs).
//
// SSOT for every response shape this file hands back for a ShareLink row.
// Round 2 fixed this drop for createShareLink by hand-copying the same
// destructure a second time; round 4 found a THIRD copy would have been
// needed for revokeShareLink, which was still returning the raw Prisma
// row (passwordHash included) straight to the client. One helper now, so
// there's nothing left to forget to copy a fourth time.
function redactShareLink<T extends { passwordHash: string | null }>(
  row: T,
): Omit<T, "passwordHash"> & { hasPassword: boolean } {
  const { passwordHash, ...rest } = row;
  return { ...rest, hasPassword: passwordHash != null };
}

export async function listShareLinks(siteId: string, revealToken = false) {
  const rows = await prisma.shareLink.findMany({
    where: { siteId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => {
    const redacted = redactShareLink(row);
    return { ...redacted, token: revealToken ? redacted.token : null };
  });
}

// Workspace sharing-settings' `defaultExpiration` is a free-form string from
// the settings form's fixed option list ("24h" | "7d" | "30d" | "" for no
// expiration). Converts to fractional days for `expiresInDays`.
function parseDefaultExpirationDays(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const m = /^(\d+)(h|d)$/.exec(value.trim());
  if (!m) return undefined;
  const n = Number(m[1]);
  return m[2] === "h" ? n / 24 : n;
}

export async function createShareLink(
  siteId: string,
  data: { name: string; password?: string; expiresInDays?: number },
  userId?: string
) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true, deletedAt: true } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");
  let plan: PlanName;
  let settings: { requirePw: boolean; allowEditors: boolean; defaultExpiration: string | null } | null | undefined;
  if (userId) {
    const member = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: site.workspaceId, status: "ACTIVE" },
      include: { workspace: { select: { plan: true, sharingSettings: true } } },
    });
    if (!member) throw new Error("NOT_WORKSPACE_MEMBER");
    settings = member.workspace?.sharingSettings;
    // A-9: DESIGNER has the same site-edit rank as EDITOR (permission.service
    // ROLE_RANK) — the gate only checked "EDITOR" literally, so a DESIGNER
    // bypassed it entirely.
    if ((member.role === "EDITOR" || member.role === "DESIGNER") && settings?.allowEditors === false) {
      throw new Error("EDITORS_CANNOT_CREATE_LINKS");
    }
    plan = (member.workspace?.plan ?? "FREE") as PlanName;
  } else {
    const ws = await prisma.workspace.findUnique({
      where: { id: site.workspaceId },
      select: { plan: true, sharingSettings: true },
    });
    plan = (ws?.plan ?? "FREE") as PlanName;
    settings = ws?.sharingSettings;
  }
  const limits = PLAN_LIMITS[plan];
  const maxDays = limits.shareLinkExpiryMaxDays as number;
  const allowPasswords = limits.shareLinkPasswords as boolean;

  // A-9: the UI already promises "require password" and "default expiration"
  // from workspace sharing settings; the service silently ignored both,
  // creating unprotected/non-expiring links regardless of the settings.
  // requirePw is meaningless on a plan with no password links at all (FREE) —
  // enforcing it there would make link creation impossible, not safer.
  if (settings?.requirePw && !data.password && allowPasswords) {
    throw new Error("PASSWORD_REQUIRED");
  }
  if (!data.expiresInDays) {
    const fromDefault = parseDefaultExpirationDays(settings?.defaultExpiration);
    if (fromDefault !== undefined) data.expiresInDays = Math.min(fromDefault, maxDays);
  }

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

  const row = await prisma.shareLink.create({
    data: {
      siteId,
      name: data.name,
      token,
      passwordHash,
      expiresAt,
    },
  });
  // S-10: the caller of sharing.create is the person who just minted this
  // link, so the token is fine to return — but the bcrypt hash is not. Same
  // redacted shape listShareLinks already returns, so nothing downstream
  // treats "the row from create" differently from "a row from list".
  return redactShareLink(row);
}

export async function revokeShareLink(id: string) {
  // S-10 (round 4): this used to return the raw prisma.shareLink.update
  // row, passwordHash included, straight through site-detail.ts's revoke
  // mutation — the router itself never had to look at it. Same redaction
  // as list/create.
  const row = await prisma.shareLink.update({
    where: { id },
    data: { isActive: false },
  });
  return redactShareLink(row);
}

// ─── Visitor side: /share/<token> ──────────────────────────────────────────

export type ShareUnavailableReason = "expired" | "revoked" | "unknown";

export type ShareResolution =
  | { state: "unavailable"; reason: ShareUnavailableReason }
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
 * What a share-link visitor may see. "unavailable" carries why — expired,
 * revoked (or its site deleted), or unknown — because those are different
 * things for the person holding the link, the same split the review link's
 * dead-link card makes. A password link without a valid unlock cookie is
 * "locked"; nothing of the site is revealed before that.
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
  if (!link) return { state: "unavailable", reason: "unknown" };
  if (!link.isActive || link.site.deletedAt) return { state: "unavailable", reason: "revoked" };
  if (link.expiresAt && link.expiresAt < new Date()) return { state: "unavailable", reason: "expired" };
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
  /* The site's ADDED fonts (Site fonts dialog — `userMetadata.siteFont`), the
     same set the editor's Composer registers from the media library. Without
     them the scratch render cannot write their @font-face, and the preview
     named e.g. 'Inter Var' while loading nothing (2026-09-24). */
  const fontAssets = await prisma.mediaAsset.findMany({
    where: { siteId, type: "font", userMetadata: { path: ["siteFont"], equals: true } },
    select: { filename: true, url: true },
    orderBy: { createdAt: "asc" },
  });
  const { sitePages, name, publishedUrl, projectStyles, projectSettings, dsSchemaVersion, ...columns } = site;
  const pages = sitePages.filter((p) => {
    const visibility = (p.settings as { visibility?: unknown } | null)?.visibility;
    return visibility === undefined || visibility === "live";
  });
  return {
    site: { name, publishedUrl, projectStyles, projectSettings, dsSchemaVersion },
    pages,
    siteColumns: { name, ...columns },
    siteFonts: fontAssets,
  };
}
