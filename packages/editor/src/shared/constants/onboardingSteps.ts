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
   bump clears it — a checklist that lied is worse than one that starts over.
   5 (2026-08-28): the list itself changed — board 296:1972's agency-framed
   steps replace the tool-framed ones (founder call). The migration resets
   progress AND phase, or a v4 "done" user would never see this list. */
export const ONBOARDING_SCHEMA_VERSION = 5;

// ── Default Steps ───────────────────────────────────────────────────────────

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "set-brand",
    label: "Set your brand",
    description:
      "Apply your fonts and colors in the Brand panel — everything you build uses them.",
    actionLabel: "Open Brand panel",
    actionKey: "open-brand",
    completed: false,
  },
  {
    id: "add-page",
    label: "Add your first page",
    description: "Create a page — blank, or from a template.",
    actionLabel: "Open Pages",
    actionKey: "open-pages",
    completed: false,
  },
  {
    id: "insert-section",
    label: "Insert a section",
    description:
      "Drop a ready-made section — hero, features, footer — onto the canvas.",
    actionLabel: "Open Insert panel",
    actionKey: "open-build",
    completed: false,
  },
  {
    id: "connect-client",
    label: "Connect your client",
    description:
      "Invite your client by email when you send the site for review — they get their own link.",
    actionLabel: "Open Review",
    actionKey: "open-review",
    completed: false,
  },
  {
    id: "send-review",
    label: "Send for review",
    description:
      "Send a review link so your client can approve the site or request changes.",
    actionLabel: "Open Review",
    actionKey: "open-review",
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
