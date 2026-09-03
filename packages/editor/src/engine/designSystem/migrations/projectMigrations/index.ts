import type { ProjectMigration } from "./types";
import { migration0001 } from "./0001-extend-token-kinds";
import { migration0002 } from "./0002-seed-dark-color-values";
import { migration0003 } from "./0003-add-color-warning";

/**
 * Registry, keyed by toVersion. Append future migrations here.
 *
 * Add new migrations by mapping `toVersion → migration` and bumping
 * `TARGET_PROJECT_VERSION`.
 */
export const PROJECT_MIGRATIONS: Record<number, ProjectMigration> = {
  1: migration0001,
  2: migration0002,
  3: migration0003,
};

/** Highest known target version. Bump when adding a migration. */
export const TARGET_PROJECT_VERSION = 3;

export type { ProjectPayload, ProjectMigration } from "./types";

export { runProjectMigrations } from "./runner";
export type { RunnerInput, RunnerResult } from "./runner";
