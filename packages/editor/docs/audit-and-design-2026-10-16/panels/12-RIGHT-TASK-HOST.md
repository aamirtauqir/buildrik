# Panel 12 — Right column task host (Publish, Review, History, Activity, AI, Issues): functionality specification (FD-PNL-12)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by RT-D1 (named-version Recently deleted only, S5) · not VERIFIED** *(R-1018)* (independent `design-qa-critic` review: pass 1 PROPOSAL with 3 blocking, pass 2 passed). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected; owner instruction 2026-10-17: all recommendations accepted. Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S3, S5, N4; gap rows D3-7, T3-7, T3-19, T3-22, T5-15, D2-18, D2-28/T1-01; CS-01, CS-02, CS-21, RT-13 label (SC-1). Round 2: Q5 (pointer), Q15; damage-scan Issues row pattern (not-asked item) *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: IA-01 surface table (right column = Inspector or one named task), REMAINING-IA-HANDOFF **NAV-01..03** (one `moduleWorkspace`, one optional `activeTask`, origin stack; Editor task replaces Inspector; resource-workspace task tray overlays; task-to-task replacement runs the outgoing draft guard incl. AI prompt and Review reply; Escape closes only the topmost layer), **GEO-01** right task host 360 / 320 / 420 bounded resize, header ≥ 48, one body scroll, footer only when the task owns actions; ≤1280 work-area sheet min(560, available−24); IAF-01, IAF-12 (AI), IAF-15/16 (Preview/Publish/Issues), IAF-17 (Review), IAF-18 (History/Compare/Time Travel/Activity). Inspector contents themselves: FD-INS-02/03 + Panel 06 (incl. the 69-block coverage document) — **not changed here**.

---

## 1. Purpose and boundary

Job: S supporting — the host for J2 Get approval (Review) and J3 Publish and maintain (Publish); History, Activity and Issues serve "never lose work" and "keep the site consistent" (00-STRATEGY §3) *(R-1018)*

The right column shows **either the Inspector for the current target, or exactly one named task** — Publish, Review, History, Activity, AI or Issues — with a clear way back. This panel defines the host (who owns the column, how tasks open, close, replace each other and return) and the delta for each task. Task interiors that already work are kept.

