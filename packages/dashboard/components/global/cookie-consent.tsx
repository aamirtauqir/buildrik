"use client";
import { useState, useEffect } from "react";
import { X, Shield } from "lucide-react";

export const COOKIE_CATEGORIES = [
  {
    key: "essential",
    label: "Essential",
    description: "Required for the site to function. Cannot be disabled.",
    canDisable: false,
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Help us understand how visitors use our site.",
    canDisable: true,
  },
] as const;

export const CONSENT_OPTIONS = [
  { value: "accept_all", label: "Accept All" },
  { value: "essential_only", label: "Essential Only" },
  { value: "manage", label: "Manage Preferences" },
] as const;

function getConsentCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("buildrik_consent="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1]);
}

function setConsentCookie(value: { essential: boolean; analytics: boolean }) {
  const encoded = encodeURIComponent(JSON.stringify(value));
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `buildrik_consent=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const consent = getConsentCookie();
    if (!consent) setShow(true);
  }, []);

  const saveConsent = (choice: string) => {
    const analyticsEnabled =
      choice === "accept_all" || (choice === "manage" && analytics);
    setConsentCookie({ essential: true, analytics: analyticsEnabled });
    setShow(false);
    setShowManage(false);
  };

  if (!show) return null;

  if (showManage) {
    return (
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center"
        style={{ backgroundColor: "#0000004D" }}
      >
        <div className="w-[480px] rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
              Cookie Preferences
            </h3>
            <button onClick={() => setShowManage(false)}>
              <X className="h-5 w-5" style={{ color: "#7A7A7A" }} />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {COOKIE_CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                className="flex items-center justify-between rounded-lg border p-3"
                style={{ borderColor: "#E8E8E8" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                    {cat.label}
                  </p>
                  <p className="text-xs" style={{ color: "#7A7A7A" }}>
                    {cat.description}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={cat.key === "essential" ? true : analytics}
                    disabled={!cat.canDisable}
                    onChange={() => cat.canDisable && setAnalytics(!analytics)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-[#22C55E] peer-disabled:opacity-70 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => saveConsent("manage")}
            className="mt-4 w-full rounded-lg py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] flex h-16 items-center border-t bg-white px-6 shadow-lg"
      style={{ borderColor: "#E8E8E8" }}
    >
      <div className="mx-auto flex w-full max-w-[1220px] items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 shrink-0" style={{ color: "#7A7A7A" }} />
          <p className="text-sm" style={{ color: "#0D0D0D" }}>
            We use cookies to improve your experience. You can manage your
            preferences at any time.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => saveConsent("accept_all")}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            Accept All
          </button>
          <button
            onClick={() => saveConsent("essential_only")}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
          >
            Essential Only
          </button>
          <button
            onClick={() => setShowManage(true)}
            className="text-sm font-medium underline"
            style={{ color: "#7A7A7A" }}
          >
            Manage Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
