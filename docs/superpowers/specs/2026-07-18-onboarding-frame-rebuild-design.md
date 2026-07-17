# M2 Onboarding — frame-parity rebuild (24-frame gallery)

**Date:** 2026-07-18
**Status:** Design approved; implementation plan pending
**Approach:** A — frame-first rebuild on the existing engine (chosen over full rewrite / parallel-flag for long-term maintainability)

## Goal

Rebuild every M2 onboarding frame to match the new **24-frame desktop gallery**
(`~/Downloads/Buildrik Onboarding (2).html`, 1440px, accent `#2563EB`) 1:1 —
including the **13 state frames** (validation / error / loading / empty) the
current happy-path code lacks — **without** rewriting the proven wizard engine.

The gallery is the pixel source. It is a JS-bundled standalone page; render it
locally to read each frame:

```
cd ~/Downloads && python3 -m http.server 8787 --bind 127.0.0.1
# open http://127.0.0.1:8787/Buildrik%20Onboarding%20(2).html
```

## Non-negotiable: what stays (the engine)

A literal rewrite would re-derive — and risk re-introducing — four documented,
already-fixed bugs. These stay untouched:

1. **`WizardContext.saveAndGo` stable-identity fix** — `saveAndGo` reads `data`
   through `dataRef`, depends only on stable `mutateAsync`/`router`. Closing over
   `data` caused the A4 poll→saveWizard loop that stranded users on the spinner
   with a finished site. (`components/onboarding/wizard/wizard-context.tsx`.)
2. **login → onboarding seam** — create-session → `window.location.assign` full
   nav so `/auth/redirect` reads the just-set cookie (no stale `useSession`
   bounce). Preserved in the auth callback, not touched here.
3. **AI image-src rewrite** — generated sites route image srcs to picsum/placehold
   so previews don't 404. Lives in the AI generation path.
4. **Server-truth wizard state** — `WizardProvider(initial)` seeds from
   `OnboardingState.wizardData`; localStorage is a write-buffer only, never
   read-merged ahead of the server.

Also kept: `WizardShell` (its two header geometries — 180px full + hairline,
110px compact — already match the frames), the `onb-*` primitives
(`onb-button/field/card/chips/select/back`, `onb-select`), `wizard-boot`,
`use-onboarding-complete`, and every tRPC mutation the flow uses
(`account.workspace.update`, `sites.create`, `templates.generate.*`,
`templates.get/list`, `clients.create/assignSite/list`,
`onboarding.saveWizard/completeWizard/completeDashboardTask/dismiss/getState`).

## What's rebuilt (the frames)

Each step page's **content** is re-authored 1:1 to its gallery frame, and the
missing states are added **inline** (component state / mutation state), never as
new routes. Frame → route/state map:

| Route | Happy frame(s) | Inline states to add |
|---|---|---|
| `app/onboarding/workspace/page.tsx` | Workspace | Empty name, Name exists, Name too long, Network error, Loading |
| `app/onboarding/site/page.tsx` | Project setup, My business, Existing client | Email error, Focused error |
| `app/onboarding/path/page.tsx` | Path chooser | Hover template (hover state) |
| `app/onboarding/ai/basics/page.tsx` | Business basics | — |
| `app/onboarding/ai/goal/page.tsx` | Goal & audience | — |
| `app/onboarding/ai/brand/page.tsx` | Brand style | — |
| `app/onboarding/ai/generating/page.tsx` | Generating | (is the loading frame) |
| `app/onboarding/ai/preview/page.tsx` | Draft ready | — |
| `app/onboarding/template/page.tsx` | Gallery | No results (empty state) |
| `app/onboarding/template/preview/page.tsx` | Preview | — |
| `app/onboarding/template/selected/page.tsx` | Selected | — |
| `app/onboarding/blank/page.tsx` | Blank canvas | — |
| `app/onboarding/ready/page.tsx` | Editor ready | — |

(`app/onboarding/page.tsx` stays the index/boot; `app/onboarding/layout.tsx` +
`.onb-scope` accent scoping unchanged.)

## State coverage — how each new state is driven

The 8 new states are **derived from existing data/mutations**, not new pages:

- **Name validation (empty / exists / too-long):** the shared zod schema
  (`@buildrik/shared/schemas/onboarding`) + `workspace.update` domain error →
  inline `onb-field` error message. "Name exists" comes from the server's
  uniqueness error; "too long" and "empty" from the client zod check.
- **Network error:** mutation `onError` → a retry banner above the CTA
  (`onb-*` styled, not a one-off). Retrying re-runs the same mutation.
- **Loading:** mutation `isPending` → the frame's loading treatment (button
  spinner / skeleton per the gallery frame).
- **Email error / Focused error (site step):** field-level validation on the
  project/client email; focused-error = the frame's active-field error style.
- **Template "No results":** `templates.list` returns empty (or filtered to
  empty) → the gallery's empty-state frame with its copy + reset action.
- **Hover template (path step):** CSS hover state on the template path card,
  matching the gallery's hover frame.

Every state uses the existing primitives + `--color-onb-*` tokens, so there is
one styling source (DRY) and no divergence from the wizard's look.

## Design system

- Accent stays `#2563EB` (`--color-onb-primary`) — the DESIGN.md onboarding
  scoped-exception, re-confirmed by the user. Do not spread cobalt into
  onboarding; `.onb-scope` re-points the focus ring at the onboarding accent.
- Reuse the existing `--color-onb-*`, `--radius-onb`, `--spacing-onb-*`,
  `--container-onb`, `--text-onb-*` tokens. Add a token only if a gallery value
  has no home; never hardcode a one-off hex in a frame.
- Brand text is "Buildrick" (user-facing); the `@buildrik/*` package ids,
  `hideBuildrik`, `BuildrikSync` identifiers stay as-is.

## Testing

Extend the Playwright suite added this session (`packages/dashboard/e2e/`):

- One e2e per flow through the rebuilt frames: **AI** (workspace → path → AI
  basics/goal/brand/generating → draft ready), **Template** (→ gallery →
  preview → selected → editor ready), **Blank** (→ blank → editor ready).
- State assertions: trigger each new state and assert its frame renders —
  empty name → field error; duplicate name → "name exists"; over-length →
  "too long"; forced mutation failure → network-error retry banner; empty
  template list → "no results".
- Reuse the magic-link auth fixture; onboarding runs post-verification, so the
  fixture user must land in the wizard (seed `OnboardingState` incomplete).

## Rollout

- Atomic commits per frame-group, each live-verified against the served gallery
  frame before the next:
  1. workspace + its 5 states
  2. site (project setup / my business / existing client) + 2 states
  3. path + hover
  4. AI flow (5 frames)
  5. template flow (gallery + no-results, preview, selected)
  6. blank + ready
  7. e2e coverage
- No deploy until the user approves the full rebuild. Prod onboarding stays as-is
  until then.

## Out of scope

- The wizard engine (shell/context/primitives/mutations) — reused, not rewritten.
- Auth/seam/AI-image-src fixes — untouched.
- Mobile onboarding — the gallery is desktop-only (1440px); mobile is a separate
  pass if wanted.
- Dashboard, editor, or any non-onboarding surface.
