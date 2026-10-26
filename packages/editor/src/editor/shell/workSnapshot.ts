/**
 * "Download a copy" for the recovery surfaces (2L9 page 07: G02 Download local
 * copy, G18 Download them, G22 Download changes, G08 Download my copy, G14
 * Download a copy, G26 Download a copy).
 *
 * Each of those surfaces sits outside the composer — a banner, a dialog, the
 * crash screen that replaces the whole shell — so none of them can export the
 * project itself. The load path registers the one provider that can
 * (`registerWorkSnapshot(() => composer.exportProject())`); without it the
 * copy kept for a failed save (`bk-unsaved-v1-<site>`) is the work there is.
 * With neither there is nothing to download, and the surfaces offer no
 * button rather than one that saves an empty file.
 *
 * @license BSD-3-Clause
 */
import type { ProjectData } from "@shared/types";
import { readUnsaved } from "@/services/unsavedRecovery";

type WorkProvider = () => ProjectData | null;

let provider: WorkProvider | null = null;

/** Returns the unregister. */
export function registerWorkSnapshot(next: WorkProvider): () => void {
  provider = next;
  return () => {
    if (provider === next) provider = null;
  };
}

/** The work on screen, else the copy kept for this site, else null. */
export function currentWork(siteId: string | null): ProjectData | null {
  try {
    const live = provider?.();
    if (live) return live;
  } catch {
    /* A crashed shell can throw on export; the kept copy may still be there. */
  }
  return siteId ? (readUnsaved(siteId)?.project ?? null) : null;
}

/** Save `project` as a JSON file the editor can import again. */
export function downloadProject(project: ProjectData, label = "copy"): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `buildrik-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
