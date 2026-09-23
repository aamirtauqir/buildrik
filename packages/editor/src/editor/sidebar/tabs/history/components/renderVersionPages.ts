/**
 * renderVersionPages — render a NamedVersion's snapshot through the
 * live export path.
 *
 * ExportEngine only operates on a live Composer instance — there is no
 * "export ProjectData" mode. To diff a saved version against the current
 * canvas, swap the snapshot in, export, swap the original back. The swap
 * path goes through Composer's `history.runWithoutTracking` so the
 * comparison render does not itself become a history entry (a transient
 * preview must never show up in Undo, in autosave, or in the Saves list).
 *
 * Throws on export failure so ComparePicker renders an error state rather
 * than a fake-empty diff (DF5).
 */
import type { Composer } from "@/engine";
import type { NamedVersion } from "@/shared/types/versions";
import { ExportEngine } from "@/engine/export";
import type { PublishPage } from "@/editor/shell/exportPublishPages";
import { inlinePublishStylesheet } from "@/editor/shell/exportPublishPages";

export async function renderVersionPages(
  composer: Composer,
  version: NamedVersion,
): Promise<PublishPage[]> {
  /* `versions.getVersion` returns the stored snapshot deep-cloned
     (VersionTimelineManager contract) — passing it through importProject is
     safe and does not mutate the stored entry. */
  let pages: PublishPage[] = [];
  await composer.history.runWithoutTracking(async () => {
    composer.importProject(version.snapshot);
    const result = await new ExportEngine(composer).exportAllPages({
      format: "html",
      minify: true,
    });
    pages = inlinePublishStylesheet(result.files);
  });
  return pages;
}