| In this panel | Not here |
|---|---|
| Host arbitration, header, back, width, overlays, guards, focus; per-task deltas | Inspector tabs and fields (Panel 06); Compare / Time Travel dedicated areas (Panel 05 §8, IAF-18); topbar CTA (Panel 01); bottom status (Panel 11) |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/shell/RightColumnPanel.tsx`, `shell/StudioPanels.tsx:400-413,472-479,525-551,664-707,949-995`, `rail/tabsConfig.ts:341-397`, `shell/hooks/useColumnPanelEscape.ts`, `sidebar/tabs/{publish,review,history,activity,ai}/*`, `shell/IssuesPanel.tsx`, `shell/hooks/useIssuesFeed.ts`, `shell/hooks/useLifecycle.ts`, `shell/lifecycle.ts`, `shell/modals/Publish*Modal.tsx`, `StaleApprovalModal.tsx`, `UnpublishConfirmModal.tsx`, `shell/PublishHistory.tsx`, `CompareHost.tsx`, `TimeTravelHost.tsx`, `panels/VersionHistoryPanel.tsx`, `rail/LayoutShell.tsx:148-151`.

| ID | Capability | Today |
|---|---|---|
| RT-01 | Host model | **Three independent states**: column tab (publish/review/history/activity), Issues mode, AI mode (`aiInInspector`); render priority Issues › tab › AI › Inspector; **opening one does not close the others** (U/H under Issues stays hidden; I under Publish opens hidden); AI keeps Inspector mounted but invisible |
| RT-02 | Open | `ui:switch-tab` / `UI_PANEL_OPEN`; AI special-case closes Issues; Issues via `UI_OPEN_ISSUES`; left drawer hidden while a column tab is open |
| RT-03 | Close / back | ✕ toggles panel; Esc via `useColumnPanelEscape` (capture, yields to menus) — **each layer listens, one Esc can close two**; "‹ Inspector" only on AI and Issues |
| RT-04 | Fallbacks | skeleton + error boundary + Retry for column tabs only; AI eager, Issues no boundary |
| RT-05 | Width | fixed 300 (`--bk-size-inspector`); ≤1366 overlay; **no resize** |
| RT-06 | Guards | only Settings + CMS record; **AI prompt, Review reply, Issues↔AI swaps unguarded** |
| RT-07 | Focus | **no focus move on open, no restore on close** |
| RT-08 | Landmark | `<aside>` always "Element properties" even for Publish/Review |
| RT-09 | Keys | U Publish, R Review (reviews on), H / ⌘H History, I / ⌘J AI; Activity and Issues none. **Target:** U, R, **H** (⌘H removed), **I** (⌘J removed; I inactive while AI is hidden, SC-21) — SC-12 *(amended 2026-10-17 — source: Panel 18 §14, Panel 20 / SC-12, SC-21)* |
| RT-10 | Publish | header ⋯ (All versions ›, Unpublish site…), Pre-publish checks (Fix ›), Release to / Environment, Changes in this session, Last deploy, pinned footer CTA with disabled reason; gate banner (Open Review / Open Issues / Retry); dialogs: errors confirm (Fix issues first / Publish anyway → continues to next gate), gate modal, stale approval (Request fresh review / Publish anyway), facts confirm (Target, Pages, Approval, Rollback); running (step n/N, elapsed, Cancel); outcomes Published (View live, "Compare vN-1 → vN" **only switches to History**), simulated, failed (Check status / Repair connection / Try again / View log), cancelled, unreachable; Unpublish typed confirm; `publish` flag + Vercel connection |
| RT-11 | Review | ⋯ (Compare rounds, Round history, open/re-send/new link, revoke, withdraw — viewer disabled); status line; Next › banner; rows Locate › → "Comment located" band → Edit {element}; Resolve, Copy link, Reattach; resolved section; composer "Comment on {page}…" Send/Retry (viewer disabled); states loading/error/empty/all resolved/revoked; no older-round pager |
| RT-12 | History | Session / Saves / Published views (last remembered per site); ⋯ Search, Time Travel ⌃⇧T, Clear undo history; Session restore with discard warning, Save a version; Saves: details, name, Restore to draft (safety version), Compare with current (**inline compare** — Visual/Semantic/screenshot views + AI change summary with cooldown, `VersionHistoryPanel.tsx:488-550`; a different capability from the shared Compare per IAF-18 S), Delete; milestone banner; Published: details, compare, Republish (admin), pruned disabled; Compare overlay 1080×760; Time Travel |
| RT-13 | Activity | chips All/Edits/Comments/Publish; rows summary/actor/time; states; row → Review or History view with "‹ Activity" back (**panel only, not exact item**); no pagination, search, actor filter. **Target label: "‹ Back to Activity"** (SC-1 one label pattern; the as-built "‹ Activity" row is retired) *(R-1018)* |
| RT-14 | AI | scopes element/multi/similar/page/site (locked while running); states idle → planning → review (plan) → running → done; edit step, Run plan, Approve, Skip, Stop; Undo all (this run only), Keep N changes / Done → Inspector; errors not-configured / quota / failed; privileged Publish confirm; suggestions; quota counter |
| RT-15 | Issues | sources DS-lint, content scanner, server checks; rows dot/message/location/severity/Fix ›; This page / Whole site; severity filter; count; scan / fix bands; Ignored (n) + Restore; jump to element (page switch + select → token user → fix pane → Brand); "Issue fixed" toast + Undo; errorCount feeds CTA "anyway" |

Tests: ~100 files across host and tasks (e.g. lifecycle 36, ReviewTab 54, PublishTab.states 26, PublishHistory 31, applySetStyle 56). **None** covers two modes open together or Esc closing one layer.

## 3. Problems this design solves
1. **No single owner** → hidden tasks, wrong task visible, double-close on Esc (RT-01/03).
2. **Unguarded drafts** in AI prompt and Review reply (NAV-02).
3. **No consistent way back** to the Inspector; no focus handling; wrong landmark name.
4. **Width** fixed 300 vs GEO-01 360 resizable; AI/Issues lack crash fallback.
5. Activity rows don't open the exact item; Publish outcome "Compare" doesn't open Compare; Saves' inline compare has no door to the full shared Compare.

## 4. Host contract

### 4.1 One task at a time (Fix RT-01)
- State = `{ moduleWorkspace, activeTask: null | publish | review | history | activity | ai | issues, originStack }` (NAV-01). `activeTask = null` → Inspector (in Editor) or nothing (resource workspace).
- **Opening a task replaces the current one** — after the outgoing task's draft guard (§4.3). Every door (keys, topbar CTA, review chip, menus, ⌘K, gate banner, bell footer, status Versions ›) sets the same single state.
- AI is a task like the others. **The Inspector stays mounted but invisible under every task** (generalising today's AI technique, `StudioPanels.tsx:977-983`), so its tab, section, scroll, authored state (e.g. :hover, not reset to Base) and any typed-but-unapplied field input survive the task (Change: applies to all tasks, not only AI). While hidden, the Inspector's host stays **pinned at 300 wide** even when a task docks at 360, so its content doesn't reflow or lose its scroll offset.

### 4.2 Host frame (every task)
```
┌─ Publish ─────────────────── ‹ Back to Inspector ✕ ┐  header 48 (task title · scope · back · close)
│ (one scroll body)                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [ Publish changes ]                                 │  footer 48 only when the task owns actions
└─────────────────────────────────────────────────────┘
```
- Header: task title, scope line (e.g. "Bella Cucina · whole site", "Heading · element"), **"‹ Back to Inspector"** back on every task in Editor **only when the Inspector was visible before the task opened** — otherwise the header has ✕ only (SC-1 *(amended 2026-10-17 — source: SC-1, Panel 17 §4.3)*) — and ✕ close. **NAV-02 split:** **Back** closes the task and **shows the Inspector**; **Close (✕ / Esc)** closes the task and **restores the prior Inspector visibility** (if the user had hidden the Inspector it stays hidden — Change from today's AI/Issues back that forces it on). In resource workspaces ✕ closes the tray.
- **Left panel (Change *(DS)*, vs boards 4418:97118):** opening a task **no longer closes the Add/Layers panel** (today a column tab is the drawer's tab, so the drawer closes). Tasks are right-column only; the left panel keeps its state, which is what the 1440 budget below assumes.
- Landmark: `<aside aria-label="{Task name}">` — "Element properties" only when the Inspector shows (Fix RT-08).
- Loading/error boundary + Retry for **all six** tasks (Fix RT-04; AI lazy-loaded).

### 4.3 Guards (NAV-02/03)
- Outgoing guard before replace/close uses **the one unsaved-changes dialog (S3, DS §3)**: title "Leave without saving?" · **Keep editing** (default) · **Discard changes** · **Save and leave** only where an explicit Save exists (Site settings, CMS record, Page settings). **AI** unsent prompt or plan in review (inactive this version, SC-21) and **Review** unsent reply have no Save → Keep editing · Discard changes. A **running AI plan** is not an unsaved draft and keeps "Stop the run?" Keep running / Stop. Existing Settings / CMS record registry joins the same dialog. Failed discard keeps the task (Panel 02 §7 rule). *(R-1018 — replaces "Discard prompt?" Keep / Discard and the Keep / Discard reply guard)*
- Rail navigation, page switching (Panel 11) and area changes use the same dialog (S3) *(R-1018)*.
- **Running or confirming work:** a **running Publish** keeps running when the user switches task (progress stays on the topbar CTA and reopens in Publish); a pending **History › Session "Restore to here" warning** (SC-15 class b; Restore to draft has no dialog — class a) *(R-1018)* and the **Unpublish typed confirmation** are modal dialogs — task switching is blocked until they close. Publishing from a resource-workspace tray with an unsaved CMS record runs the IA-03 preflight ("Save the record first or publish without it").

### 4.4 Escape and focus
- **One Esc closes one layer** (Fix): while typing in a task field the first Esc does nothing (existing `isTyping` rule); open menu/popover/dialog inside the task → that; else the task (after its guard) with **Close** semantics (prior Inspector visibility). Canvas selection survives (existing). Single host-level handler that stops propagation (no per-layer listeners). Compare and Time Travel own their Esc (Panel 05 §6 ladder).
- **Focus mode ⌘\** *(R-1018b, owner Q5; SC-12)*: hides the open task together with the other side panels; ⌘\ again shows the same task with its state. Opening a task (key, CTA, chip) while in focus mode shows that task and leaves focus mode.
- **Focus (NEW):** opening a task moves focus to its header title; closing returns focus to the invoking control (CTA, chip, key origin → canvas). F6 treats the task as the "task" region (NAV-04).

### 4.5 Geometry (GEO-01; NOT MEASURED)
| Context | Rule |
|---|---|
| Editor ≥1367 | Task **docks in the Inspector's place at 360** (320–420 bounded resize, keyboard splitter 16px, preference only); canvas region at 1440 = 740 (Panel 05 budget). Returning to Inspector restores 300 |
| Editor 1281–1366 | Task **overlays** at 360 with 12 inset (obscures 372), like the Inspector overlay |
| ≤1280 | Work-area **sheet** min(560, available−24) |
| Resource workspaces (CMS, Assets, Brand, Site settings, Templates, Components) | **Tray overlays the workspace body** (360); **topbar Publish pressed here opens Publish in this tray, in place** (SC-7, owner Q15 *(R-1018b)*); covered body inert; resource route stays mounted; Close restores focus and draft (NAV-01). **≤1280:** same work-area sheet min(560, available−24) as Editor (GEO-01) |
| Body | one scroll; footer 48 only for tasks with actions (Publish CTA, Review composer, AI run controls) |
| Canvas toolbar while a task docks | the canvas region at 1440 is 740, below the one-row toolbar's ≈750, so **Panel 05 §9's collapse order applies whenever a task docks** (verify at 1440) *(R-1018, D2-18)* |

## 5. Per-task deltas (interiors kept unless listed)

| Task | Kept | Changes |
|---|---|---|
| **Publish** (U) | **Interior now specified in Panel 14 (FD-PNL-14, 2026-10-17), which wins over this row.** Everything in RT-10: checks, release target, session changes, last deploy, CTA + reasons, gates and dialog order, running/outcome states, Unpublish typed confirm, flag + Vercel connection gating | Pre-publish checks gain an **"Unresolved images"** row (Panel 08 §5 FI-03 state; Fix › opens the first affected image) (NEW); outcome "Compare vN-1 → vN" **opens the shared Compare** directly (Fix; depends on job ids, §9); doc note: "Publish anyway" continues to the next gate (stale / facts) — code is right, inventory 9.4 corrected; header back + focus per §4 |
| **Review** (R, reviews on) | Everything in RT-11 | **Interior delta specified in Panel 17 §4.3, which wins over this row** *(amended 2026-10-17 — source: Panel 17 §4.3 / SC-10)*: round card (invitee, opened, sent, link end, Copy link), Client / Team / All filter, audience toggle Team only / To {client}, footer "Send Round {n+1} to {client}" after Changes requested; unsent reply guarded per thread + round + audience — the S3 dialog "Leave without saving?" Keep editing · Discard changes (Fix RT-06, §4.3) *(R-1018)*; "Edit {element}" from Comment located band returns via the chip "‹ Back to Review" (origin stack, NEW; SC-1); older-round pager stays absent (no endpoint) |
| **History** (H — ⌘H removed, SC-12) | Session / Saves / Published, Time Travel, restore flows, safety version, republish (admin), **Saves filter** "Filter ▾" All / Named / Auto-saves + author (INV #111), **Session keyboard** j/k/↑/↓, g/G, Enter expand, Esc (INV #124; listing them in the shortcuts sheet is Panel 18's follow-up) *(R-1018, T3-19)*, **Saves inline compare** (**Visual / Semantic / screenshot only** — the AI change summary is **inactive** while SC-21 holds; IAF-18 E/F) *(R-1018, D3-7)*. **Milestone banner: inactive** — `useAutoMilestone` is not mounted while the AI flag is off (SC-21) *(R-1018, T3-7)* | **Session rows** read verb + target + place ("Changed padding · Hero · Home"); opened / cleared render as dividers, not rows; row action "Restore to here" (Panel 24 §4.5 *(amended 2026-10-17 — source: Panel 24 §4.5, Panel 18 / SC-10, SC-12, SC-21)*). **Session restore saves (Fix, T5-15 / INV BK-19):** a Session-row restore (and "Restore to here") **marks the document dirty and queues a normal save**, so the status goes Saving… → Saved and the server holds the restored state; today it emits only `HISTORY_RECORDED` and never saves (`HistoryManager.ts:816`, `useComposerInit.ts:897-900`) *(R-1018)*. **Named-version delete (S5, SC-15 class a):** Saves row ⋯ Delete → no confirm; toast "{Name} deleted · Undo · Recently deleted ›" (≥ 8 s); the version moves to **History › Saves › Recently deleted** for 30 days (layout per Panel 24 §4.8; Restore returns it to Saves with the same ID; Delete permanently = SC-15 class c typed confirm) — needs ⛔ RT-D1 *(R-1018)*. **Republish** from History › Published = SC-15 class b consequence confirm (Panel 14 §5.6) *(R-1018)*. **Restore to draft (Saves) = SC-15 class (a) Undo only** *(R-1018 reconciliation)*: it replaces the current draft with the saved version after writing the "Before restoring" safety version, so no dialog; a persistent **Undo restore** from the safety version, with a revision check (≥ 8 s; Panel 24 row 54). It resets the ⌘Z stack — recovery is Undo restore, not ⌘Z. **Session "Restore to here"** keeps its later-steps warning = SC-15 class (b). **NEW door:** "Open comparison ›" from the inline compare opens the shared Compare with the same two versions; Time Travel opens its dedicated area (Panel 05) and returns to History › Session |
| **Activity** | chips, rows, "‹ Back to Activity" back (SC-1; replaces as-built "‹ Activity", RT-13), and the **four existing states** (INV #133, `ActivityLogView.tsx:160-240`): no site → task not offered; empty "Nothing here yet"; server error "Couldn't load activity — Retry"; no permission → "Open in dashboard" *(R-1018, T3-22)* | Rows open the **exact item** (comment, version, publish) — **NEW, needs target ids in `activity.recent`**; until then panel-level open (today); "Load more" pagination (NEW, needs cursor API); no key added (⌘K + site menu + bell footer remain) |
| **AI** (I — ⌘J removed, SC-12; **whole task hidden in this version, SC-21**) | scopes, plan/review/run/stop, **"Undo this run's N changes"** (replaces "Undo all"; stops at the first newer edit and says so — "2 of 3 undone — stopped at a newer edit"; SC-18) *(amended 2026-10-17 — source: Panel 20 §10 / SC-10, SC-12, SC-21)*, Keep/Done, errors, privileged confirm, suggestions, quota | Becomes a normal task (§4.1); Inspector state snapshot/restore; prompt/plan guard; off-canvas AI requires an explicit visible Editor target before execution (IAF-01 E) — when opened from a resource workspace, scopes element/page are disabled until the user returns to Editor |
| **Issues** | sources, rows, scope (label "This page / Whole site"), severity filter, count, bands, **motion checks** — WCAG 2.2.2 Blocking row and motion Tips (Panel 19 §5.8 *(amended 2026-10-17 — source: Panel 19 §5.8 / SC-10)*), Ignored + Restore, jump-to-element chain, fix + Undo, errorCount → CTA | Becomes a normal task (§4.1); error boundary; "Fix ›" on the current page keeps the Issues task open beside the canvas (no return chip, Panel 00 SC-7); a Fix that leaves Editor (e.g. token → Brand) pushes an origin frame so "‹ Back to Issues" returns to the list position. **Door (N4, Panel 01):** the topbar Issues chip left of Publish appears only while Blocking checks or Issues errors exist, and opens this task *(R-1018)*. **Load-time damage-scan row pattern** *(R-1018b — not-asked item, F-EN-C5.7; copy (DS))*: one grouped row per kind of damage — title **"{N} elements couldn't be loaded correctly"**, detail line **"Some saved values were unreadable — check how they look on the page"** *(DS)*, location "{page} · {element}" for the first one; action **Locate ›** (selects the first affected element on canvas, the task stays open, "Next ›" steps through the rest — same chain as Missing image). **No Repair action**: the repair (`DamageScanner` / `useLoadRepair`, commit `5cfd71467`) is not in `src` on main — only on unmerged `feat/phase1-s*` branches; the scan is there too, so the row ships when the scan merges, and Repair is designed then. Read-only in view mode (Locate only). Mirrored as a Publish Tip (Panel 14 §5.2) |

## 6. States, roles, flags
| Condition | Behaviour |
|---|---|
| Viewer | With no task open a viewer's column shows the existing `ViewerRoleNotice` (not the Inspector); History, Review, Activity open read-only (existing); Publish shows the viewer CTA reason (existing); AI and Issues not offered to viewers *(unchanged: AI needs edit rights; Issues fixes write)* — Issues list read-only would be NEW, not added |
| `publish` flag off | Publish task shows "Publishing isn't switched on for this workspace yet" (Panel 14 §6 — the old "Connect Vercel to publish." copy was the wrong reason) |
| `reviewsEnabled` false | No Review task, no R key (existing) |
| AI not configured / quota | existing error states; quota per plan (SC-20 — trial = Pro, Upgrade only on Free after the trial); provider rate limits keep a plain "Try again in a moment" |
| Task load failure | boundary + Retry; host remains usable |
| Read-only owner view | column tasks closed except existing viewer chrome (unchanged) |

**Per-task empty and offline states** *(R-1018 — fills the "~ empty / ✗ offline" cells of INTERACTION_AND_STATE_MATRIX §3)*. Offline is owned by Panel 22 §5.3 (one polite announcement, banner, "Needs a connection" on disabled controls); editing the canvas continues. Load errors follow DS §3: server "Couldn't load {thing} — Retry"; network "You're offline" — never blame the connection for a server error.

| Task | Empty | Offline |
|---|---|---|
| Publish | Panel 14 §5.1 ("No changes since vN…", first publish) | Panel 14 §6: CTA disabled "Needs a connection"; a running job view shows "Reconnecting…" |
| Review | existing empty / all-resolved states (Panel 17) | last loaded threads stay readable; Send, Resolve, Copy link disabled "Needs a connection"; never loaded → "You're offline" |
| History › Session | existing (session list is local and works offline; Restore stays available, its save queues per §5) | works (local) |
| History › Saves / Published | existing empty states | last loaded list stays readable; Restore to draft, Save a version, Delete, Republish disabled "Needs a connection"; never loaded → "You're offline" |
| Activity | "Nothing here yet" (existing, §5) | last loaded rows stay readable; never loaded → "You're offline" |
| AI | inactive (SC-21) | inactive (SC-21) |
| Issues | existing empty | DS-lint and content-scanner rows (local) work; server-check rows show "Needs a connection" |

## 7. Preservation map
| Old | New | Disposition |
|---|---|---|
| RT-01 three modes | One `activeTask` | Fix |
| RT-02 doors | Same doors → single state | Keep |
| RT-03 ✕/Esc, back on AI/Issues | Back on all tasks; one-layer Esc | Fix + NEW |
| RT-04 fallback for tabs | All tasks | Fix |
| RT-05 300 fixed | 360 docked (320–420) / overlay / sheet | Change (GEO-01) |
| RT-06 guards | + AI prompt/plan, Review reply | Fix |
| RT-07 focus | open/close focus rules | NEW |
| RT-08 landmark | task-named | Fix |
| RT-09 keys | U, R, H, I (⌘H/⌘J removed; I inactive under SC-21) | Change (SC-12) |
| RT-10..15 task interiors | Kept with deltas in §5 | Keep + Fix |
| Saves inline compare | Kept + "Open comparison ›" door to shared Compare | Keep + NEW |
| Inspector state under tasks | Mounted/invisible under every task | Change (generalised) |
| AI scope lock from resource workspaces | element/page scopes disabled until back in Editor | Change |
| Drawer closes when a task opens | Left panel keeps its state | Change |
| Session-row restore (never saved, BK-19) | marks dirty + queues a save | Fix *(R-1018)* |
| Saves Delete (no Undo, `site-version.ts:56`) | Undo + History › Saves › Recently deleted 30 days (S5) | Change *(R-1018)* |
| Saves AI change summary, milestone banner | inactive while SC-21 holds (code kept) | Keep (inactive) *(R-1018)* |
| "‹ Activity" back row | "‹ Back to Activity" (SC-1) | Change (label) *(R-1018)* |

No capability removed.

## 8. Acceptance (specified, NOT RUN)
| ID | Pass condition |
|---|---|
| T-RT-01 | With Issues open, press U → Issues closes (after guard), Publish visible; never two tasks rendered |
| T-RT-02 | With Publish open, press H → History replaces Publish; Inspector tab/scroll restored after History closes. (AI variant with I: inactive this version — SC-21) |
| T-RT-03 | One Esc closes only the topmost layer (menu, then task) |
| T-RT-04 | (inactive this version — SC-21) Unsent AI prompt → switching to History shows "Leave without saving?" Keep editing · Discard changes (S3); Keep editing stays in AI *(R-1018)* |
| T-RT-05 | Every task header has "‹ Back to Inspector" when the Inspector was visible before it opened, otherwise ✕ only (SC-1 *(amended 2026-10-17)*); focus lands on the task title on open and returns to the invoking control on close |
| T-RT-06 | At 1440 a task docks at 360 and resizes 320–420; at 1300 it overlays; at 1200 it is a sheet |
| T-RT-07 | In CMS, open History → tray overlays CMS body; Close restores the CMS record draft and focus |
| T-RT-08 | After the §9 job-id dependency ships: Publish outcome "Compare vN-1 → vN" opens the shared Compare (before: opens History › Published with vN selected) |
| T-RT-09 | Saves inline compare shows **Visual / Semantic only** — no AI summary control while SC-21 holds; "Open comparison ›" opens the shared Compare with the same versions *(R-1018, D3-7)* |
| T-RT-13 | Inspector on :hover state with an unapplied field value → open AI → close → :hover and the unapplied value are still there |
| T-RT-14 | Inspector hidden by the user → open History → header shows ✕ only (no back control, SC-1) → ✕ → Inspector stays hidden *(amended 2026-10-17 — source: SC-1)* |
| T-RT-15 | Publish running → switch to Review → Publish keeps running; CTA shows progress |
| T-RT-10 | Screen reader announces "Publish" region (not "Element properties") while Publish is open |
| T-RT-11 | AI or Issues task crash → boundary with Retry; rail/canvas usable |
| T-RT-12 | Existing ~100 host/task test files updated; new tests for single-task and one-layer Esc added |
| T-RT-16 | History › Session → restore a row → status shows Saving… then Saved; reload → the restored state is what loads (T5-15, BK-19) *(R-1018)* |
| T-RT-17 | (after RT-D1) Delete a named version → no dialog; toast "{Name} deleted · Undo · Recently deleted ›"; Undo returns it; after the toast, History › Saves › Recently deleted lists it with "Deletes in N days"; Restore returns it with the same ID (S5) *(R-1018)* |
| T-RT-18 | Offline with each task open → controls that need the server are disabled "Needs a connection"; one polite announcement (Panel 22); History › Session restore still works and saves after reconnect *(R-1018)* |
| T-RT-19 | Activity row → History → header back reads "‹ Back to Activity" (SC-1) *(R-1018)* |

## 9. Dependencies
- Activity exact-item open: target ids on `activity.recent` rows (API change).
- Activity Load more: cursor pagination (API change).
- Publish outcome "Compare vN-1 → vN": needs both published job ids (today the outcome holds only `lastDeploy.version`, `PublishTab.tsx:843-850`); until then it opens History › Published with vN selected (today's behaviour).
- Both degrade to today's behaviour until shipped.
- **⛔ RT-D1** *(R-1018, S5)*: server soft delete for saved versions (`SiteVersion` has no `deletedAt`, Panel 24 UN-15) + a 30-day History › Saves › Recently deleted store (= SC-9 ⛔ "Named-version soft delete" = Panel 24 ⛔ U-8). **Interim until shipped:** named-version delete is an SC-15 **class (b) consequence confirm** (one sentence stating the version cannot be restored; default = Cancel) — the temporary class listed in SC-15 (b) — and becomes class (a) when RT-D1 / SC-9 / U-8 ships *(R-1018)*; this panel stays "blocked by RT-D1" for that row only.
- Session-row restore save (T5-15): engineering fix in the history/save wiring (`HistoryManager.ts:816` → save queue); no API change.

## 10. Review and not verified
Independent `design-qa-critic` review: pass 1 PROPOSAL (3 blocking), pass 2 passed; minor notes fixed. Not verified: runtime, resize feel, overlay focus/inert behaviour, real publish with Vercel, AI with real quota.
**Open (not specified here, R-1018):** ~~Issues rows for a load-time damage scan / repair~~ — row pattern drafted in §5 Issues *(R-1018b)* (Locate only; Repair waits for the branch merge); an Issues copy table (T1-17) is still not written.
