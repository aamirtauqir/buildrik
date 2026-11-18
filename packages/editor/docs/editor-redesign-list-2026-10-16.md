# Buildrik Editor — Redesign List (2026-10-16)

> **SUPERSEDED / historical — do not design from.** Current specs: `audit-and-design-2026-10-16/panels/00–25` + `audit-and-design-2026-10-16/design-audit-2026-10-18/`. Rows here were absorbed, overridden or decided there (DOCUMENTATION_AUDIT D1-13, D1-16). Row IDs below are this list's own (cite as RL-xx; its BK-nn are the 10-14 Webflow audit, WF-BK-nn — not BACKLOG BK-nnn). Every owner decision in §25 now has a disposition. *(R-1018)*

**Status: PROPOSAL** (historical; superseded as above). Rows marked **Decision** needed the owner's answer before they were drawn — see §25 "Disposition (2026-10-18)".

**2026-10-18 owner decisions applied** (audit-and-design-2026-10-16/design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): dispositions for all 20 §25 decisions — N1, N3, N4, N7, N8, P1, P3, P4, P5, P6, P7, P8, P9, P12, C1; gap rows D1-13, D1-16, Q14, Q15.

**What this is:** the list of what to redesign in the editor UI, screen by screen. Each row says what to change, why (the evidence), what must survive the redesign, and how urgent it is.

**Sources:**
- `editor-feature-inventory-2026-10-16.md`: about 1,240 features with status, code on `main` @ 19f964d5e. Row ids below, such as "Canvas 6.4" or "Inspector 55", point into it.
- Trusted audits: 10-08 full audit (L*/FG-*), 10-10 UI/UX audit (UX-*), 10-10 product audit (IA-*).
- 10-14 Webflow audit (BK-*), including its §D ownership rules and §E screen spec.
- 10-15 design-review decisions (DR-T*).
- Not used: the 10-14 master-audit rounds (owner distrusts them).

**Visual direction does not change:** DESIGN.md stays (Inter, one accent `#1A56DB`, 4px spacing, compact density, light theme, chrome-ui + flowbite + `tw:` + `--bk-*`). This list is about structure, flows, states and copy, not a new look.

**Priority:**
- **P0:** the redesign is wrong without it. It fixes a trust or data-loss problem, or a core task users can't find.
- **P1:** an important gap or inconsistency.
- **P2:** polish.
- **Decision:** needs an owner call first.

**Not design work (engineering only):** several 🐞 bugs are pure code: resize math, duplicate losing styles, restore overwriting, authz holes, image loss. Most are fixed on the unmerged branch `feat/phase1-s6-publish`. They are listed at the end so the designer does not spend time on them, but rows that need a visible state (for example "image not uploaded yet") are in the screen tables.

---

## 0. Rules that apply to every screen

These are shared patterns. Settle them once, before drawing individual screens.

| ID | Redesign | Why (evidence) | Must keep | Priority |
|---|---|---|---|---|
| G1 | **One full-page host.** Settings, Brand, Templates, Assets and CMS use one shell: same header, "Back to canvas" in the same place, focus moves in and returns, the editor behind is inert, and ⌘Z/zoom keys are off | 4 takeovers with Back in different places (UX-24, UX-20); 3 takeover shapes (IA-06); Tab and screen readers reach the hidden editor (UX-22, IA-07); ⌘Z undoes hidden canvas edits (Canvas 13.10) | Deep links into each tool (Settings screen ids, Brand page + token) | P0 |
| G2 | **Disabled-with-reason everywhere.** Every disabled control shows why, visible on hover and announced to screen readers | Greyed menu rows say nothing (IA-03); the media viewer pattern is the right one to copy | Role and read-only gates themselves | P0 |
| G3 | **One save model per surface, said once.** Autosave surfaces never say "draft" or "Save"; explicit-save surfaces say Cancel / Save | Brand says "Save to draft" under autosave (Brand 18, 20); Page settings says "Done" where the owner asked for Save (FG-012); Languages mixes two models on one screen (Settings S25) | Brand autosave + one undo stack; Settings footer save bar | P0 |
| G4 | **Draft vs live shown per surface:** "applies now", "live after next publish" | §D rule 7; CMS published records, form settings and Brand copy all over-promise (UX-19) | "Saved · applies on next publish" toast (Settings S9) | P1 |
| G5 | **One empty-state pattern:** what this is, one main action, centred | CMS empty state misleads (UX-15/16); Layers empty state has no action (Pages 87); CMS empty records are the good model (CMS B16) | — | P1 |
| G6 | **One onboarding surface at a time.** Coach mark, Add tip card, checklist and step prompt never stack; progress is per site | Pop-ups stack (UX-02, UX-04, L1-029); progress is global, so a new site can show "Done 7/7" (L1-015); the review steps can't be finished when reviews are off (Shell 12.4) | 7-step checklist content | P1 |
| G7 | **One right-column host with visible modes.** Publish, History, Review, Activity, Issues and the inspector share the right column; show which one is open and how to go back | 7 modes share one column with no visible stack (Shell 1.5) | Inspector as the default right-column content | P1 |
| G8 | **Copy pass for stale and contradicting text** | "No trash" vs 30-day restore (Shell 10.6); ⌘K "focuses the shell search" (Shell 14.2); the empty container says "use +" for a removed button (Canvas 1.11); "Rolled back" vs "Republish" (Shell 9.9); Undo/Redo reason case (Shell 13.4); load errors blame "your connection" (Settings S13) | — | P1 |
| G9 | **No native browser dialogs.** Use chrome-ui confirm | Clear history uses `confirm()` (Shell 13.7) | — | P2 |
| G10 | **Desktop-only stays**, but the lowest supported size is 1280×720 | Empty CTA clips at 1280×720 (UX-01) | — | P1 |

