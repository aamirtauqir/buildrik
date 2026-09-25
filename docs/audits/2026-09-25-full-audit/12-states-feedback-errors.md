# 12: States, Feedback and Error Handling (Prompt 12)

**Agent:** C, Interaction & UX · **Date:** 2026-09-25 · **Mode:** read-only.

**Scope:** what the product shows, and what happens to the user's data, in these states:
- default, loading, empty and no results;
- saving, uploading, success, error and retry;
- permission, disabled, unsaved, offline, conflict and partial failure;
- connecting, connected, disconnected, reconnecting, syncing and synced.

**Modules:** Add, Layers, Pages, Media, CMS, Components, Brand, AI, Review, Issues, History, Activity, Publish, Settings, Templates and Collaboration.

**Surfaces traced:** editor (`packages/editor/src`), dashboard (`packages/dashboard`), `server/`, `lib/`.

**Path prefixes:**
- `E/` = `packages/editor/src/editor/`
- `ES/` = `packages/editor/src/`
- `D/` = `packages/dashboard/`

---

## Method & runtime status

**What I did:**
- Traced every write path from UI to handler to service to Prisma. That covers:
  - the project save (manual and autosave);
  - the settings mirror;
  - the four sync queues (CMS, components, templates, versions);
  - media upload;
  - publish;
  - AI streaming and apply;
  - review comments, both internal and on the public `/review/[token]` page;
  - team invites;
  - collaboration transport.
- Read the error branch at each hop.
- Scanned for empty `catch {}` blocks with a multiline ripgrep across `packages/editor/src`, `packages/dashboard`, `server` and `lib`. Most hits are `localStorage` guards and are harmless. I triaged every hit sitting on a user-action path.
- Scanned all 158 dashboard `trpc.*.useMutation(` call sites with a script. 44 of them have neither a hook-level `onError` nor any read of `.error` / `.isError`. I then read the global fallback they depend on (`lib/trpc/client.tsx:59-85`).
- Scanned dashboard files that call `useQuery` but never read an error state.

**Tests run (targeted, read-only):**
- `pnpm --filter @buildrik/editor exec vitest run src/editor/shell/hooks/__tests__/usePublishJob.test.ts`: 37/37 pass. The test "sets error and stops polling when a status poll rejects" locks in the behaviour behind A12-3.
- `vitest run src/services/__tests__/buildrik-sync-provider.test.ts`, `useSaveCallback.conflict.test.ts` and `useComposerInit.offline.test.ts`: 49/49 pass. `buildrik-sync-provider.test.ts:456` shows the settings mirror firing with every save, which is the mechanism behind A12-1 and A12-2.

**NOT RUNTIME VERIFIED:** no browser, no database and no SMTP server were available. Specifically not verified:
- every visual state;
- the timing window for the autosave self-conflict (A12-4);
- the real SMTP failure path (A12-5);
- the order in which the settings mirror and the conflict are committed on a live database (A12-1);
- the collaboration reconnect loop (A12-11).

Every finding below is derived from code, and each carries its own status.

---

## State matrix (output table)

**Legend:**
- ✓ implemented
- ~ partial
- ✗ missing
- n/a not applicable

**Data safety** says what the user can lose when the action fails.

