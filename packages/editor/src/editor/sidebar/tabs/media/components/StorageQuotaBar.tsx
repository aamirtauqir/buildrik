/**
 * StorageQuotaBar — how much of the workspace's media allowance is gone.
 *
 * Styling moved onto the component in T8. It used to live in `MediaTab.css`,
 * which only `MediaTab` imports — so the moment the drawer was rendered on its
 * own (a probe case, a test, any surface that does not pull that file) this
 * drew as unstyled 16px text. The conformance harness would then have measured
 * markup nobody ships. A component that cannot be mounted alone cannot be
 * measured alone.
 *
 * @license BSD-3-Clause
 */

import { Button} from "@/editor/chrome-ui";

interface StorageQuotaBarProps {
  used: number;
  total: number;
  /** Board 145:199's "Optimise images to free space ›" — the actionable exit. */
  onOptimize?: () => void;
  /**
   * Drawer mode: the board's default Media screen (144:2) shows no quota line
   * at all — it earns its space only once the number starts to matter, which is
   * what the separate `quota-warn` / `quota-full` screens are.
   */
  compact?: boolean;
}

/**
 * Board copy is MB-precise under a gigabyte: "842 MB of 1 GB used".
 *
 * DECIMAL, not binary, and exported so there is one quota formatter rather
 * than two. Plans are sold in decimal GB — a 5 GB plan is 5,000,000,000 bytes —
 * so `formatBytes` (1024-based, from shared/utils/helpers/number) renders the
 * same allowance as "4.66 GB". The fullpage library footer used it, so the
 * drawer said "of 5 GB" and the library said "/ 4.66 GB" for one quota, which
 * reads as the allowance shrinking when you expand the panel.
 */
export function formatQuotaSize(bytes: number): string {
  if (bytes < 1e9) return `${Math.round(bytes / 1e6)} MB`;
  const gb = bytes / 1e9;
  return `${gb >= 10 ? gb.toFixed(0) : gb.toFixed(1).replace(/\.0$/, "")} GB`;
}

export function StorageQuotaBar({ used, total, onOptimize, compact = false }: StorageQuotaBarProps) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const clampedPct = Math.min(100, pct);
  const isExhausted = pct >= 100;
  const isNearLimit = !isExhausted && pct >= 80;

  if (compact && !isExhausted && !isNearLimit) return null;

  /*
    Board 145:250 — quota-full. Two blocks, not one: a 40h band of
    --color/error at 12% (145:297, empty — it is the track at 100%), then an
    84h --color/bg-subtle block carrying the reason and the reassurance at
    11/16 ink-muted (145:298). This used to be a single red-50 card with the
    reason in 13px red-700, which said the same thing twice and in a colour
    the token set does not contain.
  */
  if (isExhausted) {
    return (
      <div className="med-quota-bar med-quota-bar--exhausted tw:shrink-0">
        <div
          className="tw:h-10 tw:w-full tw:bg-[var(--bk-error)] tw:opacity-12"
          data-testid="media-quota-full-band"
          aria-hidden="true"
        />
        <div
          className="tw:h-21 tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:pt-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
          data-testid="media-quota-bar"
        >
          {/* Board 145:299 — the reason rides the number, never hidden. */}
          <p className="tw:m-0 tw:tabular-nums" data-testid="media-quota-reason">
            {formatQuotaSize(used)} of {formatQuotaSize(total)} used — upload is off until you free space
          </p>
          {/* Board 155:6, at top 44 of the same block. */}
          <p className="tw:m-0 tw:mt-5" data-testid="media-quota-reassurance">
            Nothing already on your sites is affected.
          </p>
        </div>
      </div>
    );
  }

  /*
    Board 145:199 — quota-warn. A 78h --color/warning-tint band: the number at
    12/18 warning-text, the track 2px under it, and the way out 8px under that
    at 11/16 accent. The offsets are the board's own (6 / 26 / 38), which is
    why they are three explicit margins rather than one flex gap.
  */
  if (isNearLimit) {
    return (
      <div
        className="med-quota-bar med-quota-bar--near-limit tw:h-19.5 tw:shrink-0 tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:pt-1.5"
        data-testid="media-quota-band"
      >
        <div
          data-testid="media-quota-bar"
          className="med-quota-text tw:text-[12px] tw:leading-[18px] tw:tabular-nums tw:text-[var(--bk-warning-text)]"
        >
          {formatQuotaSize(used)} of {formatQuotaSize(total)} used
        </div>
        <div
          className="med-quota-track tw:mt-0.5 tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-[2px] tw:bg-[var(--bk-bg-subtle)]"
          data-testid="media-quota-track"
        >
          <div
            className="med-quota-fill tw:h-full tw:bg-[var(--bk-warning)]"
            style={{ width: `${clampedPct}%` }}
            data-testid="media-quota-fill"
          />
        </div>
        {onOptimize ? (
          <Button
            type="button"
            color="light"
            size="xs"
            variant="link"
            className="tw:mt-2 tw:min-h-5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-accent-text)]"
            data-testid="media-quota-optimize"
            onClick={onOptimize}
          >
            {"Optimise images to free space \u203A"}
          </Button>
        ) : null}
      </div>
    );
  }

  /* Fullpage library: no band, just the line and its track. */
  return (
    <div className="med-quota-bar tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:py-1.5">
      <div
        data-testid="media-quota-bar"
        className="med-quota-text tw:text-[11px] tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-muted)]"
      >
        {formatQuotaSize(used)} of {formatQuotaSize(total)} used
      </div>
      <div className="med-quota-track tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-[var(--bk-gray-100)]">
        <div className="med-quota-fill tw:h-full tw:bg-[var(--bk-gray-400)]" style={{ width: `${clampedPct}%` }} />
      </div>
    </div>
  );
}