## 1. Shell — top bar

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| T1 | **Save pill states:** Unsaved · Saving · Saved · Offline · Retrying in Ns · Conflict · Not saving · Error, each with a short popover | Dirty/⌘S honesty is wrong (BK-11); retry is invisible (Sync Y3); DR-T3 "Not saving" variant approved | ⌘S as the manual save; the click opens details, it does not save | P0 |
| T2 | **Always-visible issue count** next to Publish | The Issues chip was removed; the count lives only in a ⋯ tooltip, but errors still change the CTA to "Publish anyway" (Shell 2.10, 3.5, L4-038) | Issues panel, row → locate | P0 · Decision (L4-038) |
| T3 | **Live status at a glance:** live / never published / publishing… / failed | Live chip removed (Shell 2.6); the CTA should show an in-flight job (§E1) | One CTA whose verb changes with state (Shell 2.14) | P1 |
| T4 | **Site › page breadcrumb:** make "site name opens Pages" visible, or drop it | Hidden door (Shell 2.2) | Page switching | P2 |
| T5 | **Comments button with a count badge** | No count on the top-bar button (Canvas 14.2) | Comment mode C (reviews on) | P2 |
| T6 | **Presence avatars and connection pill**: design as live, tag PLANNED | 🚩 collab (Shell 2.11) | — | P1 (planned) |
| T7 | **Publish disabled state** when the publish flag is off: say so plainly | 🚩 publish (Shell 2.14) | — | P2 |

## 2. Shell — left rail, drawer, ⋯ site menu

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| L1 | **Rail item behaviour:** items that open a full page (Brand, CMS) look different from items that open the drawer | Same-looking items, different behaviour (Shell 4.1) | 6 rail items + letter keys | P1 |
| L2 | **Off-rail panels need a visible home.** Decide whether Components, History, Publish and Templates get rail items, with the letter shown in each tooltip ("Layers · L") | Panels reachable only through ⌘K, the save pill or letter keys (Shell 3.19, 4.8); §E2 recommends adding them | Letter keys A T M L P B S U H R D | Decision |
| L3 | **Closing a drawer:** add a visible close, not only "click the rail item again" | Re-click is the only close for Add and Layers (Shell 4.5) | Click-to-toggle | P2 |
| L4 | **Rail Help:** tooltip says "?" but "?" opens a different sheet. Make them one | Shell 4.3 | Shortcut sheet | P2 |
| L5 | **⋯ Site menu:** regroup; Share preview needs password/expiry here, not only in the dashboard; remove "Site health ↗" or merge it with Issues | Shell 3.10, 3.16 | All current rows keep a door | P2 |
| L6 | **Viewer rail** shows only allowed tools (not toast-after-click) | BK-39 | Read-only view | P1 |

## 3. Canvas bar, breakpoints, zoom, preview

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| C1 | **Breakpoint switcher always visible on the canvas bar** (Desktop · Tablet · Mobile) with the active width ("1024 px") | Top redesign item: the breakpoint hides behind "View · N" (UX-06 High, Canvas 2.1); View mixes overlays with a core task (Canvas 9.1); §E3 | Custom width; ⌘K "Wide view" | P0 |
| C2 | **One "Desktop" width** across canvas, Preview and export | 1024 / 1320 / 1440 today (Canvas 2.8, L1-013) | — | P0 · Decision (L1-013) |
| C3 | **Canvas breadcrumb** of the selection on the bar (click a crumb to select) | Bottom breadcrumb removed; hierarchy only in Layers/tag (Canvas 6.18) | Selection tag | P1 |
| C4 | **Zoom menu complete:** Zoom in/out, Zoom to selection, 25/50/100/200/400, Fit width default | Menu misses rows that keys support (Canvas 3.1); View › Zoom is a duplicate door (3.2) | ⌘0/1/2/=/- keys | P2 |
| C5 | **Wide (1920) breakpoint:** draw it or drop it from Figma | Board still draws Wide (FG-029); only reachable via ⌘K (Engine A4.3) | — | Decision (FG-029) |
| C6 | **Preview opens at the canvas breakpoint and page**, renders like publish, has building/error states, Escape out | Always opens on Desktop (UX-11, Shell 8.2); can't be trusted as "what ships" (Shell 8.3, UX-09); DR-T6 approved | Share preview, Compare | P0 |
| C7 | **Device frame button** on chrome-ui; hover visible | Hand-rolled, white-on-white hover (Canvas 2.7) | Bezel option | P2 |

