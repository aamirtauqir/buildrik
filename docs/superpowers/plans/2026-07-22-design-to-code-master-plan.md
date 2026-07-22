<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260722-211041.md -->
# Design→Code Master Plan — implement the 340-frame Figma into the product

> **For agentic workers:** this is the M5 program roadmap (ship-plan `2026-07-20-ship-plan.md` §M5).
> Each phase below is executed as its own detailed plan (superpowers:writing-plans) at phase
> start; this document is the scope/sequence/acceptance SSOT. Phase P0 is specced deepest —
> start there. Figma file `g4GzQFqzNYz5sosz1QtZXC` (audited + verified 2026-07-22, 340 frames,
> 21 flow starts). Spec SSOT: `docs/prd/editor/14-screen-specs.md` (banners current as of
> 2026-07-22) + `docs/designs/2026-07-19-system-contracts.md` (§2 now includes VIEWER) +
> `docs/designs/2026-07-21-code-truth-implementation-brief.md` (§4.1 decision log).

**Goal:** the running product matches the audited design — every drawn journey works in code, wedge-first.

**Architecture:** assembly against existing engine + routers. No new external deps. Editor chrome in `packages/editor/src/editor/**` (vibcoder DS, Emotion + tokens), server work only where a drawn flow lacks a procedure (rollback, notifications read, review revoke). Dashboard surfaces stay dashboard-owned.

**Tech stack:** React 18 + Vite (editor) · Next 16 + tRPC 11 + Prisma (dashboard/server) · Vitest.

## Global constraints

- Accent `#406ED6` only; tokens via `--bd-*` aliases; Gate 24 (no inline form elements), gate:ds-ssot, buildrick-baseline all stay green.
- Desktop-only. Rail order locked: `Insert · Layers · Pages · Media · Content · Brand`.
- Review/agency surfaces stay behind `agency_layer` flag (toggle exists in workspace settings).
- Contracts are behavior SSOT: §1 review state machine, §2 permissions (incl. VIEWER read-only), §3 Compare, §4 notifications, §5 rollback = new publish, never mutation.
- Decisions locked 2026-07-22 — do not reopen: client comments v1 = plain notes (pins fast-follow); J2 = edit-AI only (S2.1–S2.3 are onboarding-surface reference, NOT editor build targets); whole-site AI lives at onboarding.
- TDD per task; commit direct to `main` (solo workflow); codex review checkpoint at each phase end, iterate until 2 clean passes.
- ~~Prod deploy is P7 ONLY~~ **AMENDED at final gate (UC1 accepted 2026-07-22): P0.5 pilot deploy after P0+P2** — flag-gated wedge to prod (review schema migrations + CONCURRENTLY indexes + all unpushed fixes on `main`), `agency_layer` flipped for the pilot workspace only. P7 remains the final full deploy. Every phase plan re-greps its gap-table rows at phase start (ground truth decays under parallel work — cross-phase theme 1).

## Verified gap table (grep evidence 2026-07-22 — build against THIS, not assumptions)

| # | Surface | Verdict | Evidence |
|---|---|---|---|
| 1 | Versions/history panel | EXISTS | `sidebar/tabs/history/HistoryTab.tsx:104`, `panels/version-history/VersionList.tsx` |
| 2 | Issues panel | PARTIAL (DS-lint only) | `design-system/ui/DSLintBanner.tsx:5`, `useStudioState.ts:63` |
| 3 | Notifications bell (editor) | PARTIAL — **server DONE** (`notifications.ts` router: list/markRead/markAllRead/unreadCount/recent/listGrouped); editor bell UI missing; model lacks siteId/reviewId metadata | `shared/vibcoder/NotificationCenter.tsx`, `server/trpc/routers/notifications.ts` *(corrected by eng review — original row overclaimed)* |
| 4 | Compare view | PARTIAL (2 modes, version-diff not approved-vs-current) | `panels/version-history/CompareView.tsx:86` |
| 5 | Comment mode + threads (S5.3) | MISSING | no CommentMode/CommentPin/CommentThread in editor |
| 6 | Review panel (rounds/re-send/revoke) | MISSING | only approval banner + PublishDropdown states |
| 7 | Rollback UI (publish history) | MISSING | version restore ≠ publish rollback; no dashboard UI either |
| 8 | Recovery banner (C6) | MISSING | `engine/recovery/RecoveryManager.ts` unconsumed |
| 9 | Shell load-error screens (S1.5) | PARTIAL | `shell/hooks/useComposerInit.ts:211` session-expired prompt only |
| 10 | CmdK on CommandCenter registry | PARTIAL | `shell/modals/CommandPalette.tsx:41` hardcoded array |
| 11 | Data/CMS front-door | PARTIAL (inspector chip + modals, no rail presence) | `inspector/components/BindingPopover.tsx`, `shell/modals/CMSRecordsModal.tsx` |
| 12 | Brand-push UI | PARTIAL (dashboard ThemeManager; no push wiring) | `dashboard/components/theme/theme-manager.tsx` |
| 13 | Site settings surface | PARTIAL (drawer panel, not full page; no Publish-history/Export in snav) | `sidebar/tabs/settings/SettingsTab.tsx` |
| 14 | Forms inbox | EXISTS | `settings/screens/FormsScreen.tsx:2` |
| 15 | Publish deploy states | PARTIAL (review states only; no connect-vercel/publishing/live/failed modal) | `shell/PublishDropdown.tsx:17`, `usePublishJob.ts` |
| 16 | Onboarding checklist | EXISTS | `onboarding/OnboardingChecklist.tsx` |
| 17 | CmdK ai-offer / disabled-command | MISSING | `CommandPalette.tsx` |
| 18 | Ecommerce panel | PARTIAL (setup modal + blocks; no panel) | `ecommerce/CollectionSetupModal.tsx` |
| 19 | Media drill-ins | EXISTS (stock-browser name unconfirmed) | `AssetDetailsPanel.tsx`, `media/IconPickerModal.tsx`, `ReplaceAcrossModal.tsx:110` |
| 20 | Agency handover + shared-library pages | MISSING (theme/reviews/partner tabs exist) | `dashboard/app/dashboard/agency/(tabs)/theme/page.tsx` |

