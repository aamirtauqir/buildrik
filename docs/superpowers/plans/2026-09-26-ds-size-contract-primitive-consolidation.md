# Follow-up plan: B-11/B-12 remainder — DS size contract + primitive consolidation

Ledger IDs: B-11 (remainder), B-12 (remainder — item 1, Gate 24 → shared/
forms, landed this lane; items 2-4 remain). Needs PD-31 for B-11's default
size; B-12's remaining items are decision-free but XL/broad-churn.

## Goal

1. (B-11) Give `<Button>` a real default `size`, and self-host chrome
   fonts instead of loading them from `fonts.bunny.net`.
2. (B-12) Consolidate the parallel primitive libraries that duplicate
   chrome-ui: `shared/forms/` field components, hand-rolled tablists,
   bespoke search fields, and per-screen status-tone tables — onto
   chrome-ui equivalents, one primitive per PR.

**Done condition (B-11):** `getComputedStyle(btn).height` for AgentPlan
Skip/Approve, ConflictModal's buttons and the PublishWizard CTA all equal
the PD-31 height, measured on `/edit/:id` at 1440×900. The Network tab
shows zero `fonts.bunny.net` requests after self-hosting.
**Done condition (B-12), per migrated primitive:** a 1440×900 screenshot of
the affected drawer, before/after, matches; and a keyboard check confirms
arrow keys move focus between tabs in each migrated tablist.

## What already landed (this lane, decision-free subset)

- **B-11:** the six remaining `tw:font-bold`/`fontWeight: 700` uses in
  chrome outside `design-system/` snapped to 600
  (`tw:font-semibold`/`fontWeight: 600`). Added a `font-weight-700` ratchet
  (baseline 0) to `scripts/check-design-debt-ratchet.mjs`. Added a
  report-only "unsized `<Button>`" counter to the same script (220 current
  usages — informational, does not fail the build, since there is no
  default size yet to hold pixels steady against).
- **B-12(1):** extended Gate 24 (zero raw `<button>/<input>/<select>/
  <textarea>` in chrome) to scan `shared/forms/` too, as a ratchet
  (baseline 4 — `FileField.tsx`, `ColorField.tsx`), since Gate 24
  previously only scanned `src/editor/` and `shared/forms/` was invisible
  to it despite being documented chrome (the one intentional
  shared/→chrome-ui edge, per `packages/editor/CLAUDE.md`'s DS SSOT
  table).
- See the lane report for commit SHAs.

## Why the rest is deferred

- **B-11's default size** changes ~359 (now 220 measured by the new
  counter, which excludes `chrome-ui/Button.tsx` itself and tests) unsized
  `<Button>` call sites at once — this must be done only with the PD-31
  value in hand and a screenshot sweep, not guessed.
- **PD-31** (canonical button height 28 vs 32, modal radius, spacing
  scale, font self-hosting) is unanswered.
- **B-12's remaining items (2-4)** are each individually decision-free
  (no PD blocks them), but the ledger sizes the whole entry XL: each
  consolidation is broad visual churn across many call sites, needs its
  own side-by-side board check per the editor CLAUDE.md loop, and breaks
  tests that assert local class names or testids — this is real,
  sequential migration work, not a single PR.

## Decisions needed (PD-31, B-11 only)

1. **Canonical button height:** 28px or 32px. `BK_BUTTON_THEME`
   (`chrome-ui/buttonTheme.ts`) currently has no `size` key at all — the
   only height defined is the link variant's `tw:h-auto tw:min-h-6`.
   Flowbite's unsized default resolves to `h-10` (40px), which is what
   every unsized `<Button>` gets today.
2. **Modal radius** and **spacing scale** — bundled into the same PD
   because they were raised together in the original audit; confirm
   whether they're still open questions or were answered elsewhere before
   scoping this plan's tasks.
3. **Font self-hosting.** The dashboard still loads
   `https://fonts.bunny.net/css?family=inter:400,500,600,700,800|...` —
   confirm the decision is "yes, self-host" (likely, given DESIGN.md's
   general anti-CDN-dependency posture) vs. "acceptable as-is."

## Proposed tasks

### B-11, once PD-31 lands
1. Set `BK_BUTTON_THEME`'s default `size` to the PD-31 height in
   `chrome-ui/buttonTheme.ts`; add the `size` key Button.tsx currently
   lacks.
2. Screenshot sweep: every screen with `<Button>` (use the 220-usage
   counter this lane added as the checklist), 1440×900, before/after.
   Given the volume, batch by drawer/panel, not one screenshot per button.
3. Self-host fonts: download Inter/Inter Tight/Geist Mono weight subsets,
   serve from the dashboard's own static assets, replace the
   `fonts.bunny.net` `<link>` in `packages/dashboard/app/layout.tsx:38-42`
   and `packages/dashboard/components/dashboard/primitives/button.tsx`
   with local `@font-face` declarations.
4. Remove the `font-weight-700` and unsized-button items from
   `check-design-debt-ratchet.mjs`'s report-only status once a default
   exists — the unsized-button counter should either become a real
   pass/fail ratchet (declining toward 0 as call sites adopt an explicit
   `size` where they intentionally differ from default) or be retired if
   "unsized = default" becomes the accepted final state.

### B-12, one PR per item
1. **StatusBadge:** add a chrome-ui `StatusBadge` taking a `tone` prop;
   move `PILL_TONE` in `DomainsScreen.tsx:95`, `AnalyticsScreen.tsx:347`,
   `LocalizationScreen.tsx:73` onto it.
2. **Tabs:** move the ~10 hand-rolled `role="tablist"` instances onto
   chrome-ui `Tabs` (8 of them currently lack arrow-key navigation per the
   ledger evidence — this migration is also an a11y fix, not just DRY).
   Keyboard check per migrated tablist is the acceptance bar.
3. **SearchBar:** promote `sidebar/shared/SearchBar.tsx` (currently 2
   consumers) into chrome-ui; adopt it at the ~14 bespoke
   `type="search"`/`placeholder="Search` call sites.
4. Each item gets its own side-by-side board screenshot comparison before
   merge, and its own commit so a regression is bisectable to one
   primitive swap.

## Risks

- The 220-usage `<Button>` sweep (B-11 task 2) is the largest single
  visual-regression surface in this plan — do not batch it into one PR;
  the lane-common "measure, don't eyeball" rule means each batch needs its
  own before/after evidence, not a single global "looks fine" claim.
- B-12's tablist migration doubles as an a11y fix (8 of ~10 currently lack
  arrow keys) — do not treat it as pure refactor risk; regressing arrow-key
  support during the migration is a real accessibility regression, not
  just a visual one.
- Font self-hosting changes `next.config.mjs`'s CSP if a `font-src`
  directive currently allowlists `fonts.bunny.net` — check and tighten it
  in the same PR, per root CLAUDE.md's general posture on this class of
  change (see the `BLOB_READ_WRITE_TOKEN` CSP precedent in the env-vars
  table).