## 4. Canvas — selection, toolbar, menu, drag

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| S1 | **Selection toolbar must not cover the content being edited** | UX-07, L2-035 (Canvas 6.14) | 3-button ink toolbar, accent tag | P1 |
| S2 | **Multi-select:** an on-canvas door for multi actions (align, distribute, group); hide resize handles until multi-resize works | No on-canvas multi actions (Canvas 7.3); handles drawn but only the primary resizes (6.8) | Inspector align/distribute bar | P1 |
| S3 | **Element menu order:** clipboard first, Delete last and separated, AI not next to Delete; clamp to the viewport | IA-02 (Canvas 11.2); runs off screen (IA-15, 11.4) | One action registry; ⇧F10 | P1 |
| S4 | **Arrange labels** say "Move earlier/later", not "Bring to front", because they change DOM order | Canvas 11.11 | Commands | P2 |
| S5 | **Insert before/after/inside, wrap in section:** decide whether they come back to the menu | Removed; Add drawer is the only insert path (Canvas 11.18) | — | Decision |
| S6 | **Inline text editing:** Shift+Enter makes a line break; list items can be added | Enter always commits (Canvas 8.4) | Floating rich-text toolbar (move it onto chrome-ui) | P1 |
| S7 | **Marquee select** that starts on the page, not only in the 20px strip | Canvas 7.5 | — | P2 |
| S8 | **Hidden power features** (Alt hover hierarchy, Alt+Shift box model, spacing spots) get a visible door or a line in View ▾ | Canvas 5.2, 5.3, 6.21 | The features | P2 |
| S9 | **Empty container placeholder copy** points at a real control | Canvas 1.11 | Placeholder | P1 |
| S10 | **Comment threads:** replies, edit/delete, @mentions | Stub (Canvas 14.6); L5-031/032/033 | Pins, comment mode | Decision |
| S11 | **Collaboration on canvas:** remote cursors, remote selection, "editing this", soft locks; tag PLANNED | 🚩 + stubs (Canvas 15.x) | — | P1 (planned) |
| S12 | **Interactions "Reverse on leave"** toggle: hide it until it works | Stub (Canvas 16.2, Settings N6) | Triggers + presets | P2 |

## 5. Inspector

Ownership follows Webflow audit §D rule 1–2: **Style owns CSS** (per element × breakpoint × state), **Settings owns everything else** (content, CMS, form, attributes, interactions), and **visibility is a style**.

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| I1 | **Fields show the value the canvas shows, and where it comes from** (set here / from Tablet / from token / inherited / default). Clicking the label offers "Clear Mobile value" | Top trust gap in both 10-10 audits: line height 1.1× vs canvas 1.5×, align blank when inherited, font size "16px" when unset (Inspector 42, UX-10, UX-25); "Reset to Desktop" lands on Tablet (BK-10) | Field override dot as a control (Inspector 38) | P0 |
| I2 | **One override indicator** instead of five (chip, Revert line, section dot, field dot, note): one line "Editing Mobile · 1 value set here" | UX-14 (Inspector 39) | Revert per field | P0 |
| I3 | **Breakpoint mirror in the context row** (reads from the canvas bar, C1) | Breakpoint picker removed from the inspector (Inspector 36) | State chip | P1 |
| I4 | **Rename tab "Behaviour" → "Settings"** and move src/alt/input name/value/required out of the Style type block into it | §E5; Figma already says "Settings" (FG-020) | Style · Behaviour · Effects content | Decision (FG-020 was WONTFIX) |
| I5 | **Radio and checkbox Value field** | Every radio submits "on" (Inspector 55, BK-44) | Field block | P0 |
| I6 | **Form › Fields:** separate visible label from submission key; add Select / Checkbox / Radio types; page picker for redirect; forms can be named | "Label" edits placeholder (Inspector 107, Forms C7); no redirect page picker (L3-028) | Per-field inspector | P1 |
| I7 | **"More settings" auto-open rule:** don't push Size/Spacing below the fold | UX-05 (Inspector 19) | Section display modes | P1 |
| I8 | **Interactions with actions:** scroll to, show/hide, open modal, toggle class | Trigger → animation only (Inspector 102) | Animation editor, presets | P1 |
| I9 | **Half-built editors to finish or hide:** custom attributes list/edit/remove; gradient multi-stop; accordion items add/remove/reorder; countdown date picker; video poster picker; shadow visual editor; drag-to-scrub numbers | Inspector 106, 85, 65, 63, 57, 94, 90 | — | P1 |
| I10 | **Disabled reasons for size/spacing on inline elements** | Inspector 81 | — | P2 |
| I11 | **Classes as a selector field** in the header ("This element" + class chips + "Affects N") | §E4; today names-only under Behaviour (Inspector 104) | Class chips | Decision (classes arc) |
| I12 | **Page panel header actions:** decide what page actions live here | One-item menu (Inspector 5) | Page panel when nothing selected | P2 |
| I13 | **Beginner / Pro mode:** delete Beginner or give it a home | Toggle gone, inspector still reads a stuck Beginner value (Brand 12) | — | Decision |
| I14 | **Pressed / visited / checked states** in the State chip | Only Base/hover/focus (Inspector 34) | State chip | P2 |
| I15 | **Multi-select glyphs** become icons, not text arrows | Inspector 44 | Align/Distribute/Group bar | P2 |

