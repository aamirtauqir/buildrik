# Lane Lv3: live-verify pass 3 bugs

Worktree `/Users/shahg/Desktop/buildrik-af-Lv3`, branch `fix/audit-Lv3`, off `110ab8d9d`.
Commits: `9396f3aac..e2170fc43` (12 commits: 11 fixes plus 1 test-typing follow-up).
Evidence: `verify/results-editor-v3.md` (items 1–9) and `verify/results-dashboard-v3.md` (items 10–11).

Gates at the end:
- `npx tsc --noEmit -p packages/editor`: 0 errors.
- `npx tsc --noEmit -p packages/dashboard`: 0 errors.
- `pnpm run verify:ds` (packages/editor, foreground): exit 0.
- vitest ran with `--maxWorkers=2` on touched or affected files only. Every run was green. No `.db.test` was added.

---

## 1. [HIGH] Root-relative links flagged "malformed": fixed `9396f3aac`
- **Root cause.** `checkLink` in `packages/shared/content/contentIssues.ts` validated an href with `new URL(href)` and no base. That call throws on every relative reference, so `/about`, `/`, `./x` and `?q` were all reported as "Link URL looks malformed". The editor Issues panel and the server `runPrePublishChecks` Links row both run this one detector, so both showed the error.
- **Fix.** `isWellFormedHref` resolves a relative reference against a base, the same way a browser resolves it against the page. An absolute URL (one with a scheme) still parses with no base, because with an https base `https:/` would resolve as a relative reference and pass. Two kinds of relative reference are still flagged: a first segment that contains `:` (invalid under RFC 3986 §4.2), and scheme typos such as `http//x` or `www.x.com`.
- **Tests.**
  - `contentIssues.test.ts` adds 2 cases: `/`, `/about`, `/services?x=1#top`, `./contact`, `../index.html`, `?q=1`, `//cdn…` and `about.html` are clean, and `http//example.com`, `https:/`, `www.example.com`, `ht!tp://broken` and a bad-port URL are flagged.
  - `publish-prechecks-visibility.test.ts`: Links passes for `/`, `/about` and `/services`.
  - Red before the fix: the root-relative case and the server case failed. Green after: 27/27.
- **Not verified live:** the Issues panel and Publish pre-checks on S1 or S2.

## 2. [HIGH] Opening a site with a CMS binding dirties it and autosaves (VIEWER gets 403): fixed `44ec05728`
- **Root cause.** `BaseBindingManager.import()` (called from `Composer.importProject` on load, version restore and undo) re-ran `bind()` for every stored entry, and `bind()` applies the binding. `CMSBindingManager.applyBinding` resolves the value and writes it with `setContent`, which calls `markDirty` and emits `PROJECT_CHANGED`. `runWithoutTracking` keeps that write out of undo but, by design, not out of dirty state or autosave. Every open therefore autosaved. A second effect: when the CMS store had not arrived yet, the fallback `""` overwrote the stored text. That is how the bound heading came to be saved as `""`, and the dashboard pass confirms it is the text the share page fell back to.
- **Fix.** `import()` restores the map and emits `BINDING_CREATED` (BindingBanner listens for it) without applying anything. Display does not need the apply: the canvas preview (`useCMSPreview`) resolves bindings for display, publish resolves them at export, and content or data-source updates still re-apply.
- **Test.** `Composer.cmsBindings.test.ts` "loading a project with bindings leaves it clean and its stored content intact" runs on a real Composer. It checks that `isDirty()` stays false, that no `PROJECT_CHANGED` fires, that `resolveBinding` is never called, and that the content stays "About". Red before the fix (dirty = true). Green after: 72/72 across the binding-related files.
- **Not verified live:** opening S1 as OWNER or VIEWER with a binding and confirming that no `sites.saveProject` fires on load.

