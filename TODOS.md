# TODOS

Deferred work with a reason. Items land here when they were considered and
consciously not done, not when they were forgotten.

## Security

- [ ] **CSP: remove `'unsafe-inline'` from `script-src`.** `next.config.mjs` now
  drops `'unsafe-eval'` in production (nothing shipped needs it — there is no
  `eval(` or `new Function(` in `packages/editor/src`). `'unsafe-inline'` is the
  harder half: Next inlines hydration bootstrap scripts, so removing it needs a
  nonce middleware that does not exist. Ship
  `Content-Security-Policy-Report-Only` with a report endpoint first, watch for a
  week, then enforce — tightening a CSP by guessing is how you take a site down.

- [ ] **Sanitize AI-generated HTML at the worker boundary.** `ExportEngine` now
  sanitizes `contentFormat: "html"` content before publishing it, so published
  sites are safe. The canvas still mounts the AI worker's raw output un-escaped
  (`Canvas.tsx:511`), on an authenticated same-origin route, and the worker
  bypasses the `HTMLParser` sanitize path entirely. That is a real XSS surface,
  narrowed but not closed. Sanitize in `ai-generate/[jobId]/route.ts` before the
  content is ever stored.

- [ ] **Audit the token-authenticated surface.** The 2026-07-20 `/cso` pass found
  the session-authenticated surface clean, and the one real hole of the day was
  on the token side (`listClientComments`, fixed in `29670bf4`). Client review,
  share links and API tokens have not had the same treatment.

## Testing

- [ ] **Run the full Playwright suite in CI, not just the smoke floor.**
  `.github/workflows/dashboard-tests.yml` runs `dashboard.spec.ts` against a
  Postgres service. The other 100 tests (a11y, responsive, link-integrity,
  settings drill-in, onboarding) still only run by hand.

- [ ] **Decide whether BrowserStack earns its keep.** `playwright.config.ts:13`
  derives `isBS` from the presence of `BROWSERSTACK_USERNAME` /
  `BROWSERSTACK_ACCESS_KEY`, both of which sit in `.env.local`. Every local
  `npx playwright test` therefore ran against the paid cloud grid, silently,
  while CI ran no browser tests at all. Either gate it behind an explicit
  `PW_BS=1`, or drop the projects. Never derive an expensive default from a
  credential being present.

## Onboarding

- [ ] **The AI draft preview has no visual preview.** `/onboarding/ai/preview`
  now lists the pages and section counts the generator actually produced, but a
  user cannot see the site before opening the editor. Rendering an unpublished
  draft needs a renderer the app does not have: `/share/[token]` redirects to
  `publishedUrl`, and a fresh draft has none. Either add a render route that can
  take a siteId, or generate a thumbnail during the job.

- [ ] **No field in the AI wizard has a `maxLength`.** The fold now budgets so a
  long answer cannot starve the others, but "One-line description" still accepts
  a paragraph with no hint that only ~500 characters of the whole brief reach the
  model. A counter or a cap would tell the user before the truncation does.

## Auth (surfaced by the 2026-07-20 flow investigation)

- [ ] **Auth forms have no inline per-field validation.** Nine screens pass the
  server error straight to a banner (`setError(err.message)` in page, signup,
  magic-link, forgot-password, reset-password, invite, join-workspace,
  workspace-setup). `trpc.ts:58` already rewrites Zod failures from raw JSON to
  `field: message`, so the output is readable — but submitting an empty login
  puts `"email: Please enter a valid email address; password: Password must be
  at least 8 characters"` in a banner above the OAuth buttons, when onboarding
  would have shown each error under its own field on blur. Not broken; visibly
  less finished than the flow next to it, on the product's front door.

- [ ] **No e2e coverage of auth interactions.** 15 auth screens carry forms and
  mutations; the suite only uses the magic-link path programmatically to mint a
  session. Login, signup, 2FA, invite, reset-password, verify-email,
  change-email and join-workspace have never been exercised by a test.

## Product (surfaced by the 2026-07-20 CEO review, not yet scheduled)

- [ ] **No product analytics.** `sidebarAnalytics.ts` is a console.log stub.
  Nothing measures activation, drop-off, or whether the Vercel-OAuth publish step
  costs users. Decisions about what to build next are currently unmeasurable.

- [ ] **J5 client sign-off has no client-facing screen.** Founder-locked as the
  #1 priority on 2026-07-18 (`docs/prd/editor/14-screen-specs.md:338`). The
  comment backend exists; `app/review/[token]/` does not. `app/share/[token]/`
  already ships the pattern to copy. Either build it or revoke the lock — do not
  let it decay by neglect.

