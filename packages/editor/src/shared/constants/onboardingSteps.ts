/**
 * Onboarding Steps — Single Source of Truth
 * All step definitions and types live here (ids mirror EDITOR_TASK_IDS in
 * @buildrik/shared/schemas/onboarding, which the server validates against).
 * Import from here only. Never redefine steps inline.
 *
 * @license BSD-3-Clause
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface OnboardingStep {
  /** Unique identifier — used for event wiring and the server's per-site state (L1-015) */
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

// ── Default Steps ───────────────────────────────────────────────────────────

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "set-brand",
    label: "Set your brand",
    description:
      "Pick a starter or set your six colours and two fonts in Brand — every block and template uses them.",
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
    /* v3 IA (2026-09-14): the rail says Add and the sections are Blocks.
       Copy names what the user will see, not the old panel. */
    label: "Add a block",
    description:
      "Drop a ready-made block — hero, features, footer — from Add › Blocks onto the canvas. Blocks use your brand colours and fonts.",
    actionLabel: "Open Add panel",
    actionKey: "open-build",
    completed: false,
  },
  {
    id: "connect-client",
    label: "Connect first client",
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
    label: "Publish",
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
