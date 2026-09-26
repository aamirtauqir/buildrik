# Lane L5 report — dashboard UX

Worktree: `/Users/shahg/Desktop/buildrik-af-L5`, branch `fix/audit-L5`, base `e143ffbaf`.
Commit range: `e143ffbaf..3315d432f` (9 commits, one per fix ID; B-5 folded into the
A-19 commit since both landed in the same file, `team/page.tsx`, in the same pass).

## B-6 — Modal onClose ref, deps [open] — fixed `fb9a032ee`

`packages/dashboard/components/dashboard/primitives/modal.tsx`: effect was keyed
`[open, onClose]`; an inline `onClose` from a parent holding local state
re-ran the effect (and its cleanup, which restores focus to whatever opened the
dialog) on every keystroke. Read `onClose` through a ref, deps now `[open]`.

Test: `modal.test.tsx` — reproduced the bug first (typing "Homepage" through a
trigger-opened modal left only "H"), confirmed it fails on the pre-fix code,
then confirmed the fix. `npx vitest run .../modal.test.tsx` — 1/1 pass.

Not verified: the runtime_check's live-app walk (Share draft / New folder /
API tokens Create name fields) — left to controller Phase 2.

## B-4 — global 4xx toast, submission delete confirm, revert-on-error, double-submit guard — fixed `e80734ef6`

- `lib/trpc/client.tsx`: `handleTRPCError` now toasts the server message for
  every non-5xx tRPC error (was: only INTERNAL_SERVER_ERROR + network errors).
  Skips the `/auth/login` redirect on UNAUTHORIZED when `location.pathname`
  starts with `/review/` or `/share/`.
- `submission-drawer.tsx`: Delete now opens a danger-variant confirm Modal
  instead of deleting on click.
- `submissions-panel.tsx`: `updateMutation` reverts the optimistic drawer
  state on error.
- `create-site-modal.tsx`: local `submitting` guard on the three creation
  rows against a fast double-click.
- `api-tokens-tab.tsx`: Revoke now opens a confirm Modal.
- `context-menu.tsx`, `bulk-action-bar.tsx`, `member-actions.tsx`: destructive
  menu-item text used `var(--color-primary)` (accent blue) instead of
  `var(--color-error)` — swapped (A08-5).

Test: `lib/__tests__/handle-trpc-error.test.ts` — one case per status code
(UNAUTHORIZED with/without `/review`+`/share`, FORBIDDEN, NOT_FOUND,
BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR). `npx vitest run` — 10/10 pass
(incl. `trpc-retry.test.ts`).

Not verified: runtime_check's live walk (Disconnect as EDITOR toasts,
`/review/<token>` UNAUTHORIZED stays put, Submissions delete confirm,
double-click Create-site network tab). No confirm added on domain/share-link
revoke or redirect delete — the ledger named API tokens explicitly; the
others weren't in my file ownership scan and are unverified as either
already-confirmed or still open.

## B-5 (UI half) + A-19 — fixed `987613982`

