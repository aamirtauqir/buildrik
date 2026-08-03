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

interface StorageQuotaBarProps {
  used: number;
  total: number;
  /**
   * Drawer mode: the board's default Media screen (144:2) shows no quota line
   * at all — it earns its space only once the number starts to matter, which is
   * what the separate `quota-warn` / `quota-full` screens are.
   */
  compact?: boolean;
}

function formatGB(bytes: number): string {
  const gb = bytes / 1e9;
  return gb >= 10 ? gb.toFixed(0) : gb.toFixed(1).replace(/\.0$/, "");
}

export function StorageQuotaBar({ used, total, compact = false }: StorageQuotaBarProps) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const clampedPct = Math.min(100, pct);
  const isExhausted = pct >= 100;
  const isNearLimit = !isExhausted && pct >= 80;

  if (compact && !isExhausted && !isNearLimit) return null;

  const tone = isExhausted
    ? "tw:text-red-700"
    : isNearLimit
      ? "tw:text-amber-700"
      : "tw:text-gray-600";
  const fill = isExhausted
    ? "tw:bg-red-600"
    : isNearLimit
      ? "tw:bg-amber-500"
      : "tw:bg-gray-400";

  return (
    <div
      className={[
        "med-quota-bar tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:py-1.5",
        isExhausted && "med-quota-bar--exhausted",
        isNearLimit && "med-quota-bar--near-limit",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        data-testid="media-quota-bar"
        className={`med-quota-text tw:text-[11px] tw:leading-4 tw:tabular-nums ${tone}`}
      >
        {formatGB(used)} GB / {formatGB(total)} GB used
      </div>
      <div className="med-quota-track tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
        <div className={`med-quota-fill tw:h-full ${fill}`} style={{ width: `${clampedPct}%` }} />
      </div>
    </div>
  );
}