| Module / action | File / function | Required states | Implemented | Missing | Failure behaviour | Data safety | Pri |
|---|---|---|---|---|---|---|---|
| Project autosave | `E/shell/hooks/useComposerInit.ts:489-684` | saving, saved, error, offline, auth-expired, forbidden, conflict, not-loaded, deleted | ✓ all nine; stale in-flight guard `changeSeq` (:500) | no in-flight serialisation (A12-4); toast dedupe (A12-14) | typed branches + toasts; `keepUnsaved` recovery copy on network failure (:590) | Good. Exception: the false self-conflict can lead the user to "Reload latest" (A12-4). | P1 |
| Manual save ⌘S | `E/shell/hooks/useSaveCallback.ts:109-260` | same as autosave, plus Retry | ✓ | none | Retry only where retrying helps; Reload / Go to dashboard for not-loaded / deleted | Good | — |
| Exit / close tab | `E/shell/StudioHeader.tsx:416-502` | dirty, saving, error, offline-risky, stranded mirrors | ✓ project + mirrors | brand staged edits (A12-8) | dialog / native prompt | Brand staging lost silently | P2 |
| Conflict | `E/shell/modals/ConflictModal.tsx`, `AquibraStudio.tsx:355,685-708` | conflict, reload, backup, overwrite-confirm | ✓ | settings mirror bypasses it (A12-1); dismiss re-fires on every autosave (A12-15) | modal | See A12-1 | P0 |
| Site-column settings mirror | `ES/services/BuildrikSyncProvider.ts:398-447` | partial-failure, permission, conflict | partial-failure ✓ (`SETTINGS_MIRROR_ERROR_EVENT`) | no conflict check; no role gate | overwrites server columns; 403 toast on every save for EDITOR | **Silent lost update** | P0 / P1 |
| Pages (add, rename, delete, reorder) | `E/sidebar/tabs/pages/*`, saved inside the project snapshot | local op, then autosave | ✓ (inherits the save states) | — | save-chip states | Server refuses an empty snapshot (`sites.service.ts:632`) | — |
| Layers / Add / Issues | local engine ops; `E/shell/IssuesPanel.tsx:161` empty state | empty, loading | ✓ | — | n/a (no I/O) | n/a | — |
| Media quick upload | `ES/engine/media/MediaManager.ts:1107-1194`, `E/sidebar/tabs/media/hooks/useUploadState.ts:90-148` | uploading, progress, error, too-large, local-only | ✓ incl. local-only warning toast | server refusal reason lost (A12-13) | "saved on this device" + background retry | Asset kept locally | P2 |
| Full media library | `E/media/LibraryManager.tsx:990` | local-only count | ✓ "N not on the server" | reason (A12-13) | — | — | P2 |
| CMS | `ES/services/cmsSync.ts`, `E/shell/hooks/useCmsSync.ts:55`, `E/sidebar/tabs/content/ContentTab.tsx:182-209` | hydrating, hydrate-error+retry, mirror-failed+retry | ✓ | — | persistent toast + retry; `online` replay | Local first; exit guard counts queue | — |
| Components | `ES/services/componentSync.ts:84-105` | hydrate error, stale remote | mirror errors ✓ | hydrate error is console-only; local always wins (A12-9) | empty library, no message | Remote edits never pulled | P2 |
| Templates | `ES/services/templateSync.ts:54-75`, `E/sidebar/tabs/templates/hooks/useTemplateApply.ts` | hydrate, apply, apply-error, timeout | ✓ | — | error + retry state | — | — |
| History / versions | `E/panels/VersionHistoryPanel.tsx:188,214,236`; `ES/services/versionSync.ts:88-122` | load, restore, restore-fail, delete-fail, hydrate-fail | restore / delete ✓ | hydrate failure is console-only (A12-9) | new device shows too few saves, silently | Versions look lost | P2 |
| Brand | `E/design-system/ui/DesignSystemTab.tsx:365-386`, `E/shell/StudioHeader.tsx:560-583` | staged, unsaved, load error | ✓ chip reads Unsaved | exit guard ignores `brandDirty` (A12-8) | — | staged tokens lost on exit | P2 |
| AI inline edit | `E/canvas/controls/AiPromptPopover.tsx:49-60,83` | streaming, diff, error, not-configured, quota, apply-fail | streaming, error ✓ | apply failure swallowed; no Retry from error (A12-10) | closes as if applied | partial edit recorded silently | P2 |
| AI chat / stream | `E/sidebar/tabs/ai/hooks/useStreamPrompt.ts:104-160` | error kinds, retry bound, connection-state errors | ✓ | — | — | — | — |
| Review (editor) | `E/canvas/comments/CommentLayer.tsx:375-395`, `ES/services/ReviewService.ts:61-88` | post, fail (draft kept), stale status | ✓ | — | toast; draft preserved | Good | — |
| Review (public client) | `D/app/review/[token]/review-client.tsx:127-129,410-445` | identify error, comment error, resolve error, expired | identify / comment ✓ | `resolve.error` never rendered; 401 → `/auth/login` redirect (A12-6, A12-12) | Approve / Request changes silently do nothing | Sign-off not recorded, and the user does not know | P2 |
| Publish (editor) | `E/shell/hooks/usePublishJob.ts:155-216,297-310`, `E/sidebar/tabs/publish/PublishTab.tsx:255` | queued, building, done, failed, cancelled, blocked, poll-error | most ✓ | poll error freezes the UI in "publishing" (A12-3) | spinner + ticking timer forever; republish silently blocked | none (server job continues) | P1 |
| Publish (dashboard) | `D/components/publish/publish-progress.tsx:30-60`, `lib/hooks/use-publish-sse.ts` | SSE, poll fallback, failed, cancel-fail | SSE→poll ✓, failed ✓ | cancel 4xx silent (A12-6) | — | — | P2 |
| Settings (editor screens) | `E/sidebar/tabs/settings/screens/*` (shared load-error / `SaveErrorBanner`) | load, load-error+retry, save-error | ✓ | — | — | — | — |
| Settings (dashboard Technical SEO) | `D/components/site-detail/seo-tab.tsx:107-130` | load, load-error, save | load, save ✓ | load-error renders defaults and Save writes them (A12-7) | wipes robots / canonical, flips indexing on | **Overwrite** | P2 |
| Team invite | `server/services/team.service.ts:127-129,256-258`; `D/app/dashboard/settings/team/page.tsx:29-37` | sent, email-failed, limit | limit ✓ | email failure swallowed; UI says "sent" (A12-5) | invitee never hears | Invite dead-ends | P1 |
| Dashboard mutations (44 sites) | `lib/trpc/client.tsx:59-85,107-109` | 4xx feedback | 500 / network / 401 only | FORBIDDEN, BAD_REQUEST, CONFLICT, PRECONDITION_FAILED, NOT_FOUND, TOO_MANY_REQUESTS (A12-6) | button returns to idle, nothing said | varies | P1 |
| Activity (dashboard) | `/dashboard/activity` | load, empty, error | not separately audited beyond the query scan | — | — | — | — |
| Notifications | `E/shell/NotificationPanel.tsx:95-230`; `D/components/notifications/*` | load, error, empty, mark-fail | editor ✓ | dashboard mark / delete / mute failures silent (A12-6) | — | — | P3 |
| Collaboration (flag OFF in prod) | `ES/engine/collaboration/SSETransport.ts`, `CollaborationManager.ts:762-783`, `E/shell/StudioHeader.tsx:774-777`, `D/app/api/sse/collab/[siteId]/route.ts:36-44` | connecting, live, lost, reconnecting, resync, send-fail, removed | connecting / live ✓ | lost / restored have no UI listener; `resync` is unhandled; replay duplicates; POST result ignored (A12-11) | presence chip vanishes; ops silently lost or duplicated | Divergence | P2 |

