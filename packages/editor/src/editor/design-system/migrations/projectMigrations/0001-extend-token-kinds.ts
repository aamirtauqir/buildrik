import type { ProjectMigration, ProjectPayload } from "./types";
import type { DesignToken, TokenKind } from "../../types";
import { DEFAULT_TOKENS } from "../../constants";

const NEW_KINDS: TokenKind[] = [
  "radius", "shadow", "motion", "border", "opacity",
  "zindex", "breakpoint", "grid", "sizing", "icon", "imagery",
];

const SEED_TOKENS: DesignToken[] = DEFAULT_TOKENS.filter(
  (t) => t.kind !== undefined && NEW_KINDS.includes(t.kind)
);

export const migration0001: ProjectMigration = {
  fromVersion: 0,
  toVersion: 1,
  description: "Seed 18 placeholder tokens for 11 token kinds (radius/shadow/motion/border/opacity/zindex/breakpoint/grid/sizing/icon/imagery).",

  up(project: ProjectPayload): ProjectPayload {
    const existing = new Set(project.tokens.map((t) => t.id));
    const additions = SEED_TOKENS.filter((t) => !existing.has(t.id));
    return {
      ...project,
      tokens: [...project.tokens, ...additions],
    };
  },

  validate(project: ProjectPayload): void {
    const presentKinds = new Set(project.tokens.map((t) => t.kind));
    const missing = NEW_KINDS.filter((k) => !presentKinds.has(k));
    if (missing.length > 0) {
      throw new Error(
        `[ds-migration-0001] validate failed: missing token kinds ${missing.join(", ")}`
      );
    }
  },
};