## 6. Layers

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| Y1 | **Eye renamed "Hide on canvas"**; add "Hide on this breakpoint" (writes display:none) in the row menu | §E6, §D rule 3 | Dim in editor | P1 |
| Y2 | **Lock/Unlock and Select children in the row menu** | L2-032 owner default (Pages 99) | Context menu on chrome-ui | P1 |
| Y3 | **Multi-select bulk bar** (Group / Hide / Delete) | Removed; bulk only in context menu (Pages 94) | — | P2 |
| Y4 | **Empty state with an action** | Pages 87 | — | P2 |

## 7. Pages and page settings

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| P1 | **One SEO score** used by Listings, the SEO tab and a row dot | Two formulas (Pages 44); blocks FG-008 | Score card + checklist | P0 · Decision (which model) |
| P2 | **Page status chips that can actually happen:** Live / Hidden / Draft / Scheduled / Error, plus "unsaved" as its own mark | "● Unpublished" means unsaved (L3-009); Draft/Scheduled/Error can never appear (Pages 19, 20) | Status chip | P1 · Decision (L3-009) |
| P3 | **Page settings footer Cancel / Save** | FG-012 owner answer (Pages 48) | Discard guard | P1 |
| P4 | **Page limit shown before creating**, with an upgrade door | Found out only on save (L3-013, Pages 42; Shell 10.11) | — | P1 |
| P5 | **Row shortcuts work** (⌘D, ⌫, arrow keys move focus) | Menu shows them, row ignores them (Pages 26) | Enter / F2 / Space | P1 |
| P6 | **Listings and Structure** out of the ⋯ menu; a real full listings view | Buried (Pages 2); "Open full listings ›" has no destination (Pages 45) | — | P2 |
| P7 | **Search** also matches slug and title | Pages 6 | — | P2 |
| P8 | **Yoast-level SEO checks** (readability, keyphrase, schema, canonical) in the page SEO tab, linked to site SEO | FG-007 answered, not built (Pages 52); two SEO homes not linked (Settings S31) | Meta title override + AI | P1 |
| P9 | **X/Twitter linked-vs-independent switch** in Social | FG-011 (Pages 57) | Social tab | P2 |
| P10 | **Home page "Hide" disabled with reason** | Hidden home reassigns the root (BK-66) | — | P1 |
| P11 | **Password-protected pages:** decide if they come back | Removed (Pages 59) | — | Decision |

## 8. Templates

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| M1 | **Template cards on the empty canvas open that template's preview**; the chosen intent is kept | Opens the whole catalogue (Pages 80); intent lost (UX-03) | Empty CTA doors | P0 |
| M2 | **Templates use brand tokens**, so Brand edits recolour them | Literal colours make every token "unused" (L4-024, Pages 79, Brand 50) | Apply + replace confirm | P0 · Decision (re-author templates) |
| M3 | **Saved templates can be renamed and deleted**, and "Save page as template" has a door outside ⌘K | Pages 81 | — | P1 |
| M4 | **Search/filters** when the catalogue grows past ~10 | Removed (Pages 65) | In-place preview | P2 |
| M5 | **One apply feedback surface** (no stacked progress + achievement + toasts) | §E8 | — | P2 |
| M6 | **Purple in built-in templates** | DESIGN.md bans purple; customer output (Engine B37) | — | Decision |

## 9. Add panel

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| A1 | **Real block previews**, not wireframe sketches | Block cards show sketches (Add A20) | 8 section cards | P1 |
| A2 | **Decide what came out with no replacement:** 40 block cards, Row/Column/3 Columns presets, e-commerce blocks | Removed (Add A24) | — | Decision (FG-037) |
| A3 | **Element list grouped** (about 54 rows flat; form fields ~15 in one list) | Add A12, Forms C4 | Favourites, Recent | P1 |
| A4 | **Built-in components that duplicate elements** (Card, Tabs, Modal…): merge or explain | Add A26 | — | P2 |
| A5 | **Favourites and Recent for blocks and components too** | Elements only (Add A10, A11) | — | P2 |
| A6 | **"Generate a block with AI" visible** even when Elements is collapsed | Easy to miss (Add A25) | — | P2 |
| A7 | **Theme toggle element:** explain why it disappears | Hidden when Dark mode isn't Auto (Add A14) | — | P2 |
| A8 | **Wide Add mode (700px)**: keep or drop | Removed (Add A2) | — | Decision |
| A9 | **27-component design-system catalogue**: surface in Add or delete | Invisible to users; only AI inserts from it (Add E1) | — | Decision |

## 10. Components

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| K1 | **In-place master editing**: "Edit component" on an instance opens a ribbon "Editing ‹name› · N instances · Done" | Core gap (L2-022, Add D21); §E9 | Detail screen for management | P0 |
| K2 | **One "saved components" count** across Add and the Components panel | Counts disagree (L1-024, Add A30) | — | P0 |
| K3 | **Variants:** build authoring UI or hide the Variant dropdown | Shows only "Default" (Add D26) | — | Decision |
| K4 | **Master preview** works for light-on-dark components | Blank (L2-020, Add D18) | — | P1 |
| K5 | **Update result says what was dropped** (breakpoint/state overrides) | Add D14 | Toast Undo | P1 |
| K6 | **Search and filters** in the list; a message at the 100-component cap | Add D3, D30 | — | P2 |
| K7 | **"Linked from library" → "Copied from library"** until a real library exists | §E9, BK-18 | — | P1 |

