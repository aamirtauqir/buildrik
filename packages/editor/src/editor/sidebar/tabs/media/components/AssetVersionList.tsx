/**
 * AssetVersionList — the one version list, drawn in the drawer's Versions
 * drill-in (146:32) and in the library's Asset versions dialog. Data and
 * restore come from `useAssetVersions`; this file only draws them.
 *
 * v3 4418:62883: 56-high full-bleed rows, newest first — dot 20 in, the time
 * 13 ink over the author line, a meta column (`current` / `original` / the
 * size delta against the version before), ⋯ in a 24 box 16 from the edge.
 * The version the site carries is `current`, tinted with the 3px accent bar:
 * "current" is a fact about the placements (`getUsages`), never a flag on the
 * row. An asset with no saved version shows only the note (4418:63971).
 *
 * ⋯ appears only where a restore would move something. Without `onRestore`
 * the restore confirms INLINE in the 84h band 146:64 draws, naming the cost
 * ("a drill-in that spawns a modal has lost the plot"), and a placement that
 * did not move says so on the row (DQ-012). With `onRestore` the caller runs
 * its own confirm — the library's dialog has one, with per-page results.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useState } from "react";
import { Button } from "@/editor/chrome-ui";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import type { EditsSnapshot } from "@shared/types/media";
import { fmtSize, versionLabel } from "../data/mediaUtils";
import type { AssetVersionRow, AssetVersions } from "../hooks/useAssetVersions";

const VERSION_ROW = "tw:flex tw:h-14 tw:w-full tw:items-start tw:gap-3 tw:pt-2.5 tw:pl-5 tw:pr-4";
const VERSION_DOT = "tw:mt-1.5 tw:size-2 tw:shrink-0 tw:rounded-full";
const VERSION_TIME_COL = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col";
const VERSION_TIME = "tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
/* Board 4418:62883 — the author line under the time, "Ali" / "Sara". */
const VERSION_AUTHOR = "tw:min-w-0 tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const VERSION_META = "tw:mt-0.5 tw:w-[72px] tw:shrink-0 tw:text-[11px] tw:font-medium tw:leading-4 tw:text-[var(--bk-gray-500)]";

/** What the version was saved as — the row's tooltip, so the dimensions and
 *  edits the old dialog's cards printed stay one hover away. */
function rowDetail(row: AssetVersionRow, total: number): string {
  const { width, height, edits } = row.item;
  const head = width && height ? `${versionLabel(row, total)} · ${width} × ${height}` : versionLabel(row, total);
  if (row.index === 1 || !edits) return head;
  const e: EditsSnapshot = edits;
  return [
    head,
    `Crop: ${e.crop} · Preset: ${e.preset} · Format: ${e.format}`,
    `Brightness: ${e.brightness} · Contrast: ${e.contrast} · Saturation: ${e.saturation} · Blur: ${e.blur}`,
  ].join("\n");
}

function rowMeta(row: AssetVersionRow, before: AssetVersionRow | undefined): string {
  if (row.placements > 0) return "current";
  if (row.index === 1) return "original";
  const delta = before ? row.item.size - before.item.size : 0;
  return delta === 0 ? fmtSize(row.item.size) : `${delta > 0 ? "+" : "−"}${fmtSize(Math.abs(delta))}`;
}

interface AssetVersionListProps {
  versions: AssetVersions;
  /** Hands the restore to the caller's own confirm instead of the inline one. */
  onRestore?(row: AssetVersionRow): void;
}

export function AssetVersionList({ versions, onRestore }: AssetVersionListProps) {
  const { rows } = versions;
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  if (rows.length < 2) {
    return (
      <div className="tw:px-4 tw:pt-8 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-gray-500)]" data-testid="media-versions-empty">
        No saved versions yet. Edits create restore points automatically.
      </div>
    );
  }

  const confirmRestore = (row: AssetVersionRow) => {
    setPendingKey(null);
    setFailedKey(versions.restore(row).failed.length > 0 ? row.item.key : null);
  };

  return (
    <div className="tw:w-full" role="list" aria-label="Version history">
      {[...rows].reverse().map((row) => {
        const key = row.item.key;
        const time = formatRelativeTime(new Date(row.item.createdAt).getTime(), { fallback: "daysShort" });
        const current = row.placements > 0;
        const moving = versions.movingTo(row).reduce((n, r) => n + r.placements, 0);
        return (
          <React.Fragment key={key}>
            <div
              className={`${VERSION_ROW} ${current ? "tw:relative tw:bg-[var(--bk-accent-tint)]" : ""}`}
              data-testid={`media-version-${key}`}
              data-current={current ? "true" : undefined}
              role="listitem"
              aria-label={`${versionLabel(row, rows.length)}, ${time}`}
              title={rowDetail(row, rows.length)}
            >
              {current ? (
                <span className="tw:absolute tw:inset-y-0 tw:left-0 tw:w-[3px] tw:bg-[var(--bk-accent)]" aria-hidden="true" />
              ) : null}
              <span className={`${VERSION_DOT} ${current ? "tw:bg-[var(--bk-accent)]" : "tw:bg-[var(--bk-gray-300)]"}`} aria-hidden="true" />
              <span className={VERSION_TIME_COL}>
                <span className={VERSION_TIME}>{time}</span>
                {row.author ? (
                  <span className={VERSION_AUTHOR} data-testid={`media-version-author-${key}`}>
                    {row.author}
                  </span>
                ) : null}
              </span>
              <span className={VERSION_META} data-testid={`media-version-meta-${key}`}>
                {rowMeta(row, rows[row.index - 2])}
              </span>
              {moving > 0 ? (
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  className="tw:-mt-0.5 tw:size-6 tw:min-h-6 tw:shrink-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-gray-500)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)]"
                  data-testid={`media-version-menu-${key}`}
                  aria-label={`Restore options for version from ${time}`}
                  onClick={() => {
                    if (onRestore) onRestore(row);
                    else setPendingKey(pendingKey === key ? null : key);
                  }}
                >
                  ⋯
                </Button>
              ) : (
                <span className="tw:w-6 tw:shrink-0" aria-hidden="true" />
              )}
            </div>
            {failedKey === key ? (
              <div
                role="alert"
                className="tw:w-full tw:px-4 tw:py-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error)]"
                data-testid={`media-restore-failed-${key}`}
              >
                Couldn&apos;t move every place onto this version — try again.
              </div>
            ) : null}
            {/* Board 146:64 — the band is 84 tall because the question names
                the cost: it shipped as a 32h strip saying "Restore?", which
                asks for a decision while withholding the one fact needed. */}
            {pendingKey === key ? (
              <div
                className="tw:flex tw:h-21 tw:w-full tw:flex-col tw:justify-start tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:pt-2 tw:text-[12px] tw:leading-[18px]"
                data-testid="media-restore-confirm"
              >
                <span className="tw:text-[var(--bk-ink)]">
                  Restore this version? It is used in {moving} {moving === 1 ? "place" : "places"} — those will update too.
                </span>
                <span className="tw:flex tw:items-center tw:justify-end tw:gap-4">
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    variant="link"
                    className="tw:min-h-5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
                    data-testid="media-restore-cancel"
                    onClick={() => setPendingKey(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    variant="link"
                    className="tw:min-h-5 tw:text-[12px] tw:leading-[18px]"
                    data-testid="media-restore-go"
                    onClick={() => confirmRestore(row)}
                  >
                    Restore
                  </Button>
                </span>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
