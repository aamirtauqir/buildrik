# CROSS_SCREEN_CONSISTENCY_AUDIT

## Current rendered-design assessment — 2026-10-20

The [independent B10 review](../evidence/figma-design-execution/b10-reviewer-20261020.md) assesses each of CS01–CS23 against current named screens and native routes. It distinguishes corrected role/origin/type/count/recovery continuity from incomplete all-consumer checks and unrun keyboard/motion/runtime. The documentation audit below retains its original provenance; “no hi-fi exists” is historical. No blanket consistency pass follows from the new frame inventory.

Date 2026-10-18 · Mode AUDIT · Object: the written specs of all 31 screens (no hi-fi exists, so visual consistency of rendered screens is **NOT RUN**). Includes Audit C (design-system compliance).

## 1. Consolidated consistency violations

Each row is one contradiction that recurs across screens. Fixing the row fixes every listed instance.

| ID | Topic | Instances | Severity | Resolution (design-level; no new capability) | Owner decision? |
|---|---|---|---|---|---|
| CS-01 | **Confirm vs Undo (SC-15)** | Duplicate site, Delete site, Archive (P01/P10); locale add/remove, redirect delete, slug change, set primary (P10); Update from selection, Detach (all), duplicate-name "create anyway?" (P13); Replace page, create (P15); republish (P14); Reload latest, Overwrite (P22); Remove protection, active-set save (P23); column reduction, component Reset/Detach (FD-INS); submission delete (Forms). *(Not counted — SC-15 already allows them: RecoveryBanner discard of a kept copy, lossy CMS field-type conversion.)* | Major | Split SC-15 into three classes and list every action once: **(a) Undo only** — archive, locale remove, redirect delete, detach, update from selection, set primary; **(b) consequence confirm** (affects live site or other people, explain then act) — replace page, republish, reload latest, overwrite, remove protection, slug change, column reduction; **(c) typed confirm** — delete site (with 30-day restore line), unpublish, transfer, permanent delete. Duplicate-name → inline warning, no dialog. Then delete the "any other confirm is overridden" sentence and fix panel text | Yes — class (b) list |
| CS-02 | **Leave-with-unsaved guard** | P02 Keep editing / Leave and lose changes; P10 Keep editing / Discard / Save and continue; P01 Stay / Leave anyway / Save & leave; P12 Keep / Discard | Major | One dialog (DS §3): Keep editing · Discard changes · Save and leave (only where an explicit Save exists) | No |
| CS-03 | **Header heights and type** | 44 drawer · 48 task · 56 area · 72 inspector; DESIGN.md 11/500 caps vs 14/600; code 14/500 | Major | Header ladder L1 56/20-600, L2 48 or 44/14-600, L3 32/12-600 (DS §2.3) | No |
| CS-04 | **Override & reset wording** | SC-13 "Reset to {parent breakpoint}" + 5 markers; FD-INS "Remove Mobile override" + one scope summary | Major | FD-INS model: section count + field dot + source line; label names the removed layer | No |
| CS-05 | **Same surface, two sizes** | GEO-01 (approved) already chose rail 56, drawer 284, nav 240, task 360, footer 48, toolbar 44; DESIGN.md and tokens still say 60/280/256/300/44/36 | Major | **Drift, not an open choice:** regenerate tokens via Figma and update DESIGN.md §Layout (DS §2.6) | No (GEO-01 approved) |
| CS-06 | **Row heights** | 28/32/36/40/48/52/56/64; Pages 32 as a resource list; DESIGN "never 40" | Major | Five heights (DS §2.7); Pages 40 | Yes (40 px) |
| CS-07 | **Targets below minimum** | ⋯ 28, Exit 28h, review pill 24h, page tabs 24h, row actions 24, Play 24 | Major | 32 default; 24 in-row with 8 spacing | No |
| CS-08 | **Notices near the topbar** | P22 banner slot; P16 pill corner; P23 "notice under the topbar"; P21 banner | Major | All through P22 slot with a priority entry | No |
| CS-09 | **Toast rules** | P22 ≤1 transient + ≤2 persistent, bottom-right, no own live region; P16 achievement toast 6 s bottom-left with own `role=status` | Major | Achievement = persistent-class toast in P22 stack | No |
| CS-10 | **Offline wording and announcement** | P15 apply works offline vs P22 disables; P21 assertive vs P22 polite; refusal sentences differ | Major | P22 owns offline; "Needs a connection"; one polite announcement | No |
| CS-11 | **Role-refusal wording** | "{Area} needs Editor access" vs P14/P15/P22 variants | Minor | One sentence pattern (DS §3) | No |
| CS-12 | **Save vocabulary** | Record saving… / Uploading · Waiting to sync / Saving · Saved to site / "Saved directly" | Major | Five states (DS §3) | No |
| CS-13 | **Delete toast copy** | "{X} deleted · Undo · Recently deleted ›" vs CMS "Deleted — Restore" vs Assets "grace Undo" (unspecified) | Minor | One template | No |
| CS-14 | **Nouns** | Text style / Size preset / Font-size token / Type styles; master / definition / main component; Colour/Color; workspace (area vs org); "Library" tag; Library vs This site scope | Major | SC-11 picks one each: **Font-size token**, **main component**, US English, **Area** for areas, Workspace = organisation; scopes per T3-1 | No (SC-11 already says US English) |
| CS-15 | **"Not built yet" label** | Planned / Coming soon / Soon | Minor | "Planned" only | No |
| CS-16 | **Context menus** | Canvas generic, Layers with extras, Inspector ⋯; viewport clamp defined for some | Major | One group order for all SC-3 surfaces; canvas type-context group; clamp viewport−16 everywhere | No |
| CS-17 | **Search behaviour** | Esc clear→blur (Add) vs no-op (Layers); Settings search replaces nav; Recently deleted has no search | Minor | SC-2 everywhere; search in long lists (Recently deleted, active set) | No |
| CS-18 | **Bulk patterns** | Pages, CMS, Assets bulk bars; Recently deleted bulk restore; active-set checklist | Minor | One bulk bar (count · actions · Clear) reused | No |
| CS-19 | **Motion** | 300/600 ms, 120 ms fade, pulse; no reduced-motion rule in 01–13 | Minor | DS §2.10 only | No |
| CS-20 | **Accent overuse on canvas** | Drop-here pill, CMS badge, W×H pill, reorder grip in accent | Minor | DS §2.11 | No |
| CS-21 | **AI remnants** | PDB/HANDOFF IA tree, P12 T-RT-09, P23 benefit rows, P09 "From logo or URL" | Major | Annotate inactive / exclude AI keys while SC-21 holds | Brand-from-URL: yes |
| CS-22 | **Emoji in specs** | 🖥/📱 segments, 🗄 bindings chip, ✦, 💬 | Minor | Lucide icons only | No |
| CS-23 | **Status labels in docs** | DESIGN READY (PDB, HANDOFF) vs SPEC COMPLETE | Major | Relabel | No |