---

## Findings

### P0

#### A12-1: The site-settings mirror bypasses the save-conflict guard and silently reverts settings changed elsewhere

- **Severity:** P0 — IMMEDIATE FIX REQUIRED (data loss: a silent lost update of persisted site settings).
- **File:** `ES/services/BuildrikSyncProvider.ts:406-441`, with `:237-278` and `:192-230`.
- **Symbol:** `saveProject`, `extractSiteColumnPatch`, `mergeSiteColumnsIntoSettings`.
- **Evidence:**
  1. Load pulls the Site columns into `projectSettings` (`:246-263`). `name` and `allowIndexing` are always non-null, so from then on the editor holds a copy of them.
  2. Every save calls `extractSiteColumnPatch`. It sends each field that is `!== undefined`, and after the merge that includes at least `name` and `allowIndexing` (`:204-220`). The call goes to `siteDetail.settings.update` (`:417-422`). `buildrik-sync-provider.test.ts:456` confirms the mirror rides every save.
  3. `settingsCall` is started in the same tick as `primaryCall` and is **not** conditioned on the primary result. When the primary returns `SAVE_CONFLICT` (`:430-436`), the mirror has already been sent and writes regardless.
  4. `siteDetail.settings.update` has no optimistic-concurrency input (`server/trpc/routers/site-detail.ts:94-117`, `server/services/site-settings.service.ts:130`). It does not bump `lastEditedAt`, so the conflict guard at `sites.service.ts:603-607` never trips for settings edits.
  5. Autosave fires on any `project:changed`, which also fires on `page:activated` (`useComposerInit.ts:503-505`). Merely switching pages in an open editor tab is enough.
- **Concrete failure:** the owner turns off "Allow search engines to index this site" in dashboard Technical SEO (`D/components/site-detail/seo-tab.tsx`) on a staging site, while an editor tab for that site is open. The next editor autosave sends `allowIndexing: true` and the column is reverted. The next publish then ships an indexable site. The same applies to:
  - a site rename from the projects page (`sites.rename`), where the primary save correctly shows the conflict modal but the mirror has already written the old `name` back;
  - meta title and description, OG image;
  - head and body custom code;
  - favicon and touch icon, social links.
- **Expected:** the mirror obeys the same behind-copy rule as the pages: gated on the primary save succeeding and carrying a version token, or sending only the fields the user changed this session.
- **Root cause:** the dual-save design (P0.2b) treats the editor's load-time copy of the Site columns as authoritative on every tick, and concurrency was added only to `sites.saveProject`.
- **Affected modules:**
  - editor Settings (General, SEO, Custom code);
  - dashboard site Settings and SEO tabs;
  - dashboard site rename;
  - Publish (it reads these columns).
- **Recommendation:**
  - Send only dirty fields, diffed against the load-time snapshot.
  - Await the primary save before the mirror, and skip the mirror on conflict.
  - Give `settings.update` an `expectedLastEditedAt` (or its own version).
  - Add a test with two writers.
- **Status:** VERIFIED in code (mechanism plus the existing unit test). NOT RUNTIME VERIFIED.

### P1

#### A12-2: Every autosave by an EDITOR or DESIGNER shows "Saved — site settings didn't"

