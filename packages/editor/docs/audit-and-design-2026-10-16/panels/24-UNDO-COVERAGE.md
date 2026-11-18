# Panel 24 — Undo, history and recovery coverage matrix: functionality specification (FD-PNL-24)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by U-1, U-8 (row 45 named-version delete, S5) (rows 20/23: 07 ⛔ field tombstone, collection undelete; collab undo: ⛔ MP-8) · not VERIFIED.** *(R-1018: + U-8)* Independent design-qa-critic review: pass 1 PROPOSAL (6 blocking) + 12 notes — fixed 2026-10-17; pass 2: 1 blocking fixed 2026-10-17. Runtime NOT RUN; no undo sequence was executed; geometry NOT MEASURED. Written from the product-design review (`REVIEW-2026-10-17-pro-product-design.md` §8 "Recovery gaps" and the "undo coverage matrix" item in its list of 00 additions), after a source read (file:line below). *(DS)* = designer-selected. Owner standing instruction 2026-10-17: designer recommendations are accepted, but they stay marked *(DS)*; OD-U1…U7 decided (§10, SC-22). Panel 00 (SC-1…SC-22) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2 (§4.9 rewritten to the three classes), S4 (row 59), S5 (row 45, ⛔ U-8), V1 (row geometry); FINAL §4 items 5, 6 (CS-10, CS-13, CS-17), 13; gap rows T3-6, T3-10, T3-12, T5-15, T2-7, D2-9, D2-16, CS-01, CS-17. Round 2: Q10, Q16 *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA:
- **IA-02**, shared document Undo, locally accessible (`PRODUCT-DESIGN-BRIEF.md:794-804`).
- **IAF-18**, History, Compare and Time Travel (`evidence/ia-final-2026-10-16/module-specifications.md:959-1013`).
- IAF-22 K: "No assumption document Undo reverses server CMS/media/master operations".
- P1-D02: a master's recovery is not ordinary Undo.
- **SC-15** (Undo over confirm, 30-day Recently deleted) and **SC-17** (field undo).
- SC-3 (delete = Undo everywhere), SC-6 (viewer), SC-12 (shortcut scope).
- Panels 18 (K-8 Clear history), 20 (AI classes) and 21 §5.3 (collab undo, ⛔ MP-8).
- 00-STRATEGY supporting job "never lose work" (health signal: undo-after-delete rate).

---

## 1. Purpose and boundary
Job: S supporting — "never lose work" (00-STRATEGY §3) *(R-1018)*

For every user operation this panel answers one question: **"If I regret this, how do I get it back, and does ⌘Z do it?"** It is the cross-panel contract for panels 03–21. It adds one surface (Recently deleted for Pages and Components, §4.8). Beyond that it sets rules for the surfaces that already exist: Undo/Redo in the canvas toolbar and in the Brand header, Undo toasts, and History › Session.

**In scope:** the coverage matrix (§4.1), undo scope, what clears the stack, redo, area-aware ⌘Z, labels, how toasts relate to ⌘Z, field undo, how confirms take precedence, and the Recently deleted layouts for Pages and Components.

**Owned elsewhere:**
- History task interior: Panel 12 RT-12 and IAF-18.
- Saves and Published restore: IAF-18 and Panel 14 §5.6.
- Brand restore points: Panel 09.
- Conflict and recovery banners: IAF-22 and Panel 11.
- CMS Recently deleted (records, fields, collections): 07 §8.
- Collab undo mechanics: 21 §5.3.

**Recovery tiers** used throughout:
- **Stack**: the step is in the shared Composer undo stack, so ⌘Z, the toolbar button and History › Session all reach it.
- **Toast**: a separate inverse operation, offered only from its own toast.
- **Server**: soft delete, tombstone, restore point or saved version.
- **None**: there is no way back.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
Editor paths are under `packages/editor/src/`. `server/` and `prisma/` paths are from the repo root.