## 2. Audit C — design-system compliance by screen (spec level)

✓ complies with DESIGN_SYSTEM_SPECIFICATION · ✗ deviation (CS-ID) · — not stated.

| Screen | Geometry | Header | Rows | Targets | Type | Motion | Copy patterns | Deviation count |
|---|---|---|---|---|---|---|---|---|
| P01 Topbar | ✓ | ✓ | — | ✗ CS-07 | — | ✗ "✓ Published" 2 s ok; no RM | ✗ CS-01, CS-15 | 3 |
| P02 Rail | ✓ 56 (token drift only, CS-05) | — | ✓ | ✓ | ✓ 11/500 micro | — | ✗ CS-02 | 1 |
| P03 Add | ✓ | ✗ CS-03 (44) | ✓ 32 | ✓ | — | ✗ 300/600 no RM | ✗ CS-14 Library | 3 |
| P04 Layers | ✓ | ✗ CS-03 | ✓ 28/32 | ✗ CS-07 | — | ✗ 600 auto-expand no RM | ✗ CS-14 master, CS-17 | 4 |
| P05 Canvas | ~ 1440 frame | ✓ 44 toolbar | — | ✓ | — | — | ✗ CS-16, CS-20, CS-22 | 3 |
| P06 Inspector | ✓ 300 | — | ✗ no anatomy | ✗ 16 spots (exception undocumented) | ✗ tabs 12 ok; noun drift | — | ✗ CS-04, CS-14 | 4 |
| P07 CMS | ✓ | ✓ 56 | ✓ 40 (OWNER) | — | — | — | ✗ CS-12, CS-13, CS-14, CS-15 | 4 |
| P08 Assets | ✓ | ✓ | ✓ 40 | — | — | — | ✗ CS-12, CS-14 | 2 |
| P09 Brand | ✗ preview width twice | ✓ | ✓ | — | — | — | ✗ CS-14 Colours, CS-21 | 3 |
| P10 Settings | ✓ (as-built 256/112/44 to change) | ✓ | — | — | ✗ 20/28 title vs DS 20/30 (DS-OD-9) | — | ✗ CS-01, CS-02, CS-15 | 4 |
| P11 Pages | ✓ | ✓ | ✗ CS-06 (32) | ✗ CS-07 tabs 24 | — | — | ✓ | 2 |
| P12 Task host | ✓ 360 | ✓ 48 | — | — | — | — | ✗ CS-02, RT-13 label, CS-21 | 3 |
| P13 Components | ✓ | ✓ | ✓ 40 | — | — | — | ✗ CS-01, CS-14 | 2 |
| P14 Publish | ✓ | ✓ | ✓ | ✓ | — | ✓ progress | ✗ CS-01 republish | 1 |
| P15 Templates | ✓ | ✓ | ✓ cards 226 | — | — | — | ✗ CS-01, CS-10 | 2 |
| P16 First run | — | — | ✓ | ✓ | — | ✗ pulse (CS-19) | ✗ CS-08, CS-09 | 3 |
| P17 Client review | ✓ external | ✓ | ✓ | ✓ ≥44 phone | — | — | ✓ | 0 |
| P18 ⌘K / Help | ✓ 640/720/240 | ✓ | ✓ 32 | ✓ | — | ✗ 120 ms fade | ✓ | 1 |
| P19 Interactions | ✓ | ✓ | ✓ 32 | ✗ Play 24 | — | ✓ RM in output | — | 1 |
| P21 Collaboration | ✗ popover 320 | — | ✓ 40 | — | — | — | ✗ CS-08, CS-10 | 3 |
| P22 Global states | ✓ | ✓ | — | ✓ | ✓ 16/600 card | ✓ | ✗ CS-01 (reload/overwrite) | 1 |
| P23 Plans | ✓ 480 | — | ✓ 32 | — | — | — | ✗ CS-01, CS-08, CS-21 | 3 |
| P24 Undo | ✓ | ✓ | ✓ 32 | — | — | — | ✗ CS-17 (no search) | 1 |

Result: **22 of 23 specified screens deviate** from the shared system in at least one dimension; 0 deviations only in P17. Export cannot be assessed (no spec). Forms is a **partial** spec (P10 inbox, Unspam/Unarchive, "Configure in Inspector"; build and visitor states missing) and was not scored. Intentional exceptions accepted: client review page scale (external, phone targets); box-model 16 px spots (owner exception — must be documented with its keyboard path).

## 3. Shared-pattern matrix — panels 01–13

Legend: ✓ consistent with SC/peers · **Δ** divergence (see note) · — not applicable / not specified.

