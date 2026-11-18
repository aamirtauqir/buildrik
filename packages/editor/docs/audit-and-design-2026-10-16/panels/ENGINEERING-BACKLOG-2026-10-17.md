# Engineering backlog — panels 00, 07–25 (FD-ENG-01)

Engineering backlog derived from SPEC COMPLETE panel docs · not VERIFIED · 2026-10-17

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DOCS ONLY (no code or other doc edited).

**Sources read:** `00-SHARED-CONTRACTS.md` (SC-9 register incl. ⛔ rows, SC-20, SC-21, SC-22); the "Code defects" and "Engineering dependencies" sections of panels 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25; panels 07, 08, 10 (no defect section, so their §5–§8 contracts, current-implementation tables and acceptance were used); `REVIEW-2026-10-17-pro-product-design.md` Critical C-1…C-5. Panel 20 (AI) is DEFERRED by SC-21 and is listed in Appendix A, except the AI-D1 site-role check (BK-001).

**Rules applied**
- Evidence (`file:line`) is copied from the panel that cites it. It was not re-derived or re-read.
- "Done" quotes the panel's acceptance T-ids. Where a panel has no T-id for the item, the done line paraphrases the panel's own contract and says *(no T-id)*.
- **SC-21:** no ticket builds AI UI. AI backend stays. AI-only defects go to Appendix A.
- **Guard first:** where a ⛔ row names a mandatory interim guard, the guard is its own smaller ticket, placed earlier, and the full dependency depends on it.
- Size: S ≤ 2 days · M ≤ 1 week · L > 1 week. These are guesses from reading the specs, not estimates.
- Priority: **P0** security / data loss · **P1** release-blocking ⛔ dependencies (plus one owner-decided safety item) · **P2** correctness bugs · **P3** non-blocking dependencies and polish.

**Counts:** P0 20 · P1 25 · P2 65 · P3 64 · **total 174** · Appendix A (deferred with AI) 16 items.

---

## De-duplication map (one ticket, several sources)

| Ticket | Same item under these names |
|---|---|
| BK-021 effective-plan resolver | SC-20 ⛔ P-TRIAL · 23 TR-2 · 25 A-10 · 20 AI-D1 (plan half) · 18 P-TRIAL (T-CP-07) · 15 §11-7 · 23 §13-1, §13-2 · 20 §13-2 |
| BK-112 stable release numbers | 14 P-4 · SC-9 "Publish job ids for Compare vN-1 → vN" · 14 §13-8 |
| BK-118 actor on publish jobs | 14 P-8 · 25 A-5 · 25 D-5 |
| BK-045 failed step recorded | 14 §13-2 · 25 A-13 |
| BK-039 event pipeline | 25 A-1 · 16 F-1 · 17 R-10 |
| BK-109 receipt registry | SC-9 row 1 · 22 G-11 |
| BK-110 library query | SC-9 "Library revisions" · 18 K-4 |
| BK-087 Sentry init | 22 G-8 · 22 §13-8 · 25 D-4 |
| BK-052 template apply ends onboarding | 15 §11-4 · 16 §11-5 |
| BK-068 Clear history confirm | 18 §13-14 · 24 §13-5 · 18 K-8 fallback · 24 E-5 |
| BK-099 Replace across site all-or-none | 08 §6 · 24 §13-10 · SC-9 last row |
| BK-106 CMS record "Undo restores it" | 07 §5 · 24 §13-2 |
| BK-064 REVIEW_LINK_REQUESTED | 17 §13-11 · 22 §13-13 · part of 22 G-7 |
| BK-098 unrecorded bind/unbind | 24 U-3 · 24 §13-6 |
| BK-027 settings revision stamp | SC-9 ⛔ "Settings revision stamp" · SC-9 last row "Settings conflict" · REVIEW C-2 |
| BK-024 FI-03 persistence | SC-9 ⛔ FI-03 / P1-D18 · 14 "⛔ (Panel 08)" row · REVIEW C-1 |
| BK-025 / BK-026 CMS tombstones | SC-9 ⛔ rows · REVIEW C-4 / C-5 · 24 §11 "existing rows" · 24 §13-8 |
| BK-003 collab joiner replay | 21 ⛔ MP-5 · 21 §13-1, §13-6, §13-15 |

---

## P0 — Security and data loss (20)

