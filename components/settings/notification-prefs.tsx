"use client";

import { useState } from "react";

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

interface NotificationPrefsProps {
  initialPrefs?: Pref[];
  onUpdate?: (pref: Pref) => void;
}

const DEFAULT_PREFS: Pref[] = NOTIFICATION_CATEGORIES.map((category) => ({
  category,
  inApp: true,
  email: category === "Security" ? "instant" : "digest",
}));

export function NotificationPrefs({ initialPrefs, onUpdate }: NotificationPrefsProps) {
  const [prefs, setPrefs] = useState<Pref[]>(
    initialPrefs ?? DEFAULT_PREFS
  );

  function update(category: Category, changes: Partial<Omit<Pref, "category">>) {
    const updated = prefs.map((p) =>
      p.category === category ? { ...p, ...changes } : p
    );
    setPrefs(updated);
    const changed = updated.find((p) => p.category === category)!;
    onUpdate?.(changed);
  }

  return (
    <div>
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "#E8E8E8" }}
      >
        <div
          className="grid px-4 py-2.5 text-xs font-medium"
          style={{
            gridTemplateColumns: "1fr 80px 160px",
            backgroundColor: "#fafafa",
            borderBottom: "1px solid #E8E8E8",
            color: "#7A7A7A",
          }}
        >
          <span>Category</span>
          <span className="text-center">In-app</span>
          <span className="text-center">Email</span>
        </div>

        {prefs.map((pref, idx) => {
          const isSecurity = pref.category === "Security";
          return (
            <div
              key={pref.category}
              className="grid items-center px-4 py-3"
              style={{
                gridTemplateColumns: "1fr 80px 160px",
                borderBottom: idx < prefs.length - 1 ? "1px solid #E8E8E8" : undefined,
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                  {pref.category}
                </p>
                {isSecurity && (
                  <p className="text-xs mt-0.5" style={{ color: "#B0B0B0" }}>
                    Cannot be disabled
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
                    backgroundColor: pref.inApp ? "#E42313" : "#E8E8E8",
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
                  className="text-xs px-2 py-1 rounded-md border outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
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
