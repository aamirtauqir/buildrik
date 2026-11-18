# Panel 11 — Pages, bottom bar and status: functionality specification (FD-PNL-11)

> **BD-27 — Pages grouping refinement, 2026-10-18:**284px normal width retained. Header56px holds title/More/Close; pinned search/views92px; one scrolling list body; creation footer84px (compact112×32 secondary Add page, then quiet From template/New folder commands; BD-27 follow-up2026-10-19). Collection navigation uses text links. Page settings › opens the existing SEO-default settings panel, retaining Social/Advanced. Recovery keeps its own48px explanatory footer. Descriptive page status uses a56px stacked row; ordinary rows40px and recovery exception80px remain. Collection actions sit inside their collection group. The unsaved-dot legend explicitly explains a page indicator, not current save state. Full interaction/accessibility verification remains pending.

> **BD-25 — compact Pages width, 2026-10-18:** normal Pages/Structure/rename/recovery manager is284px, matching Add/Layers. Rail56px + panel284px =340px. Supersedes earlier560px normal manager width; expanded Listings remains720px. See the canonical brief and `pages-compact-width.md` evidence.

> **BD-24 — latest owner correction, 2026-10-18:** Pages management is in the left rail after Layers. The bottom bar contains created-page tabs and save status. This overrides earlier bottom Pages-button / no-Pages-in-rail instructions in this record and its historical references. The manager anchors beside the 56px rail, below the 56px topbar, above the 32px bottom bar; existing widths, guard/return and permission contracts remain. See the canonical decision in PRODUCT-DESIGN-BRIEF.md and `evidence/figma-design-execution/pages-placement-correction.md`.

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with 4 blocking, pass 2 passed; 2 notes fixed). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected; owner instruction 2026-10-17: "jo tumhari recommendations hein un per hi kam karna hai" (all recommendations accepted). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).

**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): V1, N3, S2 (page delete unchanged per SC-15), V6, V7; gap rows D2-16, D2-34, T1-08, T1-19, T3-4, T3-5, T3-8, T3-9, T3-10, T3-11, T3-13, T3-23, T3-27, T4-23, CS-06, CS-07, CS-10, CS-12; INTERACTION_AND_STATE_MATRIX §3 (offline writes). Round 2: Q10 *(R-1018b)*.

Visual: DS §2 (rows: 40 thumbnail resource list for pages, V1; header ladder V6; popovers 240/280/360 — status popover 360, V7; menus/popovers `shadow-drag`, V4; motion 100/160/240, V5); copy patterns DS §3. *(R-1018)*

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: **BD-02** (bottom bar = created-page strip + status only), BD-24 (Pages management in the rail), IA-05 amended by BD-24 (left-rail Pages entry; bottom strip for switching), IA-07 (context snapshots, one guard contract), IA refinement 5 (specific status), GEO-01 (bottom 32h content-growing; Pages manager284 default / Listings720 expanded, full work-area height under BD-24; full work area when narrow), IAF-05, IAF-22, Panel 01 (save pill leaves topbar; live dot), Panel 02 (P key; viewer group removed — SC-6), Panel 05 (breakpoint editor-wide; zoom/selection per-page snapshot), Panel 06 C5 (template page SEO → CMS), FD-DYN-01 §6 (Pages shows dynamic template group).

---

## 1. Purpose and boundary

The bottom bar answers two questions from every area *(R-1018 — SC-11 noun: Area)*: **which page am I on / take me to another page**, and **is my work safe** (saved, pending, failed, conflicted, published or not).

Job: J1 Build (supporting: never lose work — 00-STRATEGY §3) *(R-1018)*