B-5 UI: `team/page.tsx`'s invite `onSuccess` now reads `emailFailed` from the
result (defensively cast — `(result as { emailFailed?: string[] })` — since
the AppRouter type won't carry the field until lane L1a-1's server change
merges) and shows a separate error toast naming the addresses whose email
failed, alongside the success toast when `sent > 0`. **The live path needs
L1a-1 merged** — until then, `team.service.inviteMembers` never returns
`emailFailed`, so this branch is dead code that will light up once the
contract lands. Mocked in the sense that the cast tolerates either shape;
no unit test written for this branch specifically (would need to mock
`trpc.team.invite`, and the server contract isn't stable yet under me).

A-19:
- `edit/[siteId]/page.tsx`: query string now folds into the `/auth/login`
  `next` redirect (was dropped entirely).
- `command-palette.tsx`: "Generate with AI" now links `?method=ai` (was
  `?ai=true`, which `initial-view.ts` never read — the wizard never opened).
- `team/page.tsx`: reads `?invite=true` to open the invite modal on load.
- `auth/invite/page.tsx`: `acceptInvite`'s `onSuccess` now calls next-auth's
  `update({ workspaceId })` before showing "You're in!" (server-side
  membership re-validated in `auth.config.ts`'s jwt callback already).
- `sites/[id]/layout.tsx`: "Site not found" got a "Back to sites" link.

Test: extended `edit/[siteId]/__tests__/page.test.tsx` with the
query-preserving redirect case. `npx vitest run` — 7/7 pass.

Not verified: runtime_check's live walk (deep-link round trip through login,
⌘K Invite/AI links, workspace switch after accepting an invite without using
the switcher). BLOCKED-ON-PD-22: A03-5 ("Edit in Editor" only in ⋯ More,
editor Exit destination) not touched.

## A-20 — rename "Mentions" filter — fixed `8d4a87a5a`

`notification-page.tsx`: tab label "Mentions" → "Account & billing" (filter
key stays `mentions` to avoid schema churn). Updated
`__tests__/notification-search-components.test.ts` (root-level, not in my
file ownership list, but it directly pins this component — updated per
lane-common's "change the pinning_tests in the same commit").

Out of scope (editor chrome / server services, not owned by L5):
`NotificationPanel.tsx`'s "was deleted" band, `actionUrl` additions to
`account.service.ts` / `stripe-webhook.service.ts`.

Test: `npx vitest run __tests__/notification-search-components.test.ts` — 5/5
pass.

## B-8 — InputField/SelectField label + useId — fixed `7a4676588`

`input-field.tsx` / `select-field.tsx`: optional `label` prop, `useId`-backed
`htmlFor`/`id`. Migrated `account-tab.tsx` (all 4 password fields, including
the two same-labeled "Current password" fields — pinned as resolving to
distinct inputs) and `settings-tab.tsx` (Social Links row wired manually,
since it needs the horizontal label-beside-field layout InputField's own
`label` doesn't produce; the generic `Field` helper now clones an id onto
its single form-control child).

**Not migrated**: the other ~74 dashboard label sites the ledger's grep
counted. Only the two explicitly named locations (account-tab, settings-tab)
were done — the "migrate the rest, ~40 files" instruction is NOT complete.

Test: `account-tab-labels.test.tsx` — `getByLabelText` for all 4 fields,
click-to-focus, and the same-label-distinct-input case.
`npx vitest run` — 2/2 pass. `npx tsc --noEmit -p packages/dashboard` — clean
(0 errors, same as baseline).

## A-12 (A12-7) — SEO error state + untouched-fields — fixed `43a767ed1`

`seo-tab.tsx` `TechnicalSeoSection`: added `settings.isError` → `ErrorState` +
retry branch; Save disabled while `!settings.data || settings.isLoading`;
`save()` now sends only fields whose local state is non-null (touched this
session) instead of all three unconditionally; `onSuccess` resets local
state to null.

**A-12's second item (webhooks → `/dashboard/settings/integrations`, editor
`SETTINGS_NAV` flip, `WebhooksScreen` deletion) is NOT done** — it requires
editing `packages/editor/src`, outside this lane's ownership.

Test: `seo-tab-technical.test.tsx` (mocked `trpc.siteDetail.settings`) —
error state, Save-disabled-while-loading, payload-only-touched-fields.
`npx vitest run` — 3/3 pass.

## B-16 — aria-current, skip link, real checkbox, menu Escape, aria-labels — fixed `46abad82c`

`sidebar.tsx`, `top-nav.tsx`: `aria-current="page"` on active links,
`aria-label="Primary"` on the nav landmarks. `dashboard-shell.tsx`: skip link
+ `id="main-content"`. `members-table.tsx`: selection checkbox was
`readOnly`+`pointer-events-none` — made real (`onChange`, `aria-label`, click
`stopPropagation` so it doesn't double-toggle via the row's own handler).
`context-menu.tsx`, `member-actions.tsx`: Escape closes + returns focus to
the trigger; `role="menu"` on the dropdown (did NOT add `role="menuitem"` on
the item buttons — that strips their implicit "button" role and broke the
existing `context-menu-restore.test.tsx`'s `getByRole("button", ...)`
queries; reverted that part). `bulk-action-bar.tsx`: `aria-label` on the
icon-only clear button (the action buttons already carry visible text).

**Not done** (owned by other lanes per file-ownership list):
`Toast.tsx` hover/focus pause (`packages/editor/src/editor/chrome-ui`),
`ChatThread.tsx` `role="log"` (editor AI tab), `#9CA3AF`→ink-soft swap,
`target-size.spec.ts` extension.

Tests: `context-menu-keyboard.test.tsx` (Escape+focus-return, both menus),
`members-table-checkbox.test.tsx` (Space toggles once, click doesn't
double-toggle). `npx vitest run` — 4/4 pass, plus reran
`context-menu-restore.test.tsx` (6/6 still pass).

## B-13 — dashboard hex ratchet — fixed `172b15ba4`

`ds-grep-gates.sh` D7: replaced the fixed pre-2026-05 allowlist
(`#E42313|#7A7A7A|...`, which missed `#1A56DB` and everything since) with
`#[0-9A-Fa-f]{3,8}\b` matched against a baseline ratchet (177, today's count,
may only go down) — same shape as the editor's Gate 16.

Verified live: `bash packages/dashboard/scripts/ds-grep-gates.sh` passes
(D7: 177/177); added a throwaway `#123456` to a test file, gate failed
(178 > 177), reverted, gate green again.

PD-32 (adopt axe/jsx-a11y) intentionally not touched — decision-free scope
only, per the brief.

## D-13 — staleTime, SSE backoff + stop-on-401, debounced search — fixed `3315d432f`

- `lib/trpc/client.tsx`: `defaultOptions.queries.staleTime = 30_000`.
- `lib/hooks/use-notification-sse.ts`: exponential backoff + jitter (base
  5s, cap 60s), reset on `open`, probes `/api/auth/session` before each
  reconnect and stops once there's no session.
- `lib/hooks/use-debounced-value.ts`: new shared hook. Applied to
  `media-library.tsx`, `projects/page.tsx` (both had ad hoc debounce logic
  already at slightly different shapes — now share this), and
  `templates/page.tsx` (had NO debounce — every keystroke fired a
  `router.replace` + fresh `templates.list` query; local input state now
  decouples typing from the URL/query update).

**Not done**: media library's "load more" → `useInfiniteQuery` cursor
switch (ledger's item 4) — larger refactor, out of scope for this pass.

Tests: `use-debounced-value.test.ts`, `use-notification-sse.test.ts` — both
at repo root (`lib/hooks/__tests__/`), so no `@testing-library/react`
(unresolvable outside `packages/dashboard`); hand-rolled a minimal
`react-dom/client` + `act` harness instead. Confirmed against the pre-fix
SSE code that 2 of 3 new cases fail for the right reason.
`npx vitest run lib/hooks/__tests__` — 5/5 pass.

## Verification run at the end of the lane

Mid-lane the controller imposed a resource rule (shared machine swapping,
load 400+): `--maxWorkers=2`, touched-files-only runs, tsc at most once at
the end, no full-suite runs. Earlier in the lane (before that rule landed) I
did run broader directory-level `vitest run` passes per fix as I went —
those are the per-fix counts noted above and were all green at the time.
The FINAL verification, done under the resource rule:

- `npx vitest run --maxWorkers=2 <all 13 touched test files>` — 13 files,
  47 tests, all pass (single combined run, not a full suite).
- `npx tsc --noEmit -p packages/dashboard` — run once at the end, clean
  (0 errors, matches the pre-lane baseline — no new errors).
- `bash packages/dashboard/scripts/ds-grep-gates.sh` — 7/7 gates pass (run
  twice: once green, once with a throwaway hex added to confirm the ratchet
  fails, then reverted).
- `pnpm test:db` — NOT run (no DB-tier test was needed for any of these
  fixes; all are UI/hook-level).
- `pnpm run verify:ds` (full) — NOT run as the single combined command,
  and not re-run after the resource rule given the "no full-suite runs"
  constraint. Recommend the controller run it before merge.

## What was NOT verified (live app)

None of the ledger `runtime_check` steps were walked in a running browser —
every verification above is unit/component-level (vitest + jsdom) or static
(tsc, grep-gate script). Specifically unwalked:
- B-6: typing in Share-draft/New-folder/API-token-create modals.
- B-4: Disconnect-as-EDITOR toast, `/review/<token>` staying put on
  UNAUTHORIZED, Submissions delete confirm, Create-site double-click network
  tab.
- A-19/B-5: deep-link round trip through login, ⌘K Invite/AI links,
  workspace switch after accepting an invite, failed-invite-email toast
  (this one can't be walked at all without L1a-1's server change merged).
- A-20: bell dropdown / notifications page tab label in the running app.
- B-8: Settings > Account "Current password" click-to-focus + DevTools
  accessibility-pane name, in the browser.
- A-12: error state on a blocked `settings.get`, Postgres column check
  after a single-field save.
- B-16: Undo-toast hover-persists-10s (not my scope — editor Toast.tsx),
  ⋯ menu Esc + focus-return, Team checkbox Space-select, aria-current in
  the accessibility tree.
- B-13: n/a (gate is static, verified above).
- D-13: repeat-navigation dedupe within 30s, single request while typing
  "hero", growing SSE reconnect intervals on a stopped dev server.

## Cross-lane edits

- `__tests__/notification-search-components.test.ts` (root `__tests__/`,
  not in my file-ownership list) — updated its label assertion in the same
  commit as A-20 since it directly pins `notification-page.tsx`.
- No edits to `packages/editor/src/**` or `server/**` — both are outside
  this lane's ownership; A-12's webhooks item, A-19's PD-22 item, and
  B-16's Toast/ChatThread items are left for their owning lanes.

## B-8 wave-2: remaining sibling-label sites (read-only grep, no code change)

Method: every `<label` in `packages/dashboard/**/*.tsx` (excluding `__tests__`)
without `htmlFor` in the same tag or the next 2 lines, then a heuristic check
of whether the label already WRAPS its control (implicitly associated, no fix
needed) vs. sits as a SIBLING next to it (needs `htmlFor`/`id`, same class of
bug as B-8). 69 raw hits, 5 flagged WRAPS (verify by eye — the heuristic can
misjudge a label that wraps something that isn't a form control), **64
SIBLING sites actually needing a fix**, close to the ledger's ~74 estimate
(the two B-8 already migrated, `account-tab.tsx`'s email-confirmation
password field, and `settings-tab.tsx`'s Social Links/`Field` sites are
excluded — those are done). Grouped by file, line is where `<label` starts:

- `app/auth/page.tsx:184`
- `app/auth/signup/page.tsx:224`
- `app/dashboard/marketplace/page.tsx:316`
- `app/dashboard/settings/integrations/vercel-team-picker/vercel-team-picker-form.tsx:33,48`
- `app/dashboard/settings/workspace/page.tsx:123`
- `app/dashboard/sites/new/page.tsx:106`
- `app/review/[token]/review-client.tsx:276` (line 272 flagged WRAPS — verify)
- `components/ai-wizard/step-pages.tsx:76` (line 65 flagged WRAPS — verify)
- `components/auth/auth-input.tsx:37`
- `components/billing/cancel-modal.tsx:94,112`
- `components/clients/client-detail-view.tsx:61,68,72` (line 82 flagged WRAPS — verify)
- `components/help/ticket-form.tsx:180,200,212,232`
- `components/onboarding/wizard/onb-field.tsx:19`
- `components/onboarding/wizard/onb-select.tsx:21`
- `components/publish/pre-publish-checks.tsx:64`
- `components/reviews/send-review-modal.tsx:66`
- `components/settings/api-tokens-tab.tsx:204,214,225` (line 217 flagged WRAPS — verify)
- `components/settings/danger-zone-tab.tsx:222,237`
- `components/settings/delete-workspace-modal.tsx:52`
- `components/settings/integrations-content.tsx:296`
- `components/settings/integrations-tab.tsx:114,159,171,218,235,268,280`
- `components/settings/profile-form.tsx:186,201,217,231,253,269`
- `components/settings/workspace-form.tsx:173,188,213,226,356`
- `components/site-detail/access-tab.tsx:132`
- `components/site-detail/redirects-tab.tsx:148,153` (line 123 flagged WRAPS — verify)
- `components/site-detail/seo-tab.tsx:162,195` (Canonical domain / robots.txt — the two fields B-8's error-state fix in `seo-tab.tsx` sits next to, but did not touch)
- `components/site-detail/share-draft-modal.tsx:110,121,137`
- `components/team/invite-modal.tsx:123,151,156,186,227,246`
- `components/templates/use-template-modal.tsx:184`

Most of these follow the same repeated shape (`className="block text-body
font-medium mb-1" style={{ color: "var(--color-text-primary)" }}` beside an
`InputField`/`SelectField`/native control) that B-8's `label=` prop already
solves mechanically — a wave-2 lane can likely batch these with the same
pattern used for `account-tab.tsx` in this lane's B-8 commit (`7a4676588`).
`integrations-tab.tsx` (7), `profile-form.tsx` (6), `invite-modal.tsx` (6),
and `workspace-form.tsx` (5) are the highest-value single-file batches.

## Real bugs found outside scope (not fixed)

- `settings-tab.tsx`'s `Field` helper (used by Site Name, Slug, Head/Body
  Code) had labels with no `htmlFor` at all before this pass — same B-8
  class of bug, just not in the ledger's two named locations. Fixed as part
  of B-8 anyway since it was adjacent and low-risk (see B-8 above).