| ID | Area | Today |
|---|---|---|
| UN-01 | Engine | One class, `engine/HistoryManager.ts:33`. It stores JSON patches and takes a full checkpoint every 10 entries (`:84,209-217`). `engine/history/index.ts:1` is a deprecated folder that only re-exports types |
| UN-02 | Size | 100 entries (`HistoryManager.ts:83`, `shared/constants/config.ts:107`), trimmed at `:694-713` |
| UN-03 | Coalescing | 500 ms window (`:85,95-130`). Style edits merge into `"style-batch"` (`:177-188`). `flushPending()` (`:261-288`) runs before undo and redo (`:521,643`). One-off style actions flush first (`inspector/hooks/useStyleHandlers.ts:115-132`) |
| UN-04 | Transactions | `beginTransaction(label)` / `endTransaction` / `rollbackTransaction` (`engine/Composer.ts:1150-1215`). The transaction label becomes the entry label (`HistoryManager.ts:164-168,193`) |
| UN-05 | Scope | **One stack per loaded site and tab.** The snapshot is all pages plus `designTokens`, the token schema version, `designPresets` and `darkMode`. It excludes metadata and settings (`:378-396`). Undo keeps the current page (`:427-435`). A page switch records nothing (`PageManager.ts:231-245`; the patch is empty, `:205`) |
| UN-06 | Redo | Any new record clears redo (`:230`; collab `:320`). Entry restore also clears it (`:802`). The undo toast offers Redo (`shell/hooks/useHistoryFeedback.ts:187`) |
| UN-07 | What clears the stack | `PROJECT_LOADED` after any `importProject` resets to a "loaded" baseline (`:138-162`; `Composer.ts:682-683,761`). Bootstrap runs flush then clear (`shell/hooks/useComposerInit.ts:538-539`). A saved-version restore goes through `importProject` (`engine/VersionTimelineManager.ts:315`). **Clear undo history** asks for confirmation in two different ways: a chrome-ui `ConfirmDialog` in History (`sidebar/tabs/history/HistoryTab.tsx:214-225,411-421`) and a native `window.confirm` in the palette (`shell/modals/CommandPalette.tsx:283-298`). `clear()` re-seeds a "cleared" checkpoint and keeps nothing to restore (`HistoryManager.ts:827-842`) |
| UN-08 | Unrecorded action | `noteUnrecordedAction(reason)` makes `canUndo` false until the next recorded step (`:715-727`), and undo then emits `HISTORY_NOOP` with the reason (`:522-527`). Called by CMS bind/unbind (`engine/data/BaseBindingManager.ts:128,151,163`) and asset delete (`engine/media/MediaCommandLayer.ts:124`). **Not silent:** a toast says "Can't undo {reason} — it isn't recorded in history. Your earlier edits are still there." (`useHistoryFeedback.ts:216-223`) |
| UN-09 | Toast Undo | `captureUndo()` undoes only while its entry is still on top of the stack (`HistoryManager.ts:583-594`). If a newer entry exists it refuses, and a toast says "Can't undo {label} from here — newer edits came after it. Use ⌘Z to step back through them." (4 s, `useHistoryFeedback.ts:205-214`). Toasts using `captureUndo`: `useHistoryFeedback.ts:198,294,312`; `useClipboardToasts.ts:98,120`; `useBlockInsertion.ts:206`; `canvas/Canvas.tsx:167`; `canvas/hooks/useSectionReorder.ts:293`; `panels/layers/index.tsx:353,386`; `panels/layers/hooks/useLayerContextActions.ts:120`; `shared/elementActions.ts:152`; `inspector/components/ApplyStyleDialog.tsx:56`; `shell/AquibraStudio.tsx:626-632`; `sidebar/tabs/pages/usePages.ts:227,306,331,349`; `sidebar/tabs/templates/TemplatesTab.tsx:367,380`; `GenerateBlockScreen.tsx:208`. Toasts using a separate inverse instead: `media/hooks/useSelectionState.ts:256` (asset grace), `cms/RecordSheet.tsx:350` (record re-create), `component-library/ComponentDetailScreen.tsx:93,195` (main restore, main revert), `settings/screens/RedirectsScreen.tsx:299` (redirect re-create) |
| UN-10 | Toast duration | Default 5 s (`chrome-ui/Toast.tsx:125`). A toast whose action is labelled "Undo" is held for **at least 8 s** (`:126,135-141`). Other recovery labels, such as "Restore", get 5 s |
| UN-11 | ⌘Z | A global `window` listener (`shell/hooks/useEditorShortcuts.ts:210`, mounted at `AquibraStudio.tsx:462`). Mod+Z = undo; Mod+⇧Z / Mod+Y = redo (`:185-193`). It skips `input, textarea, select, contenteditable` (`:108-113`) and aria-modal dialogs (`:96`). **It has no active-area check** (`:91-208`) |
| UN-12 | Session list | `ActivityView` (`HistoryTab.tsx:336-342`). Newest first, index 0 hidden (`engine/HistoryFormatter.ts:25-47`). Unlabelled entries show "Checkpoint" (`:55-56`); the label map is at `:109-138`. Clicking a row runs a truncating restore behind a confirm that counts the discarded steps (`ActivityView.tsx:347-375,466-471`; `HistoryManager.ts:788-823`) |
| UN-13 | Time Travel / Saves | Time Travel preview and restore: `shell/TimeTravelHost.tsx:167,236,240`. Saves restore runs on the client and first writes a "Before restoring" safety version (`VersionTimelineManager.ts:282-322`, `:296-306`); cap 50 (`shared/types/versions.ts:73`). Server `SiteVersion` (`schema.prisma:1164`) supports create, list, get, rename and delete, but has **no restore** (`server/trpc/routers/site-version.ts:26-56`) |
| UN-14 | Collab | Remote ops are applied untracked and never pushed onto `undoStack` (`HistoryManager.ts:333-350`). Collab is demo-only (`engine/AGENTS.md`) |
| UN-15 | Soft delete | `deletedAt` exists only on User, Workspace, Site (restore at `sites.ts:227`), CmsCollection (`schema.prisma:467`) and CmsEntry (`:485`). It is absent from MediaAsset (`:1062`), Page (`:604`), Comment (`:498`), SiteVersion, SiteComponent and UserTemplate. Component definitions live in IndexedDB (`engine/components/ComponentStorage.ts:3`) |
| UN-16 | Viewer | Viewers are shown Undo/Redo (Panel 05 CV-20, `Canvas.tsx:956`) |

## 3. Problems this design solves (00-STRATEGY: "never lose work")
1. **No single place says what ⌘Z covers.** Each panel answers separately (review §8).
2. **⌘Z in CMS, Assets or Site settings undoes a canvas or Brand edit the user can't see** (UN-11). This contradicts IA-02.
3. **"Undo" means three different things:**
   - a stack step;
   - a separate inverse that recreates the record under a new ID (`CmsWorkspace.tsx:486-488`);
   - text-only advice ("Brand applied · Undo ⌘Z", `design-system/ui/sections/BrandFromSource.tsx:227`).
4. **Some deletes SC-15 promises to recover are hard deletes:** assets (`server/services/media.service.ts:401`) and server Page rows (`server/services/page.service.ts:132`). Collections and records are soft-deleted, but nothing can undelete them (`server/trpc/routers/cms.ts:57-126`).
5. **Recovery is uneven within one kind of operation:**
   - Page delete has Undo; page create has none (`sidebar/tabs/pages/components/NewPageModal.tsx:87`).
   - CMS field and collection delete have none (`CmsWorkspace.tsx:235-239`, `CollectionSettingsPane.tsx:93-96`).
   - Component create has none.
6. **Session labels are machine words** ("style-batch", "Checkpoint"), so "Undo {last action}" (Panel 05 §4) cannot name the target.

## 4. Target

### 4.1 Coverage matrix
**Today** codes: S = Stack · T = Toast (separate inverse) · Sv = Server · — = none. **Decided** is the doc and section where the target was set. *(DS)* rows are this panel's choice.