---

## P0 · J5 wedge close — editor-side review loop (gaps #5, #6)

The wedge's last product gap: the designer can send/see status (done: pill `e09fa3af`, send popover, stale gate `d9af4d05`) but cannot see or answer the client's comments, nor manage the round, without leaving the editor.

**Deliverables** *(re-specced by design review 2026-07-22 — thread-list-first; pins render only when coords exist)*
1. **Comment mode (S5.3)** — **thread-list-first** (v1 clients post plain notes → most comments have no coords). Canvas 💬 toggle enters comment mode with an explicit interaction contract: canvas editing disabled while active, cursor = comment, `Esc` exits, mode chip visible (Shell state 6 drawing). Slide-in thread list (verify `Comment row` primitive `17:40` in vibcoder before build) grouped per page; each row labels where it lives ("Home · pinned" / "General note"). Pins render ONLY for comments carrying coords (forward-compatible with pins fast-follow); §6.4 detached-pin handling moves to the pins fast-follow. Reply (`Comment.authorId` = user; composer disabled when review REVOKED, pending + failed-retry states), resolve/unresolve (optimistic w/ revert), show-resolved toggle. Thread→page jump: switches page, flashes the target, back-to-thread affordance keeps context. Client is EMAILED on reply and round-close (notification.trigger exists — wire, don't build).
2. **Review panel** — sidebar Review tab (below divider per cargo-sheets §6.5 — locked; gains an **unread-count badge** + active state so the wedge isn't invisible). The 12 drawn states, enumerated: open · all-resolved · detached-present *(pins fast-follow)* · resolved-expanded · older-round · empty · re-send-confirm · re-sending · revoke-confirm · revoked · review-closed · never-sent. Action hierarchy: **Re-send = primary slot**; **Revoke lives behind the ⋯ overflow + named confirm** (destructive isolation). Round N of M navigation; per-page comment groups.
3. Server work *(corrected by eng review — less than first claimed)*: **extend the EXISTING `comments.list`** (`comments.ts` — add `take` 200, newest-first, reviewer join) — do NOT create a duplicate `reviews.comments`; **wire `reviews.revoke` router onto the EXISTING `revokeReviewToken`** (`client-review.service.ts:84`) with a token-version guard (revoke-only-if-token-unchanged — kills the re-send/revoke race) + activity log; **server-side reject** `comments.create` against a REVOKED review (the disabled composer is UI only). Flat comment model v1 (no `parentId` — "threads" = page-grouped flat lists with per-comment resolve; stated honestly). Revoke stays EDITOR (round management belongs to the sender; the ADMIN-gated `reviews.resolve` is the separate internal-approval product). All flag-gated like `reviews.status`.
4. **Design-review acceptance rows (all P0 lists/actions):** every list has distinct loading · empty · **error+retry** (fetch-fail must NEVER render as empty — the fake-empty anti-pattern QA just purged in `343f560d`); every action has pending + failed states; keyboard: thread list arrow-navigable, focus returns to trigger on panel close (extend the `ab2fa513` Modal focus-trap pattern).

**Files:** create `editor/collaboration/comments/` (CommentMode.tsx, CommentPins.tsx, ThreadList.tsx) + `editor/sidebar/tabs/review/ReviewTab.tsx`; modify rail/tabsConfig **only** by adding Review at bottom below divider (cargo-sheets §6.5 — NOT in the locked 6-tab order); server `reviews.ts` + `review.service.ts`.

**Acceptance:** with flag on — client posts note on `/review/<token>` → designer sees pin/thread in editor, replies, resolves; re-send starts round 2 and S5.2 pill returns to pending; revoke kills the link (`INVALID` on open). Live-verified against dev DB. Vitest green; 2 clean codex passes.

## P1 · J6 publish truth (gaps #15, #7)

1. **Publish deploy states** — extend the **PublishDropdown popover** (single container — not a separate modal) with job-driven states from `usePublishJob`: connect-vercel (no connection → CTA deep-links to dashboard integrations with `?return=editor-publish`; on connect, dashboard bounces back and the popover re-checks), publishing (job running), live (URL + Visit/Copy per S6.1 frames), failed (error + retry). **Stacking rule:** while a job is in flight, deploy status is the primary content and the review pill is secondary; review states resume primacy when idle. Every transition keyboard-reachable; popover close returns focus to the Publish button.
2. **Rollback (contract §5)** — *(rewritten by eng review: the original premise was FALSE — `completePublish` NULLS the payload on success, `publish.service.ts:350`; no completed job is re-deployable today).* Server, in order: (a) **payload retention change**: add first-class `PublishBuildJob.payload Json?`; worker writes it; `completePublish`/`cancelPublish` STOP nulling it; prune to the 20 most recent successful publishes per site (implements contract §5's until-now-unimplemented cap), never pruning an approved version; (b) `sites.publishHistory` (explicit-select — NEVER returns payload/log to clients, copying `getPublishStatus` discipline); (c) `sites.rollback` = NEW publish of the stored payload, label "↩ from vN" where **vN = publish sequence number** (distinct vocabulary from document versions — each UI labels its own); ADMIN; failed publishes not targets; **explicitly bypasses the approval gate** (ADMIN restoring a previously-shipped version — activity-logged with prior-approver named); guarded by `publish_build_jobs_active_unique` (no rollback while a publish runs — drawn "publishing" state covers); (d) **stale-job reaper**: BUILDING > 15 min → FAILED (a dead worker currently wedges the unique slot and blocks all future publishes). **Accepted consequence: zero rollbackable history exists at launch** — history accrues from the retention change forward. UI: publish-history screen (settings snav — Site page S6.1 frames) with rollback pick→confirm (names: draft untouched · prior approver · new version)→publishing→done.

**Acceptance:** full publish lifecycle visible in editor; rollback re-deploys an old build as a new publish, history only grows; approval untouched by rollback. Live smoke on dev (sim path).

## P2 · Shell resilience (gaps #8, #9)

1. **C6 recovery banner** — shell banner consuming `RecoveryManager` (drawn 307:2223): "Restore unsaved work from {relative time} · {N} pages touched?" Restore/Discard; if the server copy is NEWER than the recovery snapshot, the banner says so and Restore becomes "Restore anyway". Shows once on reopen after crash.
2. **S1.5 load-error screens** — full-screen states: session-expired (→ dashboard auth), network-error (Retry), retrying (auto-retry w/ backoff); replace the bare prompt at `useComposerInit.ts:211`.

**Acceptance:** kill dev server mid-session → reload shows network-error → retrying → recovers; crash w/ unsaved → banner restores. Unit + manual smoke.

## P3 · Panels parity (gaps #3, #4, #2)

1. **Notifications** — server: `notifications.list/markRead` tRPC (reads existing `Notification` model, contracts §4 event set already produced by services); editor: topbar bell (32×32, accent dot, 9+) + 360w panel via existing `NotificationCenter` primitive. **Interaction grammar:** sort unread-first then newest; rows carry actor + event + relative time + source site ("why did I get this" metadata); clicking a row marks it read and jumps; "Mark all read" secondary in the panel header; panel close returns focus to the bell. States: unread · all-read · empty · loading · **error+retry (never fake-empty)** · jump-target-deleted (toast per drawn state).
2. **Compare per contract §3** — approved side = stored snapshot (instant), current = live render (per-side loading asymmetry); modes side-by-side/overlay/list; 5 change kinds rendered per §3 (content tint, style tint, added strip right, removed strip LEFT, moved connector) — **each kind ALSO carries an icon + text label in the list mode and a legend in visual modes; color is never the only encoding.** Snapshot-missing (older review w/o snapshotPages) → explicit "No approved snapshot for this round" state, not an error. Extend `CompareView.tsx`, feed from `ReviewRequest.snapshotPages` + current export.
3. **Issues panel** — graduate DSLint into an Issues sidebar panel (all/filtered/empty/fixing/fix-failed drawn states); v1 sources: DS-lint + broken internal links + missing alt (alt-text service exists). No new checker infra.

**Acceptance:** bell shows real events (approve on review page → designer bell within refetch); Compare renders a real approved-vs-current diff on a site with an approved round; issues list actionable.

## P4 · J3 secondary (gaps #10, #17, #11, #18, #19-tail)

1. **CommandCenter registry** — introduce `shared/commands/CommandCenter.ts` registry; migrate both hardcoded palettes; add ai-offer (no-results → "Ask AI" → opens AITab scoped) + disabled-command (reason tooltip, contracts §2 disabled-never-hidden) + recent (S3.14).
2. **Data front-door** — Content tab gains Data section (data-sources/variables/conditions drawn states) surfacing `useDataManager`/`BindingPopover` flows; no rail change.
3. **Ecommerce panel** — panel wrapping CollectionSetupModal flows (setup/sample-added/bound states).
4. Stock-browser: confirm by name; wire if loose.

**Acceptance:** ⌘K executes registry commands incl. AI offer; a data source is creatable + bindable without touching inspector chip first; ecommerce states walkable.

## P5 · Site surface graduation (gap #13)

Decision embedded in design (Site page, 46 frames): site settings = full page w/ "‹ Back to editor" + snav, not a 320px drawer. Graduate `SettingsTab` screens into a full-page editor route (same screens, page chrome per `22:2` shell): keep drawer as-is until parity, then flip; add **Publish history** (P1's screen) + **Export** into snav; Domains/Members/Billing stay dashboard deep-links. Saved-not-live banners stay on Redirects/Headers/Localization.

**Acceptance:** every snav row from the drawn shell reachable full-page; drawer retired without orphan CSS (check-buildrick gates green).

## P6 · Agency/Portfolio completion (gaps #12, #20)

1. **Handover page** (`/dashboard/agency/handover` — drawn list/expanded/all-clear/empty): per-site launch checklist rollup (domain, forms→Slack, approval, publish state — all queryable today).
2. **Shared library page** (`/dashboard/agency/library` — grid/empty/in-use-blocked-delete/renaming/loading): DESIGNER creates, ADMIN edits/deletes (contract §2), in-use assets block delete.
3. **Brand push wiring** — connect ThemeManager to `theme.capture/push` (ADMIN + flag): pick→diff→blast-radius→confirm→pushing→done/partial-failure/undo per Portfolio frames.

**Acceptance:** brand push round-trips on 2 dev sites with undo; handover reflects real site state; library CRUD respects roles (VIEWER read-only, DESIGNER create-only).

## P7 · Ship it (deploy)

Per `reference_cpanel_deploy_procedure` + founder decision (review schema rides this deploy):
1. `npm run env:check:prod` · 2. local standalone build (stop dev first — clobber trap) · 3. schema: `~/prisma-migrate/run.sh migrate deploy` (client_review_loop, review_invited_email, review_snapshot_pages, site_template_id) + manual psql partial indexes (`review_requests_pending_unique`, `publish_build_jobs_active_unique`) · 4. rsync→swap→kill-by-cwd→lsnode respawn · 5. smoke: login, editor load, send-for-review round-trip on prod, publish sim, BUILD_ID verify · 6. flip `agency_layer` for the pilot workspace only.

**Acceptance:** prod BUILD_ID new; review loop live end-to-end on pilot; no NPROC wedge; rollback plan = previous dir swap-back.

---

## Sequencing + sizing

| Phase | Size | Blocks | Why this order |
|---|---|---|---|
| P0 | L | e2e fixture fix (G5) | Wedge is the product bet; Gate C in-product; acceptance includes ONE REAL CLIENT posting one real comment (pilot agency named before P0 starts — T4) |
| P2 | S | — | Trust/resilience — rides with P0 into the pilot |
| **P0.5** | S | P0+P2 | **Pilot deploy (UC1): flag-gated wedge + schema + unpushed fixes to prod; pilot workspace flag on** |
| P1 | M+ | — | Publish truth; rollback (rewritten — retention change first) |
| P3 | M | P0 (snapshots) | Bell UI + Issues; Compare = separate L task |
| P4 | M | **pilot pull (UC2)** | Editor depth — order set by pilot feedback |
| P5 | M | P1 + env-bridge sweep + **pilot pull (UC2)** | Surface graduation |
| P6 | M | — | 2nd wedge + agency completeness (+ pagination/retention floors) |
| P7 | S | all | Final full deploy |

Out of scope (decided): S2.1–S2.3 editor-side · pins UI on client page (fast-follow after Gate C) · S4.5 Figma export (post-wedge build-or-cut, unresolved — the ONE deliberately open item, blocked on founder interest signal) · mobile editor (locked; mobile CLIENT REVIEW page raised as codex risk — see gate).

---

# AUTOPLAN REVIEW — Phase 1 (CEO) outputs · 2026-07-22

## Premise gate (user-confirmed)
All 5 premises confirmed + explicit mandate: **complete design implementation, full P0–P7**. Wedge-only alternative rejected by user.

## 0B What already exists (leverage map)
Verified-gap table above IS this map (20 rows, grep evidence). Additional verifications this review: `revokedAt` setter ABSENT server-side (P0 must add `reviews.revoke`); notifications = `createNotification`/`notifyWorkspaceOwner` only, no list/markRead readers (P3 adds them); **`PublishBuildJob.log Json?` is the actual deploy payload** (`workers/publish/[jobId]/route.ts:64-65`) — a payload living in a field named `log`.

## 0C Dream state
CURRENT: editor strong on build/media/brand; review loop backend-complete, editor-blind; publish opaque; agency layer flag-dark → THIS PLAN: every drawn journey works; wedge fully in-product; one prod deploy → 12-MO IDEAL: agencies run多-client delivery (templatize → review → publish → handover) with Buildrik as system of record. Plan moves toward ideal; the agency-leverage phase (P6) is the ideal's core — flagged by codex as possibly under-sequenced.

## 0C-bis Alternatives (auto-decided, logged)
A) Phased P0→P7 wedge-first (this plan) — Completeness 9/10 — CHOSEN (P1 completeness + risk order + user mandate).
B) Journey-order J1→J6 — 9/10 coverage but wedge lands late — rejected (P2).
C) Wedge-only sprint (P0+P7) — 4/10 — rejected by USER at premise gate.
Close-call A-vs-C on time-to-pilot resolved by user mandate; residual sequencing tension → User Challenge UC1 at final gate.

## CEO dual voices — consensus table
| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Premises valid? | P4 deploy-last wrong | P1 frame-parity=output-worship, P4 wrong | AGREE (both challenge P4) → UC1 |
| 2. Right problem? | Wedge yes, sequencing no | Wedge unproven, parity premature | PARTIAL — wedge confirmed, validation missing |
| 3. Scope calibration? | P4/P5 no pull | P4/P5 + parity polish burn quarters | AGREE → UC2 |
| 4. Alternatives explored? | deploy-after-P0 unargued | managed hosting, 48h-offer unexamined | AGREE — gap |
| 5. Competitive risk? | Webflow/Framer copyable; speed=edge | same + Relume/Wix Studio; mobile approval | AGREE + codex-only mobile flag → T3 |
| 6. 6-month trajectory? | deploy-last = regret | months vs imagined constraints | AGREE → UC1 |
CONFIRMED 1/6 · AGREE-against-plan 5/6 — models converge on SEQUENCING as the flaw, not scope.

## Section findings ledger (auto-decided per 6 principles; classification in Audit Trail)
- **A1 (Arch/Perf):** `reviews.comments` unbounded — add `take` limit (200) + newest-first; thread list virtualizes later. AUTO-FIX → P0.
- **A2 (Arch, both voices):** rollback must not read `job.log.pages` as source of truth — P1 now includes promoting the payload: migration renames/adds `PublishBuildJob.payload Json` (worker writes both during transition), rollback reads `payload` only. AUTO-FIX → P1.
- **G1 (Errors):** rollback target with empty/missing payload → `NOT_ROLLBACKABLE` (specific error, drawn "failed" state covers UI). AUTO-FIX → P1.
- **G2 (Errors):** reply-to-closed-round → allowed (comments outlive rounds; contract §6.4 keeps resolved visible), but composer disabled when review REVOKED. AUTO-DECIDE → P0.
- **G3 (Errors):** re-send revokes old token while client mid-session → client's next action gets `INVALID` → S5.5 expired-token screen (drawn ✓). Named in P0 acceptance. AUTO-FIX.
- **G4 (Security):** client comment bodies render TEXT-ONLY in editor thread list (no HTML path) — same rule as review page. AUTO-FIX → P0. P0 acceptance also references TODOS.md token-surface audit item.
- **G5 (Tests):** e2e fixture collision (qa@buildrik.local shared by auth+onboarding setups, 81 tests silently skip; BrowserStack env divert) MUST land before any P0 e2e claim. New dependency: P0 depends on open-issues Item 1. AUTO-ADD.
- **G6 (Observability):** `reviews.revoke` + `sites.rollback` get activity-log records (`recordForSite`, mirrors unpublish). AUTO-FIX → P0/P1.
- **G7 (Perf):** snapshotPages JSONB rows are full-HTML-per-page; rollback payload same class. Guard: publish-history keeps 20 (contract §5) and Compare lazy-renders sides. Noted; no new infra.
- **D1 (DRY, taste-adjacent):** editor Publish-history screen (P1/P5) coexists with dashboard `sites/[id]/publish` page — same tRPC, two shells. Accepted per design SSOT + user completeness mandate; documented as intentional duplication of VIEW not logic.
- **Q1 (Quality):** comment components go in `editor/collaboration/comments/` — existing `editor/collaboration/` domain, matches folder ownership rules. No new top-level dirs. CONFIRMED clean.
- Sections with no further findings after analysis: S7 (no N+1 — all list procs site-scoped single queries), S10 (reversibility 4/5 — flag-gated, additive; debt named: PageWizard deletion, payload rename), S11 (covered by the 2026-07-22 Figma audit — states/IA verified; /plan-design-review runs next as autoplan Phase 2).

## Error & Rescue Registry (new codepaths)
| Codepath | Failure | Exception | Rescued? | User sees |
|---|---|---|---|---|
| comments.list (extended) | flag off | — returns [] | Y | empty thread list (drawn) |
| comments.list (extended) | not EDITOR | FORBIDDEN | Y | permission toast |
| comments.list (extended) | fetch fail | error state + Retry | Y | error row, NEVER fake-empty |
| comments.create | review REVOKED | REVIEW_REVOKED (server-side) | Y | composer disabled + reason |
| reviews.revoke | already resolved | INVALID_STATE | Y | "Round already closed" |
| reviews.revoke | already revoked | idempotent no-op | Y | revoked state (drawn) |
| comment reply | review revoked | COMPOSER_DISABLED (client-side) | Y | disabled composer + reason |
| sites.rollback | payload missing | NOT_ROLLBACKABLE | Y | "This publish can't be rolled back" (drawn failed) |
| sites.rollback | not ADMIN | FORBIDDEN | Y | role-reason tooltip (disabled-never-hidden) |
| publish poll | job stuck | timeout → failed state | Y | failed + retry (drawn) |
| notifications.list | fetch fail | error state + Retry | Y | error row, NEVER fake-empty *(row corrected — was self-violating DF5)* |
| rollback during running publish | active-unique 409 | PUBLISH_IN_PROGRESS | Y | "A publish is running" (drawn publishing) |
| stuck BUILDING job | reaper → FAILED after 15min | — | Y | failed + retry (drawn) |

## Failure Modes Registry
| Codepath | Failure mode | Rescued | Test | User sees | Logged |
|---|---|---|---|---|---|
| revoke-while-client-open | token INVALID mid-session | Y | e2e | expired-link screen | Y (activity) |
| re-send during publish | two live states | Y (states independent) | unit | pill + publish states | Y |
| rollback of failed job | blocked | Y | unit | not-rollbackable | Y |
| orphan pins (element deleted) | detached pins | Y (§6.4 flow) | RTL | Orphan comments banner (drawn) | n/a |
NO CRITICAL GAPS (all rows rescued+tested+visible).

## NOT in scope (unchanged + additions)
S2.1–S2.3 editor-side · client-page pins (fast-follow) · S4.5 Figma export (open) · mobile EDITOR (locked) · comment threads on dashboard site-detail (editor is the surface) · managed-hosting alternative (codex; contradicts BYO-Vercel founder decision — recorded, not adopted).

## Dream state delta
After P7: product = design (340 frames live), wedge provable with real clients, agency layer flippable per workspace. Remaining to ideal: pins UI, S4.5 decision, template economics (P6 seeds it).

# AUTOPLAN REVIEW — Phase 3 (Eng) outputs · 2026-07-22

## Eng dual voices — consensus table
| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Architecture sound? | Yes, minus payload model | Yes, minus notification metadata + env bridge | CONFIRMED w/ fixes |
| 2. Test coverage sufficient? | No — payload regression, cross-origin smoke, fixtures | No — CI e2e floor never touches /edit | AGREE → tasks E7-E9 |
| 3. Performance risks? | (not raised) | snapshotPages unbounded; unpaginated feeds; bundle budget | CODEX-LED → E10-E12 |
| 4. Security threats? | publishHistory payload leak; IDOR clean | asset-upload origin-pin gap | AGREE → E13 + TODOS |
| 5. Error paths handled? | Registry self-contradiction; server-side revoke reject | (fed as prior) | CONFIRMED → fixed |
| 6. Deployment risk? | (deferred to CEO UC1) | P7 indexes lack CONCURRENTLY → write locks | CODEX-LED → E14 |
Note: codex output findings 1–2 lost to output capture (tail cut); 8 of ~10 captured. Both voices independently invalidated parts of the gap table — the table now carries corrections inline.

## Eng corrections applied to phases (beyond P0/P1 inline rewrites)
- **P3 scope shrunk + resized:** notifications server = DONE (routers exist); remaining = editor bell UI + `Notification` schema delta (add `siteId`/`actionUrl` metadata + trigger updates for "why did I get this"). **Compare splits out as its own L-sized task**: sandboxed-iframe rendering (same discipline as M2 review page — this week's XSS arc applies), HTML structural diff infra for the 5 change kinds, ExportEngine-generated test fixtures (never hand-built payloads — the Stripe lesson).
- **P4/P5 prerequisite:** `import.meta.env` direct reads persist in `SettingsTab.tsx:102`, `LockedScreen.tsx:57`, `errorTracking.ts:34` — sweep to the `runtimeEnv` bridge BEFORE P5 route graduation (known unified-editor trap, previously believed closed). Add a bundle-budget gate (analyzer + threshold) to editor CI — new surfaces ship through `transpilePackages` into the dashboard bundle.
- **P6 scale floor:** paginate `listReviews` + workspace comment feeds (currently unbounded full-table newest-first); snapshotPages retention rule = keep latest round per review + all approved rounds, prune superseded (unbounded full-HTML rows otherwise).
- **P7 correction:** the manual psql index step MUST use `CREATE UNIQUE INDEX CONCURRENTLY` (plain CREATE takes write locks; CONCURRENTLY is why it stays a psql step — it can't run inside prisma-migrate's transaction).
- **New cross-cutting tests (E7-E9):** payload-survives-`completePublish` regression · cross-origin cookie smoke for every new proc from the editor origin (`credentials:"include"` + `EDITOR_ORIGIN` CORS) · one `/edit` review-loop Playwright spec as the editor e2e floor (depends on G5 fixture fix).
- **Security follow-ups:** `publishHistory` explicit-select (in P1 spec) · asset-upload origin-pin → appended to the existing TODOS.md token-surface audit item.

# AUTOPLAN REVIEW — Phase 2 (Design) outputs · 2026-07-22

Mockups skipped (decision #11): the audited Figma file is the visual SSOT. Both voices ran.

## Design dual voices — litmus scorecard
| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Info hierarchy serves user? | Review-tab visibility weak | Same + wants rail slot | AGREE → badge added; placement stays locked (#18) |
| 2. Interaction states specified? | 7 gaps + fake-empty | +optimistic/transitional gaps | AGREE → DF5/DF6 applied |
| 3. User journey coherent? | Designer blind (no awareness), client arc silent | Connect-Vercel eject, cross-page threads | AGREE → DF2/DF3/DF12/DF15 applied |
| 4. Specificity vs hand-wave? | "12 states" hand-wave | Comment-mode contract missing | AGREE → states enumerated, contract written |
| 5. Accessibility? | (not raised) | Keyboard/focus debt, color-only Compare | CODEX-LED → DF10/DF11 applied |
| 6. Plan self-consistency? | P0 pins contradiction (CRITICAL) | (fed as prior) | CONFIRMED → DF1 respec |
| 7. DS alignment? | primitives unverified | state tokens underspecified | PARTIAL → verify `Comment row 17:40` pre-P0; M4 hover/pressed tokens already exist, semantic tints in `Primitives` |
Pass scores (post-fix): IA 9 · States 9 · Journey 8 · Slop 9 (DS+gates enforced) · DS-align 9 · Responsive/a11y 8 (desktop-only locked; keyboard rows added) · Unresolved 9 (vocab + parity defined, #23/#24).
26 findings total → 15 fixed in plan, 2 locked-decision tensions surfaced (#18 rail slot, T3 mobile review page), rest logged.

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| 1 | 0 | DX scope = NO despite API-term matches | Mechanical | P3 | tRPC mentions are internal plumbing; product is end-user SaaS, no dev-facing surface in plan | DX phase |
| 2 | 0C-bis | Approach A (phased wedge-first) | Taste→user-resolved | P1,P2 | User completeness mandate at premise gate | B journey-order, C wedge-only |
| 3 | 1-A1 | Cap reviews.comments at 200 newest | Mechanical | P5 | Unbounded list = perf + render risk | unbounded |
| 4 | 1-A2 | Promote publish payload to first-class column | Mechanical (both voices) | P5 | log-named payload breaks silently on shape change | keep job.log reads |
| 5 | 1-G2 | Replies allowed post-round; composer disabled when REVOKED | Mechanical | P1 | Comments outlive rounds per §6.4 | lock all closed rounds |
| 6 | 1-G4 | Comment bodies text-only render | Mechanical | P1 | XSS surface parity with review page | rich text v1 |
| 7 | 1-G5 | P0 depends on e2e fixture-collision fix | Mechanical | P1 | 81 tests silently skip today; e2e claims would be false | ignore |
| 8 | 1-D1 | Editor publish-history coexists w/ dashboard page | Taste (auto, surfaced) | P3 | Design SSOT + user mandate; same tRPC, view-only duplication | link-out only |
| 9 | 1 | Managed-hosting alternative recorded, not adopted | Mechanical | P6 | Contradicts BYO-Vercel founder decision on record | reopen hosting model |
| 10 | 1 | Mobile client-review risk → gate item T3 | Taste (locked-decision tension) | — | Codex-only flag vs locked desktop-only decision | silent drop |
| 11 | 2 | Skip AI mockup generation | Mechanical | P3,P4 | 340 audited Figma frames ARE the visual reference | $D variants |
| 12 | 2-DF1 | P0 respec: thread-list-first, pins coord-conditional, §6.4→fast-follow | Mechanical (CRITICAL fix) | P5 | v1 plain-notes decision left pins data-less; plan contradicted itself | pins-first spec |
| 13 | 2-DF2 | Review tab unread badge in P0 (bell stays P3) | Mechanical | P1 | Wedge awareness can't wait for P3 | designer polls blindly |
| 14 | 2-DF3 | Client emailed on reply/round-close (wire existing trigger) | Mechanical | P1 | Client arc ended in silence | silent resolve |
| 15 | 2-DF5 | Error ≠ empty on every new list (+retry) | Mechanical | P1 | Fake-empty anti-pattern (QA arc just purged it) | [] on fetch-fail |
| 16 | 2-DF7 | Publish stacking rule: deploy status primary while job live | Mechanical | P5 | Two state families in one control need precedence | unspecified |
| 17 | 2-DF8 | Revoke behind overflow + confirm; Re-send primary | Mechanical | P1 | Destructive isolation | adjacent buttons |
| 18 | 2-codex#1 | Review tab STAYS below divider (locked §6.5) + badge | Taste (locked, surfaced) | — | Codex wanted first-class rail slot; founder locked 6-tab order | rail reorder |
| 19 | 2-codex#6 | Compare change-kinds get icon+label, not color-only | Mechanical | P1 | Low-vision users can't parse tint-only encodings | color-only |
| 20 | 2-codex#10 | Connect-Vercel round-trip: `?return=editor-publish` + success handback | Mechanical | P1 | Eject-with-no-return breaks the publish journey | one-way eject |
| 21 | 2-codex#12 | Recovery banner shows timestamp + page count + newer-server warning | Mechanical | P1 | "Restore?" without evidence is a trust gamble | binary banner |
| 22 | 2-codex#14 | Flag-off agency surfaces = absent (feature-gate), role denials = disabled-never-hidden; distinction documented | Mechanical | P5 | Contract §2 rule is about ROLES, not un-enabled features | locked-state screens |
| 23 | 2 | Rollback version vocabulary: "vN" = publish sequence (Publish history), distinct from document versions (Versions panel); both UIs label their own | Mechanical | P5 | Two version vocabularies would collide | shared numbering |
| 24 | 2 | P5 parity definition: flip drawer→full-page when all 13 snav rows render + savebars work full-page; decider = founder eyeball on dev | Mechanical | P5 | "Until parity" had no definition | undefined flip |
| 25 | 3 | Rollback rewritten on payload-retention truth; zero history at launch accepted | Mechanical (CRITICAL fix) | P5 | completePublish nulls payload — premise was false | dual-write only |
| 26 | 3 | Reuse comments.list + wire revoke onto existing service fn | Mechanical | P4 | 3 "missing" servers already exist; duplicate procs banned by repo SSOT | new reviews.comments |
| 27 | 3 | ADMIN rollback bypasses approval gate, activity-logged | Mechanical | P1 | Gate would block rollback exactly when needed | acknowledgeStale dance |
| 28 | 3 | Stale-job reaper (BUILDING>15min→FAILED) | Mechanical | P1 | Dead worker wedges the unique slot, blocks all publishes | manual unwedge |
| 29 | 3 | Compare split to own L task w/ sandboxed iframes + fixtures | Mechanical | P5 | No HTML diff infra exists; XSS discipline mandatory | "M" inside P3 |
| 30 | 3 | env-bridge sweep + bundle-budget gate before P5 | Mechanical | P1 | import.meta.env trap open in 3 files; no bundle ceiling | discover at P5 |
| 31 | 3 | P7 indexes via CONCURRENTLY in the psql step | Mechanical | P1 | Plain CREATE takes write locks on live tables | locked deploy |
| 32 | 3 | Revoke stays EDITOR (vs ADMIN resolve) — sender manages their round | Taste (auto, surfaced) | P3 | resolve is the separate internal-approval product | align to ADMIN |

## Cross-phase themes
1. **Ground truth decays under parallel work.** CEO voices flagged assumption risk; Eng found 3 "missing" servers already built and one false payload premise — all drifted between morning grep and evening review while a parallel QA session landed 8 commits. Standing rule now in Global Constraints: every phase plan re-greps its rows at phase start.
2. **Deploy-late compounds risk** (CEO both voices + Eng's lock-taking indexes + schema drift). Resolution belongs to UC1 at the gate.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open (via /autoplan) | 3 proposals, 0 accepted pending gate, 1 deferred; consensus 1/6 |
| Codex Review | `/codex review` | Independent 2nd opinion | 3 voices | ran (via /autoplan) | CEO 12 · Design 15 · Eng ~10 concerns |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean (via /autoplan) | 17 issues, 0 critical gaps after fixes |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean (via /autoplan) | score 6/10 → 9/10, 16 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | skipped | no developer-facing scope |

- **CODEX:** all 3 phase voices ran; highest-value: rollback payload falsity (with subagent), env-bridge trap open, CONCURRENTLY indexes, mobile-approval risk.
- **CROSS-MODEL:** CEO phase converged 5/6 AGAINST the plan's sequencing (→ UC1); Design converged 6/7 on state/awareness gaps (all fixed); Eng split codex-infra vs subagent-correctness, zero contradictions between them.
- **VERDICT:** CEO + DESIGN + ENG CLEARED — approved at the final gate 2026-07-22 (option A: both User Challenges accepted). Ready to implement phase-by-phase, P0 first.
- **Gate resolutions:** UC1 ACCEPTED → P0.5 pilot deploy inserted. UC2 ACCEPTED → P4/P5 pull-ordered (still built — completeness mandate stands). T4 folded into P0 acceptance (pilot agency named first). T3 mobile review page: locked decision STANDS (user did not reopen; risk stays on record). #18 rail placement + #32 revoke-EDITOR stand as decided.

NO UNRESOLVED DECISIONS
