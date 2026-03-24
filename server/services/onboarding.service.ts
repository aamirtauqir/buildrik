import { prisma } from "@/lib/prisma";

const STEP_SEQUENCE = [
  "ROLE_SELECT",
  "PROJECT_SETUP",
  "SITE_CREATION",
  "EDITOR_TOUR",
  "CHECKLIST",
  "COMPLETED",
] as const;

type OnboardingStep = (typeof STEP_SEQUENCE)[number];

function nextStep(current: string): OnboardingStep {
  const idx = STEP_SEQUENCE.indexOf(current as OnboardingStep);
  if (idx === -1 || idx >= STEP_SEQUENCE.length - 1) return "COMPLETED";
  return STEP_SEQUENCE[idx + 1];
}

export async function getOnboardingState(userId: string) {
  const existing = await prisma.onboardingState.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.onboardingState.create({
    data: { userId, step: "ROLE_SELECT" },
  });
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
  const next = nextStep(step);
  const isCompleted = next === "COMPLETED";
  return prisma.onboardingState.update({
    where: { userId },
    data: { step: next, ...(isCompleted && { completed: true }) },
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
