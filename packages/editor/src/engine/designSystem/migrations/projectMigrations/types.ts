import type { DesignToken } from "../../types";

/**
 * Whole-project payload visible to a project migration.
 * Mirrors what `Site.projectStyles` + sibling fields will hold.
 */
export interface ProjectPayload {
  tokens: DesignToken[];
  /** Future: presets, components, dsBound, etc. Migrations declare their slice. */
  [extension: string]: unknown;
}

/**
 * One project-level migration step. Operates on the entire project.
 *
 * up()       — pure transform: returns the next-version payload.
 *              MUST be idempotent (safe to re-apply at toVersion).
 * validate() — asserts post-conditions; throws on violation.
 */
export interface ProjectMigration {
  fromVersion: number;
  toVersion: number;
  /** Human-readable label used in error messages and migration audit logs. */
  description: string;
  up: (project: ProjectPayload) => ProjectPayload;
  validate: (project: ProjectPayload) => void;
}