## 11. AI

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| X1 | **Unified Editor/Build AI workspace (spec 10-13):** design it as new work; nothing of it is in code | Add F23 | Plan review, "Nothing changed" failure copy, Undo all | Decision |
| X2 | **One-click content actions** (rewrite, shorten, tone, grammar) on text | Not built; L5-016 DECISION (Add F21, Inspector 24) | ✦ AI chip in inspector | Decision |
| X3 | **Brand AI "Generate":** result must be keepable | Can't keep the result (FG-016, Brand 42); 🚩 dsAi | — | P1 (planned) |
| X4 | **Hand a review comment to AI** | Stub (Review R16) | — | P2 (planned) |

## 12. Assets / media

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| D1 | **Per-tile upload states:** uploading · local only + Retry · failed; placed images show "not uploaded yet" | Image loss after a failed registration (P0, Media A56); progress stalls at 75% (A13) | Pick mode, quota band | P0 |
| D2 | **Library scope: site or personal** | Library is per-user today (Media A57, BK-43) | — | Decision |
| D3 | **Bulk select visible** (not only ⋯ or right-click) | Media A1 | Hover-to-select | P1 |
| D4 | **Filter state visible** (chips, not "Filter (active)") | Media A5 | Type + folder filter | P2 |
| D5 | **Grid toolbar:** column count gets its own label | Two controls labelled "Grid" (UX-20, Media A39) | — | P2 |
| D6 | **Trash / recovery** after delete, beyond an 8s toast | Trash removed; ⌘Z doesn't undo (Media A38, A45) | Confirm + Undo | P1 |
| D7 | **Stock credit field** (attribution) and stock doors softened when no key is set | Licence obligation (Media A33, A32) | One Stock modal | P1 |
| D8 | **Auto alt text: visible + a workspace toggle** | Runs invisibly on every upload (Shell 15.5, L4-007) | Generate button | Decision (L4-007) |
| D9 | **Alt mode per placement:** use asset alt / custom / decorative | §E11 | — | P2 |

## 13. CMS

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| B1 | **One honest model of a collection**, centred empty CTA, no permanent hint column | Drawer copy promises pages, modal defaults it off; CTA in far-right column (UX-15/16, CMS B4, B5) | Back to canvas → element | P0 |
| B2 | **Create collection stepper** reflects real steps | Shows step 2 before a name is typed (UX-17, CMS B10) | Products preset | P1 |
| B3 | **Records table:** status column, row actions, bulk select/publish, record export | Thin (L3-020, CMS B14, B47) | Record sheet, CSV import | P1 |
| B4 | **Conditions** either hide on canvas or are hidden until they work; **Sources** persist or are hidden | Conditions do nothing; pasted sources vanish (CMS B33, B31, L3-018) | — | P0 · Decision (owner default: hide Sources) |
| B5 | **Dynamic pages and Settings as first-class tabs** | L3-023 (CMS B8) | Dynamic pages pane | P1 |
| B6 | **Collection list:** full query editor (filter, sort, limit, skip), empty state, draft marker | Canvas shows drafts, publish shows published (L3-017, CMS B38) | Repeater | P1 |
| B7 | **Conflict banner with a field diff**; mark local-only collections | CMS B21, B44 | Server authority | P2 |
| B8 | **Field reorder**; one field-type list | CMS B23, B27 | Field inspector | P2 |
| B9 | **Google Sheets / Airtable** | Stub; needs OAuth + security review (CMS B9) | — | Decision |

## 14. Forms

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| F1 | **Inbox spam and archive views** (or undo) | Marked items vanish (Forms C19) | Unified inbox | P1 |
| F2 | **"Configure in Inspector ›" and "Sent from"** work | Page id and source URL not saved (Forms C20, C21) | — | P1 |
| F3 | **Visitor inline error state** on the published form | Visitor leaves the page (Forms C15) | — | P2 |
| F4 | **"Applies on next publish" labels** on spam/message; owner notified at abuse cap | Forms C12, C16 | — | P2 |
| F5 | **Password field inside public forms**: hide or warn | Forms C5 | — | P2 |
| F6 | **Upload field** returns only with a real backend | Removed (Forms C6, L3-025) | — | Decision |

## 15. Brand

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| R1 | **Palette first visit:** a palette, not ~58 code-named tokens "Used by 0"; groups + search come back | UX-18 (Brand 15, 28) | Token card, colour picker, safe rename/delete | P0 |
| R2 | **Nav grouping:** 11 flat rows mixing token kinds, catalogue views and tools; the other 11 token kinds get their own entries, not a dropdown on Spacing | Brand 3, 39 (FG-018) | Deep links | P1 · Decision (FG-018) |
| R3 | **Remove draft copy** ("Save to draft", ⓘ About drafts) | Brand 18, 20 | Autosave | P0 |
| R4 | **Component styles page:** either a real style editor or a rename | Title promises styling it doesn't offer (Brand 41) | — | Decision |
| R5 | **Presets editable** (add/rename/delete; binding rows clickable) | Read-only (Brand 44) | — | P1 |
| R6 | **Styles page merged** with Fonts + Presets | Overlaps (Brand 36) | — | P2 |
| R7 | **Starters preview before apply**; no real-brand names or indigo/violet | L4-028 (Brand 51) | Restore points | P1 · Decision |
| R8 | **"From workspace" badge** on pushed tokens; usage counts include inherited impact | §E10 | — | P1 |
| R9 | **Duplicate token** | Drawn, not built (Brand 25) | — | P2 |
| R10 | **First-run card copy** "Using default tokens." | L4-029 (Brand 9) | — | P2 · Decision |
| R11 | **Live preview column width** (468 of 1440px on every page) | Brand 10 | Preview | P2 |

