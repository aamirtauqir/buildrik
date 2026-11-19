import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_TASK_IDS,
  EDITOR_TASK_IDS,
  EDITOR_TIP_IDS,
  wizardDataSchema,
  type EditorOnboardingView,
  type EditorTaskId,
  type EditorTipId,
  type WizardData,
} from "@buildrik/shared/schemas/onboarding";
import { assertSiteAccess } from "./permission.service";

// The full-variant checklist must be entirely done before onboarding flips
// to completed (invited-variant users finish via dismiss).
const FULL_CHECKLIST_TASK_IDS = DASHBOARD_TASK_IDS.filter((id) => id !== "edit-page");

export async function getOnboardingState(userId: string) {
  const existing = await prisma.onboardingState.findUnique({ where: { userId } });
  if (!existing) {
    return prisma.onboardingState.create({
      data: { userId, step: "ROLE_SELECT" },
    });
  }

  // Read-repair: site creation happens on three different paths (blank from
  // onboarding, template/AI from /dashboard/sites/new), none of which used to
  // advance the step — users were bounced back to /onboarding/setup forever.
  // Owning a live site means the project phase is done, whichever path made
  // it; this also heals accounts already stuck in the loop.
  // Skip the repair while the M2 wizard is active (wizardData present): the new
  // 24-frame flow creates a site at S2/paths but the user must stay IN the
  // wizard, not be bounced to the checklist. The wizard flips step→CHECKLIST
  // itself via completeWizard() when the editor opens.
  if (
    !existing.completed &&
    !existing.wizardData &&
    (existing.step === "PROJECT_SETUP" || existing.step === "SITE_CREATION")
  ) {
    const site = await prisma.site.findFirst({
      where: {
        deletedAt: null,
        workspace: { members: { some: { userId, status: "ACTIVE" } } },
      },
      select: { id: true },
    });
    if (site) {
      return prisma.onboardingState.update({
        where: { userId },
        data: { step: "CHECKLIST" },
      });
    }
  }

  return existing;
}

// M2 wizard: persist the whole wizard state (validated) after each step so a
// refresh resumes at wizardData.route with inputs intact. Server is the source
// of truth; the client only uses localStorage as a write-retry buffer.
export async function saveWizard(userId: string, wizardData: WizardData) {
  const parsed = wizardDataSchema.parse(wizardData);
  return prisma.onboardingState.update({
    where: { userId },
    data: { wizardData: parsed },
  });
}

// M2 wizard reached the editor (E1). Flip the coarse step machine to CHECKLIST
// so the dashboard checklist widget shows afterward, and keep wizardData for
// analytics/idempotency. Called when the site is created + editor opens.
export async function completeWizard(userId: string) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { step: "CHECKLIST" },
  });
}

export async function completeDashboardTask(userId: string, taskId: string) {
  const state = await prisma.onboardingState.findUnique({ where: { userId } });
  if (!state) throw new Error("ONBOARDING_NOT_FOUND");

  const done = new Set(Array.isArray(state.dashboardTasks) ? (state.dashboardTasks as string[]) : []);
  done.add(taskId);
  const allDone = FULL_CHECKLIST_TASK_IDS.every((id) => done.has(id));

  return prisma.onboardingState.update({
    where: { userId },
    data: {
      dashboardTasks: [...done],
      ...(allDone && { step: "COMPLETED", completed: true }),
    },
  });
}

// ── Editor Getting-started (L1-015) ─────────────────────────────────────────
//
// Per user × site. One computed view — the rail pill and the checklist read
// the same object. Recorded milestones are the editor's real events (brand
// applied, preview opened, a block inserted…); four steps are ALSO derived
// from the site's own rows, so work done elsewhere (another device, the
// dashboard) still counts. The dismissal is its own column and never touches
// progress. There is no "completed" flag to go stale: done is
// `completedCount === totalCount`, computed on every read.

const editorKey = (userId: string, siteId: string) => ({ userId_siteId: { userId, siteId } });

export async function getEditorOnboarding(userId: string, siteId: string): Promise<EditorOnboardingView> {
  await assertSiteAccess(prisma, userId, siteId);
  return computeEditorOnboarding(userId, siteId);
}

