interface StorageQuotaBarProps {
  used: number;
  total: number;
}

function formatGB(bytes: number): string {
  const gb = bytes / 1e9;
  return gb >= 10 ? gb.toFixed(0) : gb.toFixed(1).replace(/\.0$/, "");
}

export function StorageQuotaBar({ used, total }: StorageQuotaBarProps) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const clampedPct = Math.min(100, pct);
  const isExhausted = pct >= 100;
  const isNearLimit = !isExhausted && pct >= 80;

  const stateClass = isExhausted
    ? " med-quota-bar--exhausted"
    : isNearLimit
      ? " med-quota-bar--near-limit"
      : "";

  return (
    <div className={`med-quota-bar${stateClass}`}>
      <div className="med-quota-text">
        {formatGB(used)} GB / {formatGB(total)} GB used
      </div>
      <div className="med-quota-track">
        <div className="med-quota-fill" style={{ width: `${clampedPct}%` }} />
      </div>
    </div>
  );
}
