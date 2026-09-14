/**
 * Settings tab constants — static data
 * @license BSD-3-Clause
 *
 * Project-wide feature flags live in `src/shared/utils/featureFlags.ts`.
 * The settings-tab-local FEATURE_FLAGS object was removed after A1 day-3:
 * domains/integrations/export gates moved to nav inclusion (workspace
 * deep-links + Topbar export) and the local flags had zero consumers.
 */

/**
 * Integration catalog — metadata for third-party service cards.
 * Moved from IntegrationsScreen.tsx to keep UI files free of business data.
 */
export const INTEGRATION_CATALOG = [
  {
    id: "formspree",
    name: "Formspree",
    description: "Simple form backend. Receive form submissions by email.",
    docsUrl: "https://formspree.io/",
    category: "forms" as const,
  },
  {
    id: "netlify-forms",
    name: "Netlify Forms",
    description: "Collect form submissions directly in your Netlify dashboard.",
    docsUrl: "https://docs.netlify.com/forms/setup/",
    category: "forms" as const,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments online with the world's leading payment platform.",
    docsUrl: "https://stripe.com/docs",
    category: "payments" as const,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing platform to grow your audience.",
    docsUrl: "https://mailchimp.com/developer/",
    category: "email" as const,
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Email marketing for creators and small businesses.",
    docsUrl: "https://developers.convertkit.com/",
    category: "email" as const,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect your site to 5000+ apps without code.",
    docsUrl: "https://zapier.com/apps",
    category: "automation" as const,
  },
] as const;

export type IntegrationId = (typeof INTEGRATION_CATALOG)[number]["id"];
export type IntegrationCategory = (typeof INTEGRATION_CATALOG)[number]["category"];

/**
 * The locales the product knows. One list for every place a locale is
 * picked or named: Localization's default/enabled lists and General's
 * `Site Language` select (Clone 3397:32011 — `English (en-US)` is the
 * frame's shape, `<label> (<code>)`). Lived inside LocalizationScreen.tsx
 * until S1 needed it on a second screen.
 */
export const SITE_LOCALES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "no", label: "Norwegian" },
  { code: "fi", label: "Finnish" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
];

/** `English` for a known code; the code itself, upper-cased, for one the list does not carry. */
export function localeLabel(code: string): string {
  return SITE_LOCALES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}
