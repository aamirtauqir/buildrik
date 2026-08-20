// Small dashboard data-viz helpers (extracted from the old stat-card.tsx).
// Consumed by StatCard's `visual` slot on the dashboard home.
export function MiniDonut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" className="shrink-0">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle key={i} cx={20} cy={20} r={radius} fill="none" stroke={seg.color} strokeWidth={6} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-currentOffset} transform="rotate(-90 20 20)" />
        );
      })}
    </svg>
  );
}

export function Sparkline({ data, color = "var(--color-success)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 76;
  const height = 30;
  const padding = 4;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + ((max - v) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AvatarStack({ avatars }: { avatars: { name: string; avatar: string | null }[] }) {
  const maxShown = 4;
  const visible = avatars.slice(0, maxShown);
  const overflow = avatars.length - maxShown;
  return (
    <div className="flex items-center">
      {visible.map((a, i) => (
        <div key={i} className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[var(--color-bg-subtle)] text-[10px] font-medium text-[var(--color-text-secondary)]" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: maxShown - i }} title={a.name}>
          {a.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.avatar} alt={a.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span>{a.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[var(--color-bg-subtle)] text-[10px] font-medium text-[var(--color-text-secondary)]" style={{ marginLeft: -8, zIndex: 0 }}>+{overflow}</div>
      )}
    </div>
  );
}

export function TrendArrow({ value }: { value: number }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  /* The -text variants, not the fill colours: --color-success on white is
     3.38:1 (axe on the site overview), under AA for text this size. The
     -text tokens exist for exactly this — same hue, enough contrast. */
  const color = isZero
    ? "var(--color-text-secondary)"
    : isPositive
      ? "var(--color-success-text)"
      : "var(--color-error-text)";
  const arrow = isZero ? "" : isPositive ? "↑" : "↓";
  const sign = isPositive ? "+" : "";
  return (
    <span className="flex items-center gap-0.5 text-body-sm" style={{ color }}>
      {arrow && <span>{arrow}</span>}
      <span className="font-mono tabular-nums">{sign}{value}%</span>
    </span>
  );
}
