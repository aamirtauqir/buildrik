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

- [x] **J5 client sign-off has no client-facing screen.** ~~The comment backend
  exists; `app/review/[token]/` does not.~~ **STALE — it has existed since
  2026-07-20** (`packages/dashboard/app/review/[token]/page.tsx`, plus
  `review-client.tsx`), and `docs/prd/editor/14-screen-specs.md:355` already
  marked the "missing" claim stale. Surfaced by the /autoplan CEO phase
  2026-08-02, which flagged it as a governance problem rather than a product
  one: this list was being used to justify scheduling decisions while being
  wrong about the flagship wedge. What remains open is not the screen, it is
  whether the loop is instrumented — see the analytics item above.

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

### Critical — ALL THREE FIXED 2026-07-31 (see docs/plans/2026-07-31-three-criticals-implementation.md)

- [x] **Dashboard publish** — fixed as honesty, not capability (`b629fb97`). Simulation is now opt-in via `PUBLISH_ALLOW_SIMULATION` instead of inferred from `NODE_ENV` in all three branch points, so no environment can fake a successful deploy; the Publish button routes to the editor, where publishing actually works.
- [x] **Stripe cancel/reactivate** — now call Stripe first and mirror the response, never write locally on a throw (`9d8c57fb`). Verified against the real Stripe test-mode API, not mocks.
- [x] **Session revocation** — `User.sessionVersion` checked in the jwt callback on every request (`a3dd2902`). Verified live: bumping the column killed an active session; re-login restored it.

### Still open, created or surfaced by those fixes

