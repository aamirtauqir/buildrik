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