| Pattern | 01 Topbar | 02 Rail | 03 Add | 04 Layers | 05 Canvas | 06 Insp. | 07 CMS | 08 Assets | 09 Brand | 10 Settings | 11 Pages/Bottom | 12 Task host | 13 Components |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Panel header height | 56 bar | — | **Δ 44** | **Δ 44** | toolbar 44 | INS-D01 slots | 56 (collection) | 56 (SC-1) | 56 | 56 | manager 56 | **Δ 48** | 56 (SC-1) |
| Back control | Preview "‹ Back to {origin}" ✓ | — | "‹ Back to Add" ✓ | — | return chip SC-7 ✓ | "‹ Back to Heading/Style" ✓ | SC-1 ✓ | SC-1 ✓ | SC-1 ✓ | SC-1 ✓ | "‹ Back to Pages" ✓ | "‹ Back to Inspector" (conditional) ✓; RT-13 "‹ Activity" legacy | sketch "‹ Back to Add / Editor" ✓ |
| Search field | — | — | sticky 32, `/`, Esc clear→blur ✓ | sticky 32, Esc clear→**no-op Δ** | — | — | Search + filters | `/` focus, server search ✓ | — | search mode combobox **Δ** (replaces nav) | names + slugs | — | name search |
| List row height | — | 52 item | 32 | 32 (28 compact) | — | bound row 48 | 40 | 40 / grid | 40 token | — | **Δ 32** (pages are "resource lists", 03 §8 says 40) | — | 40 |
| Tree row | — | — | — | indent 16, cap 4 | — | — | — | folders (unspecified) | — | — | tree + folders (indent unspecified) **Δ** | — | — |
| Empty state | — | — | copy + action ✓ | "No layers yet" + Add ✓ | → Panel 16 | — | copy + action ✓ | copy + drop zone + Stock ✓ | "No brand set." + Starters ✓ | — | one-page note | existing per task | per section ✓ |
| Loading | role-loading rule | role loading | "Open a page first" | skeleton ✓ | skeleton ✓ | base | **Δ missing** | skeleton (not restated) | **Δ missing** | footer "Loading" | skeletons ✓ | boundary for all ✓ | skeleton ✓ |
| Error | "Status unavailable" ✓ | area shows own retry | "Couldn't load … — Retry" ✓ | boundary + Retry ✓ | render error NEW ✓ | — | "Couldn't save — Retry" ✓ | "Search failed — Retry" ✓ | panel error + Retry ✓ | "Couldn't save — Retry" ✓ | "Pages unavailable — Retry" ✓ | boundary + Retry ✓ | "Couldn't load … — Retry" ✓ |
| Confirm dialog | exit 3-way; **Duplicate site confirm Δ** (not in SC-15) | guard 2-way | — | none (Delete Undo) ✓ | restore confirm (TT) | Unbind = explicit, no confirm ✓ | E-1/E-2/E-3 ✓; permanent delete **typed Δ** | E-4 ✓ | none ✓ | domain/transfer ✓; **locale add/remove confirm Δ** | page delete no confirm ✓ | History restore / Unpublish modal ✓ | **Update-from-selection confirm Δ**, **dup-name "create anyway?" Δ**, permanent delete **non-typed Δ** |
| Destructive undo toast copy | — | — | "{X} added … Undo" | "N elements deleted · Undo" ✓ | SC-3 | — | **Δ "Deleted — Restore"** | "grace Undo" (copy unspecified) | — | "Redirect deleted — Undo" | "About deleted · Undo · Recently deleted ›" | "Issue fixed" + Undo | "{name} deleted · Undo · Recently deleted ›" |
| Context menu | ⋯ site menu (grouping Δ) | — | header ⋯ only | SC-3 + **extras Δ** | CV-16 **not recomposed Δ** | header ⋯ SC-3 ✓ | row menu (Delete) | specific | card menu | — | row menu specific | task ⋯ | row ⋯ + detail ⋯ |
| Bulk bar | — | — | — | footer select mode | multi toolbar **Δ** (SC-17 missing) | Mixed (SC-17) | Bulk publish/unpublish/delete + report | "Select assets…" Move/Tag/Delete | — | — | bulk bar ✓ | — | — (no bulk) |
| Footer actions | — | — | — | footer 32 (status) | — | — | record Save/Cancel | footer 32 (quota) | — | **48 Discard / Save settings** | manager 48; dialog Cancel/Save | 48 only with actions | — |
| Tabs | — | — | — | — | — | 4 tabs (locked) | 4 workspace tabs | detail tabs 3 | none (nav) | none (nav) | page settings 3 tabs | History views 3 | — |
| Surface type | bar | bar | left panel | left panel | canvas | right column | area | area + left picker + dialog | area | area | bar + sheet + dialog | right task / tray / sheet | area |
| Save model | — | — | transaction | transaction | transaction | live commit | **explicit** record Save | upload receipt | **autosave** | **staged explicit** + immediate | page autosave; page settings explicit | per task | explicit actions |
| Dirty-guard copy | Stay / Leave anyway / Save & leave | Keep editing / Leave and lose changes | — | — | — | — | → 02 | — | none (autosave) | Keep editing / Discard / Save and continue | → one guard contract | Keep / Discard | — |
| "Not yet" feature label | "Planned" | — | — | — | — | — | "Planned" | — | — | **"Planned" + "Coming soon" Δ** | — | — | — |
| Same concept naming | — | "workspace" ×33 (SC-11 says Area) | "Library" tag **Δ** | "master" ×3 **Δ** | — | — | "workspace" | "library" alone **Δ** | "Colours/Colors" mixed **Δ** | "workspace" (org sense ✓) | ✓ SC-11 | — | "master" ×13, "Library · v4" **Δ** |
| Width model | 56h | 56w | 284/260–360 | 284/260–360 | flex, 1440 frame | 300 fixed (overlay 312) | 240 + 320 | 240 + 320 / 284 / 720 | 240 + 468 | 240 + 960/720 | 32h / 560–720 | 360 (320–420) | 240 + 320 |

---

## 4. Shared-pattern matrix — panels 14–25

Legend: ✓ specified and consistent with 00 · ≠ divergence (see note) · — not applicable · ? not specified.