## 3. [HIGH] A-4: the toast's Undo reverts a newer edit: fixed `5e70b665b` (plus typing follow-up `e2170fc43`)
- **Root cause.** Every "… · Undo" toast called bare `history.undo()`, which pops the newest entry at click time, not the action the toast announced.
- **Fix.** `HistoryManager.captureUndo()` first flushes (so the announced action is its own entry and is not coalesced into the next edit), then binds to the top entry. The function it returns undoes only while that entry is still on top. After a newer edit, a ⌘Z or a redo, it reverts nothing and emits `HISTORY_NOOP {superseded}`. `useHistoryFeedback` turns that event into "Can't undo … from here — newer edits came after it. Use ⌘Z …".
- **Scope.** All 14 editor toast Undo actions use `captureUndo`: delete, redo, duplicate, block insert, canvas drop, move-to-page, group, section reorder, template replace, generate block, reset styles, the StudioPanels delete, and the Layers delete and delete-selection.
- **Tests.**
  - `HistoryManager.captureUndo.test.ts` (real Composer, 3 cases): an undo inside the window works; after a newer edit, even an unflushed one, it refuses and reverts nothing while the image stays deleted; after a ⌘Z it refuses. Red before: `captureUndo` did not exist.
  - `useHistoryFeedback.deleteToast.test.ts`: the toast captures the undo when it is raised, and a refusal toast states why.
  - Six hook mocks gained `captureUndo`.
  - Green: 743/743 across 85 affected files.
- **Not verified live:** the delete-image → edit text → toast Undo sequence.