| # | Operation | Today | Target | Decided |
|---|---|---|---|---|
| 1 | Insert element / section / drop | S + toast | Keep. One step; selection returns to the pre-insert selection | 03 AD-11, SC-17 |
| 2 | Delete element(s), single or many | S + toast | S + toast; **never** a confirm | SC-3 |
| 3 | Duplicate, paste, cut, group, ungroup, wrap | S (`engine/commands/defaultCommands.ts:120-373`; `canvas/utils/wrapInContainer.ts:31`) | Keep; a duplicated or pasted element **keeps its Tablet, Mobile and :hover values** (⛔ FI-02, SC-9; acceptance T-FI-02 = T-UN-23) *(R-1018, T2-7)* | SC-3 |
| 4 | Move, reorder, move to page | S (`drag/dropOperations.tsx:106,252`; `panels/layers/index.tsx:180,353`) | Keep; off Desktop the toast says "applies to all breakpoints" | SC-13, 04 T-LY-04 |
| 5 | Resize | S; **Esc calls `history.undo()`** | One gesture = one step; Esc cancels only the gesture (Fix) | 05 §5 FI-01 |
| 6 | Style edit, class add/apply, reset, apply to peers | S (coalesced; `ElementStyles.ts:98,109`; `ClassAddDialog.tsx:50`) | Keep. One typing or scrub interaction = one step | 06 WF-INS-01 |
| 7 | Inline text edit | S `"inline-edit"` (`useCanvasInlineEdit.ts:166`) | Field undo while editing; one step on commit | SC-17 |
| 8 | Lock / unlock, rename layer | S | Keep | 04 LY-10/14 |
| 9 | Brand token edit / delete, alias, dark value | S (`Composer.ts:283-307`; delete goes through the same `setTokens`, not traced per kind) | Keep, with Undo/Redo in the Brand header | IA-02, 09 §4 |
| 10 | Brand class delete | NOT traced | One stack step (same rule as token delete) *(DS)* | this panel |
| 11 | Brand starter apply | S `"Apply starter"` (`useApplyStarter.ts:55`); no restore point | Preview → restore point → one step + toast with an action | 09 §4, T-BR-03 |
| 12 | Brand **Import** (Import/export card) | S; **no restore point** (09 problem 3) | **NEW:** dry-run → restore point → one step + toast Undo | 09 §4 Import |
| 13 | Brand from logo / URL, Scale, Dark Auto | Sv restore point first (`BrandFromSource.tsx:216`, `ScaleGenerator.tsx:100`, `DarkModeCard.tsx:77`) + S; the logo toast is text only | Keep Sv + S; the toast gets a real **Undo** action (Fix) | 09 §4 |
| 14 | Brand Review changes › Revert; restore a restore point | S (`useSessionEdits.ts:166-176`; `useBrandRestorePoints.ts:65-66`) | Keep. ⌘Z re-applies | SC-15, 09 header |
| 15 | CMS record create / edit | — | Field undo in the form. ⌘Z never touches records | IA-02, 07 §5 |
| 16 | CMS record delete | Sv soft delete (`cms.service.ts:439-445`) + T re-create **with a new ID** (`RecordSheet.tsx:345-351`) | "Deleted — Restore" + Recently deleted, exact Restore. A record that owns a generated page keeps its **typed confirm** (exception E-1) | 07 §5, SC-15 |
| 17 | CMS bulk delete | as 16, per record | Bulk Restore | 07 §8 |
| 18 | CMS CSV import | — (`cms.ts:126`) | Out of scope here; import report + recovery per 07 §5 Bulk | 07 |
| 19 | CMS field add | — | Toast Undo while no record holds a value *(DS)* | this panel |
| 20 | CMS field delete | — (`CmsWorkspace.tsx:235-239`) | When N>0, a **typed confirm** (E-3, kept even after the tombstone ships), then a 30-day field tombstone with Restore field. **⛔ Fallback** until the tombstone ships: delete refused while any record holds a value | 07 §6 C-4, SC-9 ⛔ |
| 21 | CMS field type change | — | Conversion step; lossy changes need a confirm (SC-15 lossy exception) | 07 §6 |
| 22 | CMS collection create | — | Toast Undo while empty *(DS)* | this panel |
| 23 | CMS collection delete | Sv soft delete (`cms.service.ts:307-318`); no Undo | Blocked while bound; **typed confirm** (E-2); 30-day Recently deleted + Restore collection | 07 §8 C-5, SC-9 ⛔ |
| 24 | CMS bind / unbind | Unrecorded; the next ⌘Z is refused with the reason (UN-08) | **Change:** a stack step (U-3) | IA-02, this panel |
| 25 | Asset upload | — | None; Delete is the reverse; in-flight Cancel is immediate | 08 §5 |
| 26 | Asset rename, alt text, metadata | Server write (`media.ts:213` `updateAsset`) | Field undo while editing; after save, none *(DS)* | 08 |
| 27 | Asset folder delete | Server (`media.ts:164`) | No asset is deleted ("Assets move to All assets"); toast Undo re-creates the folder *(DS)* | 08 §5 |
| 28 | Asset delete | T, 8 s client grace (`MediaCommandLayer.ts:68,94-157`), then a **server hard delete** (`media.service.ts:401`) | Grace Undo toast (keep). **NEW (DS):** Assets › Recently deleted for 30 days (OD-U3, U-4). Until U-4, the usage confirm stays when the asset has known placements (E-4) | 08 §5, this panel |
| 29 | Asset replace across site | S, but one transaction per source (`ReplaceAcrossDialog.tsx:78-90`); no toast | All-or-none: **one** step + toast Undo | 08 §5 IAF-09 G |
| 30 | Asset image-edit version | Sv `media.restoreAssetVersion` (`media.ts:294`) | Keep | 08 |
| 31 | Page create (blank) | S; toast without Undo (`NewPageModal.tsx:87`) | Toast **Undo** (Fix) | SC-15 |
| 32 | Page create from template | confirm; no Undo (`TemplatesTab.tsx:310-321,382-384`) | Undo including the nav entry after T-4; the confirm stays until then | 15 §5, T-4 |
| 33 | Page delete / bulk delete | S + toast (`usePages.ts:306-317,331-337`) | **No confirm**; S + toast; afterwards **Pages › Recently deleted** (§4.8) | SC-15, this panel §4.8 |
| 34 | Page rename, homepage, duplicate, move to folder | S; rename and homepage toasts have Undo; the duplicate toast offers only Open (`usePages.ts:268`); folders are per user, server/local and outside the document (`useFolders.ts:2-10`) | The duplicate toast gets Undo + Open; move to folder gets toast Undo *(DS)* | SC-3, 11 §5 |
| 35 | Page settings save | S via `updatePage` (`usePageSettings.ts:247`) | Keep; Cancel in the footer before Save | 11 PG-10 |
| 36 | Site settings save (staged) | — (`Composer.ts:994-996`) | No document undo; Cancel before Save; conflict review once the revision stamp ships | 10 §5, IA-02, OD-U2 |
| 37 | Site settings immediate actions | T on redirect delete (`RedirectsScreen.tsx:286-310`) | Keep; domain delete = confirm (SC-15 exception) | 10 §5 |
| 38 | Component create main | — | Toast Undo removes the main and restores the source elements, until the main is used elsewhere (U-5) | 13 §5 ("Undo toast") |
| 39 | Edit main / Update from selection | T `revertComponentMaster` (`ComponentDetailScreen.tsx:194-197`) | Keep T; ⌘Z never touches a main | 13 §6, P1-D02 |
| 40 | Delete main | T `restoreDeletedComponent` (`:86-95`) | T + **Components › Recently deleted** (§4.8) | SC-15, this panel §4.8 |
| 41 | Detach instance, instance override | S (`ComponentInstances.ts:281-286`) | Keep | 13 §6 |
| 42 | Library share update / package import | — | A separate library transaction with "Undo import" until a dependent edit exists | 13 §7–8 |
| 43 | Template replace page | backup + S + toast | Keep; preceded by an **SC-15 class (b) consequence confirm** (S2) *(R-1018)* | 15 §5 |
| 44 | Saved template save / delete | — / server delete (`user-template.ts:37`) | **Delete = SC-15 class (a)** (owner Q16): no confirm; toast "{Name} deleted · Undo · Recently deleted ›" (≥ 8 s) + **Templates › Recently deleted** for 30 days (§4.8, same ID). Needs U-9; Save → none *(R-1018b)* | 15 (saved cards), U-9 |
| 45 | Saved-version delete / rename | Sv delete (`site-version.ts:56`), no Undo | **Delete (named version) → toast "{Name} deleted · Undo · Recently deleted ›" + History › Saves › Recently deleted for 30 days** with Restore (same ID), row pattern §4.8 (S5; needs server soft delete, ⛔ U-8). **Interim guard until U-8:** SC-15 class (b) consequence confirm "This version will be deleted permanently — it can't be restored yet." Rename: unchanged (IAF-18) *(R-1018, S5 / T3-6)* | S5, IAF-18, 12 History |
| 46 | Publish / republish | — | Not undoable; republishing an earlier release is the recovery; **republish asks an SC-15 class (b) consequence confirm** (S2) *(R-1018)* | 14 §5.6 |
| 47 | Unpublish | — | Typed confirm (SC-15 exception); toast "Publish again" | 14 §5.7 |
| 48 | AI class A (Generate a block) — **Inactive (SC-21)** | S, one step (`GenerateBlockScreen.tsx:187-208`) | One step "AI · Generated a block"; Undo removes it | 20 §5.1 |
| 49 | AI class B (AI task run) — **Inactive (SC-21)** | One entry per approved step (Panel 20 AI-03; `sidebar/tabs/ai/applySetStyle.ts:691-730`) | One step per approval + **"Undo this run's N changes"**, which stops at the first step a newer edit sits on (`sidebar/tabs/ai/hooks/useAgentRunner.ts:413-421`). Copy "2 of 3 undone…" per 20 §5 | 20 §5 |
| 50 | AI Brand generate — **Inactive (SC-21)** | — (no Accept) | Preview → Apply = one step | 09 §4 |
| 51 | Issue auto-fix | S + toast | Keep | 12 RT-15 |
| 52 | Comment create / resolve | create: none (no delete exists, `comments.ts:40-101`); resolve toggles (`services/ReviewService.ts:315-318`) | Create: out of scope (17 owns comments). Resolve → toast Undo (reopen) (OD-U7). Never in ⌘Z | 17, IAF-19 |
| 53 | Session or Time Travel restore | truncates the stack and redo; **a Session-row restore never triggers a save** (INV BK-19) | Safety checkpoint + truncation warning (keep); **the restore marks the document dirty and queues a save** like any edit (Fix) *(R-1018, T5-15; acceptance T-UN-22)* | IAF-18 G |
| 54 | Saved-version restore | Before-restoring version, then a stack reset | Persistent **Undo restore** from the safety version, with a revision check | IAF-18 G/H |
| 55 | Clear undo history | two kinds of confirm (UN-07) | Until K-8: one chrome-ui confirm (E-5). After K-8: clears at once with "History cleared · Undo" | 18 CP-16, K-8 |
| 56 | Getting-started dismiss | — | Toast Undo | 16 (checklist ✕) |
| 57 *(R-1018, T3-12)* | Page folder delete (pages kept) | folders per user, outside the document (`useFolders.ts:2-10`) | Toast **Undo** re-creates the folder and puts its pages back (same rule as row 27); never in ⌘Z | this panel, 11 §5 |
| 58 *(R-1018, S2)* | Site-level and live-impact actions | various | Class per §4.9: archive / unarchive site, locale remove, redirect delete, set primary domain → **Undo only**; duplicate site, change a live page's slug, remove password protection and publish, choose the active set on downgrade → **consequence confirm**; delete site (screen states the 30-day restore), unpublish, transfer → **typed confirm** | SC-15 (S2) |
| 59 *(R-1018, S4)* | Overwrite in a save conflict | confirm, no snapshot (BK-59) | Consequence confirm → **"Before overwrite · {time}" written to History › Saves first** (server version), then overwrite; toast links to it. Recovery = Restore that save | Panel 22 §5.4, ⛔ G-14 |
| 60 *(R-1018, S2)* | Reload latest (discards local changes) | confirm | Consequence confirm (keep); Download a copy stays a separate action in the same dialog | Panel 22 §5.4 |