async function computeEditorOnboarding(userId: string, siteId: string): Promise<EditorOnboardingView> {
  const [row, pageCount, rounds, invitedRounds, site] = await Promise.all([
    prisma.editorOnboarding.findUnique({
      where: editorKey(userId, siteId),
      select: { events: true, dismissedAt: true, tipsSeen: true, tipsDismissed: true },
    }),
    prisma.page.count({ where: { siteId } }),
    prisma.reviewRequest.count({ where: { siteId } }),
    prisma.reviewRequest.count({ where: { siteId, invitedEmail: { not: null } } }),
    prisma.site.findUnique({ where: { id: siteId }, select: { lastPublishedAt: true } }),
  ]);
  const recorded = new Set(row?.events ?? []);
  const derived: Partial<Record<EditorTaskId, boolean>> = {
    /* The editor makes the first page itself — only a second one is the user's. */
    "add-page": pageCount > 1,
    "send-review": rounds > 0,
    "connect-client": invitedRounds > 0,
    publish: Boolean(site?.lastPublishedAt),
  };
  const steps = Object.fromEntries(
    EDITOR_TASK_IDS.map((id) => [id, recorded.has(id) || derived[id] === true]),
  ) as Record<EditorTaskId, boolean>;
  return {
    steps,
    completedCount: EDITOR_TASK_IDS.filter((id) => steps[id]).length,
    totalCount: EDITOR_TASK_IDS.length,
    dismissed: Boolean(row?.dismissedAt),
    tipsSeen: [...new Set(row?.tipsSeen ?? [])].filter(isTipId),
    tipsDismissed: [...new Set(row?.tipsDismissed ?? [])].filter(isTipId),
  };
}

const isTipId = (id: string): id is EditorTipId => (EDITOR_TIP_IDS as readonly string[]).includes(id);

export async function recordEditorMilestone(userId: string, siteId: string, milestone: EditorTaskId) {
  await assertSiteAccess(prisma, userId, siteId);
  const row = await prisma.editorOnboarding.findUnique({ where: editorKey(userId, siteId), select: { events: true } });
  if (!row?.events.includes(milestone)) {
    await prisma.editorOnboarding.upsert({
      where: editorKey(userId, siteId),
      create: { userId, siteId, events: [milestone] },
      update: { events: { push: milestone } },
    });
  }
  return computeEditorOnboarding(userId, siteId);
}

export async function setEditorChecklistDismissed(userId: string, siteId: string, dismissed: boolean) {
  await assertSiteAccess(prisma, userId, siteId);
  const dismissedAt = dismissed ? new Date() : null;
  await prisma.editorOnboarding.upsert({
    where: editorKey(userId, siteId),
    create: { userId, siteId, dismissedAt },
    update: { dismissedAt },
  });
  return computeEditorOnboarding(userId, siteId);
}

/**
 * L1-029: the tip queue's memory. `seen` is written when a tip is shown (so it
 * is never auto-shown again on this site), `dismissed` when the user closes
 * it. Neither touches the checklist — a closed tip completes no step.
 */
export async function markEditorTip(userId: string, siteId: string, tipId: EditorTipId, action: "seen" | "dismissed") {
  await assertSiteAccess(prisma, userId, siteId);
  const row = await prisma.editorOnboarding.findUnique({
    where: editorKey(userId, siteId),
    select: { tipsSeen: true, tipsDismissed: true },
  });
  const held = action === "seen" ? row?.tipsSeen : row?.tipsDismissed;
  if (!held?.includes(tipId)) {
    await prisma.editorOnboarding.upsert({
      where: editorKey(userId, siteId),
      create: action === "seen" ? { userId, siteId, tipsSeen: [tipId] } : { userId, siteId, tipsDismissed: [tipId] },
      update: action === "seen" ? { tipsSeen: { push: tipId } } : { tipsDismissed: { push: tipId } },
    });
  }
  return computeEditorOnboarding(userId, siteId);
}

export async function dismissOnboarding(userId: string) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { dismissed: true },
  });
}

