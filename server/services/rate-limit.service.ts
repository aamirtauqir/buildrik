import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  if (!user?.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

export async function incrementFailedAttempts(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: { increment: 1 } },
    select: { failedAttempts: true },
  });

  if (user.failedAttempts >= MAX_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000),
      },
    });
  }

  return MAX_ATTEMPTS - user.failedAttempts;
}

export async function resetFailedAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: 0, lockedUntil: null },
  });
}

export function getAttemptsRemaining(failedAttempts: number): number {
  return Math.max(0, MAX_ATTEMPTS - failedAttempts);
}
