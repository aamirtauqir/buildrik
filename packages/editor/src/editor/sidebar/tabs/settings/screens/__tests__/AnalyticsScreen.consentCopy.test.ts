/**
 * The cookie-consent switch made a compliance promise nothing keeps.
 *
 * It read: "Displays a banner asking visitors to accept cookies before
 * tracking begins. Required in the EU (GDPR) and recommended everywhere else."
 *
 * `cookieConsent` is written by this screen and read by nothing — not the
 * export, not the publish worker, not any runtime — and
 * `generateAnalyticsScripts` emits each ENABLED provider outright: no consent
 * check, no gtag consent mode. So no banner is shown and no tracker waits.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const screen = readFileSync(join(__dirname, "..", "AnalyticsScreen.tsx"), "utf8");
const injector = readFileSync(
  join(__dirname, "..", "..", "..", "..", "..", "..", "engine", "export", "AnalyticsInjector.ts"),
  "utf8"
);
const rendered = screen.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("cookie consent switch", () => {
  it("does not claim a banner is displayed", () => {
    expect(rendered).not.toMatch(/Displays a banner/i);
    expect(rendered).not.toMatch(/before tracking begins/i);
  });

  it("says the preference is recorded and the trackers do not wait", () => {
    expect(rendered).toMatch(/Records the preference only/i);
    expect(rendered).toMatch(/do not wait for consent/i);
  });

  it("matches the injector: providers are emitted on `enabled` alone", () => {
    expect(injector).not.toMatch(/consent/i);
    expect(injector).toMatch(/googleAnalytics\?\.enabled/);
  });
});