### 4.2 Undo scope
- **One stack per site per editor tab**, for the signed-in user. It covers all pages plus Brand and is not per page (UN-05; IA-02: "no promise that Undo only affects the visible page").
- **Off-page target:**
  - The control's name and tooltip carry the scope: "Undo: Moved Hero · About" or "Undo: Primary colour · site-wide".
  - After undoing, the user stays where they are, and a toast says "Undid: Moved Hero on About · View" (IA-02 Completion).
  - **View** opens the page through the guarded page-open contract (Panel 11 §4).
- **Collaboration:** the user undoes only their own operations, and remote changes never enter their stack. If a peer has since changed the same thing, that step is skipped with "Can't undo — Ana changed this after you", and undo moves to the next step (21 §5.3, ⛔ MP-8). Phase B stays off until MP-8 ships.
- **Two tabs:** each tab has its own stack. SAVE_CONFLICT governs (IAF-22); Undo never overwrites a newer server revision.

### 4.3 Area-aware ⌘Z (Change UN-11; IA-02 Module eligibility)

| Focus / area | ⌘Z | ⌘⇧Z / ⌘Y |
|---|---|---|
| Text field, inline text, code field (SC-17; SC-12 Field/Text scopes) | Field undo until commit (Enter or blur). After that, document undo works only in Editor and Brand | Field redo |
| Editor: canvas, Layers, or Inspector outside a field | Document undo | Document redo |
| Brand, outside a field | Document undo (same stack; header buttons) | Document redo |
| CMS, Assets, Site settings, Templates, Components, outside a field | **Never changes the document.** If that area's own recovery toast is still on screen, ⌘Z runs that toast's action (OD-U1). Otherwise status "Nothing to undo here — **Open Editor to undo**". That action navigates and does not undo (IA-02 copy) | No-op + the same message |
| Dialog, Compare, Time Travel, Preview | That surface's own rules | Same |
| Viewer | Undo/Redo hidden; ⌘Z does nothing | No-op |

The command palette's Undo and Redo follow the same eligibility (IA-02). If an area's toast has expired, ⌘Z falls back to the message; it never reaches the document.

### 4.4 Undo toasts and ⌘Z: one rule
- **Stack toast:** its Undo and ⌘Z are the same step. Using either removes the step, and the toast becomes "Undone · Redo" (existing, `useHistoryFeedback.ts:187-198`).
  - **Change:** once a newer step exists, the toast's Undo is shown **disabled**, with the description "Newer edits came after it — use ⌘Z". Clicking it is not possible.
  - The existing refusal toast (`useHistoryFeedback.ts:205-214`) stays for ⌘K and palette paths. Its wording is kept.
