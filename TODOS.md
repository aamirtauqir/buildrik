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

## Media surface — from /plan-eng-review 2026-08-03

Review of `docs`-adjacent design doc `shahg-main-design-20260803-200524.md`
(Media + Content drawers, Approach C). These three were found during the review
and deliberately left OUT of that arc.

- [ ] **Fullpage MediaTab header is hand-rolled, and 62 inline styles sit under it.**
  `MediaTab.tsx:53` (drawer branch) correctly uses `PanelFrame.Header`, but `:287`
  (fullpage branch) hand-rolls `<div className="med-tabs-wrap" style={{display:'flex',
  alignItems:'center', justifyContent:'space-between', height: ROW_LG}}>`. One tab,
  two headers. The stated goal is "flowbite via chrome-ui", so this is part of the
  problem, not cleanup (Codex, outside voice).
  **Measured split: 34 of the inline styles are STATIC and convert straight to `tw:`
  classes; 19 are genuinely dynamic and must stay** — CLAUDE.md allows exactly that
  ("NO inline style objects except dynamic computed values"). Examples:
  `{display:'flex',alignItems:'center',gap:8}` → `tw:flex tw:items-center tw:gap-2`;
  `{display:"none"}` → `tw:hidden`. Mixed cases split rather than convert wholesale —
  `MediaContextMenu.tsx` is `{position:"fixed", left, top, width:MENU_WIDTH, zIndex:200}`,
  which becomes `tw:fixed tw:w-[...] tw:z-[200]` plus `style={{left, top}}` for the part
  actually computed from the click.
  Top files by static count: LibraryView (8), StockSourceModal (5), ImageEditorModal (4),
  MediaContextMenu (3), FolderTree (3), AssetGrid (3).
  **Depends on:** the Media drawer arc landing first, so the two do not move together.