| Pattern | 14 | 15 | 16 | 17 | 18 | 19 | 21 | 22 | 23 | 24 | 25 | Divergence notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Panel header | ✓ task 48 + "‹ Back to Inspector" + ✕ + ⋯ | ✓ area 56, SC-1 back | — | ✓ task 48 (client page 56/48) | ≠ palette input 48 / sheet 56 | ✓ Inspector drill "‹ Back to Interactions" | ≠ popover title + ✕ | ≠ card title 16/600 | ? dialog title only | ✓ subview back "‹ Back to Pages" | — | Host-specific sizes are justified. 14 §4.1 mock omits the ⋯ its text names |
| Search | — | ✓ search + Esc clear/blur (added to SC-2) | — | — | ✓ palette; sheet search | — | — | — | ? (active set) | ? (Recently deleted none) | — | Recently deleted and the active-set screen have no search for long lists |
| List row | ✓ check row + Fix › | ✓ card 226 | ✓ step row | ✓ rows 32 / 48 | ✓ 32 | ✓ 32 | ≠ 40 | — | ✓ chip row 32 | ✓ 32 | — | People rows 40 vs 32 elsewhere (two-line content; acceptable) |
| Empty | ✓ "No changes since v12" | ✓ no match / Saved | ✓ (subject) | ✓ never-sent, "Check back here" | ✓ first use / no results | ✓ collapsed section | ✓ solo = no cluster | — | — | ✓ "Nothing deleted in the last 30 days" | — | Consistent sentence style |
| Loading | ✓ skeleton rows "Checking…" | ✓ skeleton grid | ✓ nothing counts | ✓ "Checking your access…" | ✓ "Loading…" (no flash <300 ms) | ? none | ✓ "Finding people…" | ✓ shell skeleton "Opening {site}…" | ✓ unknown = unlocked-pending | ✓ skeleton rows | — | 19 has no loading state. 23's unknown-plan rule cites an outdated unknown-role precedent (D3-25) |
| Error banner | ✓ gate banner above Checks | ✓ inline "Couldn't load saved templates — Retry" | — | ✓ "Couldn't load this review round" | ✓ group line + Retry | ≠ inline row line only | ✓ "Couldn't load people — Retry" | ✓ global slot (owner) | ≠ trial notice under topbar outside 22's slot list | ✓ "Couldn't load deleted pages — Retry" | — | 23 and 21 add topbar-level banners missing from 22's priority list (D3-4, D3-21) |
| Confirm dialog | ≠ republish confirm; ✓ unpublish typed | ≠ Replace confirm; create confirm until T-4 | ✓ none | ✓ revoke (SC-15) | ✓ E-5 only | ✓ none | ≠ typing "Wait / Edit anyway" (advisory) | ≠ Reload latest + Overwrite confirm | ≠ remove-protection confirm; active-set save confirm | ✓ permanent delete only | — | SC-15 says "any other confirm is overridden"; 14, 15, 22, 23 keep confirms not in its list (D3-6) |
| Destructive / undo toast | — | ✓ ≥8 s, pause | ≠ achievement toast 6 s, stacked above Undo toasts | ✓ resolve Undo | ✓ "History cleared · Undo" | ✓ | ✓ "changed Padding after you · Undo" | ✓ rule owner (≤1 transient) | — | ✓ disabled Undo once superseded | — | 16 stacking and live region vs 22 §5.10 (D3-3) |
| Context menu | ✓ header ⋯ | ✓ card ⋯, header ⋯ | — | ✓ task ⋯ | — | ✓ editor ⋯ | — | — | — | ✓ row ⋯ | — | Labels draw from local actions; no SC-3 element menu involved |
| Bulk bar | — | — | — | — | — | — | — | — | ≠ checkbox list (active set) | ✓ multi-select bulk Restore | — | Bulk patterns in Pages/CMS (11/07) not referenced by 24 §4.8 or 23 §5.5a |
| Footer actions | ✓ 48 + reason line | ≠ actions in preview header | — | ≠ composer + "Send Round" 2-row footer | ✓ hint footer 32 | — | — | ✓ dialog footers | ✓ dialog Not now / Choose Pro | — | — | 17 two-row footer vs Panel 12 "footer 48" (D3-27) |
| Tabs / segmented | — | ✓ Show filter (radio), devices radiogroup | — | ✓ Client/Team/All, Team only/To client, devices | ✓ platform toggle | ✓ Repeat/When radios | — | — | — | — | — | — |
| Host type | right task | area | canvas overlay + pill | right task + external page | modal (no dim) + sheet + popover | Inspector section | topbar popover + canvas | global slot / card / dialog | menu header + dialog + dashboard page | sheet subview | dashboard row | Consistent with IA-01 |
| Save model | job + flush first | document (normal queue) | server per user (F-2) | server per action | Recent localStorage → per user+site | document, commit on blur | presence ephemeral; save unchanged | SC-4 status | server (webhook only) | stack / server | server | Consistent |
| Naming (SC-11) | ✓ "release" | ✓ "Page template" | ✓ "Getting started", "section" | ✓ "Round n" | ✓ SC-11 nouns, no "Open" prefix | ✓ | ✓ area names | ✓ "Site" not project | ✓ Free/Pro/Business | ✓ | ≠ owner "12 Review" | Role-refusal and offline wordings diverge across panels (D3-16, D3-17) |

**Divergences from 00-SHARED-CONTRACTS:** SC-15 confirm list (D3-6); SC-6 reason wording "{Area} needs Editor access" vs 14/15/22 variants (D3-16); SC-21 hidden list vs 12 T-RT-09 and 23 §4.5 (D3-7, D3-9); SC-20/SC-18 ⋯ menu header has two occupants (D3-5); SC-5 banner slot vs extra banners in 21 and 23 (D3-4, D3-21).

---

## 5. Consistency notes from every extraction pass (raw)

### D1-core-docs

