import { PROJECT_MIGRATIONS, TARGET_PROJECT_VERSION } from "./index";
import type { ProjectMigration, ProjectPayload } from "./types";

export interface RunnerInput {
  project: ProjectPayload;
  currentVersion: number;
  siteId: string;
  /** Test-only injection point. Production callers must omit. */
  overrideMigrations?: Record<number, ProjectMigration>;
}

export interface RunnerResult {
  project: ProjectPayload;
  newVersion: number;
}

const snapshotKey = (siteId: string) => `ds-migration-backup-${siteId}`;
const markerKey = (siteId: string) => `ds-migration-in-progress-${siteId}`;

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private-mode / quota-exceeded → silent best-effort */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Apply project-level migrations from `currentVersion` up to TARGET_PROJECT_VERSION.
 *
 * Side effects (best-effort, all wrapped in try/catch):
 *   - localStorage["ds-migration-backup-{siteId}"]      := JSON snapshot of input project
 *   - localStorage["ds-migration-in-progress-{siteId}"] := original fromVersion (string)
 *   - Both cleared on success.
 *   - Snapshot stays + marker stays on failure (caller decides whether to surface modal/retry).
 *
 * Pure with respect to DOM. Does NOT call `document.documentElement.style.setProperty`.
 * CSS variable application is the registry's responsibility downstream.
 *
 * `overrideMigrations` is a test-only seam. Production callers (T8 MigrationManager) MUST omit it.
 */
export function runProjectMigrations(input: RunnerInput): RunnerResult {
  const { project, currentVersion, siteId } = input;
  const migrations = input.overrideMigrations ?? PROJECT_MIGRATIONS;

  if (currentVersion >= TARGET_PROJECT_VERSION) {
    return { project, newVersion: currentVersion };
  }

  // Snapshot once. If a marker already exists from a prior crash with the
  // same fromVersion, reuse the existing snapshot rather than overwrite it —
  // so that the crash-resume path restores to the true pre-migration state.
  const existingMarker = (() => {
    try { return localStorage.getItem(markerKey(siteId)); } catch { return null; }
  })();

  if (existingMarker !== String(currentVersion)) {
    safeSet(snapshotKey(siteId), JSON.stringify(project));
    safeSet(markerKey(siteId), String(currentVersion));
  }

  let working = project;
  for (let v = currentVersion; v < TARGET_PROJECT_VERSION; v++) {
    const migration = migrations[v + 1];
    if (!migration) {
      throw new Error(`[ds-migration] no migration registered for v${v} → v${v + 1}`);
    }
    working = migration.up(working);
    migration.validate(working);
  }

  safeRemove(snapshotKey(siteId));
  safeRemove(markerKey(siteId));
  return { project: working, newVersion: TARGET_PROJECT_VERSION };
}
