import { z } from "zod";

/**
 * Per-workspace feature flags (DB-backed runtime kill-switch).
 * SSOT for the flag keys — services and routers import from here, never redefine.
 * Absent row = disabled (default-off): a new feature ships dark.
 */
export const FEATURE_KEYS = [
  "agency_layer",
  "client_mode",
  /** L4-007: generate alt text automatically on image upload (paid AI). Off by default. */
  "auto_alt_text",
] as const;

export const featureKeySchema = z.enum(FEATURE_KEYS);
export type FeatureKey = z.infer<typeof featureKeySchema>;

export type WorkspaceFeatureMap = Record<FeatureKey, boolean>;

export const setFeatureInput = z.object({
  workspaceId: z.string().min(1),
  key: featureKeySchema,
  enabled: z.boolean(),
});
export type SetFeatureInput = z.infer<typeof setFeatureInput>;