| Function | Pattern A | Pattern B | Note |
|---|---|---|---|
| Area naming | "module workspace" / `moduleWorkspace` / "resource workspace" (PDB:235, HANDOFF:72, :106) | "Area" (00:220 — "workspace" reserved for organization) | Glossary wins; brief/annex not updated |
| Collection page noun | "template page", "Blog template", "Create template page" (DYN:6, :230, PDB:224) | "Collection page" (00:216; P/07:105) | DYN keeps old wording deliberately |
| Component noun | "master", "definition" (PDB:155, :429ff; REPORT M23) | "main component" (00:207–208; P/13) | |
| Back labels | "Back to Editor · [page]", "Back to Inspector" (PDB:344, :868; REPORT:137) | "‹ Back to {origin}" single pattern (00:17) | SC-1 wins |
| Inspector width | 300 fixed (PDB:737) | 320 adj. 300–400 (REPORT:136); 336 (ARCH:45) | historical docs |
| Rail / drawer width | 56 / 284 (HANDOFF:100–101) | 60 / 280 tokens (DYN:39; BATCH-01A:35; IMPROVEMENT-PLAN:141; REPORT:839) | HANDOFF:95 routes change through token pipeline |
| Status vocabulary | DESIGN READY (PDB, HANDOFF) | SPEC COMPLETE / VERIFIED (00:281; panels; DYN) | D1-1 |
| Delete confirmation | page delete "impact handling" (PDB:879); REPORT C1:156 "name … recovery" | Undo-only + Recently deleted; confirm only E-1…E-5 (00:273–276) | SC-15 wins |
| Esc | "closes innermost popup → surface → selection" (REPORT:128; PDB:906) | ladder ending in canvas "select parent" (00:19–37) | SC-2 wins |
| Preview desktop width | 1320 labelled (REPORT:402) | 1440 (00:99; DEC-IA-04) | |
| Undo eligibility | global ⌘Z (REPORT:231) | Editor/Brand only; elsewhere "Open Editor to undo" (PDB:803; 00:184) | consistent between PDB and 00 |
| Minimum supported size | 1280×720 lowest (RL:41) | test 1024×768…1440×600; overlays below 1024 (HANDOFF:116) | |
| Settings save labels | "Done" for Page settings (REPORT:247) | footer Save/Cancel (00:154; RL P3) | |
| Persona | solo designer (PDB:47; 00-STRATEGY:10) | roles list (HANDOFF:9); "designer/freelancer" (DYN:15; REPORT:3) | D1-5 |
| Decision-ID prefixes | RL G/T/L/C/S/I/Y/P/M/A/K/X/D/B/F/R/E/U/V/H/Q/Z | panel IDs with hyphen (U-1, K-1, T-1, R-1) and BK-nnn | D1-16 collisions |

### D2-panels-00-13

- **Headers:** four heights for the same "surface header" role. 44 (Add, Layers, canvas toolbar), 48 (right task), 56 (areas, Pages manager, Brand, topbar). No SC row reconciles them (01 §8, 03 §8, 04 §10, 12 §4.2, SC-1).
- **Back labels:** SC-1 "‹ Back to {origin}" holds everywhere. Remnants: 12 RT-13 "‹ Activity" (as-built row), 13 sketch "Back to Add / Editor" (illustrative).
- **Esc:** Areas 07/08/09/10/13 all adopt "topmost layer, else no-op". The search-field step diverges (D2-3). 07 record subview Esc = Cancel with guard; 08 picker Esc = cancel. Both are consistent with SC-2 step 3.
- **Menus:** Only 04 and 06 draw explicitly from SC-3. 05 still lists CV-16. 01/03/07/08/09/11/13 have domain menus outside the registry (expected), with no shared ordering rule (destructive last, separators).
- **Confirmations:** SC-15 whitelist vs five retained confirms (D2-8). Permanent-delete confirm type differs (D2-9).
- **Undo / recovery:** Document Undo: 05, 09 (shared stack). Live recovery toast: 07, 08, 11, 13. No document undo: 10 (OD-U2). Toast copy and the "Restore" vs "Undo" verb differ (D2-10). Recently deleted has three placements: nav entry (08, 13), ⋯ subview (11), records filter (07, D2-31).
- **Empty / loading / error:** "Couldn't … — Retry" error copy is consistent. Loading is missing in 07/09. Empty-state actions are consistent (copy + one action).
- **Save model:** Autosave (Brand, pages) vs explicit (CMS record "Save record", Site settings "Save settings", Page settings "Save"). The primary-button labels are not uniform ("Save record" / "Save settings" / "Save"), and the footer heights match (48) only in 10/11.
- **Dirty-guard dialogs:** Four copy variants (D2-28).
- **Shortcuts:** SC-12 applied in 01/02/05/11/12 (H, ⇧1, ⇧R, ⌥B). 04 ⇧L ✓. Lock ⌘⇧L is not mentioned in 04/05.
- **Widths:** Areas share 240 nav + 320 detail. Left tools 284/260–360. Right column 300 (Inspector) vs 360 (task) with a pinned-300 hidden Inspector (12 §4.1). Dialogs 720/480/960 (08, 13), 640 (10), 720 max (11 page settings).
- **Viewer treatment:** "disabled with reason" (01, 02, 11) vs "hidden" (04 structural menu items, 12 AI/Issues). SC-6 allows both, but there is no rule for when to hide and when to disable.
- **Naming:** "workspace", "master", "library", "Colours" and "Planned/Coming soon" all drift from SC-11 (D2-22…D2-26).

### D3-panels-14-25