- **Severity:** P1.
- **File:** `ES/services/BuildrikSyncProvider.ts:417-441`, `E/shell/hooks/useSaveCallback.ts:96-107`, `server/trpc/routers/site-detail.ts:98`.
- **Symbol:** `saveProject` settings mirror; `settings.update` → `checkSiteRole(…, "ADMIN")`.
- **Evidence:**
  - The editor is open to `EDITOR` and above (`sites.service.ts:795-810`), and `sites.saveProject` needs only EDITOR (`routers/sites.ts:271-273`).
  - The mirror is sent on every save (A12-1, point 2), but `settings.update` requires ADMIN.
  - The result is `FORBIDDEN` → `emitSettingsMirrorError` → warning toast: "Saved — site settings didn't. Your pages are on the server. The site-level settings were refused: Insufficient permissions".
  - The toast store has no dedupe (`E/chrome-ui/Toast.tsx:124-128`), so the toasts stack about once per second of editing.
- **Expected:** a non-admin editing content sees "Saved" and no settings warning. The mirror is not sent for roles that cannot write it, or only for fields the user changed.
- **Root cause:** the mirror has no role awareness, and every field is sent every time.
- **Affected modules:** the whole editing experience for every non-admin collaborator; Settings screens.
- **Recommendation:** fix A12-1's dirty-field diff (which removes this case for untouched settings), and skip or disable settings writes for sub-ADMIN roles, with an honest read-only hint.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A12-3: A single failed publish-status poll leaves the editor Publish panel stuck in "publishing"

- **Severity:** P1 (a dead end in a core flow; no data loss).
- **File:** `E/shell/hooks/usePublishJob.ts:155-170,188,297-310`, `E/sidebar/tabs/publish/PublishTab.tsx:158,255,278-291`.
- **Symbol:** `tick`, `uiState`, `publish` re-entrancy guard.
- **Evidence:**
  - Any rejected `fetchPublishStatus` calls `setError(msg); stopPolling()` (`:165-169`), but `jobId` stays set and `status` stays non-terminal.
  - `uiState` therefore stays `"publishing"` (`:297-303`). `PublishTab` only renders `error` when `uiState === "failed"` (`:255`), so the message is never shown.
  - The elapsed timer keeps ticking (`:278-291`), and `publish()` early-returns while the job is non-terminal (`:188`). The Publish button does nothing until the page is reloaded.
  - The existing test `usePublishJob.test.ts:295` asserts exactly the stop-polling half and passes (37/37).
- **Expected:**
  - A transient poll error retries with backoff and shows "Lost contact with the publish job — retrying".
  - After N failures it shows a recoverable state ("Check status" / Refresh).
  - It never shows a frozen spinner.
- **Root cause:** the poll error is treated as terminal, but the UI state derivation does not treat it as a terminal state.
- **Affected modules:** Publish (editor), topbar publish chip (`AquibraStudio.tsx:523`), `TabRouter.tsx:230`.
- **Recommendation:** keep polling with backoff on poll errors, surface a "reconnecting" substate, and give `uiState` an explicit branch for "job unknown".
- **Status:** VERIFIED (code plus test run). NOT RUNTIME VERIFIED visually.

#### A12-4: Overlapping autosaves can conflict with each other, and the dialog's primary action discards the newest edit

- **Severity:** P1.
- **File:** `E/shell/hooks/useComposerInit.ts:502-527`, `ES/services/BuildrikSyncProvider.ts:411-416,445`, `server/services/sites.service.ts:603-607`, `E/shell/AquibraStudio.tsx:688`, `E/shell/modals/ConflictModal.tsx:75`.
- **Symbol:** autosave `handler`, `_baselineLastEditedAt`.
- **Evidence:**
  1. The debounce is 1000 ms (`shared/constants/config.ts:113`). Nothing prevents a second save starting while the first is in flight: there is no in-flight flag or queue, and `changeSeq` only suppresses the *announcement*.
  2. Both requests carry the same `_baselineLastEditedAt`, which advances only after a save resolves (`:445`).
  3. If request 1 commits `lastEditedAt = B` before request 2 is read, the server rejects request 2 with `SAVE_CONFLICT`.
  4. That opens "This site changed somewhere else", whose primary button **Reload latest** (`AquibraStudio.tsx:688`, a plain `window.location.reload()`) discards the edit made during request 1's flight. No `keepUnsaved` runs on this path.
  - Manual ⌘S during an autosave has the same shape.
- **Expected:** saves are serialised (coalesce into a trailing save after the in-flight one resolves). A conflict against the editor's own previous request is impossible.
- **Root cause:** optimistic concurrency with a client baseline, but no client-side single-flight.
- **Affected modules:** Autosave, Conflict, every editing module.
- **Recommendation:** add a single-flight save queue (in-flight → a pending flag → one trailing save with the fresh baseline), and call `keepUnsaved` before `Reload latest`.
- **Status:** PARTIAL. The mechanism is verified in code. How often it happens depends on save latency, and is NOT RUNTIME VERIFIED.

#### A12-5: Invite emails that fail to send are swallowed, and the UI says "N invitations sent"

