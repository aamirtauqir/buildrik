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

  const tone = isExhausted
    ? "tw:text-red-700"
    : isNearLimit
      ? "tw:text-amber-700"
      : "tw:text-[var(--bk-ink-soft)]";
  const fill = isExhausted
    ? "tw:bg-red-600"
    : isNearLimit
      ? "tw:bg-amber-500"
      : "tw:bg-[var(--bk-gray-400)]";

  return (
    <div
      className={[
        "med-quota-bar tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:py-1.5",
        isExhausted && "med-quota-bar--exhausted tw:bg-red-50 tw:py-3",
        isNearLimit && "med-quota-bar--near-limit tw:bg-yellow-50 tw:py-2",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        data-testid="media-quota-bar"
        className={`med-quota-text tw:text-[${isExhausted ? "13px" : "11px"}] tw:leading-4 tw:tabular-nums ${tone}`}
      >
        {formatQuotaSize(used)} of {formatQuotaSize(total)} used
        {/* Board 145:250: the reason rides the number — disabled, never hidden. */}
        {isExhausted ? " — upload is off until you free space" : null}
      </div>
      {!isExhausted && (
        <div className="med-quota-track tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-[var(--bk-gray-100)]">
          <div className={`med-quota-fill tw:h-full ${fill}`} style={{ width: `${clampedPct}%` }} />
        </div>
      )}
      {isExhausted && (
        /* Board 145:250's reassurance line: existing files are untouched. */
        <div className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
          Nothing already on your sites is affected.
        </div>
      )}
      {isNearLimit && onOptimize && (
        <Button
          type="button"
          color="light"
          size="xs"
          variant="link" className="tw:min-h-5 tw:text-[length:var(--bk-text-12)] tw:self-start"
          data-testid="media-quota-optimize"
          onClick={onOptimize}
        >
          {"Optimise images to free space \u203A"}
        </Button>
      )}
    </div>
  );
}