- [ ] **Origin-pin `/api/asset-upload` (and the other cookie-authenticated non-tRPC
  routes).** The tRPC endpoint checks `EDITOR_ORIGIN`; `asset-upload` accepts
  cookie-authenticated mutations with no origin check while the editor calls it with
  `credentials:"include"`. Same treatment as the token-surface audit above — check
  Origin against the allowlist, reject loudly. Surfaced by /autoplan eng phase
  2026-07-22.

## Topbar (surfaced by the 2026-07-30 eng review of the topbar fix plan)

- [ ] **"Publish anyway" confirm modal — founder decision.** Errors > 0 currently
  publishes in one click (`StudioHeader.tsx:318`, `publish="anyway"`); the label is
  the only warning. A confirm ("3 errors — publish anyway?") stops accidental broken
  publishes but adds friction, and no Figma frame exists for it. Product call, not
  an engineering default. Start: design the frame first, then a small ModalRoot
  composition at the onPublish callsite.

- [ ] **Worker-based export (engine arc).** `composer.exportHTML()` is synchronous
  on the main thread — big sites freeze the UI during preview/publish. The F7-B2
  fix only reorders paint; the export itself still blocks. ExportEngine holds DOM
  references, so this needs an engine-level worker-safe refactor. Blocked by:
  engine arc capacity; callers: preview overlay, publish flow, drag ghost.

- [ ] **useSaveCallback honesty (P2 — prior-outage pattern).** Network-failed saves
  settle to `idle` with a "queued, will sync" toast (`useSaveCallback.ts:96-106`),
  and `SaveConflictError` also settles to `idle` (`:87-89`) — but the queue dies on
  navigation, so "idle" is a lie exactly when it matters. Same dev-comfort-hides-
  prod-failure shape as the three 2026-07 production outages (memory:
  dev-configured-never-to-fail). The F1 exit-guard defends downstream; the source
  should still tell the truth (`offline`/`conflict` states). Blast radius:
  autosave loops, toasts, SaveStatus consumers — own arc + test sweep.
  Depends on: F1 landed. Note (2026-07-30 design review): the topbar redesign
  plan specs the `conflict` SaveStatus pill and marks it FUTURE, blocked on this
  item (decision D11 in `docs/plans/2026-07-30-topbar-complete-redesign.md`).

- [ ] **Issue producer message quality (surfaced by the 2026-07-30 topbar design
  review, finding F19/D16).** The publish-anyway confirm modal now specs top-3
  concrete issue rows rendered from the `Issue` shape (type + message) — the
  safety gate is only as good as those messages. What: audit every Issue
  producer; ensure each issue carries a human-readable message + an element
  reference ("Broken link — Home / CTA", not "Validation failed"). Why: vague
  messages degrade the D12 modal to an abstract count, which is exactly the
  habituation Codex flagged. Pros: modal AND Issues panel both improve. Cons:
  producers are scattered; small audit. Depends on: nothing — independent of
  the topbar implementation.

## Deferred from /design-review 2026-07-30 (dashboard Flowbite audit) — ALL CLOSED 2026-07-31

- [x] **InputField adoption** — 45 fields converted across settings, site-detail, clients, modals and standalone pages (`FINDING-018a`/`018b`). Primitive gained `invalid` + `valid` props. Checkboxes/radios/file/color inputs, selects and textareas intentionally out of scope; auth + onboarding skins exempt.
- [x] **Type ramp** — `text-sm`/`text-xs` codemodded to `text-body`/`text-body-sm` across 49 dashboard files, 363 sites → 0 (`FINDING-019`). Same pixel values, so no visual delta. Auth/onboarding keep their own scales (42 sites, deliberate).
- [x] **Toggle primitive** — 4 hand-rolled `role="switch"` implementations → flowbite `ToggleSwitch` (`FINDING-015`).
- [x] **submission-drawer a11y** — now `role="dialog"` + `aria-modal` with the Modal focus-trap/restore contract (`FINDING-016`).
- [x] **SearchField** — projects + templates moved onto InputField; help-center, media-library and marketplace were already there (`FINDING-017`). No separate primitive needed.

Found and fixed while closing these (not in the original audit):
- [x] `filter-chip.tsx` was never committed — its three consumers shipped, so a fresh checkout failed to build. Pathspec commits do not stage untracked files.
- [x] 8 semantic-color bugs: account-tab (2), invite-modal (2 + textarea error border), ticket-form (3 + textarea error border), delete-confirm-modal and create-site-modal blue icons inside red danger panels — all rendered accent blue where an error was meant.
- [x] A THIRD palette family: raw Tailwind color CLASSES (`FINDING-020`, 13 sites / 6 files). The whole dunning banner was off-palette. `FINDING-002` had swept the hex form only.