- **Severity:** P1 (a collaboration invite that dead-ends silently).
- **File:** `server/services/team.service.ts:127-129` (invite), `:256-258` (resend); `server/services/email.service.ts:86-92`; `D/app/dashboard/settings/team/page.tsx:29-37`.
- **Symbol:** `inviteMembers`, `resendInvite`.
- **Evidence:**
  - `sendEmail` throws on SMTP failure (`email.service.ts:89-91`), but both callers do `catch { /* Email failure shouldn't block invite */ }`. There is no log and no flag in the return value.
  - `inviteMembers` returns `{ sent: toInvite.length }` regardless, and the page toasts "N invitations sent".
  - The PENDING row then blocks re-inviting the same address (`:93-96`, counted as `skipped`).
  - Resend is capped at 2 (`:241`), and the cap is consumed even when the email fails.
  - No copy-invite-link fallback exists in `D/components/team/*`.
  - CLAUDE.md records a real production SMTP 535 failure (`SMTP_PASS_B64` row).
- **Expected:** the invite row is still created, but the response reports `emailFailed: [...]`. The UI then says "Invite created but the email couldn't be sent" and offers "Copy invite link", and the resend count is not consumed on failure.
- **Root cause:** "email failure shouldn't block the invite" was implemented as "email failure is invisible".
- **Affected modules:** Invitations, Sharing, Roles, and the client-invite flow at `D/components/clients/client-detail-view.tsx:215`, which calls the same `team.invite`.
- **Recommendation:** return per-address send status, log it, surface it in the toast, add a copy-link action, and make resend idempotent on failure.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED (no SMTP).

#### A12-6: 44 of 158 dashboard mutations have no error feedback for 4xx answers, and the global fallback redirects public pages to the login screen

- **Severity:** P1 (a systemic silent-failure class).
- **File:** `lib/trpc/client.tsx:59-85,107-109`, plus the 44 call sites.
- **Symbol:** `handleTRPCError` (the default `mutations.onError`).
- **Evidence:**
  - The default handler toasts only on `INTERNAL_SERVER_ERROR` and network errors, and hard-redirects on `UNAUTHORIZED` (`:72-74`). Every other code falls through silently: FORBIDDEN, BAD_REQUEST, CONFLICT, PRECONDITION_FAILED, NOT_FOUND, TOO_MANY_REQUESTS.
  - The script found 44 mutations with no hook-level `onError` and no `.error` / `.isError` read. User-visible examples:
    - `sites.rename`: `D/app/dashboard/projects/page.tsx:157`. The rename modal stays open with no message.
    - `forms.deleteSubmission` and `forms.updateSubmission`: `D/components/site-detail/submissions-panel.tsx:42-48`. For updates, the drawer shows the local change (`:59-61`) even if the server refused it.
    - `integrations.vercel.disconnect` and `account.integrations.remove`: `D/components/settings/integrations-content.tsx:103,202`. A non-admin clicking Disconnect gets nothing.
    - `sites.cancelPublish`: `D/components/publish/publish-progress.tsx:35`. A CONFLICT (already finished) is silent.
    - `help.createTicket`: `D/components/help/ticket-form.tsx:46`. Rate limit or validation errors are silent.
    - `account.workspace.cancelDelete` and `account.dangerZone.cancelAccountDeletion`: `D/app/dashboard/page.tsx:28-29`. The user may believe a deletion was cancelled when it was not.
    - The notifications mark-read, delete and mute actions.
    - `clientReview.resolve`: see A12-12.
  - **Public-route hazard:** the same default handler runs on `/review/[token]`. A `NOT_IDENTIFIED` answer maps to `UNAUTHORIZED` (`server/trpc/routers/client-review.ts:49`), which sends an **external, account-less reviewer** to `/auth/login`.
- **Expected:** every mutation surfaces a 4xx in words. On public routes, 401 does not redirect to the app login.
- **Root cause:**
  - The global fallback was written for 500s only.
  - In TanStack Query, a hook-level `onError` *replaces* the default. Per-call `mutate(…, { onSuccess })` does not add error handling, so call sites that pass only `onSuccess` look handled but are not.
- **Affected modules:** Settings, Integrations, Forms, Publish, Help, Danger zone, Notifications, public Review.
- **Recommendation:**
  - Make the default handler toast `error.message` for all non-final-silent codes.
  - Skip the login redirect when `location.pathname` starts with `/review/` or `/share/`.
  - Add a lint or test that requires an error path on every `useMutation`.
- **Status:** VERIFIED in code (script output reproduced in method). NOT RUNTIME VERIFIED.

### P2

#### A12-7: Dashboard Technical SEO turns a failed load into a form of defaults, and Save writes them

- **Severity:** P2.
- **File:** `D/components/site-detail/seo-tab.tsx:107-130`.
- **Symbol:** `TechnicalSeoSection`.
- **Evidence:**
  - The only branch is `settings.isLoading`. On `isError`, `data` is undefined, so the fields fall back to `""`, `true` and `""` (`:121-123`).
  - `save()` always sends all three fields (`:125-130`). Toggling one field, or just pressing Save, writes `canonicalUrl: null, allowIndexing: true, robotsTxt: null` over the stored values.
