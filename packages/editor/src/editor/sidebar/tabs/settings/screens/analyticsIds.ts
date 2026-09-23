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
 * stored lowercase id is not flagged on open.
 *
 * @license BSD-3-Clause
 */

export type AnalyticsProvider = "googleAnalytics" | "googleTagManager" | "facebookPixel" | "microsoftClarity";

interface IdRule {
  pattern: RegExp;
  message: string;
}

const RULES: Record<AnalyticsProvider, IdRule> = {
  googleAnalytics: {
    pattern: /^G-[A-Z0-9]{10}$/i,
    message:
      "This doesn't look right. Your Google Analytics ID should start with G- followed by 10 characters, like G-ABCD123456.",
  },
  googleTagManager: {
    pattern: /^GTM-[A-Z0-9]{6,8}$/i,
    message:
      "This doesn't look right. Your GTM Container ID should start with GTM- followed by 6 to 8 characters, like GTM-ABC1234.",
  },
  facebookPixel: {
    pattern: /^\d{15,16}$/,
    message: "This doesn't look right. Your Pixel ID should be 15 or 16 digits, like 1234567890123456.",
  },
  microsoftClarity: {
    pattern: /^[A-Z0-9]{10}$/i,
    message: "This doesn't look right. Your Clarity Project ID should be 10 letters or digits, like abcdefghij.",
  },
};

/** The field's sentence when `value` does not have the provider's shape; null when it does, or when it is empty. */
export function validateProviderId(provider: AnalyticsProvider, value: string): string | null {
  if (value === "") return null;
  return RULES[provider].pattern.test(value) ? null : RULES[provider].message;
}
