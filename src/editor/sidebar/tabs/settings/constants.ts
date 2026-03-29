/**
 * Settings tab constants — feature flags and static data
 * @license BSD-3-Clause
 */

/**
 * Feature flags — set to false for features not yet implemented.
 * Change to true when the feature ships.
 */
export const FEATURE_FLAGS = {
  domains: false,
  export: false,
  integrations: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

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
