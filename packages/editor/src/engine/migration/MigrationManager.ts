import type { EventEmitter } from "../EventEmitter";
import {
  runProjectMigrations,
  TARGET_PROJECT_VERSION,
  type RunnerInput,
  type RunnerResult,
} from "../../editor/design-system/migrations/projectMigrations";

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