- [ ] **`StockService.ts` file-header is stale and actively misleads.** Lines 4-10 say
  "Currently a stub: returns empty results" and "To enable real stock search, swap the
  implementations". Line 48 records the truth (`#24, 2026-06-24: the provider is wired
  via the dashboard tRPC proxy`) and line 67 makes the real query. Delete the stale
  paragraph. **Context worth keeping:** this comment produced a confident P1 finding in
  the 2026-08-03 eng review that had to be retracted after reading the implementation.
  A wrong comment cost more than no comment.

- [ ] **`StockService` collapses "error" into "empty".** `searchPhotos`/`searchVideos`
  catch every non-abort failure and `return []`, so a provider outage and a genuine
  zero-result search are indistinguishable to callers. Figma `453:3931 Media · load-error`
  draws them differently — "Couldn't load your media." + Try again / Browse stock, versus
  the ordinary empty state. That screen cannot be built truthfully until the return
  contract can express failure. **This is the one real exception to the design doc's
  "zero new endpoints" premise** — the server is fine; the editor-side return type changes.
  **Depends on:** decide before building the Media load-error state.

### Media badges — provenance has no server-side home (2026-08-04 plan re-review)

Found re-reading `shahg-main-design-20260803-200524.md` against the code after
it was approved. **Both block T8 (the Media grid restructure), and the first one
needs a founder decision, not an implementation.**

- [x] **DECIDED 2026-08-04 — option (b): badges are fixture-conformed, and the recipe
  says so.** No schema column, no endpoint change; "zero new endpoints" survives. The
  recipe for `144:2` MUST carry a note that a green badge target proves the *rendering*,
  not that provenance persists — otherwise the gate reads as "provenance works" and lies.
  Persisting `assetSource` stays open as a later arc; the finding below is the record of
  why. Original finding kept verbatim:
- [ ] ~~**DECISION: `assetSource` never reaches the server, so STOCK/AI badges cannot
  be conformed against real data.**~~ (decided above) `prisma/schema.prisma:1015` `MediaAsset` has no
  `assetSource` column, and `MediaManager.updateAsset:969` mirrors **only `folderId`**
  server-side (`:992-1001`) — everything else stays in local storage. An asset loaded
  from the server, opened on a second machine, or seen after a storage clear has
  `assetSource === undefined` and renders **no badge**. Figma `144:2` deliberately
  shows STOCK / AI / no-badge in one grid, so the badge target passes only against
  fixtures. The design doc's "What already exists" table claimed `media.ts:139
  assetSource — drives the badges`; that line is `shared/types/media.ts:140`, an
  editor type, not a server field — while the same doc's Open Question 3 said "not
  checked". **Two options:** (a) add the column + persist it through the upload/import
  path — a second breach of the "zero new endpoints" premise, alongside the
  StockService error contract above; or (b) accept badges as fixture-only and record
  that in the recipe so nobody reads a green gate as "provenance works".
  **Depends on:** decide before T8.

- [ ] **`assetSource: "ai"` has no writer, and would render wrong if it did.** The
  union has three members; only two are ever set — `MediaManager.ts:464`
  (`"uploaded"`) and `useDiscoveryState.ts:208` (`"stock"`). Nothing produces `"ai"`,
  so Figma's AI badge has no data behind it. And `AssetGrid.tsx:365` maps `"ai"` onto
  the **`stock`** CSS class, so a future writer would ship the wrong badge silently.
  Either wire the AI-generated import path to stamp it, or drop the AI badge from the
  T8 scope — do not build a badge whose only possible value is unreachable.

## Left-rail redesign follow-ups — from /plan-design-review 2026-08-04

Deck: `~/.gstack/projects/aamirtauqir-buildrik/designs/left-rail-all-panels-20260804/wireframes.html`.
All four are editor-code changes that implement decisions locked in that review;
the deck is the design SSOT for each. None block the deck itself.

- [ ] **Drain the dead pin props.** `isPinned`/`onPinToggle` toggle and pass through
  LeftSidebar (`:346`, `:506`) into 10+ panel headers, and NOTHING reads them for
  behavior — the drawer never auto-closes, so pin is a decorative control (Issue 25,
  decision 25A: delete pin everywhere). Remove the props from the panel interfaces,
  `LeftSidebar.tsx`, `PanelHeader.tsx`/`PanelFrame`, and the header icon row. Same
  class of deletion as the AI model picker ("a control that never controlled anything").

- [ ] **Retire `PageCommandPalette`; ⌘K is global-only.** PagesTab.tsx:113-118 opens a
  second palette when Pages is open — one shortcut, two results (Issue 22, decision
  22A). Pages-scoped commands (jump-to-page, new page) become a context section of the
  GLOBAL palette when Pages is active. Search-field kbd hints change to `/`
  (focus-search), ⌘K hint appears only for the palette itself.
  **Depends on:** the global ⌘K palette design in the deck (Door 3) shipping first.

- [ ] **Flip Components V2 canonical, delete V1.** Founder chose V2 (Issue 23, decision
  23A): `componentsV2` flag at TabRouter.tsx:161 dies, `ComponentsPanelV2` becomes the
  only Components surface, old `ComponentsTab` deleted. V1's state patterns (skeleton /
  PanelErrorState / EmptyState) carry over — they are the reference implementations.
  **Depends on:** the V2 wireframe being finalized in the deck + a V2 maturity audit
  (states, shortcuts, ⌘K entry parity) before the flip.

- [ ] **Media: persist panel width, retire the slim-launcher tree.** Expand choice
  resets on tab switch (LeftSidebar.tsx:477-479) — the user's width is forgotten every
  time (Issue 24, decision 24A: one panel, 320 default, width persists per user).
  Kill the reset, persist `ui:media-panel-width` per user, and collapse the
  slim-launcher-vs-ExpandedMediaPanel dual tree into one MediaTab.
  **Inventory first:** audit `onOpenLibrary` consumers before deleting the branch
  (feedback_inventory_before_deletion_wrappers).

## Probe / gate findings — adversarial review 2026-08-03

Found by the adversarial pass on the 12-commit editor arc. The flowbite-prefix
root cause is fixed in `466158dd`; these are the rest.

- [ ] **Regenerate every parity baseline now that the probe styles flowbite.**
  `466158dd` added the missing `flowbiteStore` import. Until each surface is
  re-captured its baseline still records unstyled OS buttons (buttonface grey,
  16px, radius 0). Expect large, correct movement — a `<Button size="xs">` goes
  24px -> 32px, transparent -> `rgb(26,86,219)`. **Re-run the WCAG target-size
  gate afterwards**: its five cited violations were artifacts of the unstyled
  cascade and will not reproduce. **Depends on:** coordinating with whoever owns
  the 17 baselines added in `387e1a3d..1f903c44` — do not clobber mid-flight.
- [ ] **Re-justify or revert the two `min-h-6` edits.** `OnboardingChecklist.tsx:214`
  and `LINK_BTN` in `ContentViews.tsx` were added to fix 22px/16px measurements
  that came from unstyled buttons. flowbite `xs` is `h-8` (32), so `min-h-6` (24)
  never applies in production. Harmless but dead. The IconButton conversion in
  ContentViews stays — it is right on design grounds regardless.
- [ ] **`target-size.spec.ts` passes vacuously on an empty render.** Zero controls
  yields `[]`, `[].filter(...)` yields `[]`, and `toEqual([])` passes. Its sibling
  `style-parity.spec.ts` already guards this with
  `expect(Object.keys(actual).length, "probe rendered no measurable nodes").toBeGreaterThan(0)`
  plus a `data-probe-error` read, a fonts-loaded assert, and a `pageerror` listener.
  target-size has none of the four. React 18 commits asynchronously, so
  `data-probe-ready` is set before a render throw surfaces — a component that
  throws produces an empty DOM and a green gate.
- [ ] **`"name" in BASELINE` walks the prototype chain.** `target-size.spec.ts`
  filters with `!(c.name in BASELINE)`, so a control named `constructor`,
  `toString`, `valueOf` or `__proto__` is silently exempt from a map documented
  as shipping empty. Use `Object.hasOwn`. Also: the key is a global accessible
  name (not case-scoped), it is truncated to 40 chars, it falls back to
  `<button>` (one entry would exempt every unlabelled button), and there is no
  staleness check so the list can only grow.
- [ ] **The gate's selector misses most non-`<button>` interactives.** Present in
  chrome and invisible to it: `role="tab"` x28, `role="option"` x14,
  `role="radio"` x7, `role="treeitem"` x4, `role="switch"` x3, `role="slider"` x3,
  `role="combobox"` x1, `<summary>` x2. Conversely `input:not([type=hidden])`
  matches sr-only inputs — flowbite `Checkbox` is 16x16 and fails the moment one
  enters a probe case (`ContentViews.tsx:382` has one behind the `adding` form).
- [ ] **`.filter(c => c.w > 0 && c.h > 0)` discards the worst controls.** A control
  collapsed to zero width by flex-shrink is unclickable; 1x18 fails the gate and
  0x18 passes it. Gate on `display`/`visibility`/`offsetParent`, not on the
  number being measured.
- [ ] **Loading-state baselines are non-deterministic.** `content-loading` differs
  run to run on `opacity` (0.989 vs 0.857) and `media-drawer-loading` on 122
  sub-pixel widths — skeletons measured mid-animation. `37c7deac` claims a
  harness that stops measuring animations; it is not holding for these two.
  `canvas-footer-toolbar` also fails with zero value changes, so its key set moved.
- [ ] **`UPDATE_PARITY` has no CI guard.** `style-parity.spec.ts:93` writes a
  missing baseline and passes. A new probe case is blessed on first run with no
  review, and the env var turns the whole gate into a rubber stamp. Note the
  asymmetry: `playwright.config.ts:19` throws loudly if BrowserStack creds are
  present, but this is unguarded. In CI it should be a hard failure.
- [ ] **The CI target-size step is decorative.** `package.json:40` is
  `"test:parity": "playwright test"` with no filter and `testDir: "./e2e"`, so the
  earlier Style-parity step already runs target-size. Steps abort on first
  failure, so the dedicated step can never be the one that fails, the suite runs
  twice against a 20-minute budget, and it uses `npx` where the browser install
  two steps above uses `pnpm exec`.
- [ ] **Nothing in `chrome-reset.css` reaches portalled chrome.** `OverlayRoot.tsx:16`
  appends `#bk-overlay-root` to `document.body`, outside `.bd-studio`. Modals,
  drawers, menus, the command palette, toasts and tooltips get neither the new
  `border: 0 solid` nor `box-sizing: border-box` (preflight is off). The
  "all 42 controls in the default shell" sweep excluded every overlay by
  construction.
