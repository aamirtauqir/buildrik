/**
 * Onboarding Steps — Single Source of Truth
 * All step definitions, types, and schema version live here.
 * Import from here only. Never redefine steps inline.
 *
 * @license BSD-3-Clause
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface OnboardingStep {
  /** Unique identifier — used for event wiring and localStorage persistence */
  id: string;
  /** Short display label (≤ 40 chars) */
  label: string;
  /** One-line description shown when step is expanded */
  description: string;
  /** CTA button text (omit if no action button is needed) */
  actionLabel?: string;
  /** Action key consumed by the shell to open the relevant panel */
  actionKey?: string;
  /** Whether this step has been completed */
  completed: boolean;
}

// ── Schema Version ──────────────────────────────────────────────────────────
// Bump when step IDs or count change — clears stale localStorage automatically.

/* 4 (2026-08-27): every step used to be creditable by pressing its CTA, so
   stored progress can say "done" over things that were never done. The version
   bump clears it — a checklist that lied is worse than one that starts over. */
export const ONBOARDING_SCHEMA_VERSION = 4;

// ── Default Steps ───────────────────────────────────────────────────────────

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "name-project",
    label: "Name your project",
    description:
      "Give your project a name — it shows in the browser tab and as the SEO site title.",
    actionLabel: "Open settings",
    actionKey: "open-project-name",
    completed: false,
  },
  {
    id: "pick-start",
    label: "Choose a starting point",
    description:
      "Browse professionally designed templates or start with a blank canvas.",
    actionLabel: "Browse templates",
    actionKey: "open-templates",
    completed: false,
  },
  {
    id: "add-element",
    label: "Add an element",
    description:
      "Open the Build panel and drag any element — text, image, button — onto your canvas.",
    actionLabel: "Open Build panel",
    actionKey: "open-build",
    completed: false,
  },
  {
    id: "edit-text",
    label: "Edit text",
    description:
      "Double-click any text element on the canvas to edit its content inline.",
    completed: false,
  },
  {
    id: "change-style",
    label: "Style an element",
    description:
      "Select any element and use the right panel to change colors, fonts, and spacing.",
    completed: false,
  },
  {
    id: "preview",
    label: "Preview your site",
    description:
      "Click Preview in the top bar to see your site on desktop, tablet, and mobile.",
    actionLabel: "Open preview",
    actionKey: "trigger-preview",
    completed: false,
  },
  {
    id: "publish",
    label: "Publish your site",
    /* Was "Hit Publish to make your site live. Your site gets a free URL
       instantly." Sites deploy into the WORKSPACE'S OWN Vercel account —
       `runPrePublishChecks` hard-fails with "Sites deploy to your own Vercel
       account. Connect it to publish." — so the first publish cannot happen
       until that connection exists, and no URL is handed out by us. */
    description:
      "Connect your Vercel account once, then Publish deploys the site there and gives you its URL.",
    actionLabel: "Publish now",
    actionKey: "trigger-publish",
    completed: false,
  },
];