## 16. Site Settings

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| E1 | **SEO arc (Yoast-level):** title template, structured data, sitemap UI, page overview, search/social previews | FG-009 / L3-036 not built (Settings S32); the publish check "SEO configured" can't be cleared in the editor (Publish P3) | Per-page overrides strip | P0 (owner-planned, SEO-M1…M12 boards) |
| E2 | **Validation on touch/submit**, not on open | UX-21 (Settings S22) | — | P1 |
| E3 | **Error copy** splits server vs network | L3-035 (Settings S13) | — | P2 |
| E4 | **Password protection: tell the user** when the Vercel plan lacks it | Silently skipped (Settings S41) | Share links door | P1 |
| E5 | **Add a domain:** registrar-specific nameservers | Hard-coded (L3-033) | Domains, Manage DNS | Decision |
| E6 | **DNS CRUD** | Paused, no boards (FG-034) | — | Decision |
| E7 | **Role foot + Permissions dialog** placed deliberately; generated from the server role table | Not on the M0 board (Settings S6); §E18 | Read-only screens with reason | P1 |
| E8 | **One archive rule** (three today) | §D2 | — | P1 |
| E9 | **Footer save bar states:** Saving, conflict when another admin saved first | §E15 | Conditional footer | P2 |
| E10 | **Removed screens:** Integrations, Webhooks, analytics consent, auto-redirect by browser, grid/snap settings — confirm they stay gone | Settings S54, S55, S45, S27, S24 | — | Decision |

## 17. Publish

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| U1 | **Panel as the gate:** verdict header, server-result rows, "Your live site wasn't changed.", one-step confirm, one issue count everywhere | DR-T4 approved; §E13 | Pre-publish checks in panel; approval gate; typed unpublish | P0 |
| U2 | **Every check row has a Fix ›** | Only 5 labels do (Publish P2) | — | P1 |
| U3 | **Role-aware actions:** hide or disable-with-reason Cancel / Unpublish for non-admins | Shown to editors, server refuses (Publish P8, P12) | — | P1 |
| U4 | **"Compare" after publish opens the diff** | Only switches tab (Publish P16) | One Compare host | P2 |
| U5 | **Steps visible** ("Step 2 of 4 · Deploying") | §E13 | Failure block, log modal | P2 |
| U6 | **Preview environment** hidden until staging exists | No backend (Publish P5) | — | P2 |
| U7 | **Scheduled publish** | Stub (Publish W7) | — | Decision |
| U8 | **Topbar publish over an open panel** | L5-061 open | — | Decision |

## 18. Review and comments

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| V1 | **Review v2** (client page with element pins, threads) | FG-001/002/006 owner: v2 is the design (Review R14, Engine B34) | Send for review, rounds, approval gate, Compare with approved | P0 (owner-planned) |
| V2 | **Replies, edit/delete, @mentions** in the note composer | L5-031/032/033 (Review R8) | — | Decision |
| V3 | **Review availability:** comments without the agency review layer; a rail door | R1, B12 | Per-workspace flag | Decision |
| V4 | **Approval text names who approved and whether it was the client** | §E17 | — | P2 |
| V5 | **Pager between rounds; older rounds' comments** | Review R6 | Next › walk | P2 |

## 19. History, Compare, Time travel, recovery

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| H1 | **Restore dialog** with three copy variants and an inline differences list; shared footer with the conflict dialog | DR-T1/DR-T2 approved; "Restore my edits" overwrites newer work (BK-04) | Restore takes a safety version + Undo restore | P0 |
| H2 | **Conflict "Overwrite" saves a snapshot first**, and says so | BK-59 (Sync Y9) | Conflict modal | P1 |
| H3 | **Compare says what it covers** ("Compares element content only") until it covers names/slugs/settings/styles | §E14, BK-23 | Rendered compare | P1 |
| H4 | **Possible-damage rows in Issues** (before → after, Keep as written) | DR-T5 approved | — | P1 |
| H5 | **Search and Clear visible**, not behind ⋯ | History 104 | Session / Saves / Published tabs | P2 |
| H6 | **Time-travel points without preview**: say why | History 128 | Time-travel band | P2 |
| H7 | **Copy fix:** "Unavailable" hint names Ctrl+Z | History 121 | — | P2 |

## 20. Command palette, shortcuts, notifications

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| Q1 | **Palette opening state:** shorter, actions before navigation, larger text, legend teaches ↑↓/Enter | UX-23 (Shell 13.2, 13.9) | One palette for ⌘K and ⌘⇧P | P1 |
| Q2 | **"Scope: everything" chip**: make it a real control or remove it | Stub (Shell 13.6) | — | P2 |
| Q3 | **Insert commands** ("Add heading") in ⌘K | L1-033 DECISION (Shell 13.3) | Search-only results | Decision |
| Q4 | **Shortcut sheet** lists what's real: no footer region in F6 order; ⌃H on Mac; triple-click; Time-travel keys | Shell 14.2, 14.5; Engine A2.9 | One sheet | P2 |
| Q5 | **Notifications** list matches the bell count | Bell counts all unread, list shows five (Shell 6.3) | — | P2 |
| Q6 | **Toast stacking rule**: never over a modal, one feedback surface per action | Shell 15.1; DR-T1 | — | P1 |

