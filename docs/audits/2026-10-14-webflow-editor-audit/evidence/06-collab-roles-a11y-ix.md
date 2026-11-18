# 06 — Collaboration & permissions · Interactions & animation · AI · Chrome DS/a11y

Reader 06, audit areas I + J + interactions/AI. Repo `main @ df60cf9ec`. Read-only; no code was changed.
Evidence levels: CODE / REACH / LIVE (not run here; see §10) / DESIGN (not assessed this round) / PLANNED.
The 2026-10-10 audits were used as context only. Every prior claim below was re-checked against current code.

---

## 0. Prior-finding re-checks (requested IDs)

| ID | Prior claim (10 Oct) | Status @df60cf9ec | Evidence |
|---|---|---|---|
| RR-01 | `reviews.revoke` checks EDITOR on `input.siteId` but revokes by `reviewId` + workspace, so it can reach a review on another site in the same workspace | **Confirmed in code @df60cf9ec** | `server/trpc/routers/reviews.ts:263-289` (checks `input.siteId`, passes `siteWorkspace.workspaceId`); `server/services/review.service.ts:461-483` `updateMany where {id, site:{workspaceId}, revokedAt:null, updatedAt}`. Nothing ties the review to `input.siteId`. Audit row `review.revoked` is also recorded against the supplied site (`reviews.ts:280`). |
| RR-02 | The AI publish action skips ordinary publish freshness and loaded-state checks | **Confirmed in code @df60cf9ec** | `editor/sidebar/tabs/ai/hooks/useAiActionGate.ts:63-81` exports `exportPublishPages(composer)` and confirms with `{pages}` only. It doesn't flush or await a save, doesn't check loaded state, and doesn't send `expectedLastEditedAt`. `server/services/ai-actions.service.ts:63-66` calls `startPublish(siteId, actorId, pages)` with no opts. `publish.service.ts:393` only checks staleness when `opts.expectedLastEditedAt` is present. Also new: the client's `isFeatureEnabled("publish")` flag is not consulted on the AI path (the server's approval and Vercel gates still apply). |
| RR-04 | The viewer's Review door and backend read permissions disagree | **Confirmed in code @df60cf9ec, and worse than stated** | `reviews.status` requires EDITOR when `agency_layer` is on (`reviews.ts:171-176`). `fetchReviewStatus` swallows the FORBIDDEN as `{...UNKNOWN, readFailed:true}` (`services/ReviewService.ts:58-66`), so `reviewsEnabled` is falsy for a VIEWER. That **hides** the Review rail tab (`LeftSidebar.tsx:227`, `TabRouter.tsx:241`), the Comments toggle (`StudioHeader.tsx:742`) and the `C` shortcut (`useEditorShortcuts.ts:117`), even though `VIEWER_TABS` lists `review` (`rail/tabsConfig.ts:328-334`). If a VIEWER does get in (e.g. via the ⌘K nav row), `ReviewTab.load` uses one `Promise.all([fetchCurrentRound(), fetchReviewComments()])` (`ReviewTab.tsx:~233`). `currentRound` is EDITOR-gated (`reviews.ts:204-209`), so the whole panel goes to `error`. The composer is disabled with "Viewers can't comment" (`ReviewTab.tsx:1107-1108`) even though `comments.create` explicitly allows viewers (`server/trpc/routers/comments.ts:39-44`). |
| WS-04 | The Analytics "verified" dialog claims a GA ID "is receiving data" based on Buildrik's own beacon count | **Confirmed in code @df60cf9ec** | `settings/components/ConnectionVerifiedDialog.tsx:35-41` prints "`${id} is receiving data`". The count is `prisma.analyticsEvent.count({siteId,...})` (`server/services/analytics.service.ts:101-109`). It never involves the GA property. |
| UX-22 / IA-07 | Full-page tools leave the covered editor chrome reachable by keyboard and screen reader | **Confirmed in code @df60cf9ec** | `editor/sidebar/FullPageRouter.tsx:114-197` portals a `fixed inset-0` host. Nothing applies `inert` or `aria-hidden` to `.bk-header`, the rail or the footer. `LayoutShell.css:318-327` only hides drawer, canvas and inspector. Focus isn't moved into the portal or restored on close (no `useFocusTrap` in the hosts). The Brand host (`FullPageRouter.tsx:186-197`) **still lacks `data-bk-surface="fullpage"`**, and that attribute is the one `CommandCenter.shouldHandleShortcut` uses to stand down (`engine/commands/CommandCenter.ts:219-226`). See defect D-3. |
| CI-02 | The live interaction runtime has reversal and cleanup gaps | **Confirmed in code @df60cf9ec, but the runtime is never started from the UI** | `engine/interactions/InteractionRuntime.ts:333-339` `reverseAnimation` is a devLog placeholder. Lines 216/224/247 add `window` scroll/beforeunload listeners but record them under fake event names on the element. `stop()` (lines 98-107) calls `element.removeEventListener("__page-scroll", …)`, so the window listeners leak. `addListener` stores one handler per `(element,type)` (line 281), so a second interaction with the same trigger on the same element overwrites the record and the first listener is never removed. **New:** `composer.setPreviewMode()` is the only caller of `startRuntime()` (`engine/Composer.ts:1403-1414`), and nothing in `src/` calls `setPreviewMode`. In the shipping editor the GSAP runtime is dormant: CI-02 can't currently be triggered by users, and interactions can't be watched live anywhere. |
| UX-24 | Back-to-canvas presentation varies between full-page tools | **Confirmed in code @df60cf9ec** | Settings: link-variant Button + `ChevronLeft` icon, centred in the nav (`SettingsTab.tsx:~978-992`). Brand: link-variant + `ChevronLeft` (`BrandWorkspace.tsx:938-948`). Templates: `color="light"` button with a literal "‹" glyph whose label changes per state ("‹ Back to templates" / "‹ Back to Pages" / "‹ Back to canvas", `TemplatesTab.tsx:455-462`). Assets: a "‹ Back to canvas" Button in the **top header row** (`LibraryManager.tsx:847-849`), not the nav. The preview overlay and CMS sheet use their own variants too. |
| UX-20 | The asset manager's primary-action consistency is weak | **Partially still true** | Upload is the one `mgr-btn-primary` and is disabled-with-reason for viewers (`LibraryManager.tsx:113-118, 790-800`; good). Back sits in the header beside it rather than in a left nav like the other three tools (UX-24). Wording and visual hierarchy are DESIGN, not assessed. |

---

## 1. Module map

| Module | Purpose | Entry points | Main actions | Dependencies | Evidence |
|---|---|---|---|---|---|
| **Role resolution** | Effective role per site (workspace role capped by a per-site `roleOverride`; site-scope enforcement) | Server-side only; editor reads `sites.myRole` | — | `server/services/permission.service.ts:162-203` (`getEffectiveSiteRole`, `checkSiteRole`), `lib/constants/enums.ts:7-16, 69-75` (ROLE_RANK: VIEWER 0, EDITOR=DESIGNER 1, ADMIN 2, OWNER 3) | CODE |
| **Editor role client** | Caches the role for the session; `null` = unknown means "don't gate" | `services/RoleService.ts:28-49`, `editor/shell/hooks/useEditorRole.ts:12-38` (`useEditorRole`, `useViewerChrome`) | `invalidateMyRole` on a FORBIDDEN save (`useSaveCallback.ts:90-121`) | Has its **own RANK copy** (`RoleService.ts:15-21`), which duplicates `ROLE_RANK` | CODE |
| **Viewer read-only mode** | A VIEWER is forced to `?view=readonly` by the server page | `packages/dashboard/app/edit/[siteId]/page.tsx:53-68` (redirect). Editor: `shared/utils/editorViewMode.ts`, `StudioPanels.tsx:298-330` (sets `composer.readOnly`, root classes `bk-read-only-view`/`bk-viewer-chrome`) | Rail limited to `VIEWER_TABS` = layers, assets, history, review, activity (`rail/tabsConfig.ts:328-338`). Inspector column replaced by `ViewerRoleNotice`. Canvas handlers withheld (`Canvas.tsx:725-753`). `CommandCenter.run` refuses MUTATING_COMMANDS (`CommandCenter.ts:67-73, 142-148`) | `useViewerChrome` = readonly URL AND role === VIEWER | CODE + REACH |
| **Permissions dialog** | Explains the capabilities of the current role | ⌘K "Permissions" (`CommandPalette.tsx:168` → `EVENTS.UI_OPEN_PERMISSIONS` → `shell/PermissionsHost.tsx`). Viewer: "View permission details" on `ViewerRoleNotice.tsx` | OWNER: Delete site → `DeleteSiteModal` → `SiteDeletedScreen` | `shell/modals/PermissionsModal.tsx` (copy only, "not checks") | CODE + REACH |
| **Per-site role overrides / access** | Grant a site, cap a role | Dashboard `/dashboard/sites/[id]/access` (`components/site-detail/access-tab.tsx`) | — | `SitePermission` rows; `resolveSiteScope` | CODE (dashboard, not walked) |
| **Comments & anchors** | Canvas pins + orphan recovery + reattach | Topbar Comments toggle (only when `reviewsEnabled`), `C` key (`useEditorShortcuts.ts:117`), `ui:comment-mode` event | create pin, list, reattach (EDITOR), resolve/reopen (EDITOR) | `editor/canvas/comments/CommentLayer.tsx` (650 LOC), `commentAnchors.ts`, `services/ReviewService.ts`, `server/trpc/routers/comments.ts`, `comment.service.ts` | CODE + REACH (flag-dependent) |
| **Review rounds** | Send for review, round banner, compare to the approved snapshot, revoke/resend, history | Rail `review` tab (right column), topbar review chip, Publish CTA's "next move" | submit (EDITOR, agency_layer), currentRound/rounds/approvedSnapshot (EDITOR), revoke (EDITOR), internal resolve (workspace ADMIN, dashboard queue) | `sidebar/tabs/review/ReviewTab.tsx`, `RoundHistoryModal`, `ReattachModal`, `server/trpc/routers/reviews.ts`, `review.service.ts`, `publish-approval.ts` | CODE + REACH when `agency_layer` is on |
| **Client review page** | Public token page for client sign-off | `/review/[token]` (`packages/dashboard/app/review/[token]/review-client.tsx`, 553 LOC) | identify (email must match), comment, approve / request changes, request a new link | `server/trpc/routers/client-review.ts` (public + rate-limited) | CODE |
| **Activity log** | Server activity + comment events | Rail `activity` (right column) | filter, retry | `sidebar/tabs/activity/ActivityLogView.tsx` (states loading/ready/empty/error/permission), `activity.recent` | CODE + REACH |
| **Notifications** | Bell panel | Topbar bell → `shell/NotificationPanel.tsx` | mark-all-read, open row | `notifications` router | CODE + REACH |
| **Realtime collab** | Presence, cursors, LWW ops over SSE | Topbar Collaborate CTA + ⌘K "Start collaboration session". **Both flag-gated** (`StudioHeader.tsx:296, 869`; `CommandPalette.tsx:300`) | startSession | `engine/collaboration/CollaborationManager.ts` (825 LOC), `SSETransport`, `OTEngine`; server `collab.service.ts:isCollabEnabled` | PLANNED (flag `NEXT_PUBLIC_FEATURE_COLLAB` off) |
| **Agency / clients / handover** | Client accounts, assignment, handover rollup | Dashboard `/dashboard/agency/*` | ADMIN + `agency_layer` | `server/trpc/routers/clients.ts`, `handover.ts` | CODE (dashboard, not walked) |
| **Interactions** | Trigger → animation per element | Inspector › Behaviour › Interactions (`inspector/sections/registry/behaviour.tsx:191`) → `sections/interactions/index.tsx` | add (AddInteractionPanel, 14 triggers), edit preset/duration/delay/easing, enable/disable, delete, Preview | `engine/interactions/{InteractionManager,InteractionRuntime}.ts` (GSAP, editor) + `engine/export/interactionRuntime.ts` (WAAPI, published) | CODE + REACH |
| **Element CSS animation** | One CSS keyframe animation per element (on load) | The same section's "animation" row → `ElementAnimationEditor` → `editor/animation/AnimationEditor.tsx` | type, duration, easing, delay, iterations, Preview | `ElementOperations.setAnimation` (`engine/elements/ElementOperations.ts:212-250`) writes the inline `animation` style; keyframes in `shared/constants/animationKeyframes.ts` (injected into the canvas and the export) | CODE + REACH |
| **AI** | Scoped plan/run agent, element door, undo-all, privileged-action gate | AI in the inspector column (`StudioPanels` `aiInInspector`), "✨ Ask AI" (`AquibraStudio.tsx:709`), "Improve with AI" doors | plan → run/approve/skip/stop, Undo all, Retry, privileged `site.publish` confirm | `sidebar/tabs/ai/*` (AITab 458 LOC, AgentPlan, useAgentRunner, applySetStyle with lock gate `:630-638`), `server/trpc/routers/ai.ts:334` (`streamPrompt`, per-user quota, no site role), `actions` router + `ai-actions.service.ts` | CODE + REACH |
| **Chrome DS / a11y** | Primitive library + focus + overlays | `src/editor/chrome-ui/*` | — | `chrome-ui/focus.ts` (`useFocusTrap`, `isModalOpen`), `OverlayMount.tsx`, `Modal.tsx`/`ModalParts.tsx`, `Icon.tsx` (IconButton requires `label`), `themes/design-system/a11y.css` (global `*:focus-visible` outline) | CODE |

---

## 2. Screen / flow inventory (scope)

- **Permissions**: `editor/shell/modals/PermissionsModal.tsx` (viewer variant + `MemberPermissions`), `shell/PermissionsHost.tsx`, `shell/modals/DeleteSiteModal.tsx`, `SiteDeletedScreen` (in PermissionsHost), `shell/ViewerRoleNotice.tsx`.
- **Viewer chrome**: `StudioPanels.tsx` (rail/drawer/inspector layout under view mode), `StudioHeader.tsx:746-835` (viewer topbar: Preview, Comments [flag], Publish shown **disabled**), `rail/tabsConfig.ts` VIEWER_TABS.
- **Dashboard denial**: `packages/dashboard/app/edit/[siteId]/page.tsx:41-51` `DeniedState` "You don't have access to this site".
- **Review**: `sidebar/tabs/review/ReviewTab.tsx` (round banner, open/resolved/detached groups, "Comment located" block, reply composer, resend/revoke confirms), `RoundHistoryModal.tsx`, `ReattachModal.tsx`, `locate.ts`; SendForReview flow (inside ReviewTab, `:845, :1214`).
- **Comments on canvas**: `canvas/comments/CommentLayer.tsx` (PinDot, draft composer modal, orphan detection, pick-to-reattach).
- **Client review**: `/review/[token]` states A0 identify, A–C active/changes, D approved, E approved-but-edited, F dead link (expired/revoked/not-found/answered) (`review-client.tsx:10-35, 179-470`).
- **Activity**: `sidebar/tabs/activity/ActivityTab.tsx`, `ActivityLogView.tsx`, `BackToActivityRow.tsx`; History › Activity view `sidebar/tabs/history/components/ActivityView.tsx`.
- **Notifications**: `shell/NotificationPanel.tsx` (role=dialog, non-modal).
- **Collab**: `editor/collaboration/PresenceIndicators.tsx`, topbar presence (flag).
- **Interactions**: `inspector/sections/interactions/{index,AddInteractionPanel,InteractionItem,InteractionEditor,ElementAnimationRow}.tsx`, `editor/animation/AnimationEditor.tsx`.
- **AI**: `sidebar/tabs/ai/{AITab,AgentPlan,Composer,EmptyThread,ScopeChip}.tsx`. States: not-configured, quota, failed, residue, column35 suggestions, scope note, plan/run, ConfirmDialog for privileged actions.
- **Full-page tools**: `sidebar/FullPageRouter.tsx` → Templates (`tpl-host`), Assets (`mgr-host`, `media/LibraryManager.tsx`), Settings (`set-host`), Brand (`brand-host`, `design-system/ui/BrandWorkspace.tsx`). Overlays: `shell/PreviewOverlay.tsx`, `shell/CompareHost.tsx`.
- **Reusable a11y controls**: `chrome-ui/OverlayMount.tsx`, `chrome-ui/focus.ts`, `chrome-ui/Modal.tsx`, `ModalParts.tsx` (`ModalRoot`), `ConfirmDialog.tsx`, `Icon.tsx` (`IconButton`), `Tooltip.tsx`, `Popover.tsx`, `Rail.tsx` (aria-current), `Tabs.tsx` (roving tabindex), `shared/utils/openEscapeSurface.ts`.

---

## 3. Control traces

**T1 — A VIEWER opens the editor.** `/edit/:id` → `getEditorAccess` (`sites.service.ts:1301-1314`) → `"view"` → redirect to `?view=readonly` → `EditorClient`. In the editor: `getEditorViewMode().readOnlyView=true` → `StudioPanels.tsx:315` sets `composer.readOnly=true` → `CommandCenter.run` refuses mutating ids. `useViewerChrome` fetches `sites.myRole`. If that fetch fails, the role is `null` and the viewer gets the **owner's bare preview layout** (no rail), and `canLeaveView = roleAtLeast(null,"EDITOR") !== false` → **true**, so "‹ Back to editing" is offered (`StudioHeader.tsx:290, 793-794`). Clicking it drops `?view`, and the server redirects back. Safe, but a confusing loop. **Break point**: `composer.readOnly` only gates `CommandCenter`. `writeElement`/`writableElements` (`engine/commands/commandOperations.ts:192-234`) check lock, **not** `readOnly`. Read-only safety for direct `composer.elements.*` writes (inspector, AI apply, drop ops, interactions) depends on the UI not mounting those surfaces.

**T2 — Comment pin (EDITOR, agency on).** `C` / topbar toggle → `ui:comment-mode` → CommentLayer click → draft modal → `createPinnedComment` (`ReviewService.ts:292`) → `comments.create` (`assertSiteAccess` + 30/min rate limit) → `comment.service.createComment` → `Comment` row (pageId, x/y fractions, `targetSelector`). It renders as a pin in the canvas content root. Orphans are detected client-side (`detectOrphans`), and the deleted element's name is kept **for the session only** (`CommentLayer.tsx:44-58`). Agency off: no door at all (`StudioHeader.tsx:742`), although `comments.*` works server-side.

**T3 — Resolve a comment.** ReviewTab → `resolveReviewComment` → `comments.resolve` (EDITOR) → `resolveComment` (site-bound). It stays in place under a "RESOLVED" band for this session.

**T4 — Send for review.** ReviewTab/SendForReview → `exportPublishPages` → `reviews.submit` (agency_layer, EDITOR, 5/… rate limit) → `submitReview` freezes the pages and emails the client when `clientEmail` is set. The token comes back only for ADMIN+ (`reviews.ts:103-114`). Approval: client `/review/[token]` → `client-review.service`, or internal `reviews.resolve`. That one is a **workspace** ADMIN check via `resolveWorkspaceId(ctx)` (session workspace) and ignores the per-site `roleOverride` cap (`reviews.ts:180-191`; `review.service.ts:527-552`). It then feeds `publishApprovalBlock` (`publish-approval.ts:83-100`) when `editsRequireApproval` is on.

**T5 — Add an interaction.** Inspector › Interactions › "+ Add interaction" → AddInteractionPanel → `addInteraction(trigger)` writes `{preset:"fadeIn", duration:300, delay:0, easing:"easeOut", target:"self", reverse:false, loop:1}` (`engine/interactions/types.ts:199-207`) → `onInteractionsChange` → `writeElement(composer, el, "interactions-change", el.setInteractions)` (lock-gated, one undo step; `registry/behaviour.tsx:44-50`) → `data.interactions` on the element → `ElementStyles.ts:75` renders `data-buildrick-interactions` JSON on the canvas node → save via the normal project autosave → export: `shared/utils/html/generation.ts:107` + `buildInteractionRuntimeScript()` (WAAPI). **Editor-side live result: none.** The GSAP runtime isn't started (§0 CI-02).

**T6 — Interaction "Preview" button.** `InteractionEditor.tsx:176` → `behaviour.tsx:52-59` sets `domEl.style.animation = "bd-anim-${preset} ${duration}ms ${easing} ${delay}ms 1 normal forwards"`. **Chain breaks here**: `easing` is never a CSS timing function. The default is `"easeOut"`, and the dropdown values are GSAP strings (`"none"`, `"power2.out"`, `"elastic.out(1, 0.3)"`, …) from `GSAPEngine.EASINGS` (`engine/animations/GSAPEngine.ts:75-86`, `interactions/types.ts:178-181`). An ident or GSAP string in that slot makes the shorthand invalid, so the declaration is dropped and **nothing plays**. See D-1.

**T7 — Element CSS animation.** "+ Add animation" → `DEFAULT_ANIMATION` → `writeElement(... "animation-change", el.setAnimation)` → `ElementOperations.setAnimation` writes `data.animation` and the inline `animation` style with CSS easing values (`AnimationEditor.tsx:55-63`; valid). Preview restarts the inline animation (`behaviour.tsx:77-85`). This works on paper. The trigger row was removed, so it is always "on load".

**T8 — AI run.** Prompt → `useAgentRunner.start` → `ai.streamPrompt` subscription (per-user quota, no site role) → plan steps → `applyAiEdit` per step: refuses locked elements (`applySetStyle.ts:630-638`), all-or-nothing per command, records one history entry plus an undo handle (`:716-730`). "Undo all" walks the handles and stops at the first entry a newer edit sits on (`useAgentRunner.ts:413-420`). Persistence goes through normal autosave. The `propose-action` command → `useAiActionGate.propose` → `actions.propose` (role EDITOR) → ConfirmDialog → `confirm` → export pages → `actions.confirm` → `startPublish` (RR-02 break: no freshness or loaded checks).

**T9 — Escape.** `CommandCenter` (window capture) "deselect" stands down for open escape surfaces and `[data-bk-escape-owner]` (`CommandCenter.ts:244-258`). The focus trap (document capture, topmost dialog only) handles modals (`focus.ts:73-86`). Full-page tools each register their own window Escape: Brand capture (`BrandWorkspace.tsx:387-405`), Library bubble (`LibraryManager.tsx:153-170`), Settings guard. For Brand, the CommandCenter "deselect" also runs on the same Escape, because no `data-bk-escape-owner` or `data-bk-surface` is set. Effect: the hidden canvas selection is cleared along with leaving Brand.

---

## 4. State coverage

| Screen family | empty | loading | hover | focus | selected | disabled | read-only | validation-error | saving | saved | unsaved | failure | conflict | recovery |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Viewer chrome / Permissions | n/a | role `null` = ungated, no spinner (`useEditorRole.ts:12`) | — | global ring (`a11y.css:111-125`) | rail `aria-current` | Publish disabled (`StudioHeader.tsx:835`); HistoryTab/ReviewTab disable with `title` reasons | Yes (view mode) | n/a | n/a | n/a | n/a | role fetch fail → silently ungated | n/a | demoted mid-session → keep unsaved locally + switch to readonly (`useSaveCallback.ts:90-121`) |
| ReviewTab | yes ("no round") | `loading` | yes | — | located block | resend/revoke/composer disabled for viewer | partial | reply error (`replyError`) | `sending`/`resending` | notice | — | `error` (coupled Promise.all — RR-04) | revoke race (`expectedRevision`) | resolve-failed retry in place (`resolveFailed`) |
| CommentLayer | empty mode | fetch | pin hover | — | draft | — | hidden for viewer (flag) | — | — | toast | draft modal | toast on fail | orphans → Detached | reattach picker |
| Client review page | — | yes | — | — | — | identify pending | terminal states D/E | identify error (`review-client.tsx:286`) | "One moment…" | D approved | — | F dead link ×4 | E edited-since-approval | request new link |
| Activity | `empty` | `loading` | — | — | — | — | — | — | — | — | — | `error` + Retry | — | `permission` state (`ActivityLogView.tsx:48, 229`) |
| Notifications | "all caught up" | skeleton `role=status` | — | panel `tabIndex=-1` | unread | — | — | — | — | — | — | `error` + toast on mark-all fail | — | — |
| Interactions section | "+ Add interaction" only | — | — | — | drill-in edit screen | Enable/Disable toggle | **no read-only variant** (hidden for viewers) | duration/delay clamped by TimingInput | — | — | — | Preview silently does nothing (D-1); locked → toast via LOCKED_ELEMENTS_SKIPPED | — | undo via history |
| AnimationEditor | — | — | — | — | — | — | — | min/max on iterations | — | — | — | — | — | — |
| AI | EmptyThread / suggestions | planning/running | — | composer focus on Edit prompt | scope band | composer hidden when not-configured | n/a | — | — | — | — | not-configured / quota / failed / residue (`AITab.tsx:308-368`) | stops at a newer entry on Undo all | Retry, Continue by hand, Undo all |
| Full-page tools (Settings/Brand/Templates/Assets) | per tool | lazy Suspense | — | **no focus entry/return, covered chrome not inert** | nav current | media viewer: aria-disabled + Tooltip | Assets for viewer | Settings validation | Settings draft | — | Settings unsaved guard (`UnsavedSettingsDialog`); Brand "nothing is staged" | per tool | — | — |
| Modals (OverlayMount) | — | — | — | focus in, Tab trap, restore on close (`focus.ts:36-106`) | — | — | — | — | — | — | dirty pulse on scrim (`OverlayMount.tsx:61-69`) | — | — | — |

---

## 5. Ownership rows

| Property/action | Current editing location(s) | Value owner | Scope | Local/inherited/shared/bound/overridden | Who may change it (role check) | Side effects | How the source is shown | Reset/unlink semantics | Applied vs saved vs published |
|---|---|---|---|---|---|---|---|---|---|
| Workspace role | Dashboard team settings | `WorkspaceMember.role` | workspace | base | ADMIN+ (`checkWorkspaceRole`) | Changes rank on every site | Editor: ViewerRoleNotice says "**Workspace role**: X" but shows the **effective site** role (`ViewerRoleNotice.tsx:27`) | — | Immediate server-side; the editor caches it until a refused save (`invalidateMyRole`) |
| Per-site role override | Dashboard site Access tab | `SitePermission.roleOverride` | site | caps (never raises) the workspace role (`permission.service.ts:183-189`) | ADMIN+ | **Also turns the member into "specific sites only"** (scope rule `:55`) | Not surfaced in the editor; `myRole` returns the effective role only | Remove the row = uncapped, but if it was the last row the member also becomes all-sites | Server immediate; editor stale until reload |
| Internal review approval | Dashboard review queue | `ReviewRequest.status` | site | — | **workspace** ADMIN (`reviews.ts:185`) ignores the site cap; session workspace, not the review's site workspace | Unblocks publish when `editsRequireApproval` | Review chip / ReviewTab banner | Stale when the site is edited after approval (`publish-approval.ts`) | Gate checked at publish |
| Review revoke | ReviewTab ⋯ | `ReviewRequest.revokedAt` | site (claimed) / workspace (actual) | — | EDITOR on `input.siteId` (RR-01) | Kills the client link; activity row | Banner | none | immediate |
| Comment resolve/reattach | ReviewTab, CommentLayer | `Comment.status`, `targetSelector` | site | — | EDITOR (`comments.ts:84-115`) | resolver metadata | RESOLVED band | Reopen = same mutation | immediate |
| Comment create | CommentLayer, ReviewTab reply | `Comment` | site/page/element | — | **any member** (server) vs **EDITOR+ and agency-on** (UI) | notifications? (not traced) | — | — | immediate |
| Element lock | Context menu / Layers / ⌘ shortcut | element `locked` flag (document) | element | shared by everyone (no owner) | Any EDITOR (mutating command); not role-scoped | Every write path refuses (`writableElements`); AI refuses | lock badge in Layers, SelectionBox lock chip | Unlock by anyone with edit rights | Saved with the project; published output unaffected |
| Collab soft lock | — | `CollaborationManager.elementLocks` (memory) | element/session | — | — | **Not wired**: `acquireLock`/`getLock` have no callers outside the manager | — | — | flag off |
| Interactions | Inspector › Interactions | `element.data.interactions` | element (no breakpoint, no class/component level) | local | edit rights + not locked | Adds `data-buildrick-interactions` attr; export adds a runtime script | Row label = trigger | Delete per row (undoable); no reset | Applied to the canvas attr (inert); saved by autosave; published runtime = WAAPI (different engine from the editor's GSAP) |
| Element animation | Inspector › Interactions › animation row | `element.data.animation` **and** inline style `animation` | element (writes the base/inline style; breakpoint behaviour not verified) | local; two copies of one value (data + style) | edit rights + not locked | Overrides any `animation` set in Style/custom CSS | Row "On load · Fade In" | Clear removes both | applied immediately on canvas |
| Template apply | Templates full page | page content | page/site | — | UI: **ADMIN** (`TemplatesTab.tsx:153`); PermissionsModal says EDITOR/DESIGNER **may** (`PermissionsModal.tsx:131-135`); server `templates.applyToSite` ADMIN | rewrites the page | — | backup taken | — |
| Publish via AI | AI ConfirmDialog | Site deployment | site | — | EDITOR (`ai-actions.service.ts:52`) | Live deploy | Toast "Publishing…" + poll | not undoable | **Bypasses the save/freshness baseline (RR-02)** |

Flags: **competing surfaces**: comment policy (server says any member, UI says EDITOR+ with agency), template apply (UI says ADMIN, modal copy says EDITOR). **Silent global effect**: adding a role override also scopes the member to specific sites. **Misleading editability**: the "Workspace role" label shows the effective site role. VIEWER `RoleDescription` says "Cannot open the editor" (`enums.ts:52`) but `getEditorAccess` opens it read-only.

---

## 6. Gap candidates vs Webflow

(Webflow capabilities below are from memory; the doc agent should confirm.)

| Area | Buildrik evidence | Webflow capability (memory) | Classification | User impact | Suggested change | Priority |
|---|---|---|---|---|---|---|
| Interaction preview in the editor | GSAP runtime never started (`setPreviewMode` uncalled); Preview overlay has no `allow-scripts` (`PreviewOverlay.tsx:209-211`); the inspector Preview button is broken (D-1) | Interactions preview live in the Designer and in Preview mode | Missing capability | Authors can't see any trigger behaviour before publishing | Run the export WAAPI runtime (single engine) in Preview, or start the canvas runtime in a "preview interactions" toggle; fix D-1 | P1 |
| Interaction model | Trigger + single preset per row; no timeline, no multi-step, no scroll-progress scrub, no target classes; `target` only self/parent/selector (no UI for target, not verified) | Interactions 2.0 timelines, multi-action, scroll-linked, class targets, reusable interactions | Partial implementation | Complex motion impossible | Decide the intended depth; at minimum a target picker and reverse | P2 |
| Reverse on hover-out (editor) | placeholder (`InteractionRuntime.ts:333`); export runtime does reverse | Built-in | Partial implementation | Editor and published behaviour disagree | Single runtime | P2 (dormant) |
| Two animation runtimes | GSAP (editor) vs WAAPI (`engine/export/interactionRuntime.ts`) with separate preset tables (3 sources incl. `animationKeyframes.ts`) | One engine | Inconsistent interaction | Drift (already happened 3×, per comments) | Collapse to one | P2 |
| Content-only role | EDITOR = DESIGNER rank (`enums.ts:69-75`) | Content Editor vs Designer split (content editors can't change styles) | Missing capability / Intentional difference | Clients can't be given safe content access | Capability model | P2 |
| Viewer commenting | Server allows (`comments.ts:39`), UI blocks (RR-04) | Commenters can comment | Ownership ambiguity | Reviewers on a viewer seat can't comment | Decide policy; decouple currentRound from the comment list | P1 |
| Comments without the agency layer | Toggle hidden when `reviewsEnabled` is false (`StudioHeader.tsx:742`) | Comments available to all plans that have them | Implemented but undiscoverable | Feature invisible on default workspaces | Separate the comment door from review rounds | P2 |
| Comment threads / mentions | Flat comments; reply = new comment without parent (`postReply`, `ReviewService.ts:283`) | Threads, @mentions, notifications | Missing capability | Discussion context lost | Parent id + mentions | P3 |
| Realtime co-editing | Flag-off, LWW, soft locks unwired | Webflow: page-level "one designer at a time" plus a conflict model | PLANNED | — | Keep flag off; wire locks before enabling | P3 |
| Page/element branch-locking for roles | Element lock is document-wide, anyone can unlock | Page branching / locked pages for Editor | Partial | — | Consider role-scoped lock | P3 |
| Focus isolation in full-page tools | UX-22 confirmed | Webflow panels are modal-aware | Missing state | Keyboard/SR users land behind the overlay | `inert` the shell while a fullpage surface is mounted; focus in/return | P1 |
| AI publish freshness | RR-02 | n/a (Webflow AI doesn't publish) | Ownership ambiguity | A stale tab can publish old content | Reuse the `PublishService` gate | P1 |
| Disabled-with-reason consistency | Media: aria-disabled + Tooltip (good). History/Review: native `disabled` + `title` (no tooltip on disabled, unreachable by keyboard). Templates: enabled → toast after click. SiteMenu Invite: hidden (`SiteMenu.tsx:255`) | — | Inconsistent interaction | The reason is invisible to keyboard/SR users | One `DisabledReason` pattern | P2 |
| Back-to-canvas / exits | UX-24 | Consistent ✕/Esc | Inconsistent interaction | Learnability | One component | P3 |

---

## 7. Exists in code but hidden or poorly exposed

1. **GSAP `InteractionRuntime` + `Composer.setPreviewMode`**: fully coded (534 LOC) but never started from any UI (`Composer.ts:1403-1414`; no caller). CODE, not REACH.
2. **Comments for non-agency workspaces**: the server's `comments.*` works without `agency_layer`, but every editor door is gated on `reviewsEnabled`.
3. **Viewer Review/comments**: `VIEWER_TABS` includes `review`, but the door is hidden by the FORBIDDEN `reviews.status` (RR-04).
4. **Collab soft locks** (`CollaborationManager.acquireLock/getLock/releaseLock`): no consumers. The flag is off anyway.
5. **Interaction `target` / `reverse` / `loop`** fields: runtime-supported. Not verified whether InteractionEditor exposes target/reverse. The visible controls traced are preset/duration/delay/easing/enable/delete only (`InteractionEditor.tsx:141-205`).
6. **Agency comments triage** `comments.workspaceList` (ADMIN): dashboard only.
7. **Per-site role override**: invisible in the editor; the Permissions modal doesn't say "capped on this site".

---

## 8. Preserve

- The **server is the enforcer**: all writes are role-checked (`checkSiteRole` everywhere; `PermissionError` → tRPC). The client role is explanation only, and `null` doesn't gate (`RoleService.ts:25-27`).
- The **`CommandCenter.run` read-only gateway** closes the keyboard and click paths at one point (`CommandCenter.ts:132-148`). Layers Delete reuses `commands.run("delete")` (`LayerTreeItem.tsx:158-167`).
- **Mid-session demotion handling**: on a FORBIDDEN save it keeps a local copy, invalidates the role and moves to readonly with the unload guard bypassed (`useSaveCallback.ts:90-121`).
- The **lock gate** is shared by Inspector, Interactions and AI (`writableElements` + `LOCKED_ELEMENTS_SKIPPED` toast; AI error text names the lock).
- **AI**: honest failure states (not-configured/quota/failed say "Nothing changed"), scoped-run notes, an **Undo all that refuses to undo the user's own newer work** (`useAgentRunner.ts:413-420`), and a privileged action that always needs a separate explicit dialog plus a server role re-check.
- **OverlayMount focus trap**: focus in, Tab wrap, restore, topmost-only Escape, dirty-scrim pulse (`focus.ts`, `OverlayMount.tsx`). `IconButton` requires `label` (`Icon.tsx:38`).
- **Media library viewer gating**: `aria-disabled` + Tooltip reason (the right pattern).
- **Client review page**: four distinct dead-link screens, an approved-but-edited state, email-match identity.
- **Review ADMIN-only token return** (S-7) and the race-safe revoke (`expectedRevision`).
- **Published runtime parity fixes**: `active` trigger and GSAP-easing mapping in the WAAPI runtime (`interactionRuntime.ts:141-180`).

---

## 9. Defects found in code

**D-1 (P1): Interaction "Preview" never plays.** `inspector/sections/registry/behaviour.tsx:58` builds `animation: bd-anim-${preset} ${duration}ms ${easing} ${delay}ms 1 normal forwards` with `easing` from `DEFAULT_ANIMATION_CONFIG.easing = "easeOut"` (`engine/interactions/types.ts:203`) or `EASING_OPTIONS` values (`"none"`, `"power2.out"`, `"elastic.out(1, 0.3)"`…; `interactions/types.ts:178`). None is a CSS `<easing-function>`. A second custom ident, a dotted token or an unknown function makes the shorthand invalid, so the browser drops it and the element doesn't animate. Scenario: select a heading → Interactions → + Add → Hover → Preview → nothing happens, for every easing option. No test covers `style.animation` here. Related: the Easing select's stored default `"easeOut"` matches no option value, so the select shows no or a wrong selection (not verified live). `bounceOut` has no `bd-anim-` keyframe in `shared/constants/animationKeyframes.ts`.

**D-2 (P2): Published runtime ignores legacy-shaped interactions.** The WAAPI `frames(a)` reads only `a.preset`/`a.loop` (`engine/export/interactionRuntime.ts` script body). The editor runtime reads `preset ?? type` and `loop ?? iterations` because older inspector builds wrote `type`/`iterations` (`InteractionRuntime.ts:301-316`; `interactions/types.ts` comment). Scenario: a project saved before the shape fix with a "bounceIn" interaction publishes as `fadeIn` with 1 iteration.

**D-3 (P1): Brand workspace doesn't suspend canvas shortcuts.** `FullPageRouter.tsx:186-197` omits `data-bk-surface="fullpage"`. `CommandCenter.shouldHandleShortcut` therefore keeps running canvas commands while Brand covers the canvas (`CommandCenter.ts:219-226`). Brand's root isn't `role=dialog`, so the WIDGET_ROLES carve-out doesn't apply. Scenario: select an element, open Brand, click a nav item (focus on a button), press Backspace → the hidden selected element is deleted (`delete` shortcuts `["delete","backspace"]`, `defaultCommands.ts:96-97`). ⌘Z likewise undoes canvas history; arrow keys nudge. Escape leaves Brand **and** deselects.

**D-4 (P2): `reviews.resolve` ignores the per-site role cap and uses the session workspace.** `reviews.ts:180-191` + `requireAdmin` (`checkWorkspaceRole`). An ADMIN capped to VIEWER on site X via `roleOverride` can still approve X's review and unblock its publish (PD-6 says the cap applies "on every site"). A multi-workspace admin acting from workspace B can't resolve a review in workspace A (the A-8 class bug, still present here).

**D-5 (P1): RR-01 (above).** Cross-site revoke within a workspace.

**D-6 (P1): RR-02 (above).** The AI publish has no freshness/loaded gate.

**D-7 (P2): Permission copy contradicts enforcement.**
- (a) `RoleDescription.VIEWER = "Read-only. Cannot open the editor."` (`lib/constants/enums.ts:52`), yet the editor opens in view mode (`edit/[siteId]/page.tsx:58-68`). It is shown in invite and team UIs.
- (b) PermissionsModal `allowed(…,"template")` is true for EDITOR/DESIGNER (`PermissionsModal.tsx:131-135`), while TemplatesTab refuses them with "Only an admin can apply a template" (`TemplatesTab.tsx:153-161`).
- (c) The viewer modal says "every editing control is disabled" (`:93`) but the inspector is replaced, not disabled.
- (d) The title uses the raw enum "signed in as a VIEWER" (`:55`).
- (e) "Viewers can't comment" (`ReviewTab.tsx:1107`) vs `comments.create` "viewers included".

**D-8 (P2): ReviewTab's coupled load.** `Promise.all([fetchCurrentRound(), fetchReviewComments()])` means one FORBIDDEN or failed call blanks the readable comments (RR-04).

**D-9 (P3): SSOT duplicates of role data in the editor.** `RoleService.ts:15-21` RANK, `ViewerRoleNotice.tsx:15-21` ROLE_LABEL, `PermissionsModal` capability rules. They can drift from `lib/constants/enums.ts` (which the comment there says is SSOT).

**D-10 (P3): CI-02 leaks (dormant).** `InteractionRuntime.stop()` doesn't remove `window` scroll/beforeunload listeners. A duplicate `(element,type)` registration overwrites the handler record (`:275-282`). Reverse is a no-op (`:333`).

**D-11 (P2, a11y): Disabled reasons are inaccessible.** `HistoryTab.tsx:217-218`, `ReviewTab.tsx:436-437, 454-455` put the reason in `title` on a natively `disabled` button. Disabled buttons don't receive focus and many browsers don't show the title tooltip, so keyboard and SR users never get the reason. Media uses the correct `aria-disabled` + Tooltip pattern.

**D-12 (P2, a11y): Full-page focus isolation (UX-22).** There is no `inert`/`aria-hidden` on the covered topbar/rail/footer. Focus isn't moved into the portal (it stays on the rail button underneath) or returned on close. Applies to Templates, Assets, Settings and Brand.

**D-13 (P3, a11y): `OverlayMount`'s `role="dialog"` element uses `style={{display:"contents"}}` when not pulsing** (`OverlayMount.tsx:79`). `display: contents` has a history of dropping the element's role and name from the accessibility tree (WebKit). Needs a live AX-tree check.

**D-14 (P3): InteractionEditor a11y and style.** `<label style>` isn't associated with its inputs (no `htmlFor`/`id`; `InteractionEditor.tsx:150-166`). It uses inline style objects (`styles.*`) in chrome, against the editor CLAUDE.md rule. `AnimationEditor.tsx:203` has an emoji in a button label ("▶️ Preview Animation"). Relative `../../../../engine` imports appear in `AITab.tsx:4`, `interactions/index.tsx:14` and `interactions/types.ts:6-7` (the `../../` ban).

**D-15 (P3): Role-unknown viewer gets the edit door.** When `sites.myRole` fails, `canLeaveView` is true and a VIEWER sees "‹ Back to editing" (`StudioHeader.tsx:290, 793`). The server redirects them back, which reads as a broken button.

**D-16 (P3): `ViewerRoleNotice` says "Workspace role" but renders the effective site role**, which can be capped by an override.

---

## 10. Live checks needed

Base: `http://localhost:3300/edit/<siteId>`. Fixtures needed: one OWNER, one EDITOR, one VIEWER, and one ADMIN with a `SitePermission.roleOverride=VIEWER` on the site. One workspace with `agency_layer` ON and one with it OFF.

1. **D-1 Interaction preview.** As OWNER, select any text element. Inspector › Interactions › "+ Add interaction" › Hover. In its edit screen, click Preview. Measure in the console: `document.querySelector('[data-buildrick-id="<id>"]').style.animation` right after the click. Expected if the defect holds: `""` (empty), with no visible motion. Repeat for each Easing option. Then set Easing to "Linear" and repeat (value `"none"`), expecting it still empty. Compare: if the string is non-empty, record `getComputedStyle(el).animationName` 50 ms later.
2. **D-1 Easing select default.** Same element, new interaction. Read the Easing select's displayed text and `select.value` (DOM). Expected defect: the displayed option doesn't correspond to the stored `"easeOut"`.
3. **CI-02 reachability.** Run `window.__composer?.isPreviewMode?.()` or check that no `INTERACTIONS_RUNTIME_STARTED` event is emitted when clicking the topbar Preview. Expected: the runtime is never started, and hovering an element with a hover interaction on the canvas produces no GSAP tween (no `style.transform`/`opacity` change via `getComputedStyle`).
4. **Preview overlay interactions.** Add a "Click" interaction (preset bounce) and click topbar Preview. In the overlay iframe, click the element and check `iframe.contentDocument.getAnimations().length`. Expected: 0 (sandbox has no scripts).
5. **Published interaction.** Publish (simulation is fine) or export HTML. Open the exported page, hover/click the element, and check `document.getAnimations().length > 0`. Expected: it plays (WAAPI).
6. **D-3 Brand shortcut leak.** As OWNER, select an element (note its id and the Layers count). Open Brand (rail Design / ⌘K). Click the "Colours" nav item so focus is on a button, then press Backspace. Close Brand. Expected defect: the element is gone (Layers count −1; `document.querySelector('[data-buildrick-id="<id>"]') === null`). Then ⌘Z restores it. Repeat in Settings: expected no deletion (it has `data-bk-surface`).
7. **D-3 Escape deselect.** Select an element, open Brand, press Escape. Back on canvas, check whether the selection is empty (`composer.selection.getSelected().length`). Expected defect: deselected.
8. **UX-22 focus isolation.** Open Settings. Press Tab repeatedly (≥40) and log `document.activeElement.closest('[data-testid]')?.dataset.testid` each time. Expected defect: focus reaches elements inside `.bk-header`/rail behind the portal. Also check `document.activeElement` immediately after opening (expected: still the rail button) and after "Back to canvas" (expected: `body`, not the opener). Repeat for Templates, Assets and Brand.
9. **RR-04 viewer review.** Use workspace agency_layer ON, a site with an open round and ≥1 comment. As VIEWER, open `/edit/<siteId>` (it should redirect to `?view=readonly`). Check that the rail has no Review button (DOM `[data-testid*="rail"]` labels) and that the topbar has no Comments toggle. Press `C`: no comment mode. Network: `reviews.status` returns 403. Then open ⌘K and type "Review"; if a row exists, open it. Expected: ReviewTab error state, `reviews.currentRound` 403, `comments.list` 200.
10. **Viewer comment policy.** As VIEWER, call `comments.create` via the tRPC client in the console. Expected: 200 (server allows), which contradicts the UI.
11. **D-4 capped admin.** As the ADMIN with roleOverride=VIEWER on site X, open the dashboard review queue and Approve X's pending review (submitted by someone else). Expected defect: 200, review APPROVED.
12. **RR-01.** As EDITOR on site A (scoped grant only to A), call `reviews.revoke({siteId:A, reviewId:<review on site B>, expectedRevision:<B.updatedAt ISO>})` in the same workspace. Expected defect: `{revoked:true}` and site B's client link is dead.
13. **RR-02.** As EDITOR in two tabs: Tab 1 edits a heading and saves. Tab 2 (stale, no reload) opens AI and asks "publish the site", then confirms. Check the published HTML for the old heading. Also check the network: `actions.confirm` payload has no `expectedLastEditedAt`.
14. **D-7(b) Template apply.** As EDITOR, open ⌘K › Permissions and note the "Apply a template" row (expected: allowed). Then Templates › Use on a template. Expected: warning toast "Only an admin can apply a template".
15. **D-7(a) copy.** As ADMIN, open the dashboard invite modal and read the Viewer description (expected: "Cannot open the editor"). Then as a VIEWER confirm the editor opens read-only.
16. **D-11 disabled reasons.** As VIEWER, open History. Tab to the "Clear history" button: expected to be skipped (disabled). Hover it and check whether a tooltip appears (record a screenshot after 1.5 s). Check the AX tree (`getComputedAccessibleNode` / Playwright `accessibility.snapshot`) for the reason text. Compare with Assets › Upload (aria-disabled + Tooltip), which should be focusable with the reason announced.
17. **D-13 dialog role.** Open any modal (e.g. ⌘K › Permissions). Take a Playwright `page.accessibility.snapshot()` and confirm a node with role `dialog` and the modal's name exists. Test Chromium and WebKit.
18. **Focus ring visibility.** In the AI panel, Tab to "Continue by hand…" / "‹ Inspector" (which use `tw:focus:ring-0`). Read `getComputedStyle(el).outlineStyle/outlineWidth/boxShadow`. Expected: an outline of 2px solid accent from `a11y.css:111`. If `outline-style` is `none` and box-shadow is `none`, focus is invisible.
19. **D-15.** As VIEWER, block `sites.myRole` (DevTools request blocking) and load `?view=readonly`. Expected defect: the topbar shows "‹ Back to editing", and clicking it navigates and is redirected back to `?view=readonly`.
20. **Collab flag.** Confirm the topbar has no Collaborate CTA and ⌘K "Start collaboration session" is absent (flag off). `GET /api/sse/collab/<siteId>` should return 404.
21. **AI states.** With no provider key, run a prompt. Expected: `[data-testid="ai-state-not-configured"]` and no composer. With a key: run an element-scoped prompt, then make a manual edit, then "Undo all". Expected: only the AI entries after your edit are undone, and it stops at your edit (Layers/DOM unchanged for your edit). Lock the element, then run AI. Expected: an error naming the lock and no change.
22. **WS-04.** Settings › Analytics. Enter a valid-format, unrelated GA ID (e.g. `G-AAAAAAAAAA`) on a site with Buildrick beacon events in the last 24 h. Click Check data. Expected defect: "G-AAAAAAAAAA is receiving data".

Not verified here: dashboard Access tab UI, agency/handover screens, notifications delivery/SSE, client-review approve end-to-end, whether InteractionEditor exposes target/reverse/loop, element-animation breakpoint scoping, and the AX behaviour of `display:contents`. DESIGN: not assessed.