Remaining known gaps (not blocking, no owner yet):
- [ ] **[LOW · design] Arbitrary `text-[Npx]` values** — ~24 distinct sizes still coexist (`13px`, `13.5px`, `12.5px`…). DESIGN.md permits artifact-matched pixels, so this needs a design decision on which survive, not a codemod.
- [ ] **[LOW · design] No Select primitive** — `SELECT_FIELD_CLASS` in workspace-form is hand-matched to InputField chrome and copied by other selects. Extract if a third consumer appears.

## From /qa 2026-07-31 (whole-dashboard deep QA) — NOT fixed, need decisions

Fixed in this pass: notification-prefs wipe, DS gate, drawer focus churn,
danger-zone valid state, modal z-index + sticky footer, InputField
disabled/readOnly affordance, workspace-rename stale sidebar.

### Critical — verified, need a product/architecture decision (not safe QA fixes)

- [ ] **Dashboard "Publish" cannot publish in production.** `app/dashboard/sites/[id]/publish/page.tsx:42` calls `publishMutation.mutate({ siteId })` with no page payload; the worker throws "No page content to deploy" when `pages.length === 0 && NODE_ENV === production` (`app/api/workers/publish/[jobId]/route.ts:88`). Only the editor's `PublishService` supplies pages. In dev the same click runs `runSimulation` and marks the site PUBLISHED with a `.dev-simulated.invalid` URL, so this is invisible locally. Decide: wire the page payload into the dashboard publish, or remove the dashboard button and route to the editor.
- [ ] **"Cancel subscription" never reaches Stripe.** `server/services/billing.service.ts:286` only writes `cancelAtPeriodEnd: true` locally; there is no `subscriptions.update` call anywhere in `server/services/`. The customer sees "cancels on <date>", the card is charged at renewal, and the incoming `customer.subscription.updated` webhook resets the flag so the banner disappears. Same shape in `reactivateSubscription:312`. This is real money — fix deliberately with Stripe test-mode verification, not blind.
- [ ] **Session revocation is cosmetic.** `server/auth.config.ts:41` is `strategy: "jwt"` and `token.sid` is only copied into the session object (`:168`), never validated against the Session row. "Revoke session", "Revoke all other sessions" and the password-reset "signs you out everywhere" all delete rows while the JWT cookie stays valid for its full 30 days. Needs a real decision: DB-session strategy, or a token version/denylist check in the jwt callback.

### High — verified by source read, worth a follow-up pass

- [ ] `server/services/template.service.ts:150` — `templates.use` does an unscoped `findUnique`, so any authenticated user can instantiate another workspace's private template (including its page content). The sibling `getTemplate:89` already scopes with `OR: [{workspaceId: null}, {workspaceId}]` and carries a comment about this exact leak.
- [ ] `server/services/sites.service.ts:102` — site cards and "Copy Site URL" use `domains: { take: 1 }` with no `where: { status: "VERIFIED" }`, so an unverified/pending domain is shown and copied as the live address. The publish worker gets it right.
- [ ] Settings has no role gating at all (`app/dashboard/settings/layout.tsx`), so ADMIN/EDITOR/VIEWER see billing, plans, api-token, integration and danger-zone controls that always 403. `sites.myRole` exists and is never called from the dashboard.
- [ ] The dominant bug shape found repo-wide: `useQuery` consumers rendering `data ?? []` / `?? 0` without branching on `isLoading`/`isError`, which turns a transient failure into a confident false statement ("No templates found", "0 credits remaining", "you're on Free"). Worth one sweep rather than 20 fixes.

### Medium — from today's migration, deferred deliberately

- [ ] **flowbite `ToggleSwitch` ships a dangling `aria-labelledby`.** It always sets `aria-labelledby="<id>-flowbite-toggleswitch-label"` but only renders that span when the `label` PROP is set; our five call sites pass `aria-label`, which `aria-labelledby` outranks in the accname algorithm. Fix is to pass `label` instead — deferred because flowbite renders the label after the switch and all five sites have a visible label on the left of a justify-between row, so it needs a per-site visual check.
- [ ] **`Button`'s default `type` silently changed from `submit` to `button`** with the flowbite swap. Every current in-form Button carries an explicit type so nothing is broken today, but the next one added without `type="submit"` will look right and do nothing.
- [ ] 76 `<label>` elements across the dashboard, zero `htmlFor` — clicking a label focuses nothing and screen readers cannot pair label to field. Pre-existing, not from the migration. Cheapest real fix now that every field is one primitive: give `InputField` a `label` prop that owns the association.
- [ ] Control-height mismatches after the InputField swap: 2FA code fields (`security-tab.tsx:279,331`) and redirect From/To (`redirects-tab.tsx:142,147`) are now 42px next to 36px buttons/selects they used to align with.