- **Expected:** a load-error state with Retry; Save disabled until loaded; only changed fields sent.
- **Root cause:** a missing error branch, plus a whole-form write.
- **Affected modules:** Settings (SEO) and Publish (the worker writes these into pages).
- **Recommendation:** add an `isError` branch, disable Save until loaded, and send only changed fields.
- **Status:** VERIFIED in code.

#### A12-8: Brand's staged edits show "Unsaved" in the topbar, but the exit guards ignore them

- **Severity:** P2.
- **File:** `E/shell/StudioHeader.tsx:416-442` (`guardNavigation`), `:483-502` (`beforeunload`), `:560-583` (`brandDirty`).
- **Evidence:**
  - The save chip includes `brandDirty` (`:583`).
  - Neither the ‹ Exit dialog condition (`:422-438`) nor the `beforeunload` condition (`:496`) reads it.
  - On reload, `DesignSystemTab.loadFromComposer` resets every kind from the saved project (`DesignSystemTab.tsx:390-420`), so staged tokens are dropped.
- **Expected:** one "unsaved" truth, used by both the chip and the exit guards.
- **Root cause:** brand staging is announced by an event, and only the chip subscribed to it.
- **Recommendation:** include `brandDirty` in `guardNavigation` and `onBefore`.
- **Status:** PARTIAL. The guard omission is verified in code. That the staged tokens are then lost is inferred from the reset-on-load path and is NOT RUNTIME VERIFIED.

#### A12-9: Components and version history fail to hydrate silently (console only), and local always wins

- **Severity:** P2.
- **File:** `ES/services/componentSync.ts:84-105`, `ES/services/versionSync.ts:88-122`, `E/shell/hooks/useComponentSync.ts:39-44`.
- **Evidence:**
  - Both hydrations `catch (e) { console.warn(...) }`, with no state and no UI.
  - CMS has `getCmsHydrationStatus` plus a Retry (`ContentTab.tsx:182-209`), and templates has `getTemplateHydrateState`. Components and versions have neither.
  - Both skip any id already present locally (`if (localIds.has(...)) continue`), so a component or version edited on another device is never pulled.
- **Expected:** a hydrate-error state with Retry in the Components and History panels, and a newer remote copy replaces the local one.
- **Failure behaviour:** on a new device, or after a network blip, History shows fewer saves and Components shows an empty library, with no explanation. Users may conclude restore points are gone.
- **Recommendation:** reuse the CMS hydration-status pattern, and compare `updatedAt` instead of existence.
- **Status:** VERIFIED in code.

#### A12-10: Inline AI apply failures are swallowed, and the error state has no way back

- **Severity:** P2.
- **File:** `E/canvas/controls/AiPromptPopover.tsx:49-60,83-86`.
- **Evidence:**
  - `accept()` wraps `applyAiEdit` in `try { … } catch { /* partial recorded */ }` and then always `onClose()`. A stale element id produces a partial edit, recorded as one undo step, and the user is told nothing.
  - The error branch renders only `{stream.error}`. It has no Retry, no "Edit prompt" and no Close button; Esc is the only exit.
- **Expected:**
  - On a failed or partial apply, a toast says "Applied 2 of 5 changes — the element changed", with an Undo action.
  - The error state offers Retry and a way back to the prompt, with the text kept.
- **Recommendation:** return the apply result from `applyAiEdit` and toast on a partial apply; add Retry and Back to the error branch.
- **Status:** VERIFIED in code.

#### A12-11: Collaboration (flag off in production) disconnects silently, never handles `resync`, and duplicates ops on reconnect

- **Severity:** P2. It would be P1 or higher if `NEXT_PUBLIC_FEATURE_COLLAB` shipped; CLAUDE.md says it must not.
- **File:** `ES/engine/collaboration/SSETransport.ts:42,46-75,86-98`; `CollaborationManager.ts:762-783`; `E/shell/StudioHeader.tsx:774-777`; `D/app/api/sse/collab/[siteId]/route.ts:36-44`.
- **Evidence:**
  1. **Silent disconnect.** `handleDisconnect` sets the state to `"disconnected"` and emits `connection:lost`. Nothing in the UI listens for `connection:lost`, `connection:restored` or `sync:error`. The header shows the presence chip only when `state !== "disconnected"` (`:774`), so on a disconnect the chip *disappears* instead of saying "Reconnecting". The chip's `"reconnecting"` value is only ever drawn for the `connecting` state (`:777`).
  2. **`resync` unhandled.** The server sends `resync` and closes (`route.ts:40-43`). The client registers only `hello` and `op`, so the close fires `onerror`, EventSource auto-reconnects to the same URL, and the server answers `resync` again. This is a loop with no reload.
  3. **Duplicate replay.** `since=${this.lastSeq}` is baked into the URL once (`:42`). EventSource reconnects reuse it, and the server sends no `id:` field, so after any blip every op since session start is replayed. The client does not skip `seq <= lastSeq` (`:59-61`).
  4. **Lost sends.** `send()` ignores both rejected fetches and non-2xx responses, including a 403 after the member is removed (`ops/route.ts:20`). The op is silently lost for peers.
