"use client";

import { trpc } from "@lib/trpc/client";
import { ErrorState } from "@/components/states";

export const NOTIFICATION_CATEGORIES = [
  "Site Updates",
  "Team",
  "Billing",
  "Domains",
  "Feedback",
  "AI",
  "Forms",
  "Security",
] as const;

type Category = (typeof NOTIFICATION_CATEGORIES)[number];
type EmailFrequency = "instant" | "digest" | "off";

interface Pref {
  category: Category;
  inApp: boolean;
  email: EmailFrequency;
}

const DEFAULT_PREFS: Pref[] = NOTIFICATION_CATEGORIES.map((category) => ({
  category,
  inApp: true,
  email: category === "Security" ? "instant" : "digest",
}));

const LOCK_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1" style={{ color: "var(--color-text-muted)" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export function NotificationPrefs() {
  // Overlay stored rows onto the full default list — never replace it. Rows are
  // created one at a time (upsert per toggle), so replacing meant the first
  // toggle left exactly ONE category on screen and the other seven became
  // unreachable for good.
  const { data: prefs, isLoading, isError, refetch } = trpc.account.notifications.list.useQuery(undefined, {
    select: (data) => {
      const stored = new Map(data.map((d) => [d.category, d]));
      return DEFAULT_PREFS.map((def) => {
        const row = stored.get(def.category);
        return row ? { category: def.category, inApp: row.inApp, email: row.email as EmailFrequency } : def;
      });
    },
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.account.notifications.update.useMutation({
    onMutate: async (updated) => {
      await utils.account.notifications.list.cancel();
      const previous = utils.account.notifications.list.getData();
      utils.account.notifications.list.setData(undefined, (old) =>
        (old ?? []).map((p) =>
          p.category === updated.category ? { ...p, ...updated } : p
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.account.notifications.list.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      utils.account.notifications.list.invalidate();
    },
  });

  function update(category: Category, changes: Partial<Omit<Pref, "category">>) {
    const current = (prefs ?? DEFAULT_PREFS).find((p) => p.category === category);
    if (!current) return;
    updateMutation.mutate({ category, inApp: current.inApp, email: current.email, ...changes });
  }

  const rows = prefs ?? DEFAULT_PREFS;

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center text-body" style={{ color: "var(--color-text-secondary)" }}>Loading preferences...</div>;
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load notification preferences"
        description="Something went wrong on our end."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border-default)" }}>
        <div
          className="grid px-4 py-2.5 text-body-sm font-medium"
          style={{
            gridTemplateColumns: "1fr 80px 160px",
            backgroundColor: "var(--color-bg-page)",
            borderBottom: "1px solid var(--color-border-default)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>Category</span>
          <span className="text-center">In-app</span>
          <span className="text-center">Email</span>
        </div>

        {rows.map((pref, idx) => {
          const isSecurity = pref.category === "Security";
          return (
            <div
              key={pref.category}
              className="grid items-center px-4 py-3"
              style={{
                gridTemplateColumns: "1fr 80px 160px",
                borderBottom: idx < rows.length - 1 ? "1px solid var(--color-border-default)" : undefined,
              }}
            >
              <div>
                <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {pref.category}
                  {isSecurity && LOCK_ICON}
                </p>
                {isSecurity && (
                  <p className="text-body-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Required for security
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={isSecurity}
                  onClick={() => update(pref.category, { inApp: !pref.inApp })}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: pref.inApp ? "var(--color-primary)" : "var(--color-border-default)",
                  }}
                  aria-label={`Toggle in-app for ${pref.category}`}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: pref.inApp ? "translateX(18px)" : "translateX(2px)",
                    }}
                  />
                </button>
              </div>

              <div className="flex justify-center">
                <select
                  value={pref.email}
                  disabled={isSecurity}
                  onChange={(e) => update(pref.category, { email: e.target.value as EmailFrequency })}
                  className="text-body-sm px-2 py-1 rounded-md border outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                >
                  <option value="instant">Instant</option>
                  <option value="digest">Daily Digest</option>
                  <option value="off">Off</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