- **Panel headers:** right tasks (14, 17) use header 48 + "‹ Back to Inspector" (only when the Inspector was visible) + ⋯ + ✕, per SC-1/RT. Areas (15) use 56 with the SC-1 back slot. Recently deleted (24) uses a subview back. Consistent with SC-1; 14 §4.1's mock omits the ⋯.
- **Menus:** header ⋯ menus carry area-level, rarely used actions (14 All releases/Unpublish, 15 Reload, 17 Re-send/Revoke). Item ⋯ menus carry item actions (15 Saved card, 19 interaction, 24 row). No panel in 14–25 redefines the SC-3 element registry; 19 extends it (Add interaction in Inspector ⋯) via the SC-10 row.
- **Modals and dialogs:** widths are 480 (question, 22/23), 720 (review/conflict/bounded, 14/15/18/22) and 640 (palette, no dim). Every Esc follows SC-2, except declared ones (Play running, prompt fields inactive).
- **Empty / loading / error:** sentence style is uniform ("Couldn't {x} — Retry"). Loading has three forms: skeleton (14, 15, 24), text (17 "Checking your access…", 21 "Finding people…", 18 "Loading…"), and permissive-unknown (23). 19 has none.
- **Confirmations:** see D3-6 — 5 panels keep confirms outside SC-15's closed list.
- **Undo:** the toast Undo ≥8 s rule and "disabled once superseded" (24 §4.4) are referenced by 15, 16, 19. 16's achievement toast at 6 s is not a recovery toast, so it is exempt, but its stacking conflicts with 22.
- **Shortcuts:** no panel in 14–25 adds a key except 18 (`/`, ⌘K scope) and 17 (client-page-local C). 14, 19, 21, 24 state "no new shortcuts". All refer to SC-12 for platform mapping.
- **Widths:** 360 tasks (14, 17), 240 local nav/popover (15, 18), 300 Inspector (19), 320 People (21), 360 "N more" (22). No conflicts found.
- **Naming:** SC-11 nouns are applied (release, Page template, Getting started, Round n, Free/Pro/Business). Remaining drift: role-reason and offline-reason sentences (D3-16, D3-17); "Recently deleted" is consistent in 14–25.
- **Status labels:** all 11 active panels use "SPEC COMPLETE … not VERIFIED" per SC-16; none uses the retired "DESIGN READY". 15 is the one panel whose label omits a ⛔ dependency that applies to it (D3-18).
- **AI deferral:** cleanly stated in 20 §0 and SC-21, and in the per-panel headers (01, 02, 03, 05, 09, 11, 12, 13, 16, 18, 22, 24, 25). The remaining leaks are 12 T-RT-09 (Major), 23 §4.5 benefit generation rule (Major), 12 milestone banner (UNKNOWN), plus Minor items L4–L8.

### T1-shell

