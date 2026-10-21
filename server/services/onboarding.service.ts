import { prisma } from "@/lib/prisma";
import { DASHBOARD_TASK_IDS, wizardDataSchema, type WizardData } from "@buildrik/shared/schemas/onboarding";

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

/**
 * Record an editor-checklist step as done, server-side and per user.
 *
 * Mirrors `completeDashboardTask` deliberately rather than inventing a second
 * shape: same set-union write, same idempotence, different column. It does NOT
 * flip `completed`/`step` the way the dashboard one does — the editor
 * checklist is a nudge, not the onboarding funnel, and finishing it should not
 * silently mark the funnel complete.
 */
export async function completeEditorTask(userId: string, taskId: string) {
  const state = await prisma.onboardingState.findUnique({ where: { userId } });
  if (!state) throw new Error("ONBOARDING_NOT_FOUND");

  const done = new Set(Array.isArray(state.editorTasks) ? (state.editorTasks as string[]) : []);
  done.add(taskId);

  return prisma.onboardingState.update({
    where: { userId },
    data: { editorTasks: [...done] },
  });
}

export async function dismissOnboarding(userId: string) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { dismissed: true },
  });
}