| ID | Title | Source | Evidence (as cited) | Done when | Interim guard | Size | Depends on |
|---|---|---|---|---|---|---|---|
| BK-001 | AI routes: server resolves the caller's role on the site from `siteId` and refuses below EDITOR **before** reserving quota | 20 ⛔ AI-D1 (role half); 20 §13-1; SC-9 ⛔ AI-D1. Stays in the main list: SC-21 hides the AI UI, but the routes are still live | `ai.ts:199-490` (site-agnostic, no `siteId`); `AIPanel.tsx:51-96`, `useVersionHistory.ts:147-151` (viewer AI summary written to the version) | T-AI-09 server half: a direct `ai.streamPrompt` call with a viewer's session and that `siteId` is refused before any quota is reserved | This ticket *is* the mandatory interim guard. The plan half folds into BK-021 | M | — |
| BK-002 | Recovery copy offered only to its own user | 22 ⛔ G-12 interim guard; 22 §13-16 | `unsavedRecovery.ts:23-27` (key not user-scoped) | T-GS-26: B never sees "Restore my edits" for A's copy; explicit Sign out offers Download, then clears A's copy | userId stored inside the payload; ignored for others; cleared on Sign out after the Download offer | S | — |
| BK-003 | Collab joiner replays the retained log and imports whole projects | 21 ⛔ MP-5; 21 §13-1, §13-6, §13-15 | `CollaborationManager.ts:163-169,726-738,744-761`; `SSETransport.ts:46-54` (hello head dropped, `lastSeq = 0`), `:42`, `:46-75`; `collab.service.ts:10,92`; sse route `:21,76,81,105` | T-CO-03 (joining with 24 h of ops changes no canvas or undo stack), T-CO-12, T-CO-13 | Existing guard: `NEXT_PUBLIC_FEATURE_COLLAB` stays off in production (`gate:baked-flags`). Phase A cannot ship without this | L | — |
| BK-004 | Approval staleness measured from the round, not the approval time | 17 ⛔ R-11 interim guard; 17 §13-14; 14 §4.3 section 4 | `publish-approval.ts:58-64`, `CRS:221-225` | T-CR-10 (guard variant): an edit after send and before approval shows "Approved · edited since" and Publish shows stale | Compare the last edit with the round's existing `createdAt` (not `updatedAt`). May over-warn after a same-round re-send | S | — |
| BK-005 | Revoking the latest round lets an older internal APPROVED round clear the publish gate | 17 R-14; 17 §13-13 | `RS:134-139` (supersede revokes only rows with a token), `RS:245-251`, `publish.service.ts:447-451` | T-CR-12: revoking the latest round gives chip Not sent/Review; with approval required, Publish says "no review sent" | — | M | — |
| BK-006 | ⌘Z outside Editor/Brand never changes the document | 24 ⛔ U-1 interim guard; 24 §13-1; SC-9 ⛔ U-1 | `useEditorShortcuts.ts:91-208` | T-UN-01, T-UN-03; palette Undo/Redo follow the same rule (24 §4.3) | Outside Editor and Brand, document Undo/Redo is blocked; status "Nothing to undo here — Open Editor to undo" | S | — |
| BK-007 | Unregistered local image cannot be lost silently on save or exit | 08 §5 FI-03 interim guard; REVIEW C-1; SC-9 ⛔ FI-03 | `BuildrikSyncProvider.ts:830-840` (`blob:` stripped on save) | *(no T-id; T-AS-04 BLOCKED)* Bottom status "Image not uploaded yet — Retry" (Save failed tier); exit/close blocks with "1 image isn't saved yet — Retry upload / Remove image / Stay"; save never strips the reference without the prompt | This ticket is the guard | M | — |
| BK-008 | CMS field delete and type change refused while any record holds a value | 07 §6 C-4 fallback; SC-9 ⛔ field tombstone row; REVIEW C-4 | Protection today covers bindings only: `FieldInspector.tsx:6`, `DeleteFieldDialog.tsx:58-69,63`, `fieldUsage.ts` | T-UN-10 "before the tombstone ships: delete refused while values exist"; type change refused the same way *(SC-9 fallback text)* | This ticket is the guard. Needs a server count of records with a value | M | — |
| BK-009 | CMS collection delete blocked while bound; confirm says "Deleted collections can't be restored from the editor yet" (the data is kept on the server) | 07 §8 C-5 fallback; SC-9 ⛔ collection row; REVIEW C-5 | `CollectionSettingsPane.tsx:93-96` (no recovery toast) | *(no T-id)* Preflight lists bindings, lists, conditions and dynamic pages; delete is refused while any exist (07 §8) | This ticket is the guard | S | — |
| BK-010 | Site settings Save re-reads and compares before writing | 10 §5 C-2 layer 1; REVIEW C-2; SC-9 ⛔ settings row | ST-05 "no conflict state; no saving label" | T-ST-04b; T-CO-15 flag-off half: "Changed elsewhere — Review" with the theirs/yours list; never "All changes saved" before the server ack | This ticket is the guard. It does not depend on the collab flag | M | — |
| BK-011 | Password protection: "Your site stays public until you publish" | 10 §7 Access; REVIEW C-3 | 10 §7 (applies on next publish today) | *(no T-id)* Inline warning + Publish now under the toggle; Overview › Needs attention lists "Password protection saved — not live yet"; mirror copy when turning it off | Interim until BK-043 | S | — |
| BK-012 | A protected site is never published as public on Free | 23 ⛔ TR-7; SC-20 Blocking row; 14 §5.2 row; 23 §13-4 | `route.ts:319-321` (worker applies the password on any plan) | T-PL-08 (`PASSWORD_ON_FREE` refused server-side), T-PL-23 | No trial ships without this (SC-20 fallback = plans as today) | M | BK-021 |
| BK-013 | Reduced motion respected by the published runtime and exported CSS | 19 ⛔ IXD-4 interim guard; 19 §13-4 | `interactionRuntime.ts:200-209`, `ExportEngine.ts:351-357`; pattern `sliderRuntime.ts:78-79` | T-IX-22: `animation-name: none`, no WAAPI animations under reduced motion | Runtime no-op under one `matchMedia` check + emitted `@media (prefers-reduced-motion: reduce){[style*="bd-anim-"]{animation:none!important}}` | S | — |
| BK-014 | A plan downgrade never prunes existing asset versions | 23 TR-8; 23 §13-5 | `media.service.ts:517-518` vs `billing.service.ts:269-274` | T-PL-16 | Before replace on Free: "Free keeps 5 versions — the oldest will be removed" (TR-8 fallback) | S | — |
| BK-015 | Asset delete says it becomes permanent after 8 s | 24 U-4 fallback; 24 §13-4 | `media.service.ts:401`, `MediaCommandLayer.ts:68` | T-UN-13 "before U-4": confirm states "After 8 seconds this can't be undone" | This ticket is the guard for BK-126 | S | — |
| BK-016 | Autosave 401 keeps a recovery copy | 22 §13-3 | `useComposerInit.ts:818-830` vs `useSaveCallback.ts:355-365` | T-GS-04: close the tab and reopen → "Restore my edits" on both paths | — | S | BK-002 |
| BK-017 | Conflict "Save a backup" never reloads when the backup fails | 22 §13-5 | `AquibraStudio.tsx:818-830` (reload in `finally`) | T-GS-10: a forced backup failure keeps the dialog, the conflict and the local copy, with Retry / Cancel | — | S | — |
| BK-018 | `/review/*` sends `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex` | 17 R-9; 17 §13-9 | `next.config.mjs:122-132` | T-CR-21 | — | S | — |
| BK-174 | `NEXT_PUBLIC_FEATURE_AI` (default off) hides AI-01…AI-14 incl. dashboard wizard AI path; root CLAUDE.md env row same commit | SC-21; 20 §0 | — | T-AI-00 | — | S | — |
| BK-019 | Hidden AI fires no background requests (auto alt text, milestone names) | SC-21; 20 §0 | `useAltTextAutoTrigger.ts:47-73`, `useAutoMilestone.ts:11-14` | T-AI-00 network half | Use the existing flags/config. No backend removal | S | BK-174 |

## P1 — Release-blocking ⛔ dependencies (25)