- **Toast (separate inverse):** this is the only way back for its operation, and ⌘Z does not see it (except under the OD-U1 rule in its own area). The copy states what the action really does: "Restore as new record" until exact Restore ships.
- **Server:** the item always has a lasting home (Recently deleted, Restore points, Saves or Published) **and** a toast. The toast is a shortcut, never the only path (SC-15).
- **Unrecorded steps** (UN-08): keep the existing refusal toast "Can't undo {reason} — it isn't recorded in history…" (`:216-223`). After U-3, a CMS bind stops being one of these.
- **Duration:** a toast whose action is labelled "Undo" already lasts at least 8 s (UN-10, keep).
  - **Change:** every recovery action (Restore, Undo restore, Publish again) gets the same 8 s minimum, paused while hovered or focused.
  - One toast per operation; stack, caps and announcements follow **Panel 22 §5.10** (toasts own no live region; the single live pipe announces them) *(R-1018 — was "Toasts use `role=status`", overridden by Panel 22)*. The host already shows only the newest transient (`Toast.tsx:10-14`).

### 4.5 Labels in History › Session and on the Undo control
- Each row reads **verb + target + place**, built from the transaction label plus target metadata (U-2). Examples: "Changed padding · Hero · Home", "Primary colour · Brand", "Deleted 3 elements · About". Until U-2 ships, rows use the `HistoryFormatter` map (`:109-138`).
- "style-batch" becomes **"Style changes · {element}"**.
- "Checkpoint", "loaded" and "cleared" render as dividers, not undoable rows: "Opened site 10:42", "History cleared 11:05" *(DS)*.
- Undo/Redo tooltip and accessible name: "Undo {row label}" (Panel 05 §4). When disabled, they give the reason.
- Clicking a row keeps today's truncating restore and its discard count (IAF-18 G). The row action reads "Restore to here".

