import type { ProjectMigration } from "./types";
import { migration0001 } from "./0001-extend-token-kinds";

/**
 * Registry, keyed by toVersion. Append future migrations here.
 *
 * Add new migrations by mapping `toVersion → migration` and bumping
 * `TARGET_PROJECT_VERSION`.
 */
export const PROJECT_MIGRATIONS: Record<number, ProjectMigration> = {
  1: migration0001,
};

/** Highest known target version. Bump when adding a migration. */
export const TARGET_PROJECT_VERSION = 1;

export type { ProjectPayload, ProjectMigration } from "./types";

export { runProjectMigrations } from "./runner";
export type { RunnerInput, RunnerResult } from "./runner";
