/**
 * The one path a persisted project takes through the DS schema migrations
 * and into the engine: run `composer.migration.run` on the payload's tokens,
 * then import the result with the bumped `dsSchemaVersion`.
 *
 * Shared by the load (`useComposerInit`) and by the migration modal's
 * Restore / Retry, so a re-run after a failure lands the tokens exactly the
 * way a clean load would have. Before this lived here, the modal ran the
 * migration and discarded its result — the runner is pure and only emits
 * events, so the modal said "complete" while the engine kept the old tokens.
 *
 * Throws when a migration step (or alias validation) throws. Nothing is
 * imported in that case; the caller decides what the engine holds next —
 * the load imports the payload as-is with a warning, Restore falls back to
 * the snapshot as-is, Retry leaves the current project alone.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { ProjectData } from "@/shared/types";
import type { DesignToken } from "../types";

export function importMigratedProject(
  composer: Composer,
  data: ProjectData,
  siteId: string
): void {
  const fromVersion = data.dsSchemaVersion ?? 0;
  const result = composer.migration.run({
    project: { tokens: (data.styles ?? []) as unknown as DesignToken[] },
    currentVersion: fromVersion,
    siteId,
  });
  const toImport: ProjectData =
    result.newVersion !== fromVersion
      ? {
          ...data,
          styles: result.project.tokens as unknown as ProjectData["styles"],
          dsSchemaVersion: result.newVersion,
        }
      : data;
  composer.aliasResolver.validate((toImport.styles ?? []) as unknown as DesignToken[]);
  composer.importProject(toImport);
}
