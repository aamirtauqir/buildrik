import type { ProjectMigration } from "./types";

/**
 * Registry, keyed by toVersion. Append future migrations here.
 *
 * Currently empty — migration 0001 lands in T6.
 * Once T6 ships, replace with:
 *   { 1: migration0001 } and uncomment the import below.
 */
export const PROJECT_MIGRATIONS: Record<number, ProjectMigration> = {};

/** Highest known target version. Bump when adding a migration. */
export const TARGET_PROJECT_VERSION = 1;

export type { ProjectPayload, ProjectMigration } from "./types";
