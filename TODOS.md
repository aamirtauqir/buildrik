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
  Depends on: F1 landed.