- **Expected:**
  - A visible disconnected / reconnecting / resync state.
  - Reload on `resync`.
  - Duplicate-seq skip.
  - An outbox with a failure state, and a "you no longer have access" state on 403.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED. Agent D owns the runtime and convergence side (Prompt 16).

#### A12-12: On the public review page, Approve and Request changes fail silently

- **Severity:** P2.
- **File:** `D/app/review/[token]/review-client.tsx:129,406-440`.
- **Evidence:**
  - `resolve` has no hook-level `onError`, and there is no `resolve.error` render anywhere in the file (grep returns nothing). `identify.error` (`:230`) and `comment.error` (`:353,390`) are handled.
  - Several answers are therefore silent: `ALREADY_RESOLVED` → CONFLICT, `EXPIRED` or `REVOKED` → FORBIDDEN (`client-review.ts:45-59`), and a rate limit.
  - The button re-enables and the dialog stays open, so the client believes they signed off.
- **Expected:** "This review was already closed" or "This link has expired", in the dialog.
- **Status:** VERIFIED in code.

#### A12-13: A server refusal of an upload is reported as a transient "not on the server yet"

- **Severity:** P2.
- **File:** `ES/services/AssetUploadService.ts:141-182`; `ES/engine/media/MediaManager.ts:1168-1172`; `E/sidebar/tabs/media/hooks/useUploadState.ts:135-142`.
- **Evidence:**
  - `uploadAndCreate` does `catch { return null }` for every cause. That includes the server-side quota and size refusal from `/api/asset-upload`, and FORBIDDEN.
  - The manager marks the asset `localOnly` and queues a retry. The toast says "saved on this device — it didn't reach the server, so it won't publish yet", and the retry replays on every `online` event and after every later successful upload.
  - A permanent refusal (over quota) is thus presented as temporary, and the user is never told "storage full".
- **Expected:** transient failures are distinguished from permanent refusals. Quota or forbidden gets its own copy, and the asset is not queued forever.
- **Status:** VERIFIED in code.

### P3

#### A12-14: The editor toast store has no dedupe or cap

- **File:** `E/chrome-ui/Toast.tsx:124-128`.
- **Evidence:** `add` always appends. While offline, each autosave tick adds another "Offline — not saved" toast (`useComposerInit.ts:597-606`); the A12-2 warning stacks the same way.
- **Recommendation:** dedupe on title + description within the visible window.
- **Status:** VERIFIED in code.

#### A12-15: Dismissing the conflict dialog re-opens it on the next autosave

- **File:** `E/shell/AquibraStudio.tsx:352-357,687`.
- **Evidence:** `onClose` only clears `conflict`. The baseline stays stale, so the next edit's autosave conflicts again and the dialog returns. The chip does say "conflict", but there is no calm "paused until you choose" state.
- **Recommendation:** while unresolved, suspend autosave and keep a persistent banner rather than re-opening a modal.
- **Status:** VERIFIED in code.

#### A12-16: Dashboard notification actions fail silently

- **File:** `D/components/notifications/notification-page.tsx:27-45`, `notification-dropdown.tsx:21-28`.
- **Evidence:** a subset of A12-6. The four notification actions (mark read, mark all read, delete, mute type) have no `onError`.
- **Recommendation:** fold into the A12-6 fix.
- **Status:** VERIFIED in code.

---

## Good as-is (verified in code; do not churn)

- **Project save state machine** (`useSaveCallback.ts`, `useComposerInit.ts:488-684`):
  - it separates offline from server-unreachable, auth-expired from forbidden, and not-loaded from deleted, each with honest copy and the only action that helps;
  - the stale in-flight announcement guard (`changeSeq`);
  - `keepUnsaved` recovery on network failure;
  - `ProjectNotLoadedError` refuses to overwrite a site that never loaded;
  - the server refuses empty snapshots (`sites.service.ts:632`).
- **Exit guard** (`StudioHeader.tsx:416-502`): covers dirty, saving, error and offline-risky states and the stranded mirror queue. It reads at fire time, which avoids staleness.
- **`SyncRetryQueue`** (`ES/services/syncRetryQueue.ts`): latest-wins per key, notifies on drain, replays on `online`, and feeds `totalPendingMirrors` into the exit guard. It is wired to toasts for CMS, components, templates and versions.
- **CMS hydration status with Retry**, and **template apply** states (idle, confirming, applying, success, error, retry, timeout).
- **AI streaming** (`useStreamPrompt.ts`): distinguishes not-configured from quota from other errors, and bounds retries on the connection-state failure path.
- **Pinned comments** keep the draft on failure (`CommentLayer.tsx:375-395`). Editor settings screens share load-error, retry and `SaveErrorBanner`.
- **Editor `NotificationPanel`** loading, error and empty states; the dashboard projects page error is not collapsed into the empty state (`projects/page.tsx:544-569`).
- **Upload validation failures** stay on screen with the reason (`useUploadState.ts:90-118`), and local-only assets are labelled.