## 21. Chrome UI kit (for the design system file)

| ID | Redesign | Why | Must keep | Priority |
|---|---|---|---|---|
| Z1 | **One tooltip** (three today: Tooltip, HintTooltip, HelpTooltip) | Brand-kit B1 | — | P1 |
| Z2 | **One modal API** (Modal vs ModalParts) | Brand-kit B1 | ConfirmDialog | P1 |
| Z3 | **One row family** (8 row variants, 5 unused outside the kit; Brand rolls its own) | Brand-kit B1 | Row base | P1 |
| Z4 | **TextField vs TextInput**, **Badge vs Chip**: merge | Brand-kit B1 | 3 closed wrappers | P2 |
| Z5 | **New primitives to draw:** FullPageHost, OriginLabel, SelectorField + AffectsCount, CanvasBreadcrumb, DisabledReason, PublishGate, CollectionQueryEditor, AltTextMode; BreakpointSwitcher reused on the canvas bar | §E reusable components table | — | P0 (with G1, I1, C1) |
| Z6 | **Off-system pieces to bring onto the kit:** crash screen, floating rich-text toolbar, device-frame button, trigger picker, custom attributes, animation ▶️ emoji button, box-model badge raw hex | Shell 1.13; Canvas 8.3, 2.7, 5.3; Inspector 102, 106, 103 | — | P2 |
| Z7 | **Unused shell primitives** (EditorShell, RightPanel, Rail, Footer, Drawer in the kit; SiteCard, FieldRow, Card, AvatarGroup, RangeSlider): verify and delete or adopt | Brand-kit B1 | — | P2 |
| Z8 | **Dark theme for chrome:** tokens are light only | Brand-kit B2 | Light canonical | Decision |

---

## 22. Planned features to design as live (tag `PLANNED ·`)

Owner rule (09-21): flagged features are planned, not dead.

| Feature | Where | Inventory |
|---|---|---|
| Publish flow (FEATURE_PUBLISH) | Top bar CTA, Publish panel, confirm, history | Shell 2.14, Publish P18 |
| Real-time collaboration (FEATURE_COLLAB) | Presence, connection pill, remote cursors, start session, soft locks | Shell 2.11, Canvas 15.x |
| Design-system AI (FEATURE_DS_AI) | Brand Generate, Brand from logo/URL, AI comment hand-off | Brand 42, 52; Review R16 |
| Brand tokens v2 rollout | Read-only banner while a site is not migrated | Brand 8 |

## 23. Removed since 09-16 — revive or confirm gone

Each needs a yes/no from the owner. Don't draw these unless the answer is yes.

| Removed | Was | Inventory |
|---|---|---|
| Status footer (selection readout, size, zoom) | Bottom bar | Shell 1.2 |
| Live chip, Issues chip | Top bar | Shell 2.6, 2.10 |
| Review bar under top bar | Shell | Shell 9.1 |
| Page tab context menu | Page tabs | Shell 5.3 |
| Selection toolbar: select parent, add child, copy, wrap, move, AI | Canvas | Canvas 6.15–6.17 |
| Canvas multi-select align bar | Canvas | Canvas 7.2 |
| Insert before/after/inside, layout presets, quick styles in menu | Element menu | Canvas 11.18–11.20 |
| Touch long-press drag, Watch device | Canvas | Canvas 13.5, 2.3 |
| Templates search/filters/detail panel/version drift | Templates | Pages 65, 70 |
| Layers multi-select banner | Layers | Pages 94 |
| Password-protected pages | Page settings | Pages 59 |
| 40 block cards, Row/Column presets, e-commerce blocks | Add | Add A24 |
| Component tags, variants modal, JSON export/import | Components | Add D8, D27, D28 |
| AI chat thread, draft mode | AI | Add F10, F11 |
| Media Trash | Assets | Media A38 |
| Integrations + Webhooks screens | Settings | Settings S54, S55 |
| Brand Beginner mode, drawer-era lists, Figma export | Brand | Brand 12, 28, 57 |
| Inspector scope pill (All like this / Whole site), All CSS editor, batch style panel | Inspector | Inspector 33, 112, 46 |

## 24. Engineering bugs (not design) — fix separately

Still bugs on `main`; most are fixed on the unmerged branch `feat/phase1-s6-publish`. Merge that branch before the redesign build starts, or the new UI will sit on the same defects.

