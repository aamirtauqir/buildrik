import type { EventEmitter } from "../EventEmitter";
import { runProjectMigrations, type RunnerInput, type RunnerResult } from "../designSystem/migrations/projectMigrations/runner";
import { TARGET_PROJECT_VERSION } from "../designSystem/migrations/projectMigrations/index";

/**
 * Composer-owned manager for project-level DS schema migrations.
 *
 * Wraps `runProjectMigrations` with EventBus emissions so the UI can show
 * spinners / toasts / blocking modals without polling.
 *
 * Init order in Composer:
 *   1. loadProject (BuildrikSyncProvider)
 *   2. composer.migration.run(...)         ← this manager
 *   3. TokenRegistryProvider mounts with migrated tokens
 *   4. useTokensForKind.applyToRoot writes :root CSS vars
 *
 * Post-load edge (A2): the migration modal's Retry / Restore re-enter at
 * step 2 through `editor/design-system/migrations/importMigratedProject`,
 * the same run-then-import step the load uses, so a re-run lands the way
 * a clean load would. `run` is pure — callers must import the result.
 *
 * Critical invariant: this manager does NOT touch the DOM. CSS variable
 * application stays at step 4 to avoid parallel writers.
 */
export class MigrationManager {
  constructor(private readonly events: EventEmitter) {}

  run(input: RunnerInput): RunnerResult {
    if (input.currentVersion >= TARGET_PROJECT_VERSION) {
      this.events.emit("migration:skipped", {
        siteId: input.siteId,
        currentVersion: input.currentVersion,
      });
      return { project: input.project, newVersion: input.currentVersion };
    }

    this.events.emit("migration:started", {
      siteId: input.siteId,
      fromVersion: input.currentVersion,
    });

    try {
      const result = runProjectMigrations(input);
      this.events.emit("migration:complete", {
        siteId: input.siteId,
        fromVersion: input.currentVersion,
        toVersion: result.newVersion,
      });
      return result;
    } catch (err) {
      this.events.emit("migration:failed", {
        siteId: input.siteId,
        fromVersion: input.currentVersion,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
