"use client";

export interface LimitReachedProps {
  resource: string;
  used: number;
  limit: number;
  unit?: string;
  isOwner: boolean;
  onUpgrade?: () => void;
  onComparePlans?: () => void;
}

function formatValue(value: number, unit?: string): string {
  if (!unit) return String(value);
  return `${value} ${unit}`;
}

export function LimitReached({ resource, used, limit, unit, isOwner, onUpgrade, onComparePlans }: LimitReachedProps) {
  const pct = limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: "#FEF2F2" }}
        >
          🔒
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
            {resource} limit reached
          </h3>
          <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
            You've used {formatValue(used, unit)} of your {formatValue(limit, unit)} {resource.toLowerCase()} allowance.
          </p>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "#7A7A7A" }}>
              <span>{formatValue(used, unit)} used</span>
              <span>{formatValue(limit, unit)} limit</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: "#E42313" }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isOwner ? (
              <>
                {onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#E42313" }}
                  >
                    Upgrade to Pro
                  </button>
                )}
                {onComparePlans && (
                  <button
                    onClick={onComparePlans}
                    className="text-sm font-medium underline-offset-2 hover:underline"
                    style={{ color: "#7A7A7A" }}
                  >
                    Compare plans
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: "#7A7A7A" }}>
                Contact your workspace admin to upgrade.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
