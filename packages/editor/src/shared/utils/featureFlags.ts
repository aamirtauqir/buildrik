/**
 * Editor feature flags.
 *
 * Gate WIP UI behind these flags. Default is OFF in production.
 * Dev: set `VITE_FEATURE_<NAME>=true` in `.env.local` to enable.
 *
 * SCAFFOLD: when a feature ships real backend, delete its flag entry +
 * the gating call sites in the same PR. Do not let flags rot.
 */

import { FEATURE_PUBLISH, FEATURE_DS_AI, FEATURE_COLLAB, FEATURE_CMS_DATA_SOURCES } from "./runtimeEnv";

export const FEATURES = {
  publish: FEATURE_PUBLISH,
  dsAi: FEATURE_DS_AI,
  collab: FEATURE_COLLAB,
  cmsDataSources: FEATURE_CMS_DATA_SOURCES,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => FEATURES[flag];
