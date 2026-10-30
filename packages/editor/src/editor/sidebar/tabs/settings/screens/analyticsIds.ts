/**
 * analyticsIds — the shape each provider's id must have, and the sentence
 * the field shows when it does not (2L9 B8-AN05 245:46189: "Enter a valid
 * Google Analytics measurement ID."; the other three in their own terms).
 *
 * Empty is "not set", never an error — the toggle beside an empty id is
 * ANDed off at flush time. Case is the screen's business (it uppercases the
 * GA and GTM ids as they are typed); the rules read case-insensitively so a
 * stored lowercase id is not flagged on open. The patterns live in
 * `@buildrik/shared/schemas/analytics-ids`; they are this screen's hint only —
 * the server enforces the looser injection-only `ANALYTICS_ID_SAFE`.
 *
 * @license BSD-3-Clause
 */
import { ANALYTICS_ID_PATTERNS, type AnalyticsProvider } from "@buildrik/shared/schemas/analytics-ids";

const MESSAGES: Record<AnalyticsProvider, string> = {
  googleAnalytics: "Enter a valid Google Analytics measurement ID.",
  googleTagManager: "Enter a valid Google Tag Manager container ID.",
  facebookPixel: "Enter a valid Meta Pixel ID.",
  microsoftClarity: "Enter a valid Microsoft Clarity project ID.",
};

/** The field's sentence when `value` does not have the provider's shape; null when it does, or when it is empty. */
export function validateProviderId(provider: AnalyticsProvider, value: string): string | null {
  if (value === "") return null;
  return ANALYTICS_ID_PATTERNS[provider].test(value) ? null : MESSAGES[provider];
}
