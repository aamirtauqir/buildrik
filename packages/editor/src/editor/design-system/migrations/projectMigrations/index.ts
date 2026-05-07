import type { ProjectMigration } from "./types";

/**
 * Registry, keyed by toVersion. Append future migrations here.
 *
 * Currently empty — migration 0001 lands in T6, which will register it
 * here as `{ 1: migration0001 }` after importing from `./0001-extend-token-kinds`.
 */
export const PROJECT_MIGRATIONS: Record<number, ProjectMigration> = {};

/** Highest known target version. Bump when adding a migration. */
export const TARGET_PROJECT_VERSION = 1;

export type { ProjectPayload, ProjectMigration } from "./types";