| In this panel | Not here (owner) |
|---|---|
| Bottom bar: created-page strip, status entry + details | Canvas controls → canvas toolbar (Panel 05); publish → topbar CTA |
| Pages manager (list, folders, search, bulk, rename/duplicate/delete/home, templates, page settings) | Page templates browsing → Templates area (Panel 15) *(amended 2026-10-17 — source: Panel 15 / SC-11)*; site SEO defaults → Site settings; dynamic page settings → CMS |
| Page settings dialog (SEO / Social / Advanced for one page) | Element-level anything → Inspector |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/sidebar/tabs/pages/` (`PagesTab.tsx`, `components/PageList.tsx`, `PageRow.tsx`, `PageFolder.tsx`, `PageContextMenu.tsx`, `AddPageButton.tsx`, `BulkToolbar.tsx`, `MovePagesDialog.tsx`, `RenameUrlDecision.tsx`, `SearchListingsTable.tsx`, `SiteStructureTree.tsx`, `NewPageModal.tsx`; hooks `usePages.ts`, `useFolders.ts`, `useBulkSelect.ts`, `useDynamicPagesSummary.ts`; `page-settings/PageSettingsDrawer.tsx`, `SeoTab.tsx`, `SocialTab.tsx`, `AdvancedTab.tsx`, `usePageSettings.ts`), `shell/PageTabBar.tsx`, `chrome-ui/SaveStatus.tsx`, `shell/StudioHeader.tsx:631-662,777-784`, `shell/SaveFailedBanner.tsx`, `RecoveryBanner.tsx`, `modals/ConflictModal.tsx`, `chrome-ui/Footer.tsx`, `rail/LayoutShell.tsx:172` / `.css:44-48`.

| ID | Capability | Today |
|---|---|---|
| PG-01 | Entry | Rail **Pages** (P) → 280 drawer (widens to 700); ⌘K "New page" / "Go to {page}" |
| PG-02 | Header ⋯ | Select pages…, Listings, Show structure, Reload, Widen/Narrow; views pages / listings / structure |
| PG-03 | List | tree with folders; search (names only, tree view only, clears on close); states loading / empty / error / one-page note; legend; footer Add page · From template · ⋯ New folder; "+N from collections ›" link for CMS dynamic pages |
| PG-04 | Row | checkbox (bulk), grip, chevron, home icon, name / rename input ("Enter to save · Esc to cancel"), "in {Folder}" while searching, **"● Unpublished" (means unsaved)**, status chip (Draft / Hidden / Scheduled / Error — **only Live/Hidden can be set**), ⋯; 32h |
| PG-05 | Row menu | Rename F2, Duplicate ⌘D, Set as homepage, Replace layout with template…, Copy link, Page settings…, Remove from {Folder}, Delete ⌫ (disabled with reason); **⌘D/⌫ shown but not bound** |
| PG-06 | Guards | home and only-page delete guards; duplicate-name check; rename URL decision Keep URL / Update URL / Cancel → Page settings slug → redirect offer → Settings › Redirects repair card with "Back to {Page} SEO"; delete warns for CMS template pages |
| PG-07 | Folders | private per user × site (server + local cache); pages in a folder can't be reordered |
| PG-08 | Bulk | N selected · Duplicate · Move to… · Delete; home skipped; one page always kept; Esc exits |
| PG-09 | New page | `NewPageModal`: name, Blank / From template, Add to site navigation; From template → Templates picks then creates; Replace layout → Templates replace mode; **page limit only checked by server on save** |
| PG-10 | Page settings | centred modal 560×520 fixed, focus trap; tabs SEO (Google preview, score, title /60 + AI write, description, slug + redirect offer, Indexed/Hidden, "Site SEO defaults ›"), Social (OG title/description/image), Advanced (Live/Hidden, indexing, follow links, head code); staged; footer Cancel / **Done**; ⌘S; unsaved warning |
| PG-11 | Page strip | `PageTabBar` **above the canvas**: all pages in order, click/Enter switches immediately (no guard), active grey chip, unsaved amber dot, "+" opens Pages panel; tablist roving ←/→; doesn't keep active tab in view; 36h, tabs 28h, name max 120 |
| PG-12 | Status | **Topbar save pill only** (6 states; click History / retry / conflict dialog / offline tooltip; hidden in view mode; live regions); canvas SaveFailedBanner, RecoveryBanner, ConflictModal; per-page dirty dots. **No bottom bar mounted** (`Footer` component exists, unused) |
| PG-13 | Roles | viewers can't open Pages; strip visible to viewers and switching works; no page lock |

Tests: pages ~22 files / 204; page-settings 7 / 98; utils 26; PageTabBar 9; SaveStatus 6; savePill 7.

## 3. Problems this design solves
1. Pages lives on the rail and the strip above the canvas — both against BD-02/BD-05.
2. **Status in the topbar** shows one ambiguous "Saved" for page, CMS record, Brand and upload work (IA refinement 5); no per-operation detail.
3. **Page switching has no guard or snapshot**; from a workspace there's no "Open {page} in Editor".
4. Row copy "● Unpublished" actually means *unsaved*; status chips show states that can't be set.
5. Advertised shortcuts (⌘D, ⌫) don't work.
6. Page settings dialog cramped (560×520 fixed) and its primary says "Done" (owner asked for "Save").
7. Page limit discovered only after creating.

## 4. Bottom bar (spans the full editor width, below rail + panels)

```
┌───────────┬───────────────────────────────────────────────────────────────┬─────────────────────────────┐
│ ⌂ Home │ About • │ Menu │ Contact │ Blog post ⧉ │ …  [+]  │ ● Saved 2m ago · 3 changes not published ⌄│ 32h
└───────────┴───────────────────────────────────────────────────────────────┴─────────────────────────────┘
```

| Zone | Contract |
|---|---|
| **Pages management entry — left rail** | Existing labelled RailItem after Layers → Pages manager (§5). Shortcut **P**. Not a bottom-bar button. |
| **Page strip** (centre, flex) | All pages in page order (existing), horizontal scroll, **active page kept in view** (Fix); home icon on homepage; **unsaved dot** "•" (existing amber dot, accessible name ", unsaved changes"); collection pages marked ⧉ "Collection page · N pages" (SC-11 *(amended 2026-10-17 — source: Panel 15 §1 / SC-11)*); long names truncate (max 120) with full name tooltip; **tabs stay 28h** inside the 32h bar (as-built 28 — the 24h shrink is withdrawn: below the 32/24-in-row target rule, CS-07) *(R-1018)*; "+" opens the **Pages manager** with focus on "+ Add page" (existing behaviour: "+" opens Pages; IA-05 "same manager"). No strip context menu (IA-05: one canonical manager) |
| **Status** (right, fixed, max 280) | §8. Never scrolls away |

- **Select a page from the strip = "Open {page} in Editor"** (IA-05): runs the one guard contract for drafts (CMS record, Site settings), then enters Editor on that page from any area; breakpoint kept (editor-wide); zoom/pan/selection restored from that page's session snapshot if any, else Fit + no selection; authored pseudo-state reset to Base (Panel 05). Announce "Opened About". Selecting the current page from another area returns to Editor (not a no-op).
- In non-Editor areas the strip entries are **navigation actions** named "Open {page} in Editor" (not ARIA tabs).
- Removed: page tab bar above the canvas (moved here).

## 5. Pages manager (temporary sheet over the current area)

- Geometry (GEO-01): left panel **284 normal / 720 expanded Listings**, height **work area = viewport−56−32**, anchored beside the left rail at **x56 / y56** (never overlapping topbar or bottom bar); at 1440×900 this is **812h**; full work area when narrow; header56 / pinned search and views92 / one body scroll / creation footer84 (recovery footer48). Opening or closing it **does not change the active page** or discard any draft. Esc closes it (topmost layer) and returns focus to the left-rail Pages button.
- **Header:** "Pages · N" · search ("Search pages…" — names **and slugs** *(DS)*; works in every view) · ⋯ (Select pages…, Listings, Show structure, Reload, **Recently deleted (N)** — subview per Panel 24 §4.8, "‹ Back to Pages" *(amended 2026-10-17 — source: Panel 24 §4.8 / SC-15)*) · ✕. (Widen/Narrow removed — sheet bounds replace it; Listings' **"Open full listings"** (`PagesTab.tsx:454`) now expands the sheet to its full work-area size.)
- **Body:** existing tree with folders (folder label "My folders · only you see these" *(DS: makes the existing per-user privacy visible)*), Listings and Structure views; dynamic pages group **"Blog post · Collection page · 20 pages"** with "Open collection page" and "Manage in CMS ›" *(amended 2026-10-17 — source: Panel 15 §1 / SC-11)* (FD-DYN-01 §6 / CMS §7) — replaces the "+N from collections ›" link.
- **Footer:** primary + Add page, then explicitly labelled From template and New folder; preserve existing destinations. Add page is secondary while renaming (BD-27).
- **Row** (**40h** — pages are a thumbnail resource list, owner V1 / GEO-01 40; as-built 32 → Change) *(R-1018 — D2-16, T3-10, CS-06)*: grip, chevron, home icon, name, **status chip only for real states** — Live (no chip), **Hidden** ("Hidden from publish"); **"● Unsaved"** replaces the misleading "● Unpublished" (Fix); legacy password value shows "Hidden (legacy password)" (IAF-05 H); ⋯. The list **legend stays**, its dot text aligned to **"● marks a page with unsaved changes"** (was "● unpublished changes") *(R-1018 — T3-8)*.
- **Row actions:** row click = **Open {page} in Editor** (same contract as §4; closes the sheet); menu kept (Rename F2, Duplicate, Set as homepage, Replace layout with template…, **Save as template…** (door added by Panel 15 §5.5 *(R-1018 — T1-08, T3-9)*), **Move up ⌥↑ · Move down ⌥↓** *(R-1018 — T3-4)*, Copy link, Page settings…, Remove from folder, Delete) — **⌘D and ⌫ now bound on the focused row** (Fix PG-05). **Keyboard reorder (WCAG 2.5.7 — dragging is never the only way)** *(R-1018 — T3-4)*: on a focused page row **⌥↑ / ⌥↓** move it one place in page order (same chords as Layers, Panel 04 §7); the menu items do the same; inside a folder both are disabled with the reason "Pages in a folder can't be reordered" (existing limitation, PG-07); first/last row disables the matching direction; announce "About moved to position 3"; one Undo step.
- **Delete (SC-15, Panel 24):** **no confirm** — Delete / ⌫ (row or bulk) deletes at once with toast "About deleted · Undo · Recently deleted ›"; ⌘Z in the session restores slug, folder and settings; afterwards **Pages › Recently deleted** (30 days, same ID). Page delete is not a declared exception. *(amended 2026-10-17 — source: Panel 24 §4.8–4.9 / SC-10, SC-15)*
- **Guards kept:** home/only-page delete, duplicate name, rename URL decision → slug → redirect repair (existing chain). The CMS collection-page delete warning and the inbound-link / collection-page impact preview (IAF-05 G) **no longer gate the delete with a confirm**; they ride on the Undo toast (§6: "…3 pages link to it · Show links · Undo"). *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15)*
- **Bulk:** existing rules (home skipped, one page kept); results per page. The bar is the **shared bulk bar → SC-32** "{N} selected · Duplicate · Move to… · Delete · Clear" (owner Q10) *(R-1018b)*.
- **Search no results** *(R-1018 — T3-27)*: "No pages match "{query}"" + **Clear search** (DS §3). **"/"** focuses the manager's search while the sheet is open (SC-12 "/" = area search; the sheet is the topmost surface) *(R-1018 — T3-23)*.
- **Collection-pages counting rule** *(R-1018 — T4-23)*: the dynamic pages group lists and counts **only collections that have a collection page** (a collection without one adds nothing).
- **Folders:** existing; in-folder reorder stays unsupported (documented limitation, revisit with folder sort).

## 6. New page
- Existing `NewPageModal` (name, Blank / From template, Add to site navigation). **NEW:** shows plan capacity before create ("10 of 10 pages on Free"; during the Pro trial the Pro limit applies — SC-20); at the limit Create is disabled with reason and **Upgrade** (workspace owner) / **Ask the workspace owner to upgrade** (others) — SC-18 (server check kept). **Dependency:** needs a new tRPC capacity query returning the server-side page count and plan limit (today the editor learns `PAGE_LIMIT` only after a failed save, `sites.ts:392`); until then the existing post-save error stays. From template → Templates area with "‹ Back to Pages" (existing; *amended 2026-10-17 — source: Panel 15 / SC-11*), page created only after a template is chosen (existing). **Plan-locked pages (SC-20, 2026-10-17):** after the trial on Free, pages beyond the 10 active ones (Panel 23 §5.5) show a lock in the strip and the manager; opening one shows it read-only with the reason; Delete is allowed (OD-PL-7). **Delete warnings without a confirm** (page delete is Undo, SC-15): the Undo toast carries the warnings that the confirm used to show — "About deleted · 3 pages link to it · Show links · Undo" and, for a collection page, "Blog collection page deleted — 20 record pages won't be generated · Undo".

## 7. Page settings (dialog)
- Opens for the **chosen page ID** without changing the canvas page or selection (IA-05 "Manage without switching"); from the manager row menu and Inspector page context (existing doors).
- Size: **720 max width, height bounded min(viewport−48, work area−24)** (as-built 560×520 → Change), sticky tabs and footer, one body scroll.
- Tabs and fields unchanged (SEO, Social, Advanced), with these *(R-1018)* rules:
  - **One SEO score (owner N3)** *(T3-5)*: the score is computed **once, by the SEO tab's model**; the Listings view's score column and the SEO tab pill read that same value, so the two never disagree for a page (INV #44 fixed). Listings shows it per row with the same label and color bands as the tab.
  - **One indexing control** *(T3-13)*: the **SEO tab's Indexed / Hidden from search** control is the only writer *(DS: search indexing belongs with SEO)*; the Advanced tab shows a **read-only line** "Search indexing: {Indexed | Hidden} · Change in SEO ›" that switches to the SEO tab. Advanced keeps Live/Hidden (publish visibility) and follow links unchanged.
  - **Advanced › head code is Pro** *(T3-11; OD-PL-5, Panel 23 / SC-20)*: Pro chip; open during the trial; on Free after the trial the field is read-only with "Available on Pro" + Upgrade (SC-18), value kept. Collection pages: SEO tab shows "This is the collection page for **Blog**. SEO for generated pages is set in **CMS › Dynamic pages ›**" *(amended 2026-10-17 — source: SC-11)* and its title/description fields edit only the collection page itself (Panel 06 C5; no second writer).
- Footer **Cancel / Save** (rename from "Done" — owner request, inventory #48; **IAF-05 E/G amendment** "Done/Cancel" → "Save/Cancel") — Save awaits the writer and closes; failure keeps input with Retry; **⌘S saves without closing** (existing); "Page settings saved" toast kept; unsaved warning on close (existing).

### 7.1 B3.1 page navigation and settings return contract

**2026-10-19 · DESIGN SPECIFICATION · source inspected; runtime NOT RUN.** This is the owning Pages detail for the continuation plan's PG-G01–12. Shared transaction, concurrency, guard actions and status semantics belong to [SC-24.1–3](00-SHARED-CONTRACTS.md#sc-241-navigation-transaction-and-draft-ownership--b31-2026-10-19). The user authorized completing this documentation slice; it is not application or visual acceptance.

**Retained ownership:** Pages manages page resources; the bottom strip opens a page in Editor; Page settings edits its captured page ID; CMS/Site settings retain their own drafts and writers; Brand retains applied shared-history edits. No second page API, global Save or tab-close model is introduced. The 284px manager, rail placement and 720px maximum settings dialog remain. The new guard is a temporary 480px shared modal, not a wider Pages manager. Existing local Cancel behavior is redesigned to use SC-24 for dirty drafts.

| Entry | Exact destination / effect | Cancellation and return |
|---|---|---|
| Rail Pages / P / bottom + | Open the same manager over the current area, preserving the active page and underlying task; + focuses Add page, ordinary rail entry restores current-page context | Close returns to the actual invoking entry (rail, + or command origin). Search Escape follows SC-2 before manager dismissal. Closing the manager does not discard the retained CMS/Settings draft |
| Page row / bottom page button / Go to page command | Capture `Open {page} in Editor`; all use SC-24 before leaving an affected draft. Command palette closes back to its source task when handing off to a guard; no second active modal | Keep editing returns to the source form, preserving manager search/view/scroll/selection for reopening. A page button merely receiving focus never opens a page |
| About row → Page settings while Home is active | Open About settings, SEO default, with Social/Advanced retained; Home canvas and selection remain unchanged. Remember manager state and About row/menu origin | Pristine Close/Cancel/Escape returns immediately. Dirty Close/Cancel/scrim/Escape requests SC-24; no silent discard. Keep editing returns to the exact settings tab/field |
| Page settings from Inspector Page context | Same settings writer for that page; capture Inspector section/field as origin | Save/discard/clean close returns to that Inspector entry, not a generic Pages manager |
| Page settings → Site SEO defaults | Resolve the current settings draft, then open Site settings → SEO defaults with an origin return to the same page's SEO tab | Cancelling the guard stays on that page's settings; returning from Site defaults restores the captured settings target/tab without changing the canvas page. Revalidate deleted targets before returning |

The underlying bottom strip/rail cannot be activated through the Page settings scrim. A desired page switch from that modal is a two-step task: resolve/close settings, then activate the destination. Do not depict background tabs as usable while the modal is open. Opening/closing the manager over a retained task requires retention across its mount lifecycle; the current drawer-unmount implementation is not evidence that this contract already works.

### 7.2 Save, cancel and async result detail

- **Pristine:** footer Save disabled; Cmd/Ctrl+S is a no-op. Close/Cancel returns without a guard. The three tabs share one draft; switching SEO/Social/Advanced preserves it. Input-level Escape follows SC-17; modal dismissal runs only after the innermost interaction is resolved.
- **Dirty Save:** validate the captured page ID and fields, retain input, then apply through its owner and await required completion. Footer Save returns to the captured origin only on success; Cmd/Ctrl+S saves without closing. Duplicate submissions are suppressed. A live slug change still uses SC-15's consequence step; cancellation keeps the draft and resolves no pending leave. Never show that consequence dialog and the unsaved guard as two active focus traps.
- **Dirty Cancel/Close:** use SC-24. Keep editing preserves the same tab/field and values. Discard changes discards only this staged page-settings draft and returns to its captured origin. Save and leave validates/saves then returns to that origin; it does not open the page being managed. A save/discard error keeps the task recoverable and must not close it.
- **Invalid input:** show the existing slug/head-code validation reason at the field and focus it. If returning from a guard, temporarily replace the normal footer with the pending-destination notice, Cancel navigation and Save and leave per SC-24.2; competing navigation remains blocked. Cmd/Ctrl+S saves and stays in this correction task. Only explicit Save and leave executes the captured close/return after successful resolution; Cancel navigation restores the normal footer Save-and-close behavior. A corrected field, tab change or autosave alone cannot complete navigation.
- **Offline:** fields may retain local staged input, but Save is disabled with `Needs a connection to save page settings`; Save and leave cannot succeed offline. Keep editing retains the task; explicit supported discard returns to its captured origin. Do not queue a second write when an existing result is still uncertain. Already-loaded page navigation remains available after the modal is resolved.
- **Failure / applied-but-unsynced:** keep the exact page and operation identity. Server errors use the actual reason, never a fabricated offline explanation. Follow SC-24.2's distinction between an unapplied draft and a locally committed revision: retry synchronization without applying twice, and never label applied values as discarded. Global Saved cannot conceal this operation's pending/error state.
- **Access/target changes:** before submit and return, recheck page existence, session/site and write permission. Lost permission leaves the draft available only under the existing recovery policy; Save remains disabled with a reason. Deleted target offers return to the surviving Pages list or source area after resolving retained work. It never transfers the draft to the now-selected page. An unavailable destination is explained without claiming the intended page opened.

**Page-open completion:** keep editor-wide breakpoint and width; restore valid per-page pan/zoom/selection, otherwise Fit/no selection; reset authored pseudo-state to Base on explicit opening. Scroll the active bottom entry into view, announce `Opened About` and focus the canvas/page region. A page with plan-restricted editing still opens read-only under P23; Viewer navigation works without opening management. Explicitly opening the remembered Home from CMS returns to Editor. A contextual Back restores its captured context instead; page opening supersedes an older return-to-page target. Navigation and manager visibility never create Undo entries. Form edits use their existing owner's history; guard cancellation does not undo a successfully saved operation.

### 7.3 B3.1 acceptance and coverage ledger

All rows below are **written cases**, not executed tests or new drawn screens. Existing PG-G IDs are retained from the plan; these named fixtures make them reproducible. Use the existing section 13 acceptance criteria as well.

| Case | Fixture and action | Expected evidence / owning contract |
|---|---|---|
| PG-G01 | CMS Blog record “Studio launch”, dirty title → rail Pages → close | Record, active page, field and manager query retained; no leave guard. §7.1; T-PG-04 |
| PG-G02 | Same record → About from strip, manager row or command; then attempt Contact | One guard names Studio launch and About; Contact cannot retarget it. Keep editing/Escape returns to record; focus alone causes no switch. SC-24.1/3 |
| PG-G03 | Save and leave → delay, validation error, rejection, queued result; then confirmed retry | Each unsuccessful result stays on the owner; correction requires explicit continuation. Success opens About once; no duplicate submit. SC-24.2 |
| PG-G04 | Discard changes → supported discard, missing handler and throwing handler | Only the successful discard allows continuation; others retain input and explain failure. Unrelated saved/canvas work preserved. SC-24.2 |
| PG-G05 | Branch A: Home active → About row in manager → About settings. Branch B: About active, no element selected → Inspector Page context → About settings. In each, edit then Cancel/Close | A returns to the captured manager with Home still active; B returns to About's Inspector. Keep editing restores the settings tab/field. No page switch caused by managing settings. §7.1–2; T-PG-07 |
| PG-G06 | About settings footer Save versus Cmd/Ctrl+S; locally applied but sync fails | Footer returns only on confirmed success; key save stays. Failure retains owner/revision and truthful local/global status; retry does not create another application/history step. §7.2 |
| PG-G07 | Offline settings dirty close → Keep editing / Discard | Save unavailable; no false success. Discard only staged values; close returns to source. Loaded page navigation then remains available. §7.2; T-PG-17 |
| PG-G08 | Home at Tablet; About first visit, then revisit with captured zoom/pan/selection | Breakpoint/width retained; first visit Fit; revisit valid snapshot; pseudo-state Base. No cross-page selection leak; active button visible. §7.2; T-PG-03 |
| PG-G09 | Brand save pending/fails → About; repeat offline | Exact Brand action set; no Discard. Leave and keep retrying retains applied changes and pending/failure status after navigation. SC-24 Brand variant |
| PG-G10 | Two retained affected owners; first saves/discards, second fails; cancel or retry | Sequence names each owner; earlier results preserved; retry only unresolved work. A newly dirty owner is not skipped. SC-24.2 |
| PG-G11 | Delete destination or revoke access during save; also cancel navigation before late success | No stale-target write/automatic retarget. Late success updates only its submitted revision and never reactivates cancelled navigation. Fallback names surviving container; no cross-account resend. SC-24.1–2 |
| PG-G12 | Viewer Home → About; then Editor role on Home remembered in CMS → Open Home | Viewer management stays unavailable but page navigation works. Same remembered page opens Editor from another area; no no-op. §7.2; T-PG-11 |

**Composition acceptance still NOT RUN:** inspect each representative guard with long page/record names, validation text, pending status and two affected owners at the plan's viewport matrix and 200% text enlargement. Separately review (1) geometry/scroll and usable actions, (2) grouping/identity before metadata and action hierarchy, (3) local/global label and status scope, (4) keyboard, focus, screen reader and disabled reasons. A written state matrix or source test cannot substitute for these visual/interactive checks.

### 7.4 Source evidence, preservation and implementation dependencies

Read-only inspection on 2026-10-19 at working-tree HEAD `19f964d5e`; no runtime reproduction. Evidence paths are relative to the editor root:

| Source / symbol | Observed source behavior | Required change or preservation |
|---|---|---|
| `src/editor/shell/PageTabBar.tsx`, `handleTabClick`; `src/editor/sidebar/tabs/pages/usePages.ts`, `selectPage` | Direct `setActivePage` calls in these handlers | Preserve page IDs/selection intent; route affected draft loss through the shared contract. Broader engine behavior not certified by this observation |
| `src/editor/shell/hooks/useTabSwitchGuard.ts`, `guard` / `onLeaveAnyway` | Pending callback is replaced on a guarded request; leave invokes `perform` even when `discardDirty` reports failures | Keep its shared entry-point approach; add fixed intention and no-leave-on-discard-failure semantics. Whether UI permits a competing click is runtime NOT RUN |
| `src/editor/shell/shellDirtyRegistry.ts`, `DirtyDomain` / `discardDirty` | Tracks settings and cms-record dirty flags/discard handlers; no owner save/receipt operation in this registry; absent discard is skipped | Extend owner identity/retention/completion capabilities without treating a boolean or missing handler as successful save/discard |
| `src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx`, `handleDone` / `handleCancel` / `handleClose` | Done awaits save; Cancel discards directly; dirty Close uses local warning; Cmd/Ctrl+S calls save | Preserve scoped writer and key-save intent; unify dirty cancellation under SC-24 and topmost shortcut handling |
| `src/editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx` | Rendered warning offers Keep editing and Discard only; introductory autosave comment conflicts with the current drawer's explicit save path | Preserve safe focus/default; extend to current SC-24 actions. Do not use that stale comment as evidence of autosave |
| `src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts`, `save` | Validates, awaits `updatePage`, marks a local clean snapshot and emits saved toast | Preserve validation/fields; investigate actual persistence boundary before claiming server-confirmed navigation. The await alone does not prove remote receipt |

No roles, fields, page-management capabilities or saved data are removed. Engineering still needs owner-aware save/discard results, retained drafts across mount changes, per-page view snapshots, late-result reconciliation and completion receipts. Existing SC-9 dependencies remain. This written slice does not certify the underlying services, browser unload recovery, exact Undo behavior, permissions or output.

## 8. Status (IAF-22, IA refinement 5) — moved from the topbar

**Entry (right of the bottom bar):** two controls — the **status button** (dot + text of the existing six states, **reordered per IA refinement 5 (Change)** so failure and conflict win over pending: Conflict — reload › **Couldn't save — Retry** › **Offline — will save when back online** › Saving… › Unsaved changes › Saved {time} (labels aligned to the DS §3 save vocabulary, CS-12 — was "Save failed — retry" / "Offline — not saved" *(R-1018)*); the Save-failed tier also carries **"Image not uploaded yet — Retry"** (Panel 08 interim FI-03 guard, until P1-D18 ships) *(R-1018 — D2-34)*; plus " · N changes not published" (SC-11 *(amended 2026-10-17 — source: SC-11)*) when the site is live with unpublished changes, matching Panel 01's live dot) and a separate **Details ⌄** button.

| Control / key | Result (status button keeps the save pill's **existing one-click targets**, `StudioHeader.tsx:645-657`) |
|---|---|
| Saved / Saving / Unsaved | Opens **History** (existing) |
| Save failed | **Retry** save (existing) |
| Image not uploaded yet *(R-1018 — D2-34)* | **Retry** the upload (Panel 08 §5 interim guard); Details lists it under Uploads |
| Conflict | Opens existing **ConflictModal** (existing) |
| Offline | No click; tooltip "You're offline. Page edits are kept in this browser; other changes need this tab open. Everything saves when you reconnect." (replaces "Offline — changes aren't reaching the server…", `StudioHeader.tsx:659`; same sentence as Panel 22 banner 6 *(amended 2026-10-17 — source: Panel 22 §14)*). (CMS records keep their own "Saved on this device only" message, Panel 07) |
| **Details ⌄** (NEW) | Opens the Status details popover (360w, above the bar) |
| ⌘S / H | ⌘S save unchanged; History is **H** (⌘H removed — SC-12) *(amended 2026-10-17 — source: Panel 18 / SC-12)* |

**Status details popover (NEW):** one row per operation owner with its own state and action — **Page** (this page: Saved / Saving / Failed — Retry), **Other pages with unsaved changes** (list → Open), **CMS records** (Record saving / **Record save pending** / saved / failed — Open record), **Brand** ("Brand changes applied locally" → "Brand changes saved", SC-4), **Uploads** (N uploading / failed — Retry, Panel 08), **Sync queue** (N waiting). Footer links: **Versions ›** (History) · **Published {time}** · "N changes not published". A success of one owner never hides another owner's failure.
- **Dependency (requires engineering):** the multi-owner rows need a **writer/receipt registry** across page save, CMS, Brand, uploads and sync (today `shellDirtyRegistry` tracks dirty state only, not receipts). **Fallback until it lands:** the popover shows the **Page** row, the other-unsaved-pages list and the footer links only; the status button keeps reflecting the page save state as today.
- Live regions (save + publish announcements) move here (existing messages). SaveFailedBanner and RecoveryBanner stay on the canvas (existing).
- Viewer: status reads **"View only"** + **Versions ›** (opens History — **this is now the viewer's History door**, replacing the removed rail viewer group; viewers could already open History, so not a new grant).


> **Amended 2026-10-17 by Panel 22:** offline tooltip and Details line read "You're offline. Page edits are kept in this browser; other changes need this tab open. Everything saves when you reconnect." (same sentence as Panel 22 banner 6). The live pipe (polite + `bk-announce-assertive`) also carries Panel 22 banner and toast announcements.
## 9. States and roles
| Condition | Behaviour |
|---|---|
| Viewer | Strip visible and switching allowed (existing); **Pages button disabled with reason "Managing pages needs Editor access"** (unchanged access — viewers can't open Pages today; the manager's Listings/slugs would be new data, IAF-05 D / IAF-20); status "View only · Versions ›" |
| Locked element / page | No page lock exists (unchanged) |
| Loading pages | strip skeleton; manager existing skeleton |
| Load error | manager existing error + Retry; strip shows "Couldn't load pages — Retry" (server) or "You're offline" (network) — never blames the connection for a server error (DS §3; was "Pages unavailable — Retry") *(R-1018)* |
| **Offline** *(R-1018 — state matrix: writes)* | strip switching between pages already loaded keeps working; page edits are kept in the browser (status per §8). **Manager writes are disabled with "Needs a connection"**: + Add page, From template, Duplicate, Delete, Rename, Move up/down, Move to…, folders, Set as homepage, bulk actions, Recently deleted Restore, and Page settings **Save**; the announcement is Panel 22's one polite announcement |
| Viewer and the strip "+" *(R-1018 — T1-19)* | "+" is disabled with the reason "Adding pages needs Editor access" (same access as the Pages button; DS §3 role-refusal pattern) |
| One page | existing one-page note; delete disabled with reason |
| Many pages (100 fixture) | strip scrolls; manager search + virtualized list above 300 rows *(DS, Layers threshold)* |

## 10. Geometry (GEO-01; NOT MEASURED)
- Bottom bar **32h**, grows with enlarged text; full editor width; strip flex (tabs **28h** inside 32 — as-built, no shrink to 24 *(R-1018 — CS-07)*, name max 120, gap 2) · status max 280.
- Pages manager rows **40h** (V1 thumbnail resource list); tool lists 32 *(R-1018)*. **BD-25 compact exception:** Recently deleted rows may grow to80px at284px panel width so deletion metadata wraps fully; ordinary page rows remain40px.
- Manager sheet 560 / 720, height min(viewport−48, work area−24); Page settings 720 max; status popover 360 (clamped viewport−24).
- Canvas column gains the 36px the old tab bar used above the canvas (offset by the 32 bottom bar, which spans everything).

## 11. Keyboard and accessibility
- F6 reaches the bottom bar last (NAV-04). Strip: roving focus ←/→, Home/End, **Enter/Space opens**; focus alone never switches (IA-05). Strip is a `toolbar` of navigation buttons ("Open About in Editor", `aria-current="page"` on the active one) — not ARIA tabs.
- Manager: tree semantics (existing treeitem, `aria-current`), F2 rename, ⌘D duplicate, ⌫ delete, **⌥↑ / ⌥↓ move up / down** on focused row (+ "Move up" / "Move down" menu items — WCAG 2.5.7 single-pointer alternative to drag) *(R-1018 — T3-4)*; "/" focuses the manager search *(R-1018 — T3-23)*; Esc closes sheet → focus to Pages button.
- Status entry: button with full status text as accessible name; popover non-modal, Esc returns focus.

## 12. Preservation map
| Old | New | Disposition |
|---|---|---|
| PG-01 rail Pages (P) | Left-rail Pages button (P); manager beside rail | Keep (BD-24) |
| PG-02 header ⋯ + views | Same; Widen/Narrow → sheet bounds | Keep (Change: widen) |
| PG-03 list, search, states, footer | Same; search incl. slugs in all views; collection-pages group replaces "+N from collections" | Keep + extend |
| PG-04 row | "Unsaved" label fix; only real status chips; row 32 → 40 (V1); legend text "● Unsaved changes" | Fix *(R-1018)* |
| PG-05 menu | Same; ⌘D/⌫ bound; + Save as template… (Panel 15); + Move up/Move down with ⌥↑/⌥↓ | Keep + Fix + NEW *(R-1018)* |
| PG-10 SEO score in Listings vs tab (two models) | One score (SEO-tab model) read by both (N3); one indexing writer (SEO tab), Advanced read-only line | Fix *(R-1018)* |
| PG-06 guards chain | Same; delete confirm → Undo + Pages › Recently deleted (SC-15) | Keep + Change *(amended 2026-10-17 — source: Panel 24 / SC-15)* |
| PG-07 folders | Same; privacy labelled | Keep |
| PG-08 bulk | Same actions; bar = SC-32 shared bulk bar *(R-1018b, Q10)* | Keep |
| PG-09 new page | + capacity pre-check | Keep + NEW |
| PG-10 page settings | 720 max; Save label; collection-page SEO note | Keep + Change |
| PG-11 strip above canvas | Strip in bottom bar; guarded Open; active in view; tabs stay 28h | Move + Fix *(R-1018: no 24h shrink)* |
| PG-12 topbar save pill + click targets | Bottom status button with the **same one-click targets**; Details ⌄ popover (NEW, multi-owner rows depend on a receipt registry); live regions | Move + NEW |
| PG-13 viewer | Strip switching kept; Pages button disabled with reason (same access as today) | Keep |
| Status in view mode (today hidden) | "View only · Versions ›" | Change |
| Strip "+" opens Pages | "+" opens manager focused on Add page | Keep |

No capability removed.

## 13. Acceptance (specified, NOT RUN)
| ID | Pass condition |
|---|---|
| T-PG-01 | Bottom bar shows created-page strip · status in Editor, CMS, Assets, Brand, Site settings; no page strip above the canvas; Pages management entry is in the left rail |
| T-PG-02 | From CMS with a dirty record, click "About" in the strip → guard dialog; after resolve, Editor opens About with the same breakpoint |
| T-PG-03 | Open About, zoom 150%, go Home, back to About → 150% restored; first visit to Contact → Fit |
| T-PG-04 | Pages manager open/close changes no page and discards no draft |
| T-PG-05 | Row shows "Unsaved" for unsaved pages; no Draft/Scheduled/Error chips appear |
| T-PG-06 | Focused row: ⌘D duplicates; ⌫ deletes with **no confirm**, toast "{page} deleted · Undo · Recently deleted ›"; ⌘Z restores slug, folder and settings; after reload the page is in Pages › Recently deleted *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15)* |
| T-PG-07 | Page settings opened from the manager for About while Home is on canvas → canvas stays on Home; Save awaits; failure keeps input |
| T-PG-08 | **BLOCKED until the receipt registry exists:** CMS record save fails while page saves → popover lists Page saved + Record failed — Retry |
| T-PG-08b | Status button: saved → History; failed → retries; conflict → ConflictModal; offline → tooltip only (same as today's pill) |
| T-PG-09 | Status popover "Versions ›" opens History; **H** opens History; ⌘H is not bound (SC-12) *(amended 2026-10-17 — source: Panel 18 / SC-12)* |
| T-PG-10 | On Free after the trial: capacity shown, Create disabled at the limit with Upgrade; pages beyond the active 10 are plan-locked read-only (strip and manager show a lock, reason "Over the Free limit — Upgrade to edit"), Delete allowed (OD-PL-7); during the trial the Pro limit applies |
| T-PG-11 | Viewer: strip switching works; Pages button disabled with reason; status "View only · Versions ›" |
| T-PG-12 | Existing Pages, page-settings, PageTabBar and SaveStatus tests updated with the change, not deleted |
| T-PG-13 | Pages manager rows measure 40px; strip tabs measure 28px inside the 32px bar *(R-1018 — V1, CS-07)* |
| T-PG-14 | Focused row outside a folder: ⌥↓ moves it one place, announced, one ⌘Z restores the order; "Move up" / "Move down" menu items do the same; inside a folder both are disabled with "Pages in a folder can't be reordered" *(R-1018 — T3-4)* |
| T-PG-15 | For any page, the Listings score equals the SEO tab score; changing the title updates both *(R-1018 — N3)* |
| T-PG-16 | Only the SEO tab changes search indexing; Advanced shows "Search indexing: … · Change in SEO ›" read-only and the link opens the SEO tab *(R-1018 — T3-13)* |
| T-PG-17 | Offline: Add page, Delete, Rename, Move, folders and Page settings Save are disabled with "Needs a connection"; switching to a loaded page still works; status reads "Offline — will save when back online" *(R-1018)* |
| T-PG-18 | With an unregistered local image on the page, the status shows "Image not uploaded yet — Retry" at the Save-failed tier and the click retries the upload *(R-1018 — D2-34; interim until P1-D18)* |
| T-PG-19 | Page delete unchanged: no confirm, "{page} deleted · Undo · Recently deleted ›" (SC-15, T-PG-06) *(R-1018 — S2 confirms page delete stays class a)* |

## 14. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, keyboard reorder against the folder rule, single SEO score implementation, multi-owner status aggregation (needs a status registry across CMS/Brand/uploads), capacity API on the client, measured geometry.