- Resize ignores zoom; Esc undoes the previous edit; keyboard resize writes NaNpx (Canvas 6.4–6.6, BK-01/02/03)
- Duplicate / paste / ⌘-drag lose Tablet/Mobile and :hover styles (Canvas 13.2, 13.4, BK-06)
- ⌘Z behind full-page tools and read-only (Canvas 13.10, BK-05) — design side is G1
- "Restore my edits" overwrites newer work (BK-04) — design side is H1
- Image loss after failed asset registration (Media A56, BK-42) — design side is D1
- Site-scope authz holes in reviews, library, theme (BK-08)
- Group/Ungroup skip the lock check (Canvas 11.14)
- Tab from canvas-column controls cycles the selection (Engine A3.29, BK-28)
- Session-row restore never triggers a save (Sync Y2, BK-19)
- Media drop toast text "added ✓ added" (Canvas 12.8)

## 25. Owner decisions needed before drawing

| # | Decision | Rows | Disposition (2026-10-18) *(R-1018)* |
|---|---|---|---|
| 1 | Always-visible issue count next to Publish (L4-038) | T2 | **Decided 2026-10-18 (N4):** "{N} issues" chip left of Publish only when Blocking checks or errors exist; opens Issues (supersedes P01 Q-TB3) |
| 2 | Off-rail panels: which get a rail item | L2 | **Superseded by BD-05** (rail Add · Layers │ Assets · CMS · Brand │ Help, SC-10); Components door **decided 2026-10-18 (N1)**: "Components ›" in the Add header + Layers instance link, no rail item |
| 3 | One Desktop width (L1-013) and whether Wide stays (FG-029) | C2, C5 | **Decided by SC-22** (SC-13 + DEC-IA-04: Desktop 1440 authoring frame, Wide 1920 = Desktop preset); **decided 2026-10-18 (C1)**: keep 1440 + Fit, zoom-independent selection chrome, one-click 100% |
| 4 | Rename Behaviour → Settings (FG-020) | I4 | **Superseded by BD-08** — tab stays (Content / Style / Behavior / Effects); label spelled **Behavior** per SC-11 |
| 5 | Classes as selector field — when | I11 | **Decided 2026-10-18 (P6):** deferred to the classes arc |
| 6 | Beginner/Pro: delete or keep | I13 | **Decided 2026-10-18 (P7):** Pro everywhere; Beginner path removed |
| 7 | Which SEO score model | P1 | **Decided 2026-10-18 (N3):** one SEO score (SEO-tab model), also shown in Listings |
| 8 | "Unpublished" meaning on page rows (L3-009) | P2 | **Decided by SC-22** (SC-11 glossary: "Changes not published") |
| 9 | Re-author templates on tokens (L4-024); purple in templates | M2, M6 | **Decided 2026-10-18 (N7):** templates re-authored on Brand tokens, no purple; interim "Connect to Brand colors" offer (SC-11 spelling) |
| 10 | Removed Add blocks and e-commerce (FG-037) | A2 | **Decided 2026-10-18 (P1):** e-commerce deferred — existing product blocks render, text/images editable, "Commerce editing is planned"; other removed Add blocks → P12 |
| 11 | DS 27-component catalogue: surface or delete | A9 | **Decided 2026-10-18 (P5):** stays in code, no UI (reserved for the later AI Build tab) |
| 12 | Component variants: build or hide | K3 | **Decided 2026-10-18 (P4):** variant authoring deferred (PDB P1-D14) |
| 13 | Unified AI workspace (spec 10-13) and one-click text actions (L5-016) | X1, X2 | **Decided by SC-21** (owner 2026-10-17, recorded in SC-22): no AI UI this version; later a separate Build tab; BD-09 stays a discussion direction |
| 14 | Media library: per site or per user (BK-43); auto alt toggle (L4-007) | D2, D8 | Library scope **superseded by BD-16 / P1-D13** (personal discovery, filterable to this site; Panel 08, SC-11). Auto-alt toggle: **no recorded decision — open** |
| 15 | CMS Sources/Conditions: hide until built | B4 | **Superseded by BD-20 / BD-22** (FD-DYN-01 D13: CMS → Data keeps Sources/variables; Conditions in Inspector Content) |
| 16 | Brand token kinds as own pages (FG-018); Component styles page; starters (L4-028) | R2, R4, R7 | **Decided by SC-22** via Panel 09 (other token kinds each get a page; Component styles page removed → Add link); starters **decided 2026-10-18 (N8)** renamed generically, violet recoloured; From logo or URL ships (P3) |
| 17 | Comment threads, replies, @mentions; comments without review layer | S10, V2, V3 | **Decided by SC-22** (Panel 17 OD-R1…R7, e.g. OD-R5 replies visible only "To {client}"; BK-136) |
| 18 | Scheduled publish; topbar publish over panel (L5-061) | U7, U8 | Scheduled publish **decided 2026-10-18 (P8)**: stub removed until built. Topbar publish over an open panel (L5-061): **no recorded decision — open** |
| 19 | Chrome dark theme | Z8 | **Decided 2026-10-18 (P9):** light chrome only this version |
| 20 | Section 23 removed features: revive or confirm gone | §23 | **Decided 2026-10-18 (P12):** removed features stay gone except those the panel docs revived (Wide preset, breadcrumbs, Show in Layers, Y27) |

## Not verified

- Every row is based on a static code read of `main` and the audit documents. Nothing was walked in the live app for this list.
- Priorities are a recommendation, not owner-approved.
- The DR-T* items were approved in the 10-15 design review; everything else is a proposal.
- Figma boards were not opened for this list. Whether page `4418:45431` already draws a row's fix is unknown.
