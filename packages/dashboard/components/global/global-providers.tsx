"use client";

import { OfflineBanner } from "./offline-banner";
import { CookieConsent } from "./cookie-consent";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
      <CookieConsent />
    </>
  );
}