- [ ] **[HIGH] Server-side page renderer — blocked on the `packages/editor` migration merge.** Until it exists the dashboard cannot publish at all (it routes to the editor instead), and the AI `site.publish` action stays unable to publish without an editor-supplied payload. The data is all in Postgres (`Page.blocks` is written by the same `elements.exportPages()` serializer the renderer reads), so this is a packaging problem, not a data problem. **Two hard requirements when it happens:** raw-HTML containers must go through `isomorphic-dompurify` (the editor's sanitizer falls back to `stripAllTags` with no DOM, which would publish every AI site as plain text), and a DB-sourced render ships last-*saved* state because publish never saves first and autosave is a 5s debounce.
- [ ] **[HIGH] Per-device session revocation.** `sessionVersion` is a per-user counter, so "sign out on all devices" is all it can offer; the per-row control now says "Remove from list" because that is all it does. Real per-device revoke needs `sid` validated per request, which needs OAuth logins to create Session rows with **full parity**: rememberMe expiry, IP/UA capture, the 10-session cap, the `SESSION_CREATED` audit entry, and new-device alerting (`create-session/route.ts:59`). That is a second session-mint pipeline, which is why it was deferred.
- [ ] **[MEDIUM] A revoked session renders an empty dashboard shell instead of redirecting to login.** Middleware is edge-runtime and only `decode()`s the cookie, so it cannot check `sessionVersion`; the gate lives in `auth()`. Result: a revoked user reaching `/dashboard` gets the chrome plus a wall of 401s rather than a bounce to `/auth/login`. Needs a client-side 401 handler or `experimental.nodeMiddleware`.
- [ ] **[LOW] Three stale test files assert code that was deliberately removed.** Not from the three fixes (zero overlap with their commits) and not from the editor migration — each is a test left behind by an earlier refactor:
  - `template-ai-components.test.ts` imports `components/templates/template-gallery`, deleted in `be81c8ac` ("one canonical template surface").
  - `settings-rail-routes.test.ts` expects agency cross-links in `settings-sections.ts`; that file's own comment (line 68) says those links "have moved out".
  - `team-components.test.ts` asserts a `MEMBER_ACTIONS` export; `member-actions.tsx` exports `MemberAction` (a type) and `MemberActions` (a component), never that.

  Either update each test to the current surface or delete it. **Note for whoever runs the full suite:** counts move while a parallel session is editing the tree — a run during the `editor/ui` deletion showed 15 failures, of which all but these three were races against concurrent file writes and passed on a re-run against a stable tree.

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

### Medium — found during /plan-eng-review of the conformance harness, 2026-08-03

- [ ] **`gate:figma` has been red for four days and runs nowhere.** `packages/dashboard/scripts/check-figma-conformance.mjs` encodes 14 hand-written expected values from the pre-Flowbite Slate palette; the dashboard migrated to the Flowbite palette on 2026-07-30. Running it now: `exit 1`, 8 mismatches — `--color-primary` is `#1A56DB` (correct, `globals.css:91`), the gate expects `#406ED6`; same for `bg-page`, `bg-subtle`, `border-default`, `border-strong`, `text-primary`, `text-secondary`, `primary-subtle`. It is referenced only by its own `package.json` script line: not in `.github/workflows/`, not in the pre-push hook.

  **Why it matters:** `gate:ds` (which the pre-push hook DOES run) passes all 7 checks and its D3 asserts the correct `#1A56DB`, so accent enforcement is genuinely covered. The problem is that `gate:figma` still exists and lies — anyone running it concludes the dashboard has drifted from Figma when it is the gate that is stale. This is the third time this gate family has gone stale on an accent flip (see memory `ds-gate-stale-hides-downstream-gates`, 07-18 and 07-30).

  **Two ways out, and the choice is the work:** refresh the expected values to the Flowbite palette and wire it into the pre-push chain so it cannot rot again, OR delete it and let `gate:ds` own accent conformance. Refreshing without wiring it in just resets the clock on the same failure.

  **Depends on:** nothing. Independent of the editor conformance harness — but it is the strongest evidence for why that harness derives its specs instead of hand-writing them.

### Deferred from /plan-ceo-review of the conformance harness, 2026-08-03

- [ ] **E1 — point the conformance harness at the dashboard.** Once
  `scripts/conformance/lib.mjs`, `extract.mjs` and `diff.mjs` exist in the editor
  and the editor sweep has proven them, run the same three scripts against
  `packages/dashboard`. Nothing in them is editor-specific — they read a recipe
  JSON and drive a browser.

  **Why:** it retires `packages/dashboard/scripts/check-figma-conformance.mjs`
  instead of refreshing it. That script hardcodes 14 expected values from the
  pre-Flowbite Slate palette and has been failing since the 2026-07-30 accent
  flip. Refreshing the hexes just resets the clock on a gate that has now gone
  stale three times (see memory `ds-gate-stale-hides-downstream-gates`).

  **Pros:** one conformance instrument for both packages; the dashboard gets
  derived specs, which cannot rot the way hand-written hexes do; deletes a lying
  gate rather than repairing it.

  **Cons:** the dashboard writes UNPREFIXED Tailwind while the editor writes
  `tw:` — the token-identity read (which parses the className) needs a
  per-package mode. Not free.

  **Not a free delete.** Codex ran `gate:figma` during the CEO review and counted
  16 problems. Some of those are real dashboard drift, not just stale expected
  values. Retirement needs parity criteria: the new harness must report at least
  what the old one legitimately catches before the old one goes.

  **Effort:** M (human ~1d) → with CC ~2h. **Priority:** P2.
  **Depends on:** editor harness shipped and wave A green. Nothing else.

### Deferred from Phase 0.1 font self-hosting, 2026-08-03

- [ ] **Self-host the dashboard's fonts too.** `packages/dashboard/app/layout.tsx:38-42`
  still loads Inter, Inter Tight and Geist Mono from `fonts.bunny.net` with
  `display=swap`. That layout wraps the unified editor route, so the production
  editor renders from the CDN while the demo/probe hosts now render from
  vendored woff2.

  **Why it matters:** the conformance harness measures the demo host. If prod
  and the harness resolve fonts differently, the harness can go green against
  text metrics production never produces. It also keeps a third-party runtime
  dependency in the render path of the paid product.

  **Why it was not done in Phase 0.1:** the dashboard needs a wider weight set
  than the editor — Inter 700/800 (plus a stray `font-black`), and Inter Tight
  400-700 for the auth craftwork surface (`globals.css:213-215`). Vendoring
  those touches the auth surface, and `docs/plans/2026-08-03-editor-figma-conformance.md`
  puts the dashboard package explicitly out of scope.

  **Careful:** `next.config.mjs:28-32` allows `fonts.bunny.net` in
  `style-src`/`font-src`/`connect-src`. `'self'` is already permitted so
  self-hosted files load today; the Bunny entries become dead once the link goes
  and should be dropped in the same commit.

  **Effort:** M (human ~1d) → CC ~2h. **Priority:** P2.
  **Depends on:** nothing.

- [ ] **`--bk-font-mono` names system fallbacks that DESIGN.md bans.**
  `tokens.generated.css:162` is `"Geist Mono", "SF Mono", Menlo, Consolas, monospace`.
  DESIGN.md §Typography anti-slop rule 8 bans naming system fallbacks in any
  stack. `--bk-font-ui` was cleaned earlier today; the mono stack was missed.
  Fix in `scripts/tokens/figma-tokens.json` and regenerate — hand-editing the
  generated file fails `gate:tokens-generated`. **Effort:** S. **Priority:** P3.

## Editor ↔ Figma fidelity — /qa 2026-08-03, all deferred items now CLOSED

Report: `docs/audits/2026-08-03-editor-figma-qa.md` (screenshots alongside it).

Fixed in the QA run: Publish black ring (`7683eabc`), Publish 40px→32px
(`af315d82`). Fixed in the follow-up: D1 IconButton 28→32 (`8b65eef8`),
D3 target size + gate (`d8f82204`), D2 Exit button (`e1782ef9`).

- [x] **D1 — IconButton 28×28 → 32×32.** Board 697:440. 13 instances / 8 files,
  all measured at 32×32 after. Worth restating because the board's own note
  invites the wrong conclusion: 28 ALSO cleared WCAG 2.5.8, so this was fidelity,
  never a violation.
- [x] **D2 — Exit button.** Now h28 · px10 · 12px regular · `#111827`, exactly the
  board. The colour needed a decision the board could not make: matching
  gray-900 at rest would have deleted the gray-600→gray-900 hover. Moved the
  hover signal to a `bg-gray-100` surface instead, so both hold.
- [x] **D3 — five controls under the 24×24 target minimum**, not the one the
  report named. Two root causes: an icon-only action rendered as a text
  `<Button>` with a glyph (21.92×18), and `LINK_BTN`'s `p-0` leaving height to
  the line-box (16px). Now covered by `e2e/target-size.spec.ts`, **locked at
  zero** — the exemption map ships empty — and wired into `editor-ci.yml`.

### Still open

- [ ] **`media/components/SelectionBanner.tsx:31`** renders its cancel action as
  `<Button>✕</Button>` — the same root cause as D3's delete buttons. No probe
  case reaches it, so it is not covered by the target-size gate and was not
  changed blind. Convert to `IconButton` and add a probe case in the same edit.
- [ ] **CORRECTION to the QA report.** It said `GHOST_BTN_CLASS` was "duplicated
  verbatim in 4 files". That undercounted badly: the *string* is inlined about
  **130 times** with **16 separate `const GHOST*` definitions**. The original
  grep matched only the constant name, not the literal. This is not a QA-sized
  refactor — it belongs to the open one-component-system inline drain.
- [ ] **The Figma board is stale on the topbar, three ways** — save pill (T8/D7
  rule 4), review pill tone (T8/D7 rule 3), and the eye/comment/shield tool
  icons ("Figma nodes pending", `Topbar.tsx`). The CODE is right in all three.
  Update the Figma component so conformance runs stop re-flagging them.
