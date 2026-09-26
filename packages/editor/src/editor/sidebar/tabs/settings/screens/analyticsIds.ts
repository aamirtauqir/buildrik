/**
 * analyticsIds — the shape each provider's id must have, and the sentence
 * the field shows when it does not (Clone 3397:34148: `This doesn't look
 * right. Your Google Analytics ID should start with G- followed by 10
 * characters, like G-ABCD123456.`; the other three providers get the same
 * sentence in their own terms).
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
  googleAnalytics:
    "This doesn't look right. Your Google Analytics ID should start with G- followed by 10 characters, like G-ABCD123456.",
  googleTagManager:
    "This doesn't look right. Your GTM Container ID should start with GTM- followed by 6 to 8 characters, like GTM-ABC1234.",
  facebookPixel: "This doesn't look right. Your Pixel ID should be 15 or 16 digits, like 1234567890123456.",
  microsoftClarity: "This doesn't look right. Your Clarity Project ID should be 10 letters or digits, like abcdefghij.",
};

/** The field's sentence when `value` does not have the provider's shape; null when it does, or when it is empty. */
export function validateProviderId(provider: AnalyticsProvider, value: string): string | null {
  if (value === "") return null;
  return ANALYTICS_ID_PATTERNS[provider].test(value) ? null : MESSAGES[provider];
}
