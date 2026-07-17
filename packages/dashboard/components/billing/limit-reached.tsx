"use client";

type Role = "owner" | "editor";

export interface LimitReachedProps {
  resource: string;
  used: number;
  limit: number;
  unit?: string;
  role: Role;
  upgradePlanName?: string;
  upgradePlanPrice?: string;
  onUpgrade?: () => void;
  onComparePlans?: () => void;
}

function formatValue(value: number, unit?: string): string {
  if (!unit) return String(value);
  return `${value} ${unit}`;
}

export function LimitReached({
  resource,
  used,
  limit,
  unit,
  role,
  upgradePlanName = "Pro",
  upgradePlanPrice = "$29/mo",
  onUpgrade,
  onComparePlans,
}: LimitReachedProps) {
  const pct = limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "#FEF2F2" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 2a3 3 0 0 0-3 3v3H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V5a3 3 0 0 0-3-3ZM9 5a1 1 0 1 1 2 0v3H9V5Zm1 7a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0v-2a1 1 0 0 0-1-1Z"
              fill="var(--color-primary)"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {resource} limit reached
          </h3>
          <p className="mt-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
            You've used {formatValue(used, unit)} of your {formatValue(limit, unit)} {resource.toLowerCase()} allowance.
          </p>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              <span>{formatValue(used, unit)} used</span>
              <span>{formatValue(limit, unit)} limit</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border-default)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: "var(--color-primary)" }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {role === "owner" ? (
              <>
                {onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="rounded-lg px-5 py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Upgrade to {upgradePlanName} &mdash; {upgradePlanPrice}
                  </button>
                )}
                {onComparePlans && (
                  <button
                    onClick={onComparePlans}
                    className="text-body font-medium underline-offset-2 hover:underline"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Compare plans
                  </button>
                )}
              </>
            ) : (
              <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
                Contact your workspace admin to upgrade.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