### 4.6 What clears the stack
| Event | Effect | Rule |
|---|---|---|
| Open site, reload, sign in after a reload | New baseline "Opened site" | Keep; the stack lives for the session only (OD-U4) |
| Saved-version restore | Baseline "Restored {version}"; Undo restore uses the safety version | IAF-18 G |
| Session row or Time Travel restore | Later steps and redo are dropped after a warning | IAF-18 G |
| **Clear undo history** (History ⋯ / ⌘K) | **Until K-8:** one chrome-ui ConfirmDialog in both places (keep the existing History copy, `HistoryTab.tsx:418-420`; the palette's `window.confirm` goes). **After K-8:** clears at once, toast "History cleared · Undo", and Undo restores the cleared steps | 18 CP-16, K-8; unavailable to viewers and during an unresolved conflict |
| More than 100 steps | The oldest are dropped; divider "Older steps dropped — see Saves" *(DS)* | UN-02, OD-U6 |
| Page switch, area switch, task open/close, save, publish | **Never** clear the stack | UN-05 |

### 4.7 Redo rules
- Redo uses the same stack (IA-02).
- A new recorded step clears redo (UN-06, keep).
- A truncating restore clears redo, after a warning.
- Separate-inverse toasts have no redo; deleting again is the reverse.
- Redo follows the §4.3 eligibility.

### 4.8 Recently deleted: Pages and Components (owned by this panel, NEW)
SC-15 says: deleting a page or main component "moves it to that area's Recently deleted list for 30 days with Restore (same ID where the server supports it — SC-9). Undo toast as well." This section sets the layout. CMS (07 §8) and Assets (OD-U3) use the same row pattern.

- **Entry points:**
  - Pages: manager header ⋯ › **Recently deleted (N)**.
  - Components: nav list footer › **Recently deleted (N)**.
  - Templates *(R-1018b, owner Q16)*: Templates area › Saved templates header ⋯ › **Recently deleted (N)** (Panel 15 hosts it, back "‹ Back to Templates"); secondary line "Saved {date} · Deleted by {name} · {age}". Needs U-9.
  - Both: the delete toast's link "Recently deleted ›".
  - The entry is always present; when N = 0 it reads "Recently deleted".
- **Named versions** *(R-1018, S5)*: History › Saves gets the same subview, "Recently deleted (N)" at the foot of the Saves list (Panel 12 hosts it), back "‹ Back to Saves"; secondary line "Saved {date} · Deleted by {name} · {age}". Needs ⛔ U-8.
- **List:** the subview replaces the list, with back "‹ Back to Pages" / "‹ Back to Components" (SC-1). Rows are **48 px two-line rows** (DS §2.7 row set: name + secondary line; was "32 px", which cannot hold two lines) *(R-1018, T3-10 / D2-16 — V1 keeps 40 for thumbnail resource lists; these rows carry no thumbnail)*:
  - name;
  - secondary line, page: "/about · Folder: Company · Deleted by you · 2 days ago";
  - secondary line, component: "Detached 6 instances on 3 pages · Deleted by Ana · today";
  - a right-hand "Deletes in 28 days" label, written as text (not colour alone) when under 3 days.
  - Newest first. Multi-select gives bulk Restore (and Delete permanently, ADMIN+) through the **shared bulk bar → SC-32** "{N} selected · Restore · Delete permanently · Clear" (owner Q10) *(R-1018b; was the CS-18 pointer)*.
  - **Search for long lists** *(R-1018, CS-17)*: above **20 rows** a search field ("Search deleted pages" / "…components" / "…versions") sits above the list; it matches the name and the slug; SC-2 search behaviour (Esc clears, second Esc blurs); "No deleted {items} match '{q}'" when empty.
  - **Long names** *(R-1018)*: the name and the secondary line each stay on one line and truncate with an ellipsis at the end (slugs truncate in the middle so the last segment stays visible); the full text is in the tooltip and the accessible name; toasts name the item truncated at 40 characters with "…".
- **Restore:**
  - **Page:** restored with the same ID, slug, folder, settings and position. If the slug is now taken: "Restore with a new slug" (slug field prefilled `about-2`). If the folder is gone, the page goes to the root.
  - **Component:** restored with the same ID, and instances it detached are re-linked when unchanged since the detach. Others are listed as "2 instances were edited after detach and stay detached".
  - Result toast: "About restored · Open".
- **Delete permanently:** row ⋯ for ADMIN+ only. **Typed confirm** — SC-15 class (c) (S2): "Delete About permanently? This can't be undone. Type **About** to confirm." [Delete permanently] (enabled only when the text matches) [Cancel] *(R-1018, S2; resolves D2-9 — was "non-typed confirm"; Panels 07 §8 and 13 §4 cite this one rule)*.
- **Expiry:** the server purges after 30 days. Nothing else purges, including publish and plan changes (SC-20 "nothing is deleted").
- **Empty state:** "Nothing deleted in the last 30 days. Deleted pages stay here for 30 days." (components: the same with "components").
- **States:**
  - Offline: Restore disabled, **"Needs a connection"** (Panel 22 §5.3; was "Can't restore while offline") *(R-1018, CS-10)*.
  - Viewer: not available (SC-6).
  - Loading: skeleton rows.
  - Failure: "Couldn't load deleted pages — Retry" (server); offline: "You're offline" — never blame the connection for a server error *(R-1018, DS §3)*.
- **Dependencies:** U-7 (pages), ⛔ U-8 (named versions), U-9 (saved templates, Q16 *(R-1018b)*) and the existing SC-9 row for component Recently deleted. Fallback: only the session ⌘Z and the toast, with the item named.

### 4.9 Confirm precedence (SC-15)
SC-15 wins: every delete and destructive change uses Undo, **except** the declared confirmations. *(R-1018, S2 / CS-01 — SC-15 is split into three classes; every action is listed once.)*
- **(a) Undo only** — toast ≥8 s "{Name} {verb} · Undo", plus Recently deleted where the object has one: delete page / component / collection / record / field (as today, with E-1…E-3 below), archive / unarchive site, locale remove, redirect delete, detach instance(s), update main from selection, set primary domain, **named-version delete** (S5, row 45), **saved page template delete** (owner Q16, row 44) *(R-1018b)*.
- **(b) Consequence confirm** — a plain dialog that states the consequence; default = Cancel: replace page from template, republish, reload latest (discards local), overwrite in a conflict (after the "Before overwrite" save, S4), remove password protection and publish, change a live page's slug, Inspector column reduction that removes content, component Reset that drops overrides, choosing the active set on plan downgrade, duplicate site, delete N form submissions ("Delete N submissions permanently" — submissions are hard-deleted).
- **(c) Typed confirm** — delete site (the screen also states the 30-day restore), unpublish site, transfer site, permanent delete from Recently deleted (§4.8), and the CMS exceptions E-1 / E-2 / E-3 below.
- **Unchanged existing SC-15 items:** delete domain, revoke a client review link (Panel 17), Clear undo history until K-8 (E-5), discarding a kept unsaved copy (Panel 22, incl. RecoveryBanner Discard), lossy CMS conversions, asset delete while placed (E-4).
- **Duplicate name** ("create anyway?") → inline warning under the name field, **no dialog**.
- Plus the exceptions **E-1…E-5** declared below for Panel 00 (IDs kept). **Every confirm in the product is listed in SC-15; a panel that needs another must add it there first** (SC-15 sentence; advisory prompts are not confirms) *(R-1018)*.
- **E-1:** typed confirm to delete a CMS record that owns a generated page (07 §5, `RecordSheet.tsx:339`).
- **E-2:** typed confirm for collection delete (07 §8).
- **E-3:** typed confirm for CMS field delete when N > 0 records hold a value (07 §6 C-4). It is **kept after the tombstone ships**, because the confirm states the data count.
- **E-4:** asset delete confirm while the asset has known placements, **until U-4 ships**. Reason: the server hard-deletes after the 8 s grace (08 §5).
- **E-5:** Clear undo history confirm, **until K-8 ships** (18).

Page delete is **not** an exception; it follows SC-15 (Undo + Recently deleted). Text follow-up: Panel 11 T-PG-06 "⌫ opens delete confirm".

## 5. Flows
### 5.1 Delete anything
1. Delete happens at once; there is no confirm unless §4.9 lists one.
2. Toast "{Name} deleted · Undo · Recently deleted ›" (CS-13 one template) *(R-1018)*.
3. Pages, records, fields, collections, main components, named versions (after U-8), saved templates (after U-9 *(R-1018b)*) and (after U-4) assets stay in that area's Recently deleted for 30 days.
4. Restore uses the same ID where SC-9 allows.
5. Permanent delete is a **typed** confirm (class c) *(R-1018)*.

### 5.2 ⌘Z in CMS after a canvas edit (T-IA-02)
1. Edit Hero in the Editor, open CMS, delete a record.
2. ⌘Z with no field focused runs the record toast's Restore (OD-U1).
3. ⌘Z again shows "Nothing to undo here — Open Editor to undo". The canvas edit is unchanged.
4. **Open Editor to undo** opens Editor (SC-1). The button there reads "Undo: Changed text · Hero · Home".

### 5.3 Brand ↔ canvas
1. Make a canvas edit, then a Brand token edit.
2. Undo in the Brand header reverses the token.
3. The next Undo's tooltip names "· Home" before it is pressed; pressing it reverses the canvas edit.
4. Redo restores both, in order (T-IA-02, T-BR-02).

## 6. States and permissions
| State | Behaviour |
|---|---|
| Viewer | No Undo/Redo, no Clear, no Recently deleted (SC-6, 05 CV-20) |
| EDITOR | All stack operations; Restore in the areas they can edit; permanent delete is ADMIN+ |
| Read-only (Brand migration lock, unresolved conflict) | Undo/Redo disabled with the reason, e.g. "Brand is read-only while tokens migrate" (09 §6); Clear unavailable |
| Offline | The stack works locally; Server-tier restores are disabled with "Needs a connection" (Panel 22 owns the offline announcement) *(R-1018, CS-10)* |
| Refused undo (superseded, unrecorded, peer-changed) | Existing refusal toasts (§4.4) and 21 §5.3 copy |
| Collab | Own operations only, with skip, after ⛔ MP-8; Phase B off until then |
| Plan lock (over Free limit, SC-20) | Undo and Redo of steps that touch locked items are refused with "Over the Free limit — Upgrade to edit"; the stack is kept and works again after upgrade. Delete of a locked item (OD-PL-7) is an ordinary Undo toast plus Recently deleted. Restore while at or over the limit restores the item locked |

## 7. Content / copy
- Toasts:
  - "{N} elements deleted · Undo"
  - "About deleted · Undo · Recently deleted ›"
  - "{Record} deleted · Undo · Recently deleted ›" (CS-13 one template; until exact Restore ships the action reads "Restore as new record", §4.4) *(R-1018 — was "Record deleted — Restore")*
  - "About restored · Open"
  - "History cleared · Undo" (after K-8)
- Disabled toast Undo: "Newer edits came after it — use ⌘Z".
- Area message: "Nothing to undo here — Open Editor to undo".
- Refusals: existing (`useHistoryFeedback.ts:205-223`) and "Can't undo — Ana changed this after you" (21).
- Divider rows: "Opened site 10:42", "History cleared", "Older steps dropped — see Saves".
- Never write "Undo restores it" for an inverse that creates a new ID (Fix, `RecordSheet.tsx:349`).

## 8. Geometry and accessibility (NOT MEASURED)
- Undo/Redo stay 32×32 in the canvas toolbar (05) and Brand header (09). Recently deleted uses the host sheet or detail geometry (Pages sheet 560/720, Components detail column, History › Saves task 360) with **48 px two-line rows** *(R-1018, T3-10)*; row ⋯ is a 24 in-row icon button with ≥8 spacing.
- Accessible names carry label and scope. Disabled controls are `aria-disabled` with the reason as their description; a disabled toast Undo is focusable and reads its reason.
- Undo completion and refusals are announced politely. The Session list keeps the IAF-18 I keyboard rules.
- Recently deleted is a listbox with multi-select (Space, ⇧↑/↓). Focus after Restore goes to the next row, or to the empty-state heading.
- Toasts with actions are reachable in the bottom-bar F6 region (SC-5) and never take focus.

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| UN-01–04 engine, coalescing, transactions | unchanged | Keep |
| UN-05 site-wide stack | same + scope labels | Keep + NEW |
| UN-06 redo | same | Keep |
| UN-07 Clear behind two confirms | one chrome-ui confirm → Undo after K-8 | Change |
| UN-08 unrecorded refusal toast | kept; CMS bind becomes recorded (U-3) | Keep + Change |
| UN-09 superseded refusal toast | kept; toast Undo additionally shown disabled | Keep + Change |
| UN-10 Undo toasts ≥8 s | same; other recovery labels also ≥8 s | Keep + Change |
| UN-11 global ⌘Z | area-aware (§4.3) | Change (IA-02) |
| UN-12 Session list, truncating restore | labelled rows, dividers, same restore | Keep + Change |
| UN-13 Time Travel, Saves restore + safety version | same + persistent Undo restore | Keep |
| 19 stack toasts / 5 inverse toasts (UN-09) | same, with honest copy | Keep + Fix |
| UN-16 viewer Undo/Redo | hidden | Change (05) |

No capability removed. ⌘Z stops reaching the document from CMS, Assets, Site settings, Templates and Components. This is a routing change under IA-02: the same steps stay reachable from Editor and Brand.

## 10. Planned and owner decisions — OD-U1…U7 **Decided (SC-22)** as recommended
- Planned: an undo stack persisted across reload (OD-U4; not recommended now).
- **OD-U1** *(Decided, SC-22)*: in a non-document area, should ⌘Z run that area's live recovery toast? **Recommend: yes** *(DS)*. It matches intent and never touches the hidden document.
- **OD-U2** *(Decided, SC-22)*: should Site settings saves get document undo? **Recommend: no.** Cancel before Save, revision-stamp conflict review, and per-action toasts cover it.
- **OD-U3** *(Decided, SC-22)*: should Assets get a 30-day Recently deleted (server soft delete)? **Recommend: yes.** A favicon or OG image breaks silently after the 8 s grace.
- **OD-U4** *(Decided, SC-22)*: should the undo stack survive a reload? **Recommend: no.** Saves and local recovery cover reloads, and a persisted stack could replay over a newer server revision.
- **OD-U5** *(Decided, SC-22)*: should a collab undo that a peer invalidated be skipped (21 §5.3) rather than blocking the whole stack? **Recommend: skip** (as 21 decides).
- **OD-U6** *(Decided, SC-22)*: keep the 100-step limit? **Recommend: keep it** and add the "Older steps dropped" divider. Measure memory before raising it.
- **OD-U7** *(Decided, SC-22)*: should comment resolve get a toast Undo (reopen)? **Recommend: yes.** The toggle exists. Comment delete stays absent.

## 11. Engineering dependencies (add to SC-9)
| ID | Dependency | Fallback until shipped |
|---|---|---|
| ⛔ U-1 | Area-aware document shortcut routing (§4.3) in `useEditorShortcuts.ts` and the palette | **Interim guard (mandatory):** outside Editor and Brand, document Undo/Redo is **blocked** and the status shows "Nothing to undo here — Open Editor to undo". It never runs |
| U-2 | Target, page and area metadata on history entries | `HistoryFormatter` labels; plain "Undo" when there is no label |
| U-3 | CMS bind/unbind recorded as stack steps | Existing refusal toast (`useHistoryFeedback.ts:216-223`) |
| U-4 | Server soft delete + restore for MediaAsset (OD-U3) | 8 s grace + usage confirm (E-4) stating "After 8 seconds this can't be undone" |
| U-5 | Component-create undo (remove main, restore source elements, guarded by usage) | Delete main + its toast |
| ⛔ U-8 *(R-1018, S5 / T3-6)* | Server soft delete + restore for `SiteVersion` (named versions; no `deletedAt` today, UN-15) — = SC-9 ⛔ "Named-version soft delete" | **Interim guard (mandatory):** class (b) consequence confirm "This version will be deleted permanently — it can't be restored yet." |
| U-9 *(R-1018b, owner Q16)* | Server soft delete + restore for `UserTemplate` (no `deletedAt` today, UN-15) + Templates › Recently deleted store (30 days) — part of the SC-9 "Recently deleted" row | Toast Undo only, through a client grace period before the server delete (the Assets row 28 pattern) *(DS)*; no Recently deleted entry until U-9 |
| U-7 | Server page soft delete + Pages Recently deleted store (Page has no `deletedAt`, `page.service.ts:132`; relation to the document's pages NOT traced) | Session ⌘Z + toast only, item named |
| K-8 (Panel 18) | `history.clear()` keeps the cleared stack restorable while the toast shows | One chrome-ui confirm (E-5) |
| ⛔ MP-8 (Panel 21) | Collab-aware undo with skip | Collab Phase B off |
| — | Existing rows: CMS record undelete; ⛔ field tombstone; ⛔ collection undelete (07); component Recently deleted (SC-9); T-4 (15); Replace across site all-or-none (08); FI-01 resize Esc (05) | As each panel states |

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-UN-01 | Edit on Home → open CMS → ⌘Z outside a field → the canvas is unchanged and "Nothing to undo here — Open Editor to undo" shows; the action opens Editor without undoing |
| T-UN-02 | In CMS delete a record → ⌘Z → the record's Restore runs (OD-U1); ⌘Z again → message only |
| T-UN-03 | In CMS, wait until the record toast expires → ⌘Z → message only; the document is unchanged |
| T-UN-04 | Brand token edit after a canvas edit: the header Undo reverses the token; the next tooltip names "· Home"; Redo restores both in order |
| T-UN-05 | Typing in an Inspector field, ⌘Z reverts characters; after Enter, one ⌘Z undoes the whole field change |
| T-UN-06 | Delete an element → make another edit → the toast Undo is disabled with "Newer edits came after it — use ⌘Z"; ⌘Z twice restores both in order |
| T-UN-07 | Delete 3 elements from canvas, Layers and toolbar → never a confirm; toast "3 elements deleted · Undo" |
| T-UN-08 | Create a blank page → toast Undo removes it. Delete a page → no confirm → ⌘Z restores slug, folder and settings. After reload the page is listed in Pages › Recently deleted, and Restore brings it back with the same slug (after U-7) |
| T-UN-09 | Delete a main with 6 instances → Components › Recently deleted → Restore re-links the unchanged instances and lists edited ones; ⌘Z never restores a main |
| T-UN-10 | CMS field with values → typed confirm → Fields › Recently deleted → Restore field brings the values back. Before the tombstone ships: delete refused while values exist. Collection → Restore collection resolves its bindings again |
| T-UN-11 | Bind a field → ⌘Z unbinds it (after U-3); before U-3 the existing refusal toast names the reason |
| T-UN-12 | Replace across site on 4 placements → one Undo reverts all 4 |
| T-UN-13 | Delete an asset → wait 9 s → Assets › Recently deleted lists it (after U-4); before U-4 the confirm states the 8 s limit |
| T-UN-14 | With 5 steps in History › Session, switch page, switch area, save and publish → still 5 rows, and the Undo tooltip still names the same last step. Reload → Session shows only the "Opened site" divider and Undo is disabled |
| T-UN-15 | Before K-8: Clear history from History and from ⌘K → the same chrome-ui dialog (no `window.confirm`). After K-8: clears at once, "History cleared · Undo", and Undo restores the steps. Disabled for viewers |
| T-UN-16 | Session list shows "Style changes · Hero · Home", not "style-batch"; the "Opened site" divider is not clickable |
| T-UN-17 | **Inactive (SC-21)** — AI task run with 6 approved changes → "Undo this run's 6 changes" removes all 6; one ⌘Z removes only the last approved step; with a manual edit on top, Undo this run stops and reports how many were undone |
| T-UN-18 | Offline → Restore in every Recently deleted list is disabled with "Needs a connection" *(R-1018)*; stack ⌘Z still works |
| T-UN-19 | Brand migration lock → Brand Undo/Redo disabled with the lock reason; viewer sees no Undo/Redo and ⌘Z does nothing |
| T-UN-20 | Workspace on Free over the page limit after the trial: ⌘Z on a step that edited a locked page → refused "Over the Free limit — Upgrade to edit", Undo count unchanged; after upgrade the same ⌘Z works. Delete a locked page → Undo toast + Pages › Recently deleted; Restore while still over the limit → page returns locked |
| T-UN-21 | Create a component from a selection → toast Undo restores the original elements and removes the main (after U-5) |
| T-UN-22 *(R-1018, T5-15)* | History › Session → Restore to here → status shows Saving… then Saved; reload shows the restored state |
| T-UN-23 *(R-1018, T2-7 = T-FI-02)* | Duplicate and copy/paste an element with Tablet, Mobile and :hover values → the copy has the same values at every breakpoint and state |
| T-UN-24 *(R-1018, S5)* | Delete a named version → toast "{Name} deleted · Undo · Recently deleted ›"; Undo brings it back; after the toast, History › Saves › Recently deleted lists it and Restore returns it with the same ID (after U-8); before U-8 the consequence confirm shows instead |
| T-UN-25 *(R-1018, S2)* | Permanent delete from any Recently deleted list asks a typed confirm (button enabled only on an exact name match); republish, Replace page and Reload latest ask consequence confirms with Cancel as default; archive site, redirect delete and set primary domain ask nothing and show an Undo toast |
| T-UN-26 *(R-1018, CS-17)* | 25 deleted pages → search field above the list; typing a slug fragment filters; a 120-character name truncates with the full name in the tooltip |
| T-UN-27 *(R-1018b, Q16, Q10)* | Delete a saved template → no dialog; toast "{Name} deleted · Undo · Recently deleted ›"; Undo restores it; after U-9, Templates › Recently deleted lists it with Restore; selecting 2 rows in any Recently deleted list shows the SC-32 bar "2 selected · Restore · Delete permanently · Clear" |

## 13. Code defects found during this inventory (engineering, not design)
1. ⌘Z runs `composer.history` with no area check, so it undoes hidden canvas/Brand edits from CMS, Assets and Site settings (`useEditorShortcuts.ts:91-208`). This contradicts IA-02.
2. The CMS record-delete toast says "Undo restores it" but re-creates the record with a new ID (`RecordSheet.tsx:345-351` → `CmsWorkspace.tsx:486-488`). There is no undelete endpoint (`cms.ts:57-126`). Also noted in 07 §5.
3. The Brand-from-logo toast "Brand applied · Undo ⌘Z" has no action (`BrandFromSource.tsx:227`).
4. Asset delete becomes a server hard delete after the 8 s client grace (`media.service.ts:401`; `MediaCommandLayer.ts:68`).
5. Clear history has two kinds of confirm: chrome-ui in History (`HistoryTab.tsx:411-421`) and native `window.confirm` in the palette (`CommandPalette.tsx:283-298`). Also noted in 18 CP-16.
6. CMS bind/unbind and asset delete call `noteUnrecordedAction`. This blocks ⌘Z for all earlier work until the next recorded step (`BaseBindingManager.ts:128,151,163`; `MediaCommandLayer.ts:124`). The refusal is announced (`useHistoryFeedback.ts:216-223`), but undo is still blocked.
7. Page create is recorded, but its toast has no Undo (`NewPageModal.tsx:87`); the duplicate toast offers only Open (`usePages.ts:268`).
8. Field-delete and collection-delete toasts offer no recovery (`CmsWorkspace.tsx:235-239`, `CollectionSettingsPane.tsx:93-96`), although collections are soft-deleted on the server (`cms.service.ts:307-318`).
9. `engine/history/index.ts:1` is a deprecated folder that only re-exports types (dead-code rule).
10. Replace across site runs one transaction per source, so it needs N undos and gives no toast (`ReplaceAcrossDialog.tsx:78-90`). Also noted in 08 §5.

## 14. Review and not verified
- **Independent design-qa-critic review:** pass 1 PROPOSAL (6 blocking B1–B6 + 12 notes N1–N12), all fixed 2026-10-17; pass 2: 1 blocking (U-L1 plan lock) fixed 2026-10-17; AI rows marked Inactive (SC-21).
- **N8:** the source shows Undo-labelled toasts are already held at least 8 s (`Toast.tsx:126,135-141`). The Change is therefore limited to recovery toasts with other action labels.
- **Citations:** about 75 come from a delegated source inventory. 10 were re-read directly: `HistoryManager.ts:583-594,827-842`; `useEditorShortcuts.ts:108-113`; `useHistoryFeedback.ts:205-223`; `RecordSheet.tsx:345-351`; `BrandFromSource.tsx:227`; `media.service.ts:401`; `page.service.ts:132`; `Toast.tsx:125-141`; `useAgentRunner.ts:413-421`; `HistoryTab.tsx:411-421`.
- **Not verified:**
  - any live undo sequence;
  - whether server `Page` rows are what the editor's page delete removes;
  - Brand token-kind and class delete paths;
  - collab behaviour;
  - memory cost of the 100-step stack;
  - Recently deleted geometry.
- No new shortcuts. ⌘Z eligibility changes per IA-02.
- *(R-1018)* ~~**Not applied (needs a decision):** D3-24 / row 44~~ — **decided by owner Q16** *(R-1018b)*: Undo + 30-day Recently deleted (SC-15 class a; row 44, §4.8, U-9).
