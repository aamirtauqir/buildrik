/**
 * The e2e accounts, and which fixture owns which.
 *
 * These are deliberately two users, not one with an override. The two setup
 * projects run concurrently and need opposite onboarding state — `setup` wants a
 * user past the wizard, `setup-onboarding` wants one inside it and resets the
 * row to get there. Sharing one account meant they wrote the same row in
 * opposite directions; whichever lost the race failed, and `chromium` declares
 * `dependencies: ["setup"]`, so 81 tests were skipped rather than failed. A skip
 * reads as "fine" in a summary line, which is why it went unnoticed.
 *
 * The default was previously written out in three places. Seeding a second user
 * without collapsing that left three spots to forget, so it lives here.
 *
 * Both are created by `prisma/seed.ts`. Neither has a seeded OnboardingState —
 * each fixture upserts the state it needs, so a fresh database works on the
 * first run instead of depending on what a previous run left behind.
 */

/**
 * Re-running locally more than twice inside 15 minutes will fail at the setup
 * step with `/auth/error/expired-link`, and the link is fine. `verifyMagicLink`
 * is behind `strictRateLimit` (5 per 15 min, `routers/auth.ts:139`), each run
 * spends two, and `callback/page.tsx:17` renders every failure — including a
 * rate-limit rejection — as the expired-link screen. Clear it with
 * `prisma.rateLimitBucket.deleteMany({})` or wait out the window. CI is
 * unaffected: it gets a fresh database per job.
 */

/** Owned by `auth.setup.ts`. Must be past the wizard (`step: CHECKLIST`). */
export const QA_EMAIL = process.env.PW_USER_EMAIL ?? "qa@buildrik.local";

/** Owned by `onboarding.setup.ts`. Must be inside the wizard (`ROLE_SELECT`). */
export const QA_ONBOARDING_EMAIL =
  process.env.PW_ONB_EMAIL ?? "qa-onboarding@buildrik.local";
