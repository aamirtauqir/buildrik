"use client";
import { useState, useEffect, useRef } from "react";
import { Shield } from "lucide-react";
import { ToggleSwitch } from "flowbite-react";
import { Button, Modal } from "@/components/dashboard/primitives";

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

  /* THE BANNER PUBLISHES ITS OWN HEIGHT (2026-08-27).
     It is `fixed` at `z-[9998]`, so it covers whatever sits at the bottom of
     the page. Measured live at 1280x720 on `/review/<token>`: the banner spans
     y 672-708 and the two buttons that page exists for — "Approve this design"
     and "Request changes" — sit at y 668-704. Both were completely covered. The
     page's own source says it: "A client who cannot see 'Approve' does not
     approve."

     Rather than guess at document padding (which does nothing for a sticky
     footer inside a full-height scroll container), the banner states its height
     as `--cookie-inset` and anything bottom-anchored offsets by it. Cleared the
     moment the banner goes, so the offset never outlives the thing it is for. */
  const barRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!show || showManage || !el) {
      root.style.removeProperty("--cookie-inset");
      return;
    }
    const publish = () => root.style.setProperty("--cookie-inset", `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(publish) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.removeProperty("--cookie-inset");
    };
  }, [show, showManage]);

  if (!show) return null;

  if (showManage) {
    return (
      <Modal open onClose={() => setShowManage(false)} title="Cookie Preferences" width={480}>
        <div className="space-y-3">
          {COOKIE_CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="flex items-center justify-between rounded-lg border p-3"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div>
                <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {cat.label}
                </p>
                <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {cat.description}
                </p>
              </div>
              <ToggleSwitch
                checked={cat.key === "essential" ? true : analytics}
                disabled={!cat.canDisable}
                onChange={() => cat.canDisable && setAnalytics(!analytics)}
              />
            </div>
          ))}
        </div>
        <Button className="mt-4 w-full" onClick={() => saveConsent("manage")}>
          Save Preferences
        </Button>
      </Modal>
    );
  }

  return (
    <div
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 z-[9998] border-t bg-white px-4 py-3 shadow-lg sm:px-6"
      style={{
        borderColor: "var(--color-border-default)",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <Shield className="h-5 w-5 shrink-0" style={{ color: "var(--color-text-secondary)" }} />
          <p className="text-body" style={{ color: "var(--color-text-primary)" }}>
            We use cookies to improve your experience. You can manage your
            preferences at any time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          <Button size="sm" onClick={() => saveConsent("accept_all")}>
            Accept All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => saveConsent("essential_only")}>
            Essential Only
          </Button>
          <button
            onClick={() => setShowManage(true)}
            className="text-body font-medium underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Manage Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
