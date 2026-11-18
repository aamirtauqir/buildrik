/**
 * useAssetVersions — the ONE version list for an asset, shared by the drawer's
 * Versions drill-in and the library's Asset versions dialog.
 *
 * The list is the asset's family: the original, then every saved version (a
 * library row flagged `versionOf` the parent, synced through
 * `userMetadata.versionOf`), oldest first. That is where the version files
 * live, so it is the complete list. The server's `MediaAssetVersion` history
 * is not: it is written best-effort, only once both rows have synced, it is
 * pruned to the plan's cap, and it never holds the original. The drawer used
 * to list that history while the library listed the family, so the same
 * asset showed two different version lists (owner decision after REA
 * 2026-10-20 M-5: one list). The server history now only supplies each
 * version's author line (board 4418:62883), matched by file URL.
 *
 * Restore (M-5 semantics) moves every placement the family has on the site
 * onto the chosen version's file: one `replaceAcross` per other member that
 * carries placements, each its own undo step. Nothing on the server is
 * rewritten. A refused placement keeps its old src, so restoring again is the
 * retry.
 *
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Composer } from "@/engine/Composer";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import { listAssetVersions } from "@/services/MediaVersionService";
import type { LibraryItem } from "../data/mediaTypes";

export interface AssetVersionRow {
  item: LibraryItem;
  /** 1 is the original; the highest is the latest saved. */
  index: number;
  /** Placements on the site carrying this member's file. */
  placements: number;
  /** Who saved it, from the server history. Absent when unknown. */
  author?: string;
}

export interface AssetVersions {
  /** The original first, then saved versions oldest to newest. */
  rows: AssetVersionRow[];
  /** The members whose placements a restore onto `row` would move. */
  movingTo(row: AssetVersionRow): AssetVersionRow[];
  /** Moves those placements onto `row`'s file; element ids by outcome. */
  restore(row: AssetVersionRow): { replaced: string[]; failed: string[] };
}

/**
 * @param family `versionsOf(key)` — the original first. Pass a memoized
 *   array; an empty one yields an empty list.
 */
export function useAssetVersions(composer: Composer | null | undefined, family: LibraryItem[]): AssetVersions {
  /* A replace changes no library row, so the placement counts re-read on the
     engine's replace events (and after our own restore). */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!composer) return;
    const bump = () => setTick((t) => t + 1);
    composer.media.on(MEDIA_EVENTS.REPLACE_COMMITTED, bump);
    composer.media.on(MEDIA_EVENTS.REPLACE_PARTIAL, bump);
    return () => {
      composer.media.off(MEDIA_EVENTS.REPLACE_COMMITTED, bump);
      composer.media.off(MEDIA_EVENTS.REPLACE_PARTIAL, bump);
    };
  }, [composer]);

  const parentAssetId = family[0]?.assetId;
  const [authors, setAuthors] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(() => {
    setAuthors(new Map());
    if (!parentAssetId || family.length < 2) return;
    let live = true;
    listAssetVersions(parentAssetId)
      .then((versions) => {
        if (!live) return;
        const byUrl = new Map<string, string>();
        for (const v of versions) if (v.createdByName) byUrl.set(v.url, v.createdByName);
        setAuthors(byUrl);
      })
      .catch(() => {
        /* The author line is decoration; the list stands without it. */
      });
    return () => {
      live = false;
    };
  }, [parentAssetId, family.length]);

  const rows = useMemo<AssetVersionRow[]>(
    () =>
      family.map((item, i) => {
        const author = authors.get(item.src);
        return {
          item,
          index: i + 1,
          placements: composer ? composer.mediaOps.getUsages(item.src).count : 0,
          ...(author ? { author } : {}),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is the re-read trigger
    [family, composer, authors, tick],
  );

  const movingTo = useCallback(
    (row: AssetVersionRow) => rows.filter((r) => r.item.src !== row.item.src && r.placements > 0),
    [rows],
  );

  const restore = useCallback(
    (row: AssetVersionRow) => {
      if (!composer) return { replaced: [], failed: [row.item.key] };
      const results = movingTo(row).map((r) => composer.mediaOps.replaceAcross(r.item.src, row.item.src));
      setTick((t) => t + 1);
      return {
        replaced: results.flatMap((r) => r.replaced.map((e) => e.elementId)),
        failed: results.flatMap((r) => r.failed.map((f) => f.elementId)),
      };
    },
    [composer, movingTo],
  );

  return useMemo(() => ({ rows, movingTo, restore }), [rows, movingTo, restore]);
}