- [ ] **`chrome-reset.css` guards on the class but the engine accepts the attribute.**
  `:not(.buildrick-canvas, .buildrick-canvas *)` keys on the class only, while
  `engine/canvas/resize/utils.ts:27`, `indicators/BoundsCalculator.ts:44` and
  `resize/ConstraintManager.ts:138` all query
  `"[data-buildrick-canvas], .buildrick-canvas"`. A canvas mount setting only the
  attribute is unguarded. Add `[data-buildrick-canvas]` to the `:not()` list and
  to `CANVAS_GUARD` in `chrome-reset.test.ts`.
- [ ] **The canvas inherits the editor's UI font.** `chrome-reset.css:72` sets
  `font-family: var(--bk-font-ui)` on `.bd-studio`; `.buildrick-canvas` sets no
  font of its own, and `font-family` inherits. A customer site with no
  font-family declaration renders Inter in the editor canvas and browser-default
  when published. Preview does not match output, in a WYSIWYG builder.
- [ ] **`PanelFrame` delegation dropped `min-w-0` from the title.** The old header
  wrapped title+subtitle in `tw:flex-1 tw:min-w-0`; `PanelHeader.tsx:88` is
  `tw:flex-1` only. A flex item's `min-width` defaults to `auto`, so a long title
  cannot shrink and pushes the pin/help/close cluster past the right edge of a
  fixed 44px bar. Was 3 drawers, now all 7.
- [ ] **`PanelHeaderActions` still renders the pattern this arc declared fixed.**
  `PanelHeader.tsx:34-64` renders pin / help / close as
  `<Button color="light" size="xs">📌 / ? / ✕</Button>` — an icon-only action as a
  text Button carrying a glyph, which is exactly what `ContentViews.tsx:350` was
  converted away from. The delegation propagated it from 3 drawers to 7.
- [ ] **Row and NavItem accent bars are not the same bar.** `NavItem` uses
  `before:rounded-l-lg`, `Row` uses no radius, in the commit whose message says
  "one active language across the product". On a selected Row the bar also paints
  over the left 3px of the `focus-visible` inset ring — the exact cost NavItem's
  comment says it avoided.
- [ ] **Parity baselines are keyed by positional DOM index.** `style-parity.spec.ts`
  builds keys as `${label}>${idx}` from `querySelectorAll("*")`. Inserting one
  element shifts every subsequent key and silently re-pairs recorded values with
  different elements. This is why a primary CTA recorded as buttonface-grey
  survived review.