| Topic | Variants found | Evidence |
|---|---|---|
| Leave/discard confirmations | "Keep editing / Leave and lose changes" · "Keep editing / Discard / Save and continue" · "Stay / Leave anyway / Save & leave" · "Leave — changes stay in this browser only" · "Discard prompt? Keep / Discard" · "Discard your reply? Keep / Discard" | P02 §7 · P10 §5 · P01 §7.1 · P22 §5.3 · P12 §4.3 · P17 §4.3 |
| Back labels | SC-1 one pattern "‹ Back to {origin}". Exceptions still in text: "‹ Back to editing" (owner view mode, P01 §5.1), "‹ Activity" (P12 RT-13 today → "‹ Back to Activity" §5) | SC-1 · P01 · P12 |
| Confirm vs Undo | SC-15 Undo-first. Panel confirms outside the list: Duplicate site (P01 §6), Delete site (P10). Checklist hide uses Undo (P16 §5.3), consistent | SC-15 |
| Disabled vs toast refusal | SC-6/SC-18 disabled-with-reason everywhere. The create-component no-selection toast (P13 CP-03, kept) and the old viewer rail toast (fixed in P02) are exceptions | P13 · P02 §11 |
| Toast durations | 5 s default / Undo ≥8 s (P22 §5.10) · achievement 6 s (P16 §4.4) · "Can't undo … from here" 4 s (P24 UN-09) · "✓ Published" 2 s (button state) | — |
| Status vocabulary | SC-4 / P11 "Saved {time}", "Offline — not saved" vs MS IAF-22 E "Saved at…", "Offline—local changes" | T1-22 |
| Live state glyphs | P01 dot (green / grey / amber / hollow) vs P14 glyph (● / ◐ / ○). Both use "Changes not published" (SC-11) | P01 §11 · P14 §8 |
| Popover/dialog widths | 360 bell / status details / task / "N more"; 240 Help popover; 640 palette; 720 sheet / publish dialog / conflict / page settings; 480 full-screen card / Upgrade / question dialog. Consistent family | P01 · P11 · P12 · P18 · P22 · P23 |
| Retry copy case | "Try Again" (SidebarFallbacks, flagged P22 §13 #9) vs "Try again" everywhere else | P22 §13 |
| Shortcut notation | ⌘H removed (SC-12), and P01/P12 amended. Site settings ⌃, vs ⌘, still mixed (T1-10). ⌘\ undocumented (T1-11) | SC-12 |
| Send for review surface | INV "popover" vs P17 §5.1 "dialog" | INV 9.2 · P17 §5.1 |

### T2-canvas

| Function | Pattern A | Pattern B | Note |
|---|---|---|---|
| Element menu structure | Canvas: grouped submenus Arrange › Style › Structure › (P05 CV-16) | Layers: flat list (P04 §7); SC-3: unordered table | Same registry, three structures. No canonical order |
| Disabled reason | Palette rows show the reason (SC-18, P18 K-2); topbar aria-disabled + tooltip (P01) | Add rows: subtitle reason (P03 §5); canvas menu: unspecified | Four patterns, one missing |
| Menu/popover clamp | Layers menu clamps (P04 §10); Review popovers −16 (P17 §8); status popover −24 (P11) | Canvas menu: none | Three margins, one gap |
| Delete confirmation | SC-3 / P24: never confirm | INV 7.4 confirm; REG Keep | Docs consistent; register stale |
| Lock copy | SC-14: "Locked — unlock to edit" | INV 6.12 tooltip / 6.20 toast (two old copies) | Resolved by SC-14 |
| Parent selection | Esc → parent (SC-2), ← key (CV-21), breadcrumbs (P05 §5) | INV: ← key, Layers | Three doors, consistent |
| Shortcuts | SC-12 remaps (⇧1/⇧2/⇧0, ⇧R, ⌥B, ⌥X, ⌘⌥]/[) used in P05 §5 | P05 §2 "Today" keeps the old keys (correct as as-is) | Consistent |
| Width / Wide | SC-13: Wide = Desktop preset | IAF-02 F: lists "Wide 1920" with Tablet/Mobile as authoring widths | Wording drift only |
| Undo label | P05 §5: "Undo {last action}" | P24 §3 problem 6: labels are machine words ("style-batch") | P05 depends on unshipped labelling |
| Skeleton | P05 §8: existing canvas skeleton | P22: one shell skeleton | See T2-27 |
| Term | SC-11: "Section" (not "block") | SC-3 / P05: "Replace with block…"; P16: "Add a section" | Label drift in the registry |
| Multi-select toolbar | SC-17: Duplicate · Delete · Group · More | P05: single only | See T2-1 |
| Remote vs own selection colour | P21 §4.2: person's tone, own blue wins on overlap | DESIGN.md: accent for selection | Consistent |

### T3-pages-add

| Topic | Pattern drift |
|---|---|
| No-results | Add "Nothing matches '{q}'." + Clear search (P03 §6.1) · Layers "No matching layers" + Clear + Search everywhere (P04 LY-05) · Pages "No pages match your search." + Search everywhere only (INV #8; P11 silent) · Templates "No templates match '{q}' — Clear search" (P15 §6) · Components: search is NEW (P13 §4), no-match state unspecified |
| Empty states | Layers P04 §11 vs P16 §4.6 differ (T3-3); Pages empty not restated |
| Header heights | Add/Layers 44 (P03 §8, P04 §10) · task host 48 (P12 §4.2) · Pages manager sheet 56 (P11 §5) · areas 56 (SC-1, P13, P15). A temporary sheet uses area height |
| Row heights | Add 32 · Layers 32 (28 compact) · Pages manager 32 · Components list 40 · Recently deleted 32 · GEO-01 note: resource lists 40 (T3-10) |
| Confirm vs Undo | Pages / Layers / Components delete → Undo (SC-15) · Templates Replace, Components Update-from-selection / Detach all → confirm (T3-2) · Clear undo history → confirm until K-8 (E-5) · Saves version delete → neither (T3-6) |
| Recently deleted entry | Pages: manager header ⋯ menu · Components: persistent nav footer (P24 §4.8) — same feature, different discoverability |
| Back labels | SC-1 "‹ Back to {origin}" in P11, P13, P15 · P15 preview "‹ Back to templates" (lower-case noun vs area "Templates") · INV "‹ Activity" → P12 "‹ Back to Activity" |
| Select mode | Pages: ⋯ "Select pages…" → header "Done" · Layers: ⋯ "Select mode" + footer Select / Done · Components: none |
| Search Esc | SC-2 search exception lists Add, Layers, Assets, CMS, Templates; Pages manager (P11 §11 "Esc closes sheet") and Components search (P13 §10) not listed — is the first Esc "clear" or "close"? |
| Nouns (SC-11) | "master" still used in P03 §6.6, P13 §6 ("site master") vs "main component" · "Blocks use your Brand colours" footnote kept (P03 §6.5) vs SC-11 "Section" + US "Color" · "Generate a block" (IAF-04, P20 AI-01) vs "Generate a section" (P03 §6.4, P18) · P11 §4/§1 uses "workspace" for areas (SC-11: "Area") |
| Shortcuts | P (Pages), L, A in SC-12 single-key list; ⇧A (Components) and T (Templates) are not in the SC-12 table or its single-key toggle list |
| Dialog widths | Pages sheet 560/720 · Page settings 720 · Templates confirms 720 · package dialogs 720/480/960 · Move pages / Move to page dialogs unspecified |
| Undo toast duration | ≥ 8 s, pauses on hover/focus — consistent (P24 §4.4, P15 §7, P11 §5) |

### T4-assets-cms-forms

| Topic | Pattern difference | Evidence |
|---|---|---|
| Back labels | P/07–08 "‹ Back to Editor · {page}" ✓ SC-1; DYN §10.1 "Back to CMS · Dynamic pages" (the area · subview form appears only here); P/10 "‹ Back to Form submissions" ✓ | SC-1; DYN:231; P/10:105 |
| Delete / recovery | Assets: confirm only while placed (E-4), Recently deleted after U-4. CMS: Undo + Recently deleted, typed E-1/2/3. Folders: none (T4-6). Submissions: confirm, hard delete, not on the SC-15 list (T4-22) | P/08 §6; P/07 §8; MS IAF-13 G |
| Save status | CMS "Record saving/saved/failed" (SC-4); Assets "Uploading / Waiting to sync / Not saved to library"; Forms "Saving / Saved to site / Failed" | SC-4; P/08 §5; CPC:65 |
| Empty states | "Upload your first image" vs "Create your first collection" vs IAF-13's 4-way split (no forms / no submissions / no matches / failed) — Forms copy unwritten | P/08 §9; P/07 §11; MS IAF-13 I |
| Pickers | Asset picker 284 (Editor) / 720 dialog; CMS source picker 280 popover — different widths for similar choosers (justified by context) | P/08 §4.3–4.4; DYN §7.1 |
| Widths | Nav 240 and detail 320 match across P/07, P/08, P/10 ✓; P/10 forms max 720 | GEO-01 refs |
| Naming | "workspace" for areas (SC-11 violation); "entry" → "record" fixed in P/07 §9 ✓; "Optimise/organise" (UK) in P/08 §1–2 vs SC-11 US spelling | SC-11; P/08:11, :31 |
| Search Esc / keys | Assets `/` focus + ⌘K scoped palette; CMS search follows SC-2; no Forms inbox search spec | SC-12; P/08 §4.1 |
| Register vs spec | CP dispositions (e.g. C12 "Keep") ignore INV redesign notes ("say applies on next publish") | CP:719; INV:1190 |

### T5-settings-publish

| Topic | Variants | Where |
|---|---|---|
| Release list label | "All releases ›" vs "All versions ›" | P/14 §4.1 vs P/12 RT-10; INV P7/P8 |
| Publish CTA verb | "Publish changes" / "Publish to production" / "Publish" | P/14 §4.1, §4.2 vs INV P10; P/01 §5.9 |
| Export name | "Export site…" vs "Export code" | P/01 §6 vs INV X1 |
| Backup action | "Save a backup" vs "Download a copy" | INV Y9 / IAF-22 vs P/22 §5.4 |
| Noun "Project" | "Project saved successfully", "Project update failed" vs SC-11 "Site" | P/22 §13-19; INV Y36 (not fixed in P/09) |
| Confirms vs Undo | SC-15 list vs Settings confirms | T5-03 |
| Site menu grouping | "Unpublish site…" sits under the Collaborate group | P/01 §6 l.141 |
| Back label | "‹ Back to Editor · Home" (P/10 sketch) consistent with SC-1; Settings group label "Organization workspace ↗" vs the SC-11 rule "Workspace = organization" | consistent |
| Footer height | Settings footer 48 (P/10 §9) and task footer 48 (P/12 §4.2) match | consistent |
| Width | Desktop 1440 for authoring/preview/export (P/05 l.90, SC-8) vs INV X3 note 1024/1320/1440 | resolved by docs |
| Bug IDs | BL `BK-0nn` and INV `BK-nn` are different namespaces with overlapping prefixes | BL vs INV |
| Status priority | SC-4 and P/11 §8 agree: Conflict › Save failed › Offline › Saving › Unsaved › Saved | consistent |

### T6-inspector-brand

| Topic | Pattern A | Pattern B | Evidence |
|---|---|---|---|
| Unbind wording | "Unbind" (P06 global rename) | "Unlink token" (IC-03), "Unlink" (II-06), "Disconnect" (PM M07-99, superseded) | P06:25; PM IC-03; II-06 |
| Main component | "Edit main component" (P13) | "Edit definition" (PM M07-49), "Edit master ↗" (INV), "Reset to master" (INV) | SC-11 glossary |
| Dark mode page | Tools › "Dark mode" (P09 §4.1) | "Open Brand → Colour mode" (PM M07-11; INV theme-toggle) | P09; PM |
| Font-size binding | Font-size token (PDB) | Size preset (B1A); Text style (INV); Type styles (Brand) | T6-2 |
| Back labels | "‹ Back to {element}" (P09 §9, P13, SC-1) | consistent | SC-1 |
| Esc | Brand: no-op when nothing is open (P09 §11) = SC-2 | Inspector outside a field → focus to canvas (SC-2 exception, P06 C6) | consistent |
| Undo in Brand | Header ↶ ↷ (P09 §5), IA-02, P05 toolbar Undo label "Undo {last action}" | same | consistent |
| Confirm vs Undo | SC-15 Undo-first | INS-D05 confirms; INV component confirms | T6-28 |
| Widths | Inspector 300 fixed, overlay 312 (PDB, P05, P12, SC-19) | DESIGN.md:232 rail 60 / drawer 280 vs GEO-01 56 / 284; B1A rail 60 + drawer 280 | T6-11 |
| Header heights | Brand header 56 (P09 §5, SC-10) | Inspector header ≈72 (DESIGN.md:238) vs INS-D07 natural (8 + 20 + 32 + 8) | compatible |
| Disclosure label | "More settings" (PM) | "Advanced typography · 9" (B1A) | T6-1/T6-19 row |
| Empty states | Inspector empty tab "No [category] properties for this selection" (PDB:705) | Brand "No brand set.", "Nothing to fix", "No restore points yet" (INV); P09 restates only "No brand set." | partial |
| Shortcut list | SC-12 lacks ⌘\ (Hide inspector) and ⌥-click section toggle | INV 1567/1575 | T6-25 |

### T7-design-system-engine

- **Panel headers:** 44 drawer (03:154), 48 task (12:60), 56 workspace (00:10), 72 Inspector (DESIGN.md:238), Brand as-built 30, Settings as-built 112; code sizes 44/48/44 (+36 back row).
- **Back labels:** SC-1 single pattern "‹ Back to {origin}" (00:17) — panels comply where checked (15:64, 13:61).
- **Menus/popover widths:** 240 / 260 / 264 / 320 / 360, all literal; `Popover` min 180/200; token menu-item 30 vs code item h-8.
- **Modals:** 480 / 560 / 640 / 720 / 960; two modal APIs (Modal vs ModalParts, INV:1900).
- **Not-built labels:** "Coming soon" (07:25; 10:100; B4/B7/B8), "Planned" (07:63; 10:100 card title), "Soon" (B6/B9).
- **Empty/loading/error:** CTRL-02 (RIH:134) requires distinct states; Panels 08 (08:40) and 22 list them; Panels 03/04/13 list without layout. DESIGN rule 6 (typographic empty state) is the only visual rule.
- **Confirmations:** SC-15 exception list (00:275-276) vs as-is confirms still described in 04:34 (N>1), 11 (page delete), 15 (template create until T-4).
- **Undo:** toasts ≥8 s (00:186; 22 §5.10) consistent.
- **Shortcuts:** SC-12 is the SSOT; DESIGN.md:293 and :417 are stale; 02:124 restates letters.
- **Widths:** see table (c) — 6 surfaces carry two values (rail, drawer, nav, task, header, footer).
- **Pro marker:** one chip, purple ramp (23:91) — consistent with DESIGN.md:41 allowance.
- **Selection colour:** rail active tint + 3px bar (02:94); canvas blue ring (21:82); row selection colour not stated in any panel.
