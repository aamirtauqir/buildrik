/**
 * Editor feature flags.
 *
 * Gate WIP UI behind these flags. Default is OFF in production.
 * Dev: set `VITE_FEATURE_<NAME>=true` in `.env.local` to enable.
 *
 * SCAFFOLD: when a feature ships real backend, delete its flag entry +
 * the gating call sites in the same PR. Do not let flags rot.
 */

const env = import.meta.env;

export const FEATURES = {
  /** Publish-to-host workflow. Backend: Vercel API integration. Phase 1. */
  publish: env.VITE_FEATURE_PUBLISH === "true",
  /** Account modal (Profile/Team/Collaboration/Billing). Phase 2-7. */
  account: env.VITE_FEATURE_ACCOUNT === "true",
  /** Invite modal (team invitations via Resend). Phase 4. */
  invite: env.VITE_FEATURE_INVITE === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => FEATURES[flag];