## 4. [HIGH] A-5: ⌘A + Delete deletes locked elements: fixed `67e4a18a4`
- **Root cause 1 (engine).** The delete and cut commands dropped locked elements only from the `topMost()`-pruned selection. ⌘A selects every element, so the locked image was pruned as a descendant of the selected section and never examined, and removing the section took its subtree with it.
- **Root cause 2 (canvas).** `useCanvasKeyboard` had its own second delete implementation. It had the same ancestor hole, no lock check on a single element, no multi-delete confirm (decision #17), and bare-undo toasts.
- **Fix.**
  - `dropLockedAndInstances` no longer removes an unlocked element that has a locked descendant. It considers the element's children in its place, recursively down to the locked element, and emits the skip event.
  - Canvas Delete and Backspace now run the delete command. Only the focus hand-off after a single delete stays in the hook.
  - Cut is covered by the same fix.
- **Tests.**
  - `deleteLockedDescendant.test.ts` (real Composer): ⌘A + Delete and ⌘A + Cut keep the locked image and its section and remove everything else, the clipboard holds only what was removed, and the confirm count is 2. Red before: the locked image was gone.
  - The `useCanvasKeyboard.test.ts` multi-delete block asserted the old in-hook `removeElement` loop and was rewritten: it now checks the command route, the focus hand-off, and that the root alone is left in place.
  - Green: 141 command tests and 220 canvas-hook tests.
- **Not verified live:** ⌘A + Delete count on S2, and Cut → Paste (still HARNESS? in the evidence). Drag-onto-instance was not touched.

## 5. [MED] C-9: forbidden save never enters read-only: fixed `34ad4e445`
- **Root cause.** `invalidateMyRole()` cleared a cache that nothing re-read. The view mode a VIEWER gets comes from the URL (`?view=readonly`, which the dashboard redirect sets), and every consumer reads it once. Nothing switched the editor into it, and autosave kept retrying into 403.
- **Fix.**
  - `refuseForbiddenSave` in `useSaveCallback.ts` is now the single handler for both the manual save and autosave. It keeps the unsaved edits, drops the cached role, shows the toast, and re-asks for the role. If the role is now below EDITOR, it calls `location.replace` with `?view=readonly`: the same mode a VIEWER gets, with the VIEWER rail, Publish disabled with its reason, and `composer.readOnly`.
  - Autosave never runs in a read-only view.
  - On load in view mode, the unsaved-work notice says the edits are kept on this device and offers no Restore, since a restore would only be refused again.
- **Tests.**
  - `useComposerInit.offline.test.ts` adds 3 cases: VIEWER → `replace(?view=readonly)`, EDITOR → stays, and a read-only view never sends an autosave or sets dirty. Red before: 2 failed.
  - `useComposerInit.loadFlow.test.ts`: in view mode the notice has no Restore action and the record is kept.
  - Green: 96/96 across the save and init suites.
- **Not verified live:** demoting through `/dashboard/settings/team` mid-session and watching the switch.

## 6. [MED] X-6: "+1 from collections ›" sits under the footer: fixed `1d598c951`
- **Root cause.** The row rendered as a flex sibling after `.bd-pg-list`. `.bd-pg-footer` is `position:absolute; bottom:0` over the shell, so the row landed in the strip the footer covers (row at y 870–900, footer at 824–900).
- **Fix.** The row is now the footer's first child, above the legend, and shares the footer's visibility rule. Footer height with the row is about 88px, which stays inside the list's 120px `--pg-footer-clearance`.
- **Test.** `PageList.test.tsx`: the row is inside `pages-footer` and is its first child. jsdom has no layout, so this pins the structure only. Red before, green after: 195/195 in the pages suite.
- **Not verified live.** No `getBoundingClientRect` or `elementFromPoint` measurement was run. The controller should measure the row versus the footer at 1440×900 and try a real click.

## 7. [MED] A collection's template page publishes `{title}`: fixed `bc956c9fd`
- **Intended behaviour, from the code.** The template page is a blueprint. `CMSExportResolver` writes an on-page binding as the worker's `{fieldSlug}` token (its `pageFile` doc), and `appendDynamicPagesToPublish` fills those tokens once per record. A template page published as-is can only ever ship placeholders.
- **Fix.** `appendDynamicPagesToPublish` removes each bound template path from the page set it returns, even when no record has generated a page yet. **Exception:** `index.html` is kept, because dropping the home page would leave the site root empty. A home page used as a template therefore still ships its tokens. The PD question is whether the Dynamic pages pane should refuse the home page as a template.
- **Test.** `cms.service.test.ts`: the old append test asserted that the template stayed, and was rewritten; the no-entries and home-page cases were added. Red before (2 failed), green after: 49/49. Publish suites: 72/72.
- **Not verified live:** that the publish job's page list no longer contains `about.html`.

## 8. [MINOR] A-15: Components-panel Insert shows no toast: fixed `4fe1313ac`
- **Root cause.** The Insert button on `ComponentDetailScreen` (⇧A › detail) never used `instantiateComponentAtSelection`. It was a third copy of the insert algorithm, and that copy was silent on success. Separately, the shared helper returned "ok" when the engine refused placement (a null id).
- **Fix.**
  - `instantiate.ts` owns the whole insert: the parent rule, one `insert-component` history step (previously only the detail screen had it), null id treated as error, and `INSTANTIATE_TOASTS`, the single copy of each outcome message.
  - BuildTab, the Components tab list and the detail screen all read their messages from it.
- **Tests.**
  - The detail-screen test "stays quiet on a successful insert" had pinned the bug; it now expects "Component added to canvas".
  - `instantiate.test.ts` adds the null → error case.
  - The shared `mockComposer` gained transactions and a real instance id.
  - Red before (2 failed), green after: 442/442.
- **Not verified live.**

## 9. [MINOR] B-7: dashboard ⌘K has no ARIA combobox: fixed `a767bb68c`
- **Fix.**
  - The palette is now a named `role=dialog aria-modal`.
  - The input is a `role=combobox` with `aria-autocomplete=list`, `aria-expanded` and `aria-controls` pointing at the `role=listbox`.
  - Groups are named with `role=group`.
  - Results are `role=option` with `aria-selected` and `tabIndex=-1`.
  - `aria-activedescendant` follows the arrow-key highlight. Ids come from `useId`.
- **Test.** New `components/search/__tests__/command-palette.a11y.test.tsx` (3 cases). Red before, green after.
- **Not verified live:** screen-reader output. The "No results" `<p>` still sits inside the listbox; when no options exist, `aria-expanded` is false.

## 10. [HIGH] Share draft and editor Preview show stale or empty text for a bound element: fixed `f7b4d5242`
- **Root cause (share).** `getShareDraftRows` sent the bindings but no CMS data. The scratch composer that renders the draft therefore resolved nothing and showed the last-saved text, which item 2 had corrupted to `""`.
- **Choice: carry the data, and resolve on the client with the publish exporter's own `CMSExportResolver`.** Publish resolves bindings in the browser export, not on the server, so this path reuses the publish code. It keeps text semantics, the allowlist, collection lists (RepeaterRenderer) and the first-published-record rule. A server-side resolver would have been a second implementation.
- **Server.** `getPublishedCmsForBindings` (in `cms.service`) returns only:
  - the collections the bindings name, scoped to the site;
  - their **PUBLISHED** entries (newest first, the editor store's order);
  - the columns the resolver reads.

  A draft record never reaches an anonymous link holder.
- **Editor side.**
  - `cmsFromRows` (in cmsSync, sharing the hydration field mapping) converts the rows to engine shapes.
  - `CollectionManager.loadSnapshot` makes the scratch store exactly that snapshot, in memory only; it never reads or writes the visitor's IndexedDB.
  - `renderProjectPages(snapshot, fonts, cms?)` loads the snapshot.
  - `draft-preview.tsx` passes it through.
- **Preview.** Preview was built with `composer.exportHTML()`, which resolves no bindings. `renderPreviewHtml` runs the same resolver (static mode) and falls back to the stored text if it throws. The toggle in `AquibraStudio` is async-safe.
- **Tests.**
  - `share-link.visitor.test.ts` adds 2 cases: referenced collections only, PUBLISHED only, site-scoped, newest first; no CMS query when there are no bindings.
  - `projectDataFromRows.test.ts` adds 2 cases: the bound value renders escaped from the rows, and the stored text is kept when the rows cannot resolve it.
  - `renderPreviewHtml.test.ts`: the preview contains the escaped bound value.
  - `draft-preview.test.tsx`: the snapshot reaches the render.
  - The server and editor tests were red before (2 each), green after. Draft-preview was updated with the fix.
- **Not verified live:** `/share/<token>` logged out and the editor Preview on a bound element. Entry order matches the editor store (updatedAt desc) by construction, not by measurement.

## 11. [MINOR] The invite page shows "another email" to an unverified invitee: fixed `b6666b563`
- **Root cause.** `acceptInvite` rejects in two different ways with the same FORBIDDEN: an unverified email (PD-5) and an invite sent to another address. The page (`:92`) mapped every FORBIDDEN to the wrong-account screen.
- **Fix.**
  - The router adds `cause: {reason: "EMAIL_UNVERIFIED" | "EMAIL_MISMATCH"}`. The formatter lifts it to `data.cause`, the same pattern clientReview uses for dead links.
  - The page maps EMAIL_UNVERIFIED to a "Verify your email to accept" screen. That screen offers "Resend verification email" (`auth.resendVerification` for the session's email, with a success banner) and "View invitation".
- **Tests.**
  - `server/trpc/routers/__tests__/auth-accept-invite-reasons.test.ts` (2 cases). Red before, green after.
  - `app/auth/invite/__tests__/invite-forbidden-reasons.test.tsx` (2 cases). Red before on the unverified case.
- **Not verified live.**

---

## Note (not fixed): "Publish now" disabled without Vercel, even with PUBLISH_ALLOW_SIMULATION=true
This is not intended. The two code paths disagree:
- `runPrePublishChecks` (`server/services/publish.service.ts:64-73`) always adds "Vercel connected" as a **fail** when there is no connection, and it never reads `PUBLISH_ALLOW_SIMULATION`.
- `startPublish` (`:379`) and the worker's Vercel step (`:768`) both skip the connection requirement under the flag.

The root CLAUDE.md env table documents the flag as "the pre-publish Vercel-connection check is skipped", so the pre-check is the path that drifted. The smallest fix: under the flag, the check reports warning or pass ("Simulation — no deploy") instead of fail. This leaves `ready` true, so the editor's confirm button enables.

## Cross-lane edits
- `packages/shared/content/contentIssues.ts` (lane Lrt's detector).
- `server/services/cms.service.ts` and `share-link.service.ts`.
- `server/trpc/routers/auth.ts`.
- `packages/dashboard/app/auth/invite/page.tsx`, `app/share/[token]/draft-preview.tsx`, `components/search/command-palette.tsx`.
- `packages/editor/src/editor/shell/AquibraStudio.tsx`: the preview toggle effect only. This is a worktree edit; the founder-tree staging rule does not apply here, but watch for merge conflicts.
- The shared test mock `src/editor/sidebar/__tests__/test-utils/mockComposer.ts`.

## Out-of-scope observations
- `server/trpc/routers/auth.ts` `acceptInvite` touches Prisma directly from the router, which breaks the Router → Service rule. This predates the lane and was not changed.
- The generated dynamic page gets an empty `<title>` when no SEO title pattern is set (evidence Found #5). Not in scope.
- The B-2 "Publish failed" copy when only the status poll failed (Found #6). Not in scope.

---

## Fix round 1 (review verdict CHANGES_REQUIRED)
Commits: `68375184f..04993bf41` (7 commits), on top of `e2170fc43`.

Gates:
- tsc `-p packages/editor` and `-p packages/dashboard`: 0 errors each.
- vitest on every touched test file: 115/115.
- vitest on the history, delete and template suites (24 files): 175 passed.
- `verify:ds` in the foreground: exit 0.

**Superseded by this round:** item 4's fix (it descended into children), item 10's payload (it sent whole entries), and the item 1 regex.

| Item | SHA | What changed | Evidence (red → green) |
|---|---|---|---|
| **I-1** (#4) | `68375184f` | `dropLockedAndInstances` takes the RAW selection and never substitutes children. An element is removed only if it is not locked, not in an instance, has no locked descendant and has no locked ancestor (a locked container locks its contents). The delete and cut commands then apply `topMost` to what is kept. | `deleteLockedDescendant.test.ts` has 3 new tests. Explicit Delete on the section removes nothing and emits the skip event (red before: the text was deleted). Explicit Cut removes nothing and leaves the clipboard empty (red before). ⌘A with a locked container keeps the container's children. The ⌘A sibling cases still pass. |
| **I-2** (#10) | `299207d4f` | `boundCmsFields` (in share-link.service) reads only bindings on the DELIVERED pages' elements: field bindings give their `fieldSlug`; a collection list gives the `{{<itemVar>.<field>}}` placeholders in its own subtree. `getPublishedCmsForBindings` projects each entry's `data` and each collection's field list to those slugs plus `displayField`. It reads PUBLISHED entries per collection with `take: CMS_COLLECTION_LIMIT_MAX`. | `share-link.visitor.test.ts`: a collection bound only on a hidden page is not queried; `internal-notes`, `email` and `draftNotes` are absent from both entries and fields ("fire Bob" is not in the payload); every entry read carries the cap. Red before: the where-clause had 3 ids. |
| #3 | `d0f1da0a1` | GenerateBlockScreen now captures the Undo when the insert lands (a ref), not on Done. TemplatesTab captures right after the apply commits, before `requestAnimationFrame`. | `GenerateBlockScreen.test.tsx`: `captureUndo` is called once at insert and not again on Done. Red before: 0 calls at insert. |
| #5 | `2d9e71438` | `refuseForbiddenSave({siteId, composer, addToast, setIsDirty, setSaveState})` sets dirty to false and the save state to idle, then calls `location.replace` a frame and a task later, so the beforeunload guard has re-read the clean state. **The composer's own dirty flag is deliberately NOT cleared:** `markSaved` would claim a save that never happened, and the guard reads the React state, not the composer. The explanation carries across the reload through the kept unsaved record: the view-mode load shows "Your role no longer allows editing … kept in this browser" (pinned by the loadFlow test). | `useComposerInit.offline.test.ts`: the call order is `[clean, navigate]` and the edits are kept. Red before: no clean call. |
| #7 | `3c83e0fad` | New pre-publish row "Template pages" (warning; `ready` unaffected): "`<page>` is a template for `<collection>` — not published." `findStaleTemplateBindings` returns the existing templates by page name. index.html is not listed, because it stays published (home-page-as-template is left to the owner). **Keying templates by page id was not done:** `pageTemplatePath` stores the published file name, and moving it to a page id needs a schema and migration change, which is not cheap. | `publish-prechecks-visibility.test.ts` (row text, `ready` true) and `cms.service.test.ts` (shapes). Red before: the row did not exist. |
| #1 | `e3f383119` | `SCHEME_TYPO` is now `/^(?:(?:https?\|ftp):?\/\/\|www\.)/i`, anchored on the `//`. | `contentIssues.test.ts`: `ftp/docs` and `http/x` are clean; `http//example.com` and `www.example.com` are still flagged. Red before: both were flagged. |
| NEW (sim) | `04993bf41` | `runPrePublishChecks`: with `PUBLISH_ALLOW_SIMULATION=true` and no Vercel connection, "Vercel connected" is a **warning** ("… this publish is simulated and nothing is deployed") and `ready` stays true. This is the same opt-in that `startPublish` and the worker read, and it is never keyed on NODE_ENV. | `publish-prechecks-visibility.test.ts`: flag on gives warning and ready (red before: fail); flag off with `NODE_ENV=development` still fails. |

Still not verified live: all items. Most useful to check:
- I-1: explicit section Delete on S2.
- I-2: the `/share` payload in the network tab, confirming unbound fields are absent.
- NEW: "Publish now" enabled under the flag with no Vercel connection.
