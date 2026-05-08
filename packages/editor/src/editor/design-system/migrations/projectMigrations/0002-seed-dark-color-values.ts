import type { ProjectMigration, ProjectPayload } from "./types";

/**
 * Phase B.3b: seed `darkValue` on the 9 default color tokens.
 *
 * Light → dark mapping picked to keep semantics intact in dark mode:
 *   - brand colors lift one tint (Tailwind 400/500 → 400)
 *   - surface colors invert (slate 50 ↔ slate 900, etc.)
 *   - text/muted lift (slate 700 → slate 200)
 *   - state colors lift (green/red 500 → 400)
 *
 * Idempotent: only seeds when the token has NO darkValue yet. User edits
 * to darkValue (including explicit empty string `""`) are preserved.
 *
 * Selective: only the 9 known default token ids get a default mapping. Custom
 * user-added color tokens are left alone — user can set their own dark pair
 * via the Design tab when that UI ships.
 */
const DARK_VALUE_BY_ID: Record<string, string> = {
  "color-primary":    "#60A5FA", // blue-500 → blue-400
  "color-secondary":  "#94A3B8", // slate-500 → slate-400
  "color-accent":     "#4ADE80", // green-500 → green-400
  "color-background": "#0F172A", // slate-50 → slate-900
  "color-text":       "#E2E8F0", // slate-700 → slate-200
  "color-muted":      "#A1A1AA", // zinc-500 → zinc-400
  "color-border":     "#3F3F46", // zinc-800 → zinc-700
  "color-success":    "#4ADE80", // green-500 → green-400
  "color-error":      "#F87171", // red-500 → red-400
};

const SEEDED_IDS = Object.keys(DARK_VALUE_BY_ID);

export const migration0002: ProjectMigration = {
  fromVersion: 1,
  toVersion: 2,
  description: "Seed darkValue on 9 default color tokens (color-primary/secondary/accent/background/text/muted/border/success/error). Skip tokens that already have darkValue.",

  up(project: ProjectPayload): ProjectPayload {
    const tokens = project.tokens.map((t) => {
      if (t.darkValue !== undefined) return t;
      const seed = DARK_VALUE_BY_ID[t.id];
      if (!seed) return t;
      return { ...t, darkValue: seed };
    });
    return { ...project, tokens };
  },

  validate(project: ProjectPayload): void {
    const seenIds = new Set(project.tokens.map((t) => t.id));
    const missingSeed = SEEDED_IDS.filter((id) => {
      if (!seenIds.has(id)) return false;
      const t = project.tokens.find((x) => x.id === id);
      return t?.darkValue === undefined;
    });
    if (missingSeed.length > 0) {
      throw new Error(
        `[ds-migration-0002] validate failed: tokens still missing darkValue after seed: ${missingSeed.join(", ")}`
      );
    }
  },
};
