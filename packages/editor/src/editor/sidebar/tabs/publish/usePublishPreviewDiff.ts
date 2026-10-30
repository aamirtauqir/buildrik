/**
 * usePublishPreviewDiff — what a publish now would change against the live
 * version (A-33; 2L9 B8-PB01–PB03, PB21, PB04's "1 Changes"). Exports the
 * pages a publish would send and asks the server to compare them with the
 * live job's retained payload; page names come from the editor's own pages.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { pageFileNames } from "@/engine/export";
import { exportPublishPages } from "@/editor/shell/exportPublishPages";
import { fetchPublishPreviewDiff, type PublishPreviewDiff } from "@/services/PublishService";

export interface PreviewChange {
  name: string;
  change: "added" | "changed" | "removed";
}

export interface PublishPreview {
  diff: PublishPreviewDiff;
  /** Pages that differ, by the editor's page name (the file name when the
   *  page is gone from the editor — a removal). */
  changes: PreviewChange[];
}

/** `null` while loading, when there is no site, or when the read failed — the
 *  caller keeps its plain sentence then. Re-reads when `reloadKey` moves. */
export function usePublishPreviewDiff(
  composer: Composer | null,
  siteId: string | null,
  active: boolean,
  reloadKey: unknown = null,
): PublishPreview | null {
  const [preview, setPreview] = React.useState<PublishPreview | null>(null);
  React.useEffect(() => {
    if (!active || !composer || !siteId) return undefined;
    let alive = true;
    void (async () => {
      try {
        const pages = await exportPublishPages(composer);
        const diff = await fetchPublishPreviewDiff(siteId, pages);
        if (!alive) return;
        const all = composer.elements.getAllPages();
        const files = pageFileNames(all);
        const nameByFile = new Map(all.map((p) => [files.get(p.id) ?? "", p.name] as const));
        const changes = diff.pages
          .filter((p): p is typeof p & { change: PreviewChange["change"] } => p.change !== "same")
          .map((p) => ({ name: nameByFile.get(p.path) ?? p.path.replace(/\.html$/, ""), change: p.change }));
        setPreview({ diff, changes });
      } catch {
        if (alive) setPreview(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, composer, siteId, reloadKey]);
  return preview;
}
