/**
 * L1-015 (owner, 2026-10-10): Getting-started progress is server state per
 * user × site, computed once and read by both the rail pill and the checklist.
 * Milestones come from real events (recorded) or real state (pages, review
 * rounds, a publish — derived at read time). The dismissal is stored apart from
 * progress, and there is no global "completed".
 *
 * Runs against the real `editor_onboarding` table, so it also proves the
 * 20261010120000_editor_onboarding migration applies.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getEditorOnboarding,
  markEditorTip,
  recordEditorMilestone,
  setEditorChecklistDismissed,
} from "@/server/services/onboarding.service";
import { PermissionError } from "@/server/services/permission.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  createTestPage,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("editorOnboarding", "page", "site", "workspaceMember", "workspace", "user");
});

async function seed() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  await createTestWorkspaceMember({ userId: user.id, workspaceId: workspace.id, role: "OWNER" });
  const siteA = await createTestSite({ workspaceId: workspace.id, createdBy: user.id, name: "A" });
  const siteB = await createTestSite({ workspaceId: workspace.id, createdBy: user.id, name: "B" });
  return { user, workspace, siteA, siteB };
}

describe("editor onboarding — per user × site (L1-015)", () => {
  it("a brand-new site starts at 0 of 7 and not dismissed, whatever another site has done", async () => {
    const { user, siteA, siteB } = await seed();
    for (const m of ["set-brand", "preview", "insert-section"] as const) {
      await recordEditorMilestone(user.id, siteA.id, m);
    }
    const a = await getEditorOnboarding(user.id, siteA.id);
    const b = await getEditorOnboarding(user.id, siteB.id);
    expect(a.completedCount).toBe(3);
    expect(b).toEqual({
      steps: {
        "set-brand": false,
        "add-page": false,
        "insert-section": false,
        "connect-client": false,
        "send-review": false,
        preview: false,
        publish: false,
      },
      completedCount: 0,
      totalCount: 7,
      dismissed: false,
      tipsSeen: [],
      tipsDismissed: [],
    });
  });

  it("derives add-page, send-review, connect-client and publish from the site's own rows", async () => {
    const { user, siteA } = await seed();
    await createTestPage({ siteId: siteA.id, name: "Home" });
    expect((await getEditorOnboarding(user.id, siteA.id)).steps["add-page"]).toBe(false);
    await createTestPage({ siteId: siteA.id, name: "About", position: 1 });

    await prisma.reviewRequest.create({ data: { siteId: siteA.id, requestedById: user.id } });
    let v = await getEditorOnboarding(user.id, siteA.id);
    expect(v.steps["add-page"]).toBe(true);
    expect(v.steps["send-review"]).toBe(true);
    expect(v.steps["connect-client"]).toBe(false);

    await prisma.reviewRequest.create({
      data: { siteId: siteA.id, requestedById: user.id, invitedEmail: "client@example.com" },
    });
    await prisma.site.update({ where: { id: siteA.id }, data: { lastPublishedAt: new Date() } });
    v = await getEditorOnboarding(user.id, siteA.id);
    expect(v.steps["connect-client"]).toBe(true);
    expect(v.steps.publish).toBe(true);
    expect(v.completedCount).toBe(4);
  });

  it("recording a milestone twice counts it once", async () => {
    const { user, siteA } = await seed();
    await recordEditorMilestone(user.id, siteA.id, "preview");
    const v = await recordEditorMilestone(user.id, siteA.id, "preview");
    expect(v.completedCount).toBe(1);
    const row = await prisma.editorOnboarding.findUnique({ where: { userId_siteId: { userId: user.id, siteId: siteA.id } } });
    expect(row?.events).toEqual(["preview"]);
  });

  it("dismissing completes nothing and reopening keeps the progress", async () => {
    const { user, siteA } = await seed();
    await recordEditorMilestone(user.id, siteA.id, "set-brand");
    const dismissed = await setEditorChecklistDismissed(user.id, siteA.id, true);
    expect(dismissed.dismissed).toBe(true);
    expect(dismissed.completedCount).toBe(1);
    const reopened = await setEditorChecklistDismissed(user.id, siteA.id, false);
    expect(reopened.dismissed).toBe(false);
    expect(reopened.completedCount).toBe(1);
  });

  it("is per user: a teammate on the same site has their own milestones", async () => {
    const { user, workspace, siteA } = await seed();
    const mate = await createTestUser();
    await createTestWorkspaceMember({ userId: mate.id, workspaceId: workspace.id, role: "EDITOR" });
    await recordEditorMilestone(user.id, siteA.id, "preview");
    expect((await getEditorOnboarding(mate.id, siteA.id)).steps.preview).toBe(false);
  });

  it("refuses a site the user is not a member of", async () => {
    const { siteA } = await seed();
    const stranger = await createTestUser();
    await expect(getEditorOnboarding(stranger.id, siteA.id)).rejects.toBeInstanceOf(PermissionError);
    await expect(recordEditorMilestone(stranger.id, siteA.id, "preview")).rejects.toBeInstanceOf(PermissionError);
    expect(await prisma.editorOnboarding.count()).toBe(0);
  });
});

describe("tip queue state (L1-029)", () => {
  it("stores seen and dismissed per user × site, once each, and dismissing a tip completes no step", async () => {
    const { user, siteA, siteB } = await seed();
    await markEditorTip(user.id, siteA.id, "rail-coach", "seen");
    await markEditorTip(user.id, siteA.id, "rail-coach", "seen");
    const v = await markEditorTip(user.id, siteA.id, "rail-coach", "dismissed");
    expect(v.tipsSeen).toEqual(["rail-coach"]);
    expect(v.tipsDismissed).toEqual(["rail-coach"]);
    expect(v.completedCount).toBe(0);
    expect(v.dismissed).toBe(false);
    expect((await getEditorOnboarding(user.id, siteB.id)).tipsSeen).toEqual([]);
  });

  it("refuses a site the user is not a member of", async () => {
    const { siteA } = await seed();
    const stranger = await createTestUser();
    await expect(markEditorTip(stranger.id, siteA.id, "rail-coach", "seen")).rejects.toBeInstanceOf(PermissionError);
  });
});