| ID | Title | Source | Evidence | Done when | Guard ticket | Size | Depends on |
|---|---|---|---|---|---|---|---|
| BK-020 | `Workspace.trialEndsAt` on both create paths, launch-day backfill, one trial per owner per 12 months | 23 ⛔ TR-1; SC-20 | `server/services/subscription-status.ts:1-23` (no app trial) | T-PL-01, T-PL-25 | — (fallback: no trial) | M | — |
| BK-021 | One effective-plan resolver for every gate, the badge, Billing and quotas (keyed to the site's workspace) + `hasPaid` | 23 ⛔ TR-2 = SC-20 P-TRIAL = 25 A-10 = 20 AI-D1 plan half; 23 §13-1, §13-2; 15 §11-7 | `route.ts:326` (badge reads `ws.plan`); `billing.service.ts:64` vs `site-quota.ts:39`; `quota.service.ts:48-55`; `media.service.ts:49-55,597-600` | T-PL-02, T-PL-03 (unit test per call site), T-PL-15, T-PL-26; unblocks T-CP-07, T-TP-13 | — | L | BK-020 |
| BK-022 | Stripe: Checkout during the trial sets `trial_end`; webhook stores TRIALING; reconcile skipped when nothing was ever paid | 23 ⛔ TR-6; 23 §13-6, §13-18 | `stripe-webhook.service.ts:116` (hard-coded ACTIVE), `:245`; `billing-downgrade/route.ts:45` | T-PL-05, T-PL-19, T-PL-20, T-PL-22. The ≥48 h rule is **unverified against Stripe docs** (23) | — | L | BK-021 |
| BK-023 | `startPublish` refuses on Pages ready, Collection lists and Site size | 14 ⛔ P-1; 14 §13-3; SC-9 ⛔ | `sites.ts:444-454` (only caller of `runPrePublishChecks`); `PublishTab.tsx:395-396` | T-PB-01 (direct API call with 0 live pages refused) | — (fallback: UI-only gating) | M | — |
| BK-024 | FI-03 persistence P1-D18: `asset-pending:{localAssetId}` token, local byte store, cross-device unresolved state, publish row | 08 §5; SC-9 ⛔; 14 §11 | `BuildrikSyncProvider.ts:830-840` | T-AS-04 | BK-007 | L | BK-007 |
| BK-025 | CMS deleted-field tombstone (30 days) + type-conversion endpoint with preview | 07 §6 C-4; SC-9 ⛔; 24 §13-8 | `CmsWorkspace.tsx:235-239` (field-delete toast without recovery) | T-UN-10 (Restore field brings values back); conversion contract 07 §6 *(no T-id)* | BK-008 | L | BK-008 |
| BK-026 | CMS collection undelete + CMS › Recently deleted | 07 §8 C-5; SC-9 ⛔; 24 §13-8 | `cms.service.ts:307-318` (server already soft-deletes, 24); `CollectionSettingsPane.tsx:93-96` | T-UN-10 last sentence: Restore collection resolves its bindings again | BK-009 | M | BK-009 |
| BK-027 | Site settings revision stamp + per-field conflict review | 10 §5; SC-9 ⛔ | ST-05 / ST-10 (no conflict state) | T-ST-04 | BK-010 | M | BK-010 |
| BK-028 | Store the snapshot time per round (on send and re-send) | 17 ⛔ R-11 | `publish-approval.ts:58-64` | T-CR-10 | BK-004 | S | BK-004 |
| BK-029 | R-4 interim guard: remove "You will be notified", 60 s chip refresh, task re-read on open | 17 ⛔ R-4 interim; 17 §13-2 | `RT:1008` | T-CR-08 chip half ("Changes requested · 3" within 60 s) | This ticket is the guard | S | — |
| BK-030 | Review notifications and emails: open, comments (batched), changes, approve, link request, 7-day reminder | 17 ⛔ R-4 | `CRS:283-376` (no notification) | T-CR-08 (one batched bell row), T-CR-14, T-CR-17 | BK-029 | L | BK-029, BK-064, BK-155 |
| BK-031 | Preview note while scripts are off: "Interactions don't play in Preview yet…" | 19 ⛔ IXD-3 fallback | 19 §5.4 | T-IX-10 "before IXD-3: Preview note shown" | This ticket is the guard | S | — |
| BK-032 | Preview runs only Buildrick's runtime: opaque-origin sandbox, nonce CSP, checked `postMessage`; same for `/share/<token>` | 19 ⛔ IXD-3; OD-I1 (SC-22); 19 §13-3, §13-16 | `Composer.ts:870-881` vs `ExportUtils.ts:39`, `PreviewOverlay.tsx:208-212`; sanitizer blocklist `ExportUtils.ts:50-55` | T-IX-10 attack fixtures do nothing in Preview and on `/share/<token>` | BK-031. "Not shippable in part" (19) | L | BK-031 |
| BK-033 | Full reduced-motion semantics: entrances jump to end state, attention and loops don't play | 19 ⛔ IXD-4 | `interactionRuntime.ts:200-209` | T-IX-05, T-IX-21 | BK-013 | M | BK-013 |
| BK-034 | Area-aware ⌘Z routing: an area's live recovery toast runs on ⌘Z (OD-U1) | 24 ⛔ U-1 | `useEditorShortcuts.ts:91-208` | T-UN-02 | BK-006 | M | BK-006 |
| BK-035 | User-scoped recovery key `bk-unsaved-v1-{userId}-{siteId}` + clear on sign-out | 22 ⛔ G-12 | `unsavedRecovery.ts:23-27` | T-GS-26 | BK-002 | S | BK-002 |
| BK-036 | Client knows the session user id at load and after re-auth; resends only for the same user | 22 ⛔ G-2 | `useSaveCallback.ts:51-70` | T-GS-06, T-GS-07 | No automatic resend (today's behaviour; keep it) | M | BK-151 |
| BK-037 | HMAC key (server-only env var), row added to the root CLAUDE.md env table in the same commit | 25 ⛔ A-3; OD-A2 | — | Pipeline refuses to start without it; raw ids never stored *(no T-id)* | — | S | — |
| BK-038 | Per-user telemetry opt-out + Account settings › Privacy row | 25 A-4, **⛔ because OD-A4 was decided as "built before launch" (SC-22)** | none exists (25 §6.4) | T-AN-13 (also needs BK-118) | — | M | BK-118 |
| BK-039 | First-party event pipeline: `product.track` batch endpoint, `product_events`, server envelope, legal gate | 25 ⛔ A-1 = 16 F-1 = 17 R-10 | none exists (16 §9) | T-AN-01…T-AN-20 (except T-AN-10, which is AI), T-FR-11, T-FR-22 | — (fallback: reports backfilled from tables) | L | BK-037, BK-038, BK-165 |
| BK-040 | Collab Phase A: server-stamped identity on every presence/op frame | 21 ⛔ MP-3; 21 §13-3 | `CollaborationManager.ts:807-809`; `StudioHeader.tsx:622`; `CommandPalette.tsx:315` | T-CO-02 (account names) | Presence hidden (fallback = none) | M | BK-003 |
| BK-041 | Collab Phase A: ephemeral presence channel (roster on join, heartbeat 10 s / timeout 30 s, leave on `pagehide`) | 21 ⛔ MP-4; 21 §13-2 | `:644-660`; `ping`/`pong` unused | T-CO-02, T-CO-04, T-CO-05, T-CO-18; unblocks 10 §5 layer 2 | Presence hidden | L | BK-040 |
| BK-042 | Collab Phase B epic: convergent merge (MP-1), one server document (MP-2), durable outbox + acks (MP-6), collab-aware undo (MP-8) | 21 ⛔ MP-1, 2, 6, 8; 21 §13-4, 5, 7, 8 | `OTEngine.ts:199-226,256-315`; `SSETransport.ts:60`; `HistoryManager.ts:333-350,516-569`; `BuildrikSyncProvider.ts:854,864` | T-CO-09…T-CO-12 | Phase B off (OD-CL-1) | L | BK-041 |
| BK-043 | Access/password changes apply immediately through a server gate | SC-9 ⛔ "Access gate applied immediately" (OD-C3, SC-22); 23 §5.6 M3. Mandatory guard: BK-011. | 10 §7; `route.ts:319-321` (worker applies the password at publish) | *(no T-id)* Turning protection on protects the live site without a publish; trial end never changes access (23 M3) | BK-011 | M | BK-012 |
| BK-173 | Server refuses `OVER_FREE_LIMIT` on writes, publish and member edit rights for locked items; persisted active set + Billing "Choose what stays active" (OWNER, once per 30 days); unlock on webhook | 23 ⛔ TR-12; SC-9 | — | T-PL-27…T-PL-31 | — (fallback: no trial) | L | BK-021 |

## P2 — Correctness bugs (65)

| ID | Title | Source | Evidence | Done when | Size | Depends on |
|---|---|---|---|---|---|---|
| BK-044 | Publish step reads `"running"`, worker writes `"active"`; test mocks the wrong value | 14 §13-1 | `PublishTab.tsx:307` vs `route.ts:48`; `PublishTab.buildLog.test.tsx:112` | T-PB-05 | S | — |
| BK-045 | Worker marks step 0 failed wherever it failed | 14 §13-2 = 25 A-13 | `route.ts:208` | T-PB-09, T-AN-08 | S | — |
| BK-046 | Cancel, stale override and panel Unpublish shown to roles the server refuses; Cancel labelled "Cancel (not started)" because it only works while QUEUED | 14 §13-4, §13-5 | `PublishTab.tsx:421,752-767`; `StaleApprovalModal.tsx:245-250`; `route.ts:136-138` vs `publish.service.ts:594` | T-PB-03 (EDITOR sees no stale override), T-PB-07, T-PB-10 | S | — |
| BK-047 | Flag-off copy shows the Vercel message | 14 §13-6 | `PublishTab.tsx:677-690`; string at `lifecycle.ts:237` | T-PB-14 | S | — |
| BK-048 | Simulation with a verified domain reports "Published to production" | 14 §13-7 | `route.ts:473` | T-PB-08 | S | BK-115 |
| BK-049 | Template create-mode: false "nothing was changed" message; Retry creates a second page | 15 §11-1 | `TemplatesTab.tsx:337,631`; `TemplatesTabModals.tsx:250` | T-TP-07, T-TP-17 (fallback copy per T-1) | M | — (full fix BK-159) |
| BK-050 | Template apply timeout fails while the apply continues | 15 §11-2 | `useTemplateApply.ts:78-87` | T-TP-12 | S | — |
| BK-051 | `replaceCurrentPage` silently applies `SITE_TEMPLATES[0]` when the id is missing | 15 §11-8 | `TemplatesTab.tsx:~189` | *(no T-id)* A missing id refuses the apply and changes nothing | S | — |
| BK-052 | Applying a template ends onboarding permanently | 15 §11-4 = 16 §11-5 | `templatesStorage.ts:14-19` | T-TP-11, T-FR-12 | S | — |
| BK-053 | Template brand copy contradiction; brandCopy test checks the wrong token prefix | 15 §11-3 | `TemplatesTabModals.tsx:95-115`; `TemplatePreview.tsx:85` | T-TP-09 | S | — |
| BK-054 | Pro template gate keyed on `starter` → effective plan | 15 §11-7; 23 §13-16; SC-22 | `TemplatesTab.tsx:154-157` | T-TP-13 | S | BK-021 |
| BK-055 | First-run Preview step completes on its own button press and on closing Preview | 16 §11-1 | `OnboardingMount.tsx:63,230-231`; `AquibraStudio.tsx:284-287`; test `OnboardingMount.signals.test.tsx:111-118` | T-FR-03 | S | — |
| BK-056 | Seeded steps open the modal achievement popup and hide RailCoach (likely, unconfirmed) | 16 §11-2 | `OnboardingMount.tsx:169-173`; `useOnboardingOrchestrator.ts:283` | T-FR-04 | S | — |
| BK-057 | Checklist dismissal on the server per user + user-namespaced cache (skip is local only; replay undone by server union; progress leaks across accounts) | 16 F-2; 16 §11-4 | `useOnboardingOrchestrator.ts:208-227,303-305` | T-FR-02, T-FR-06, T-FR-07, T-FR-19 | M | — |
| BK-058 | Dashboard onboarding: "Back to setup" can create a second site; raw `CRON_SECRET` error shown; stale e2e | 16 §11-6 | `ready/page.tsx:96`; `generating/page.tsx:16-21`; `onboarding.spec.ts:171` | *(no T-id)* One site per run; no env-var name in user copy; e2e matches the current default | S | — |
| BK-059 | Viewer can read review status and rounds without a token (Review task never errors) | 17 R-1; 17 §13-4 | `reviews.ts:205`; `RT:233-244` | T-CR-18 | M | — |
| BK-060 | Viewer review composer disabled although `comments.create` allows viewers | 17 §13-5 | `RT:1107-1108`; `comments.ts:39-57` | T-CR-18 (viewer can post a Team comment) | S | — |
| BK-061 | Review chip staleness ignores CMS edits | 17 R-7; 17 §13-3 | `RS:240,271` vs `publish.service.ts:462` | T-CR-11 | S | BK-028 |
| BK-062 | Snapshot render failure swallowed on Send for review | 17 §13-8 | `SendForReview.tsx:105-111` | T-CR-02 | S | — |
| BK-063 | Review composer posts to the first comment's page, not the active page | 17 §13-15 | `RT:289,1107,1117` | *(no T-id)* The note lands on the page its label names | S | — |
| BK-064 | `REVIEW_LINK_REQUESTED` missing from `NotificationType` and created without `siteId` | 17 §13-11; 22 §13-13 | `enums.ts:149-171` vs `:193`; `client-review.service.ts:407-412` | T-CR-14 (owner and sender notified; row visible in the editor bell) | S | — |
| BK-065 | Client snapshot frame fixed at 680 → Mobile CSS on desktop, overflow on phones | 17 §13-7 | `signoff-snapshot.tsx:104` | T-CR-03 | M | — |
| BK-066 | CONFLICT dead-link card unreachable on the client page | 17 §13-6 | `CRS:132-178` vs `RC:37-40,182-193` | *(no T-id)* Dead-link state renders its card | S | — |
| BK-067 | Quick-add commands escape the read-only gate | 18 K-6; 18 §13-2 | `CommandCenter.ts:67-73`; `defaultCommands.ts:657-691` → `useEditorEventListeners.ts:246-258` | *(no T-id)* A read-only `commands.run("add-text")` writes nothing (K-6 fallback: palette disables Add rows) | S | — |
| BK-068 | Clear history: one chrome-ui confirm in History and ⌘K (no `window.confirm`) | 18 §13-14; 24 §13-5 | `CommandPalette.tsx:283-298`; `HistoryTab.tsx:411-421` | T-CP-15, T-UN-15 (before K-8 part) | S | — |
| BK-069 | ⌘K bound twice in the Asset library | 18 §13-3 | `StudioHeader.tsx:329-347`; `LibraryManager.tsx:163-166` | T-CP-09 | S | — |
| BK-070 | Palette mounts in read-only view with disabled-with-reason rows (viewer filter is dead code today) | 18 §13-1; OD-18-2 (SC-22) | `StudioHeader.tsx:336`; `useEditorRole.ts:34-38`; CP:148-156,449 | T-CP-06 | M | — |
| BK-071 | Disabled palette row: Enter is silent and the reason fades with the row | 18 §13-8 | CP:497, CP:716 | T-CP-05 | S | — |
| BK-072 | No-match actions ignore permissions; Enter falls to Ask AI (Ask AI hidden under SC-21) | 18 §13-9 | CP:537-544,585 | T-CP-08 (viewer: no stock row; Ask AI hidden for all under SC-21) | S | — |
| BK-073 | Palette opening list floods with one "Go to" row per page | 18 §13-10 | `usePageCommands.ts:94-98`; CP:70 | T-CP-02 | S | — |
| BK-074 | Records reloaded on every palette open → cap 200 per collection, then "Search in CMS ›" | 18 §13-11; K-5 fallback | CP:464-494 | *(no T-id)* One load per session; cap applied | S | — |
| BK-075 | Palette listbox a11y: `aria-expanded` always true, tabbable option buttons | 18 §13-12 | CP:627, CP:701-725 | T-CP-13 | S | — |
| BK-076 | Shortcut sheet, legend and rail Help tooltip disagree with real bindings; remove the legend card | 18 §13-4…7; K-1 fallback test | `KeyboardLegend.tsx:24,98-107`; KR:100-107,157; `useSidebarKeyboard.ts:53-58`; `useEditorShortcuts.ts:117-125`; `LeftSidebar.tsx:451-455` | T-KS-01 (test asserts every printed key is bound), T-KS-03, T-HP-01 | M | — |
| BK-077 | Inspector interaction Preview writes an invalid CSS `animation` (GSAP ease names) | 19 §13-1 | `registry/behaviour.tsx:58`; `interactions/types.ts:178-181` | T-IX-04 (Play matches the published end state) | S | — |
| BK-078 | Published runtime ignores legacy `{type, iterations}`, ignores `once`; threshold differs from the editor | 19 IXD-9; 19 §13-5, §13-6 | `interactionRuntime.ts:203,205`; `InteractionRuntime.ts:70-75,308-316` | T-IX-08, T-IX-13 | M | — |
| BK-079 | `fill:'both'` permanently overrides an authored transform; fill rule per effect kind | 19 IXD-10; 19 §13-9 | `interactionRuntime.ts:204` | T-IX-18 | M | — |
| BK-080 | Interaction Duration/Delay add one undo step per keystroke | 19 §13-10 | `InteractionEditor.tsx:89-93` (NOT RUN) | T-IX-03 | S | — |
| BK-081 | Default easing `easeOut` is not a value of the easing select | 19 §13-11 | `engine/interactions/types.ts:203` vs `interactions/types.ts:178-181` | T-IX-15 | S | — |
| BK-082 | `add-interaction` missing from `INSPECTOR_MENU` | 19 §13-14 | `elementActions.ts:243-255` | T-IX-01 | S | — |
| BK-083 | "Missing" banner says there is no trash (sites have 30-day Recently deleted) | 22 §13-1 | `LoadErrorBanner.tsx:15-17,97` vs `sites.service.ts:661-701` | T-GS-03 | S | — |
| BK-084 | Deleted site: editor renders (`getEffectiveSiteRole` ignores `deletedAt`); NOT_FOUND save maps to "Could not save project." + Retry loop | 22 §13-2, §13-15 | `permission.service.ts:162-169`, `page.tsx:36`; `sites.ts:385-388` → `useSaveCallback.ts:156,384-393` | T-GS-03, T-GS-13 | M | — |
| BK-085 | `SessionExpiredModal` says nothing local is written although `keepUnsaved` writes localStorage | 22 §13-4 | `SessionExpiredModal.tsx:6-8,92-93` vs `unsavedRecovery.ts:93-97` | T-GS-04, T-GS-05 (copy matches behaviour) | S | — |
| BK-086 | Error boundaries: raw `error.message`, no capture, Reload remounts non-chunk errors, hex + Inter Tight in chrome, unconditional "Your work is safe" | 22 §13-6, §13-7, §13-9 | `AquibraStudio.tsx:106-127`; `EditorErrorBoundary.tsx:24-38,57-87`; `EditorClient.tsx:50-55`; `SidebarFallbacks.tsx:25,40` | T-GS-15, T-GS-16, T-GS-17 | M | BK-087 |
| BK-087 | Sentry initialised in the Next-bundled editor; error code = Sentry event id | 22 G-8 = 22 §13-8 = 25 D-4 | `errorTracking.ts:31,77`; `demo/main.tsx:26` | T-GS-16 (Sentry event with error code). Whether the dashboard client config loads under Next 16 + Turbopack is NOT VERIFIED (25) | M | — |
| BK-088 | `beforeunload` guard lives in `StudioHeader`, which a shell crash unmounts (inference) | 22 §13-10 | `StudioHeader.tsx:541-564` | T-GS-16 "Reload is guarded" after a forced shell crash | S | — |
| BK-089 | Toast and alert discipline: persistent toasts unbounded, `aria-live` flips, `LoadErrorBanner` uses `role=alert` | 22 §13-18, §13-21 | `Toast.tsx:155-162,322-329`; `LoadErrorBanner.tsx:88`; `StudioHeader.tsx:780-781` | T-GS-18, T-GS-24, T-GS-29 | M | — |
| BK-090 | Bell: failed mark-read swallowed; unread-count failure shows 0 | 22 §13-17, §13-14 | `NotificationPanel.tsx:157-163`; `NotificationService.ts:53-58` | T-GS-28 | S | — |
| BK-091 | Custom code ships after a downgrade (export has no plan check) | 23 §13-3; TR-7 export half (client-enforced, not a security boundary) | `ExportEngine.ts:636-637,975-976`; `site-settings.service.ts:306` | T-PL-09 | S | BK-021 |
| BK-092 | `UpgradeModal` offers Upgrade to every role; lists "Priority support" and AI features | 23 §13-7; SC-21 (AI copy hidden) | `UpgradeModal.tsx:84-104` vs `billing.ts:41-49`; `plan-limits.ts:34-35` | T-PL-11, T-PL-13 | S | — |
| BK-093 | One Pro chip; no "Enterprise" text | 23 §13-8, §13-9 | `LockedScreen.tsx:28,76`; `UpgradeModal.tsx:116`; `SettingsTab.tsx:124,869-871`; `TemplateCard.tsx:82` | T-PL-14 | S | — |
| BK-094 | Dashboard Plans page lets non-owners press plan buttons the server refuses | 23 §13-10 | `settings/plans/page.tsx:107-113`; `billing/page.tsx:145-146` | *(no T-id)* Non-owners see the SC-18 "Ask the workspace owner" line | S | — |
| BK-095 | Limit errors name the plan and the next step | 23 §13-15 | `pages.ts:63`; `media.ts:192`; `site-detail.ts:248`; `account.ts:302` | T-PL-10 | S | — |
| BK-096 | Free workspace with saved custom code may fail every Site settings save (probable, needs checking) | 23 TR-11; 23 §13-17 | `BuildrikSyncProvider.ts:352-353`; `site-settings.service.ts:282-306` | T-PL-21 | S | — |
| BK-097 | "Brand applied · Undo ⌘Z" toast has no action | 24 §13-3 | `BrandFromSource.tsx:227` | *(no T-id)* Toast action runs Undo, or the label is removed | S | — |
| BK-098 | CMS bind/unbind and asset delete block ⌘Z for all earlier work; record bind/unbind as steps | 24 U-3; 24 §13-6 | `BaseBindingManager.ts:128,151,163`; `MediaCommandLayer.ts:124`; `useHistoryFeedback.ts:216-223` | T-UN-11 | M | — |
| BK-099 | Replace across site: all-or-none in one document transaction, one Undo | 08 §6; 24 §13-10; SC-9 | `MediaCommandLayer.ts:367,496`; `ReplaceAcrossDialog.tsx:78-90` | T-AS-06, T-AS-07, T-UN-12 | M | — |
| BK-100 | Upload accept list = server allow-list; audio and video/ogg greyed with reason | 08 §5; AS-07 | 08 AS-07 (client accepts what the server rejects) | T-AS-08 | S | — |
| BK-101 | Stock save keeps author, source URL and alt; Unsplash download ping; placeholder copy fixed | 08 §5; AS-08 | 08 AS-08 | *(no T-id)* Metadata stored; ping sent on save (provider requirement) | S | — |
| BK-102 | Editor behind the full-page library and Site settings portals is made `inert` | 08 AS-01; 10 ST-01 | 08 AS-01; 10 ST-01 (`fixed inset-0`, no `inert`) | *(no T-id)* Focus cannot reach the editor behind either surface | S | — |
| BK-103 | Media grid uses the grid pattern (not listbox with buttons) | 08 §10; AS-14 | 08 AS-14 | T-AS-10 | M | — |
| BK-104 | Site settings "Checking access": unknown role is not a grant | 10 §6; ST-06 | 10 ST-06 ("unknown role stays editable") | T-ST-03 | S | — |
| BK-105 | CMS field changes show Saved only after the server receipt | 07 §6; CM-06; SC-9 "field-write receipts" fallback | 07 CM-06 ("field update fire-and-forget") | T-CM-02 | S | — |
| BK-106 | CMS record "Undo restores it" toast → "Restore as new record" with the new-ID warning | 07 §5; 24 §13-2 | `RecordSheet.tsx:345-351` → `CmsWorkspace.tsx:486-488`; `cms.ts:57-126` | T-CM-07b | S | — (full: BK-119) |
| BK-107 | `InspectorErrorBoundary` would ship free text (`error.message`) through `trackSidebar` once wired | 25 D-2; 25 §6.1 | `InspectorErrorBoundary.tsx:45`; `sidebarAnalytics.ts:26` | T-AN-14 shape: free text never stored *(no exact T-id)* | S | — |
| BK-108 | Dashboard checklist marks a task complete on click | 25 D-6 | `dashboard-checklist.tsx:117-120`; `onboarding.service.ts:111-148` | T-AN-11 | S | — |

## P3 — Non-blocking dependencies and polish (64)

| ID | Title | Source | Done when / fallback until then | Size | Depends on |
|---|---|---|---|---|---|
| BK-109 | Per-operation save receipt registry | SC-9 row 1; 22 G-11 | Unblocks T-PG-08, T-CM-06; T-GS-08 count. Fallback: page save status only | L | — |
| BK-110 | Library revisions + library query incl. current-site-only components | SC-9; 18 K-4 | Library rows in ⌘K (T-CP-10); "Update available". Fallback: current-site only | L | — |
| BK-111 | Activity target ids + cursor pagination | SC-9 (12 §5) | Load more; exact item open. Fallback: panel-level open | M | — |
| BK-112 | Stable release numbers + both job ids on the outcome | 14 P-4 = SC-9 Compare row; 14 §13-8 (`publish.service.ts:782-797`) | "See what changed" opens Compare vN-1 → vN. Fallback: dates as primary labels | M | — |
| BK-113 | Active-job query on load / after a start timeout; job id inside `ALREADY_PUBLISHING` | 14 P-3 | T-PB-06, T-PB-15. Fallback: "A publish is already running" | M | — |
| BK-114 | Draft-vs-live page diff + CMS/Brand counts endpoint | 14 P-2 | T-PB-19 after-state. Fallback: "Edits this session" | L | — |
| BK-115 | Server `simulated` flag on jobs | 14 P-5; 25 P-5 | T-PB-08, T-AN-07 | S | — |
| BK-116 | Notify the publisher of publish results | 14 P-6 | Exit copy "You'll get a notification" (T-PB-12) | S | BK-155 |
| BK-117 | Publish a stored saved revision (revision id captured at Publish) | 14 P-7 | Fallback: flush + export live canvas | L | BK-109 |
| BK-118 | `actorId` on `publish_build_jobs` | 14 P-8 = 25 A-5 = 25 D-5 (`prisma/schema.prisma:1440-1467`; `route.ts:158-160,179`) | Actor on History rows; unblocks T-AN-13 | S | — |
| BK-119 | CMS record undelete endpoint (same ID) + slug-taken check | SC-9 two rows; 07 §5 | T-CM-07 | M | BK-106 |
| BK-120 | CMS bulk-operation API | SC-9; 07 §5 | T-CM-10. Fallback: per-record calls with a count | M | — |
| BK-121 | Server-side component cap (100) | SC-9 (13 §5) | Server refuses the 101st | S | — |
| BK-122 | Server filter / sort / pagination at publish | SC-9 (FD-DYN-01 §18) | As FD-DYN-01 states | M | — |
| BK-123 | Pages and Components "Recently deleted" (30 days) incl. server page soft delete | SC-9; SC-15; 24 U-7, U-5 (`page.service.ts:132`) | T-UN-08 after-reload half, T-UN-09, T-UN-20 | L | — |
| BK-124 | Create-page undo incl. nav entry + capacity slot; page-create toast gets Undo | 15 T-4; 24 §13-7 (`NewPageModal.tsx:87`, `usePages.ts:268`) | T-TP-01 (after T-4), T-UN-08 first half | M | — |
| BK-125 | Site-wide asset usage scan incl. CMS, Site settings and Brand | SC-9; 08 §6; AS-05 | T-AS-05. Fallback: delete confirm always warns | M | — |
| BK-126 | MediaAsset server soft delete + Assets › Recently deleted (OD-U3, 30 days) | 24 U-4 | T-UN-13 | M | BK-015 |
| BK-127 | Site-font owner name field | SC-9; 08 §7 | "Added by {name}" | S | — |
| BK-128 | D8 published runtime script for live sources | SC-9 (FD-DYN-01 P4b) | Live sources leave "Coming soon" | L | — |
| BK-129 | Capacity reads (pages, sites, domains, storage, redirects) in the editor | SC-9 page capacity; 23 TR-10 | Pre-action limit lines. Fallback: post-action error | M | BK-021 |
| BK-130 | Shortcut table as data (K-1) + per-user single-key preference (K-3) | 18 K-1, K-3 | T-KS-01, T-KS-04 (other device) | M | — |
| BK-131 | Capability resolver (role, flag, plan, lock, selection, offline) | 18 K-2 | Shared by rail, menus, palette, shortcuts | L | BK-021 |
| BK-132 | Record search endpoint (display field, paginated, ACL-filtered) | 18 K-5 | Replaces BK-074 fallback | M | — |
| BK-133 | Cross-page layer index | 18 K-7 | Layers group searches every page | L | — |
| BK-134 | `history.clear()` restorable while the Undo toast shows | 18 K-8 | T-CP-15, T-UN-15 after K-8 | S | BK-068 |
| BK-135 | Review pin capture: snapshot `pageId`, full height, element under click, comment stores page/x/y/selector | 17 R-2; 17 §13-1 (`RC:300-311,333-343`; `reviews.ts:98-108`; `CommentLayer.tsx:451-457`) | T-CR-05, T-CR-06 | L | — |
| BK-136 | Comment replies (`parentId`) + audience team/client | 17 R-3 | T-CR-09 | M | — |
| BK-137 | Round metadata: `reviewId` on comments, `expiresAt`/`invitedEmail`/`lastSeenAt`, live/expired/revoked status | 17 R-5, R-6, R-12 | T-CR-13, T-CR-16 | M | — |
| BK-138 | Client receipt + "replied" digest emails | 17 R-8 | On-page confirmation only until then | M | BK-030 |
| BK-139 | One-time email code before Approve (OD-R7 decided) | 17 R-13 | T-CR-19 | M | — |
| BK-140 | One preset keyframe table + canvas Play hook | 19 IXD-1, IXD-2; 19 §13-7 | T-IX-04 | M | — |
| BK-141 | Head script `bk-ix` + `data-bk-enter` + 3 s fail-safe reveal | 19 IXD-5 | T-IX-06, T-IX-07 | M | BK-013 |
| BK-142 | Per-breakpoint interactions | 19 IXD-6 | T-IX-09 | M | — |
| BK-143 | Re-point picked targets on duplicate/paste | 19 IXD-7 | T-IX-17 shape | S | — |
| BK-144 | rAF throttle for continuous triggers | 19 IXD-8; 19 §13-8 | T-IX-16 | S | — |
| BK-145 | Flash clamp ≥0.4 s + WCAG 2.2.2 Blocking row in `runPrePublishChecks` | 19 IXD-11 | T-IX-19, T-IX-20 | S | BK-023 |
| BK-146 | Interactions cleanup: retire the unreachable GSAP `InteractionRuntime` path (OD-I2), `setPreviewMode` without caller, misleading Composer comment, two trigger declarations, emoji/unnamed ×/commented-out code, reverse placeholder, static `gsap` import | 19 §13-2, 3, 12, 13, 15, 17; OD-I2 | Dead paths removed; tests updated | M | BK-140 |
| BK-147 | Editor re-reads `{plan, source, trialEndsAt, canManageBilling}` on focus and after a refusal | 23 TR-3; 23 §13-13 | T-PL-12 | S | BK-021 |
| BK-148 | Hourly trial milestone job + workspace notices in the editor bell | 23 TR-4; 23 §13-14 | T-PL-04, T-PL-07, T-PL-24 | M | BK-020 |
| BK-149 | Trial/downgrade email templates per DESIGN.md (no system fonts; accent `#1A56DB`); wire `sendAutoDowngradeEmail`; review invite font | 23 TR-5; 23 §13-11; 17 §13-12 | T-PL-04 email half | S | BK-148 |
| BK-150 | "Ask owner to upgrade" sends an owner notification | 23 TR-9 | Button instead of text | S | — |
| BK-151 | Cheap session probe on focus | 22 G-1 | T-GS-06 | S | — |
| BK-152 | Typed 401/403/404 from tRPC `data.code` (no message regex) | 22 G-3; 22 §13-20 | T-GS-13 | S | — |
| BK-153 | `editorState` on focus: role, site `deletedAt`, workspace deletion date, last editor | 22 G-4, G-5 | T-GS-11, T-GS-12 | M | — |
| BK-154 | Build id for "new version while open" | 22 G-6 | T-GS-14 | S | BK-156 |
| BK-155 | Typed notifications (`targetType`, `targetId`) and `siteId` on every site event | 22 G-7 | T-GS-20, T-GS-21 | M | BK-064 |
| BK-156 | URL state for area / page / task | 22 G-9 | T-GS-14 return to page | M | — |
| BK-157 | Restore a deleted site from the editor (OWNER) | 22 G-10 | Fallback link to dashboard | S | — |
| BK-158 | Target, page and area metadata on history entries | 24 U-2 | T-UN-04, T-UN-16 | M | — |
| BK-159 | Template create + import as one operation (page removed on failure) | 15 T-1 | T-TP-07 final form | M | BK-049 |
| BK-160 | Operation id for template apply; real completion signal; saved-template rename | 15 T-2, T-3 | T-TP-10, T-TP-12 | M | — |
| BK-161 | Figma boards: 4418:54134 (Templates in shell), 4428:44164 (empty canvas) | 15 T-5; 16 F-5. Design task, not code | Boards match the panels | S | — |
| BK-162 | Collab Phase A non-blocking: viewer presence (MP-7), viewport broadcast (MP-9), room cap + cursor coalescing (MP-10), page-space cursors (MP-11), save notification (MP-12) | 21 MP-7, 9–12; 21 §13-9 (`useCursorSync.ts:104-106`, `ops route:9`) | T-CO-05, T-CO-06, T-CO-08, T-CO-14 | L | BK-041 |
| BK-163 | Collab cleanup: indigo hex + contrast in collab colours, silent op-send failures, one 24 h retention (OD-CL-6), `syncStatus` never updated, unconsumed events; root CLAUDE.md and `runtimeEnv.ts:95-97` "last-write-wins" wording | 21 §13-5 (wording), 10, 11, 12, 13, 14 | `CollaborationManager.ts:38-47`; `SSETransport.ts:95-98`; `collab.service.ts:14` vs `ephemeral-purge/route.ts:20`; `useStudioState.ts:269` | M | BK-041 |
| BK-164 | Retention cron for `product_events` + `ai_adoption_events` (13 months) + account-deletion cascade | 25 A-6; 25 D-7 | T-AN-17 | S | BK-039 |
| BK-165 | Shared event catalogue schema `packages/shared/schemas/product-events.ts` + `gate:events-catalogue` | 25 A-2 | T-AN-14, T-AN-19 | M | — |
| BK-166 | Server emit points (publish worker, `startPublish`, review, CMS, Stripe, trial job) | 25 A-7 | T-AN-06…T-AN-09, T-AN-12 | M | BK-039 |
| BK-167 | `editor_ready` at first canvas paint (cold-load metric measures the skeleton today) | 25 A-8; 25 D-3 (`EditorClient.tsx:8-29`) | Real time-to-editor | S | BK-039 |
| BK-168 | Internal/QA workspace flag | 25 A-9 | QA workspaces excluded from every report | S | — |
| BK-169 | `Site.creationMethod` for duplicate and import | 25 A-11 | R-2 split exact | S | — |
| BK-170 | One server mapping of publish errors to `reason_code` | 25 A-12 | T-AN-08 enum `reason_code` | S | BK-045 |
| BK-171 | Assets labels and stale publish code: font bucket mislabelled "Icons"; `PrePublishChecks.tsx:15-18` says six checks (server sends 13); SSE route + `use-publish-sse.ts` with no importer | 08 AS-02; 14 §13-9, §13-10 | Labels true; dead route removed or wired | S | — |
| BK-172 | Dead code and stale comments: unused template state machine + its test, `TemplatesTab.ia.test.tsx` rewrite, `SITE_TEMPLATES` naming; unused onboarding keys; `ReviewService.ts:89-93`; unrendered client note status; `navigator.platform`; skeleton jargon and "Project saved successfully"; `PaywallModal`/`LimitReached`; `engine/history/index.ts`; router writing `activityLog` via Prisma (`api-tokens.ts:90-99`); `PAGE_CREATED` constant; `REVIEW_SENT` email field | 15 §11-5, 6, §9; 16 §11-7; 17 §13-10, 16; 18 §13-13; 22 §13-11, 12, 19; 23 §13-12; 24 §13-9; 25 D-8, D-9, D-10 | Removed or corrected per the CLAUDE.md no-dead-code rule | M | — |

---

## Dependency graph (text)

```
Plans / trial
  BK-020 trialEndsAt ─► BK-021 effective-plan resolver ─┬─► BK-022 Stripe trial + hasPaid
                                                        ├─► BK-012 PASSWORD_ON_FREE ─► BK-043 immediate access gate
                                                        ├─► BK-054 template Pro gate · BK-091 custom code export
                                                        ├─► BK-129 capacity reads · BK-131 capability resolver
                                                        └─► BK-147 plan re-read
  BK-020 ─► BK-148 milestone job ─► BK-149 emails
  BK-001 AI role check (independent) ··· AI plan half waits on BK-021 (Appendix A)

Data-loss guards ─► full fixes
  BK-007 FI-03 guard      ─► BK-024 P1-D18
  BK-008 field guard      ─► BK-025 field tombstone
  BK-009 collection guard ─► BK-026 collection undelete
  BK-010 settings RCW     ─► BK-027 revision stamp ;  BK-041 MP-4 ─► settings banner (layer 2)
  BK-006 ⌘Z guard         ─► BK-034 area-aware ⌘Z
  BK-002 recovery guard   ─► BK-035 user-scoped key ;  BK-002 ─► BK-016 autosave-401 copy
  BK-015 asset honesty    ─► BK-126 asset soft delete
  BK-106 CMS copy         ─► BK-119 record undelete

Review
  BK-004 staleness guard ─► BK-028 snapshot time ─► BK-061 CMS-aware chip
  BK-029 R-4 guard ─► BK-030 notifications ◄─ BK-064 REVIEW_LINK_REQUESTED ◄─ BK-155 typed notifications
  BK-030 ─► BK-138 receipts/digests ;  BK-116 publisher notification ◄─ BK-155

Publish
  BK-023 P-1 server checks ─► BK-145 2.2.2 server row
  BK-115 simulated flag ─► BK-048 ;  BK-045 failed step ─► BK-170 reason_code
  BK-109 receipt registry ─► BK-117 stored-revision publish
  BK-118 actor ─► BK-038 opt-out (T-AN-13)

Analytics
  BK-037 HMAC + BK-038 opt-out + BK-165 catalogue ─► BK-039 pipeline ─► BK-164, BK-166, BK-167

Interactions
  BK-013 reduced-motion guard ─► BK-033 full IXD-4 ;  BK-013 ─► BK-141 head script
  BK-031 Preview note ─► BK-032 IXD-3 sandbox
  BK-140 preset table + Play ─► BK-146 cleanup

Collaboration (flag stays off in production throughout)
  BK-003 MP-5 ─► BK-040 MP-3 ─► BK-041 MP-4 ─┬─► BK-162 Phase A extras ─► BK-163 cleanup
                                             └─► BK-042 Phase B epic (only after Phase A passes)

Session
  BK-151 session probe ─► BK-036 G-2 same-user resend
  BK-156 URL state ─► BK-154 build id
```

## Suggested first sprint (10 tickets: guards and P0)

All are S or M and have no dependencies outside the sprint.

1. **BK-001** AI routes: site-role check before quota (security; the routes are live although the UI is hidden)
2. **BK-002** Recovery copy only for its own user (G-12 guard)
3. **BK-016** Autosave 401 keeps a recovery copy (needs BK-002, same sprint)
4. **BK-017** Conflict backup never reloads on failure
5. **BK-006** ⌘Z blocked outside Editor/Brand (U-1 guard)
6. **BK-007** FI-03 unregistered-image guard
7. **BK-008** CMS field delete/type change refused while values exist (C-4 guard)
8. **BK-009** CMS collection delete blocked while bound (C-5 guard)
9. **BK-010** Site settings read-compare-write (C-2 guard)
10. **BK-004** Approval staleness from the round's `createdAt` (R-11 guard)

Next in line: BK-013 reduced-motion guard, BK-011 access warning, BK-018 `/review` headers, BK-005 revoked-round gate, BK-014 version pruning, BK-174 AI flag, then BK-019 background AI check. BK-012 waits for the trial work (BK-020, BK-021). BK-003 is L and only matters once collab Phase A is scheduled; until then the flag stays off.

## Conflicts found while de-duplicating

1. **Access timing (OD-C3) vs the publish-time password model.** **Resolved 2026-10-18:** 10 §7, 14 §5.2, 23 §5.6 M3 and BK-043 now state the interim (next publish + C-3 warning) and the post-gate behaviour (SC-9 ⛔ Access gate). SC-22 decided that password/access changes apply immediately through a server gate. Panel 14 §5.2 ("…but the live site is still protected (v12) · Restore protection") and Panel 23 TR-7 / §13-4 (the worker applies the password at publish) still treat protection as publish output. Panel 23 §5.6 M3 aligns only partly. Panel 10 §7 said "Applies on next publish" (now: immediate once the Access gate ships, next-publish fallback with the C-3 warning). BK-043 has to settle where the password is enforced before BK-012's copy is final.
2. **Collection soft delete.** **Resolved 2026-10-18:** BK-009 copy now reads "Deleted collections can't be restored from the editor yet" (the data is kept on the server). The SC-9 ⛔ row asks for "collection soft delete + undelete", and the 07 §8 fallback copy says "This can't be undone". Panel 24 §13-8 says collections are already soft-deleted on the server (`cms.service.ts:307-318`). If 24 is right, only the undelete endpoint and the UI are missing, and the fallback copy would be untrue.
3. **Asset delete.** **Resolved 2026-10-18:** 08 §6 now reads "8 s grace Undo (then Recently deleted after U-4)". Panel 08 §6 describes "Move to trash (existing grace recovery)". Panel 24 §13-4 says the asset is hard-deleted on the server after an 8 s client grace, and OD-U3 decided 30-day Recently deleted (U-4). Panel 08 lists no U-4 dependency.
4. **Bell scope.** **Open.** G-7 wants `siteId` on every site event for a site-scoped bell. TR-4 / 23 §13-14 need workspace notices with `siteId` null (PAYMENT_FAILED, trial reminders) in the same bell. They are compatible, but BK-148 and BK-155 have to be designed together.
5. **A-4 opt-out status.** **Resolved 2026-10-18:** 00 SC-9 and 16 now list A-4 as ⛔ (OD-A4 decided). SC-9 and Panel 25 still say A-4 is ⛔ only "if OD-A4 = opt-out before launch". SC-22 decided OD-A4 that way, so A-4 is ⛔ now. The register text is stale.
6. **Collab merge wording.** **Resolved (docs) 2026-10-18:** root CLAUDE.md corrected; 21 updated; the `runtimeEnv.ts:95-97` comment stays a code item (BK-163). Root CLAUDE.md and `runtimeEnv.ts:95-97` say "last-write-wins". Panel 21 §13-5 says the merge is non-convergent, which is a different behaviour. This backlog does not edit CLAUDE.md (BK-163).
7. **Collab retention.** **Open (code).** 24 h (`collab.service.ts:14`) vs a 7-day cron (`ephemeral-purge/route.ts:20`). OD-CL-6 decided 24 h.
8. **Duplicate SC-9 rows.** **Open.** "Settings conflict…" duplicates the ⛔ revision-stamp row. K-4 duplicates "Library revisions". G-11 duplicates the receipt registry. P-4 duplicates the Compare row. These are merged here.
9. **AI-D1 status vs the DEFERRED panel.** **Resolved 2026-10-18:** role half is P0 (BK-001); plan half waits on BK-021. Panel 20 says it "stays blocked by AI-D1 until the role half ships", but the panel is DEFERRED by SC-21. Following the brief, the role half is P0 here (BK-001) and the plan half waits on BK-021.
10. **SC-21 scope.** **Resolved 2026-10-18:** BK-174 hides the dashboard wizard AI path too. SC-21 lists editor entry points only. The dashboard AI onboarding path (`generating/page.tsx`, 16 §11-6; 20 §13-13) is not named, so it is unclear whether it is hidden. BK-058 fixes only the raw error copy.

## Not verified

- Everything here comes from **reading the panel docs**. No code was read, run, built or tested for this backlog. Every `file:line` is copied from a spec, and the specs themselves are source reads marked "runtime NOT RUN".
- Items the specs mark as likely or inferred are carried over unconfirmed: BK-056, BK-059, BK-080, BK-088, BK-096, and the D-3/D-4 Sentry behaviour.
- The Stripe ≥48 h trial rule (BK-022) is unverified against Stripe docs, as Panel 23 says.
- Panels 07, 08 and 10 have no code-defect section. Their tickets come from §2 "Today" rows and §5–§8 contracts, so their coverage is thinner than for 14–25.
- Panels 01–06, 09 and 11–13 were not read beyond what SC-9 cites. Their SC-9 rows (receipt registry, library revisions, activity ids, component cap, page capacity) are included. Any defects listed only inside those panels are not.
- Sizes are guesses. No estimate was checked with an engineer.
- Design deltas that are not defects (for example 08 §4.5 removal of implicit replace, the 10 §7 "Choose from Assets" doors, the new layouts) are not tickets here. They belong to the build plan for each panel.

---

## Appendix A — Deferred with AI (SC-21; not scheduled)

The AI UI is hidden in this version, and nothing below builds it. The backend stays as it is. These items return with the AI "Build" tab. **Exception:** the AI-D1 role check is BK-001 in the main list, and the BK-019 background check is in the main list too.

| # | Item | Source | Evidence |
|---|---|---|---|
| A-01 | AI-D1 plan half: quota per user per workspace from the site's workspace effective plan; trial applies to AI | 20 AI-D1; 20 §13-2 | `quota.service.ts:48-55` (rides on BK-021) |
| A-02 | AI-D2 `ai.status` + typed error codes + retry-after for every AI route | 20 AI-D2; 20 §13-5, §13-13 | `ai.ts:200-327` vs `:346-352`; `:216,242,268`; dashboard substring match `generating/page.tsx:19` |
| A-03 | AI-D3 run-level quota estimate | 20 AI-D3 | — |
| A-04 | AI-D4 step canvas preview; `set-text` sends an empty `from`; `applyOps.preview` always `{}` | 20 AI-D4; 20 §13-7 | `ai.service.ts:776-778`; `ai.ts:423` |
| A-05 | AI-D5 alt-text suggest-without-saving | 20 AI-D5 | — |
| A-06 | AI-D6 site setting for background alt text (OD-AI-1) | 20 AI-D6; 20 §13-8 | `useAltTextAutoTrigger.ts:47-73` |
| A-07 | AI-D7 context builder excludes embed/custom code | 20 AI-D7 | — |
| A-08 | AI-D8 workspace AI switch + privacy page / subprocessor (OD-AI-2, OD-AI-4) | 20 AI-D8; 20 §13-14 | `packages/dashboard/app/privacy/page.tsx` |
| A-09 | `reserveQuota` returns `used: limit` | 20 §13-3 | `quota.service.ts:98-99` |
| A-10 | Generate forwards non-insert commands | 20 §13-4 | `GenerateBlockScreen.tsx:90-104` |
| A-11 | SEO Write with AI collapses all failures | 20 §13-6 | `SeoTab.tsx:183-186` |
| A-12 | Page pool falls back to all elements, slices to 200 | 20 §13-9 | `useAgentRunner.ts:157-167` |
| A-13 | Quota copy "out of credit", billing link for every role, "generations" noun; three "open AI" shortcuts; plan steps without a live region | 20 §13-10, 11, 12 | `AITab.tsx:333-345`; `GenerateBlockScreen.tsx:121,164`; `defaultCommands.ts:580`; `keyboardSheetRows.ts:138`; `AgentPlan.tsx` |
| A-14 | `trackAiEditApplied` has no production caller (`ai_*` events are not emitted under SC-21) | 25 D-1; T-AN-10 | `services/ai/adoptionTracker.ts:43,89-97` |
| A-15 | AI sections (`type:"container"`, `tagName:"section"`) never seed first-run step 1 | 16 §11-3; T-FR-09, T-FR-20 | `route.ts:74-75` vs `OnboardingMount.tsx:172` |
| A-16 | Wizard brand answers written as Brand tokens on AI site creation | 16 F-3 | — |
