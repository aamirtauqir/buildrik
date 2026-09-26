/**
 * D-14a — Postgres-backed test tier: factories + truncation helper.
 *
 * Every factory takes only the caller's required fields plus an `overrides`
 * bag for anything else on the model; everything else gets a Prisma-valid
 * default so callers building a chain (user → workspace → member → site →
 * page → permission) don't have to restate schema defaults. This file is the
 * one seam later `*.db.test.ts` files (S-5, S-6, A-2, S-9, S-11, ...) build
 * fixtures through — do not duplicate these factories in a test file.
 */
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createTestUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  return prisma.user.create({
    data: {
      email: `user-${randomUUID()}@test.buildrik.local`,
      fullName: "Test User",
      emailVerified: new Date(),
      ...overrides,
    },
  });
}

export async function createTestWorkspace(
  params: { ownerId: string } & Partial<Prisma.WorkspaceCreateInput>,
) {
  const { ownerId, ...overrides } = params;
  return prisma.workspace.create({
    data: {
      name: "Test Workspace",
      slug: `test-ws-${randomUUID()}`,
      ownerId,
      ...overrides,
    },
  });
}

export async function createTestWorkspaceMember(
  params: { userId: string; workspaceId: string } & Partial<Prisma.WorkspaceMemberUncheckedCreateInput>,
) {
  const { userId, workspaceId, ...overrides } = params;
  return prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId,
      role: "EDITOR",
      status: "ACTIVE",
      ...overrides,
    },
  });
}

export async function createTestSite(
  params: { workspaceId: string; createdBy: string } & Partial<Prisma.SiteUncheckedCreateInput>,
) {
  const { workspaceId, createdBy, ...overrides } = params;
  return prisma.site.create({
    data: {
      workspaceId,
      createdBy,
      name: "Test Site",
      slug: `test-site-${randomUUID()}`,
      ...overrides,
    },
  });
}

export async function createTestPage(
  params: { siteId: string } & Partial<Prisma.PageUncheckedCreateInput>,
) {
  const { siteId, ...overrides } = params;
  return prisma.page.create({
    data: {
      siteId,
      name: "Home",
      slug: `home-${randomUUID()}`,
      position: 0,
      blocks: [],
      ...overrides,
    },
  });
}

export async function createTestSitePermission(
  params: { memberId: string; siteId: string; grantedBy: string } & Partial<Prisma.SitePermissionUncheckedCreateInput>,
) {
  const { memberId, siteId, grantedBy, ...overrides } = params;
  return prisma.sitePermission.create({
    data: {
      memberId,
      siteId,
      grantedBy,
      roleOverride: "VIEWER",
      ...overrides,
    },
  });
}

export async function createTestInvite(
  params: { workspaceId: string; invitedBy: string } & Partial<Prisma.InviteUncheckedCreateInput>,
) {
  const { workspaceId, invitedBy, ...overrides } = params;
  return prisma.invite.create({
    data: {
      workspaceId,
      invitedBy,
      email: `invitee-${randomUUID()}@test.buildrik.local`,
      role: "EDITOR",
      token: randomUUID(),
      status: "PENDING",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ...overrides,
    },
  });
}

export async function createTestAccount(
  params: { userId: string; provider: string; providerAccountId: string } & Partial<Prisma.AccountUncheckedCreateInput>,
) {
  const { userId, provider, providerAccountId, ...overrides } = params;
  return prisma.account.create({
    data: {
      userId,
      provider,
      providerAccountId,
      type: "oauth",
      ...overrides,
    },
  });
}

const MODEL_TO_TABLE = {
  user: "users",
  workspace: "workspaces",
  workspaceMember: "workspace_members",
  site: "sites",
  page: "pages",
  sitePermission: "site_permissions",
  pendingUpload: "pending_uploads",
  mediaAsset: "media_assets",
  mediaAssetVersion: "media_asset_versions",
  invite: "invites",
  account: "accounts",
  rateLimitBucket: "rate_limit_buckets",
} as const;

export type TruncatableModel = keyof typeof MODEL_TO_TABLE;

/**
 * TRUNCATE ... CASCADE the given tables (by model name, not raw table name —
 * keeps callers from having to know `@@map` names). Call in `beforeEach` with
 * only the models the test file actually seeds; CASCADE handles the rest of
 * the FK graph (e.g. truncating `site` also empties `page`/`sitePermission`
 * rows via their FKs, but list them explicitly anyway for clarity + so
 * RESTART IDENTITY resets their sequences too).
 */
export async function truncateTables(...models: TruncatableModel[]): Promise<void> {
  if (models.length === 0) return;
  const tables = models.map((m) => `"${MODEL_TO_TABLE[m]}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
