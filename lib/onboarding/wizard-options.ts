/**
 * The onboarding wizard's vocabulary, in one place.
 *
 * Every list here is offered to the user by a wizard screen AND consumed by a
 * map somewhere else — `INDUSTRIES` by `INDUSTRY_TO_TYPE`, `TONES` by
 * `TONE_MAP`, `ROLES` by `ROLE_LABEL` and `RECOMMEND`. They used to be declared
 * twice, once in the page and once next to the map, with nothing tying the two
 * together. A value offered but not mapped does not error: it falls through to
 * whatever default the `??` on the lookup provides, so the user makes a choice
 * and quietly gets someone else's.
 *
 * That is not hypothetical. `tone` shipped with the wizard offering five values
 * and the AI worker collapsing them onto three, so four choices reached the
 * model identical. Nothing failed; the answers just stopped mattering.
 *
 * Co-locating them means a new option is added next to the maps that have to
 * handle it, and `onboarding-vocabulary.test.ts` fails when one side moves
 * without the other.
 */

export const INDUSTRIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "clinic", label: "Clinic / Medical" },
  { value: "agency", label: "Agency / Services" },
  { value: "shop", label: "Shop" },
  { value: "portfolio", label: "Portfolio" },
  { value: "events", label: "Events" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Other" },
];

export const ROLES = [
  { value: "freelancer", label: "Freelancer" },
  { value: "agency", label: "Agency" },
  { value: "in-house", label: "In-house" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

export const GOALS = [
  { value: "leads", label: "Get leads" },
  { value: "calls", label: "Book calls" },
  { value: "sell", label: "Sell products" },
  { value: "portfolio", label: "Show portfolio" },
  { value: "inform", label: "Share information" },
];

/**
 * `playful` exists in `generateSiteSchema.tone` but is deliberately not offered:
 * five options is the designed set. Listing it here would put an unreachable
 * choice in the UI; the schema keeps it because the field is not wizard-only.
 */
export const TONES = ["Professional", "Friendly", "Premium", "Bold", "Minimal"].map((t) => ({
  value: t.toLowerCase(),
  label: t,
}));

export const STYLES = ["Clean SaaS", "Agency", "Local business", "Portfolio", "E-commerce"].map(
  (s) => ({ value: s, label: s })
);

const SUGGESTED_PAGE_NAMES = ["About", "Services", "Pricing", "Portfolio", "Contact", "Blog", "FAQ"];

/** Home is always included by the goal step, so it is not offered here. */
export const SUGGESTED_PAGES = SUGGESTED_PAGE_NAMES.map((p) => ({ value: p, label: p }));