---

## Product decisions required

1. **Settings authority (A12-1, A12-2).** Should the editor write Site columns at all on autosave, or only from the explicit Settings screens? And should sub-ADMIN roles see settings as read-only in the editor?
2. **Conflict UX (A12-4, A12-15).** Should autosave pause while a conflict is unresolved, and which action is primary: Reload, or Save a backup?
3. **Invite failure (A12-5).** Is "Copy invite link" acceptable as the fallback when email cannot be sent? There are security and product implications.
4. **Dashboard error policy (A12-6).** Should one global toast carry the server message for every 4xx, or should every mutation own its copy?

---

## Overlaps with other audits

- **Agent D (Prompt 16):** A12-11 mechanics (duplicate replay, the resync loop, lost sends, no permission re-check) need a runtime convergence test. The inventory's "resync unhandled" item is the same as A12-11 point 2.
- **Agent F (Prompt 19):**
  - A12-1 is also an authorization-adjacent integrity issue: a stale writer overrides an admin's settings.
  - A12-6's login redirect on the public `/review/[token]` route.
  - `clientReview.identify` uses BAD_REQUEST semantics.
- **Agent G (Prompts 14, 15, 20):** `usePublishJob.test.ts:295` asserts the stuck behaviour of A12-3 as correct. `buildrik-sync-provider.test.ts:456-540` has no two-writer or role case, and needs tests for A12-1, A12-2 and A12-4.
- **Agent E (Prompt 17):** the two parallel error-mapping regexes (`useSaveCallback.ts:160-162` and `useComposerInit.ts:583-585`) are kept in sync by hand; the comments record that one previously drifted.

---

## AUDIT HANDOFF

- **Agent / Prompt:** C, Interaction & UX / Prompt 12: States, Feedback & Error Handling
- **Report:** `docs/audits/2026-09-25-full-audit/12-states-feedback-errors.md`
- **Counts:** P0 = 1 · P1 = 5 · P2 = 7 · P3 = 3
- **P0:**
  - A12-1: the site-settings mirror bypasses the save-conflict guard and silently reverts dashboard-side settings (name, allowIndexing, meta, custom code). IMMEDIATE FIX REQUIRED.
- **P1:**
  - A12-2: EDITOR and DESIGNER roles get a settings-refused toast on every autosave.
  - A12-3: a failed publish poll freezes the editor Publish UI.
  - A12-4: overlapping autosaves conflict with each other, and "Reload latest" discards the newest edit.
  - A12-5: invite email failures are swallowed.
  - A12-6: 44 dashboard mutations are silent on 4xx, and the global 401 redirect fires on public review pages.
- **P2:**
  - A12-7: Technical SEO writes defaults after a failed load.
  - A12-8: brand staged edits are ignored by the exit guards.
  - A12-9: components and versions hydrate silently, and local always wins.
  - A12-10: inline AI apply failures are swallowed.
  - A12-11: collaboration disconnect, resync and replay (flag off).
  - A12-12: public review resolve errors are silent.
  - A12-13: upload refusals are reported as transient.
- **P3:**
  - A12-14: no toast dedupe.
  - A12-15: the conflict dialog re-opens.
  - A12-16: notification actions fail silently.
- **Runtime verified:**
  - Targeted vitest runs passed: `usePublishJob` 37/37; sync-provider + conflict + offline 49/49.
  - The dashboard mutation scan script was run.
  - No browser, database or SMTP.
- **NOT RUNTIME VERIFIED:**
  - all rendered states;
  - the A12-1 live two-writer revert;
  - the A12-4 race window;
  - A12-5 SMTP failure;
  - the A12-11 reconnect loop;
  - the A12-8 staged-token loss after reload.
- **Dependencies:**
  - The A12-1 fix (dirty-field diff + gate the mirror on primary success) largely removes A12-2. Land it first.
  - The A12-4 single-flight change interacts with A12-1's ordering. Do them in one batch.
  - A12-6's global handler change also resolves A12-12 and A12-16.
  - A12-9 should reuse the CMS hydration-status pattern.
- **Inventory corrections:**
  - The inventory says publish progress runs over SSE. That is true only on the dashboard (`lib/hooks/use-publish-sse.ts`); the **editor** polls every 2 s (`usePublishJob.ts:25`).
  - The inventory's "SSETransport POSTs … if the POST fails the op is silently lost" also applies to non-2xx responses (403 after removal), not just network failures.
