import { prisma } from "@/lib/prisma";
import { DASHBOARD_TASK_IDS } from "@buildrik/shared/schemas/onboarding";

const STEP_SEQUENCE = [
  "ROLE_SELECT",
  "PROJECT_SETUP",
  "SITE_CREATION",
  "EDITOR_TOUR",
  "CHECKLIST",
  "COMPLETED",
] as const;

type OnboardingStep = (typeof STEP_SEQUENCE)[number];

function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= STEP_SEQUENCE.length - 1) return "COMPLETED";
  return STEP_SEQUENCE[idx + 1];
}

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
  if (
    !existing.completed &&
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

export async function selectRole(userId: string, role: string) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { role, step: "PROJECT_SETUP" },
  });
}

export async function setupProject(
  userId: string,
  data: { projectName: string; method: string }
) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { projectName: data.projectName, method: data.method, step: "SITE_CREATION" },
  });
}

export async function completeStep(userId: string, step: string) {
  // Unknown input used to fall through nextStep's idx===-1 branch straight to
  // COMPLETED — any stray caller could (and did) finish ALL of onboarding.
  if (!STEP_SEQUENCE.includes(step as OnboardingStep)) {
    throw new Error("INVALID_STEP");
  }
  const next = nextStep(step as OnboardingStep);
  const isCompleted = next === "COMPLETED";
  return prisma.onboardingState.update({
    where: { userId },
    data: { step: next, ...(isCompleted && { completed: true }) },
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

export async function dismissOnboarding(userId: string) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { dismissed: true },
  });
}

export async function completeTourStep(userId: string, step: number) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { tourStep: step + 1 },
  });
}

export async function completeTour(userId: string) {
  return prisma.onboardingState.update({
    where: { userId },
    data: { tourCompleted: true },
  });
}
