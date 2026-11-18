# T3 — Pages / Templates / Layers / History / Activity · Add / Components / AI — traceability

Mode: AUDIT ONLY (read-only). Spec-level judgement; no runtime, no Figma.

## Scope read

| File | Lines read | Note |
|---|---|---|
| INV `docs/editor-feature-inventory-2026-10-16.md` | 617–997 (all) | 617–977 in scope; 978–997 = Assets/CMS intro (T4 scope, skipped) |
| `design-audit-2026-10-18/_extraction/EXTRACTION-BRIEF.md` | 1–46 | |
| P/00-SHARED-CONTRACTS.md | 1–361 (full) | |
| D/PRODUCT-DESIGN-BRIEF.md | 1012–1166 | |
| P/03-ADD.md | 1–230 (full) | |
| P/04-LAYERS.md | 1–192 (full) | |
| P/11-PAGES-AND-BOTTOM-BAR.md | 1–172 (full) | |
| P/12-RIGHT-TASK-HOST.md | 1–157 (full) | |
| P/13-COMPONENTS.md | 1–155 (full) | |
| P/15-TEMPLATES.md | 1–210 (full) | |
| P/24-UNDO-COVERAGE.md | 75–233 (§4 target, matrix, §4.8–4.9) | §1–3, §5–14 skipped (not needed for these rows) |
| P/20-AI.md | 11–68 (§0, §2) + heading list | rest DEFERRED by SC-21 — not needed per row |
| D/evidence/ia-final-2026-10-16/module-specifications.md | IAF-04 (175–230), IAF-18 (959–1014) | other IAF sections only via grep |
| D/evidence/ia-final-2026-10-16/capability-preservation.md (= **CP-reg**) | 1–20, 357–601 (M03-1…M04-G1) | the 1,238-row register; names every row with a family-level home only |
| P/05, P/09, P/10, P/14, P/16, P/17, P/18 (§5.2 148–162), P/22, P/23 | grep hits only | cited lines only |

Grep method: ≥2 synonyms per row across P/*.md, D brief, REMAINING-IA-HANDOFF, CMS-DYNAMIC-BINDING-DESIGN, IMPROVEMENT-PLAN, evidence/ia-final/*.md. Because CP-reg maps all 1,238 rows to a family home, **no row is strictly OMITTED**; a row named **only** in CP-reg is classed PARTIAL ("register-only — home named, no controls/states").
Not read: FD-INS-02/03 Inspector annexes (rows D22–D24, A43 depend on them → marked PARTIAL/UNKNOWN depth).

Abbrev: P03…P24 = panel file + §; CP-reg = capability-preservation.md; IAF-nn = module-specifications.md section.

## Traceability

| FID | Feature | INV | INV line | Design home | Controls? | States specified | Interaction? | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-PG-001 | Pages panel (entry) | ✅ | 621 | P11 §4, §5, §12 (rail → bottom-bar Pages, P key) | Y | loading, error, viewer disabled-with-reason | Y | COVERED | Move per BD-02/05 |
| F-PG-002 | Header ⋯ menu | ✅ | 622 | P11 §5 Header | Y | select-mode "Done" not restated | P | COVERED | Widen/Narrow → sheet bounds; + Recently deleted (N) |
| F-PG-003 | ⌘K keycap / panel-local palette (#3–4) | ❌ | 623–624 | P18 §5.2 Pages row | — | — | — | REMOVED-N/A | replaced by global "Go to page ›" |
| F-PG-004 | ⌘K "New page" / "Go to {page}" | ✅ | 625 | P18 §5.2, §4.3 | Y | "Loading…" generic | Y | COVERED | Change: nested "Go to page ›" |
| F-PG-005 | Search pages | ✅ | 626 | P11 §5 Header; SC-2 | Y | — (clear-on-close not restated) | P | COVERED | extended to slugs + all views (DS) |
| F-PG-006 | "/" focuses search | ❌ | 627 | SC-12 "Focus area search /" | P | — | P | REMOVED-N/A | SC-12 revives "/" globally; P11 silent whether it reaches the Pages manager (T3-23) |
| F-PG-007 | No-results state | ✅ | 628 | P11 PG-03 (as-is only) | N | as-is only | N | PARTIAL | target silent; no Clear search (Layers/Add/Templates have it) |
| F-PG-008 | Loading skeleton | ✅ | 629 | P11 §9 | Y | manager skeleton, strip skeleton | Y | COVERED | |
| F-PG-009 | Empty state | ✅ | 630 | P11 PG-03 (as-is); P16 §4.6 generic | P | as-is only | N | PARTIAL | "No pages yet / Create blank page · From template" not restated |
| F-PG-010 | Load error | ✅ | 631 | P11 §9 | Y | error + Retry; strip "Pages unavailable — Retry" | Y | COVERED | |
| F-PG-011 | One-page note | ✅ | 632 | P11 §9 | Y | one page; delete disabled with reason | Y | COVERED | |
| F-PG-012 | Footer legend | ✅ | 633 | P11 PG-03 (as-is "legend") | N | "N of M match" not restated | N | PARTIAL | target silent; legend text "● unpublished changes" conflicts with §5 "● Unsaved" (T3-8) |
| F-PG-013 | "+N from collections ›" | ✅ | 634 | P11 §5 Body; FD-DYN-01 §6 | Y | — | Y | COVERED | replaced by "Blog post · Collection page · 20 pages" group |
| F-PG-014 | Footer add actions | ✅ | 635 | P11 §5 Footer, §6 | Y | capacity / plan-locked | Y | COVERED | |
| F-PG-015 | Select / open page | ✅ | 641 | P11 §4, §5 Row actions | Y | draft guard, announce | Y | COVERED | Change: row click = "Open {page} in Editor", closes sheet |
| F-PG-016 | Home glyph | ✅ | 642 | P11 §4, §5 Row | Y | — | Y | COVERED | |
| F-PG-017 | External-link page glyph | ❌ | 643 | — | — | — | — | REMOVED-N/A | |
| F-PG-018 | Status chip | 🟡 | 644 | P11 §5 Row, T-PG-05 | Y | Live (none), Hidden, Hidden (legacy password), plan-locked | Y | COVERED | Fix: only real states |
| F-PG-019 | "● Unpublished" marker | 🟡 | 645 | P11 §5 Row ("● Unsaved"), §4 strip dot | Y | unsaved | P | COVERED | L3-009 SR announcing "Live" on never-published site not addressed |
| F-PG-020 | Inline rename | ✅ | 646 | P11 §5 guards, §11 | Y | duplicate-name error | Y | COVERED | |
| F-PG-021 | Rename → URL decision | ✅ | 647 | P11 PG-06, §5 guards | Y | Keep / Update / Cancel, redirect offer | Y | COVERED | |
| F-PG-022 | Drag to reorder | ✅ | 648 | P11 §5 Row (grip only) | P | drop indicator not specified | N | PARTIAL | no keyboard / non-drag reorder (T3-4) |
| F-PG-023 | Bulk selection | ✅ | 649 | P11 §5 Bulk, PG-08, §11 | Y | select mode; Esc exits | P | COVERED | |
| F-PG-024 | Page context menu | ✅ | 650 | P11 §5 Row actions | Y | Delete disabled-with-reason (PG-05) | Y | COVERED | missing P15 §5.5 "Save as template…" door (T3-9) |
| F-PG-025 | Menu chords ⌘D / ⌫ | 🐞 | 651 | P11 §5, §11, T-PG-06 | Y | — | Y | COVERED | Fix: bound on focused row |
| F-PG-026 | Duplicate | ✅ | 652 | P11 §5; P24 §4.1 #34 | Y | toast Undo + Open | Y | COVERED | error toasts (missing source/corrupt) not restated |
| F-PG-027 | Set as homepage | ✅ | 653 | P11 §5; P24 #34 | Y | toast Undo | Y | COVERED | |
| F-PG-028 | Copy link | ✅ | 654 | P11 §5 menu (name only) | P | "No address yet" absent | N | PARTIAL | |
| F-PG-029 | Delete one page | ✅ | 655 | P11 §5–6; SC-15; P24 §4.8 | Y | guards, Undo toast + warnings, Recently deleted (offline/viewer/loading/failure) | Y | COVERED | Change: confirm removed |
| F-PG-030 | Replace layout with template… | ✅ | 656 | P11 §5; P15 §5.1 | Y | Replacing mode | Y | COVERED | |
| F-PG-031 | Server-backed folders | ✅ | 662 | P11 §5 Body/Folders | Y | — | P | COVERED | privacy label "My folders · only you see these" (DS) |
| F-PG-032 | Folder row | ✅ | 663 | P11 §5 "Folders: existing" | N | none | N | PARTIAL | tri-state, ⓘ tip, hover Rename/"Delete folder (pages kept)" unspecified; folder-delete recovery absent (T3-12) |
| F-PG-033 | New folder | ✅ | 664 | P11 §5 Footer | Y | — | P | COVERED | "opens into rename" not restated |
| F-PG-034 | Move page into folder | ✅ | 665 | P11 §5 menu "Remove from folder"; P24 #34 | P | move toast Undo | P | PARTIAL | drag-onto-folder / empty-folder drop target unspecified |
| F-PG-035 | Reorder inside folder | 🟡 | 666 | P11 §5 Folders | — | — | — | COVERED | documented limitation (accepted) |
| F-PG-036 | Bulk toolbar | ✅ | 667 | P11 §5 Bulk, PG-08 | Y | — | P | COVERED | |
| F-PG-037 | Move pages dialog | ✅ | 668 | P11 PG-08 (as-is "Move to…"); CP-reg M03-38 | P | — | N | PARTIAL | dialog body/width unspecified |
| F-PG-038 | Bulk delete | ✅ | 669 | P11 §5 Delete; SC-15; P24 #33, §4.8 bulk Restore | Y | Undo toast, Recently deleted | P | COVERED | bulk toast copy / inbound-link warning for N pages unspecified |
| F-PG-039 | Bulk duplicate | ✅ | 670 | P11 PG-08, §5 Bulk | Y | — | P | COVERED | |
| F-PG-040 | New page modal | ✅ | 676 | P11 §6; P15 §5.1; P24 #31 | Y | capacity, at-limit disabled, Undo toast | Y | COVERED | |
| F-PG-041 | Plan page limit | 🟡 | 677 | P11 §6; SC-9; SC-18; SC-20 | Y | capacity, locked, post-save fallback | Y | COVERED | blocked on capacity query |
| F-PG-042 | Listings view | ✅ | 678 | P11 §5 Body | P | — | N | PARTIAL | columns/score/click target not restated |
| F-PG-043 | SEO score consistency (two formulas) | 🐞 | 679 | CP-reg M03-44 "Fix" only | N | — | N | PARTIAL | no doc picks one score model (T3-5) |
| F-PG-044 | "Open full listings ›" | 🟡 | 680 | P11 §5 Header | Y | — | P | COVERED | expands sheet to work-area size |
| F-PG-045 | Structure view | ✅ | 681 | P11 §5 Body (name only) | N | — | N | PARTIAL | |
| F-PG-046 | Page settings dialog shell | ✅ | 687 | P11 §7 | Y | — | Y | COVERED | 720 max; opens without switching canvas page |
| F-PG-047 | Save model (Cancel / Save) | 🟡 | 688 | P11 §7; SC-10 | Y | saving, failure + Retry | Y | COVERED | "Done" → "Save" |
| F-PG-048 | Discard guard | ✅ | 689 | P11 §7 ("existing") | P | — | P | COVERED | |
| F-PG-049 | SEO score pill on tab | ✅ | 690 | CP-reg M03-50; P11 §7 "unchanged" | N | — | N | PARTIAL | depends on F-PG-043 |
| F-PG-050 | Google preview | ✅ | 691 | P11 PG-10, §7 "unchanged" | Y | no-description | N | COVERED | by reference |
| F-PG-051 | Score card + checklist | ✅ | 692 | P11 PG-10; P10 §5 "SEO analysis · Planned" (site-level) | P | — | N | PARTIAL | FG-007 page-level checks undecided |
| F-PG-052 | Meta title override + "Write with AI" | ✅ | 693 | P11 §7 (field); SC-21 (AI button) | Y | — | P | DEFERRED-BY-DECISION | AI button hidden (SC-21); field itself COVERED |
| F-PG-053 | Meta description | ✅ | 694 | P11 PG-10, §7; IAF-05 H (≤160) | Y | — | P | COVERED | |
| F-PG-054 | URL slug + redirect offer | ✅ | 695 | P11 PG-06, §5, §7 | Y | warning, redirect offer | Y | COVERED | |
| F-PG-055 | Indexing select in SEO tab | ✅ | 696 | P11 PG-10 | Y | — | N | PARTIAL | duplicates Advanced toggle (T3-13) |
| F-PG-056 | Social tab | ✅ | 697 | P11 PG-10, §7 | Y | — | N | COVERED | FG-011 linked/independent X switch not addressed |
| F-PG-057 | Visibility Live / Hidden | ✅ | 698 | P11 PG-10, §5 Row | Y | Hidden chip, legacy password | Y | COVERED | |
| F-PG-058 | Password-protected pages | ❌ | 699 | P11 §5 "Hidden (legacy password)" | — | — | — | REMOVED-N/A | |
| F-PG-059 | Indexing / Follow toggles | ✅ | 700 | P11 PG-10 | Y | — | N | COVERED | |
| F-PG-060 | Custom `<head>` code | ✅ | 701 | P11 PG-10, §7; P23 l.181 / OD-PL-5 | Y | Pro lock only in P23 | P | PARTIAL | P11 §7 omits Pro chip/lock (T3-11) |
| F-PG-061 | Settings error boundary | ✅ | 702 | CP-reg M03-62; P22 §5.9 (generic) | N | crash (generic) | N | PARTIAL | |
| F-PG-062 | Templates view (full-canvas → area) | ✅ | 708 | P15 §4 Host, §5.1 | Y | loading skeleton | Y | COVERED | Change: portal → in-shell area; T-5 Figma update |
| F-PG-063 | Compact drawer gallery | ❌ | 709 | — | — | — | — | REMOVED-N/A | |
| F-PG-064 | Search / filter / tags | ❌ | 710 | P15 §4 (search, Show filter, category rule) | Y | no match | Y | COVERED | revived by doc (IAF-06 E/K) |
| F-PG-065 | Workspace sidebar | ✅ | 711 | P15 §4 header 56 + local nav 240 | Y | — | Y | COVERED | per-template list → Show + Recent; back labels fixed |
| F-PG-066 | Catalogue grid | ✅ | 712 | P15 §4 Grid, §7 | Y | applied, Pro, preview unavailable | Y | COVERED | |
| F-PG-067 | Catalogue content | ✅ | 713 | P15 TP-03, §4 | Y | saved syncing / failed | Y | COVERED | |
| F-PG-068 | In-place preview | ✅ | 714 | P15 §4.1 | Y | render error | Y | COVERED | |
| F-PG-069 | Detail panel / "where used" dialog | ❌ | 715 | P15 §4.1 ("Used on" kept) | — | — | — | REMOVED-N/A | |
| F-PG-070 | Replace mode | ✅ | 716 | P15 §4 mode bar | Y | Replacing; target cleared | Y | COVERED | |
| F-PG-071 | Replace confirm | ✅ | 717 | P15 §5.3; P24 #43 | Y | backup on | Y | CONFLICT | confirm kept vs SC-15 / P24 §4.9 (T3-2) |
| F-PG-072 | "Reset global styles" option | ❌ | 718 | — | — | — | — | REMOVED-N/A | |
| F-PG-073 | Backup-failed dialog | ✅ | 719 | P15 §5.3 | Y | Cancel / Try again / Replace without | Y | COVERED | |
| F-PG-074 | New page from template | ✅ | 720 | P15 §5.2; P11 §6 | Y | confirm until T-4; truthful failure | Y | COVERED | |
| F-PG-075 | Apply progress card | ✅ | 721 | P15 §5.4 | Y | "Taking longer than usual…", Cancel pre-import | Y | COVERED | 15 s auto-fail removed |
| F-PG-076 | Admin-only apply | ✅ | 722 | P15 §6 Role | Y | viewer disabled, role unknown | Y | COVERED | Change: EDITOR+ (OD-T1) |
| F-PG-077 | Pro templates | 🔒 | 723 | P15 §6; SC-20 | Y | trial, Free locked | Y | COVERED | |
| F-PG-078 | Brand tokens after apply | 🟡 | 724 | P15 §4.1 Brand line (copy only), TP-09 | P | — | N | PARTIAL | L4-024 "re-author on semantic tokens" not in any doc (T3-24) |
| F-PG-079 | Empty-canvas template cards bug | 🐞 | 725 | P15 §5.1; P16 §4.1; SC-10 | Y | — | Y | COVERED | cards open their preview |
| F-PG-080 | Save page as template | 🟡 | 726 | P15 §5.5 | Y | empty Saved filter; Rename hidden until T-3 | Y | COVERED | cross-device pull-back still unverified |
| F-PG-081 | Legacy template list / manager | ❌ | 727 | — | — | — | — | REMOVED-N/A | |
| F-PG-082 | Layers panel | ✅ | 733 | P04 §4; P02 | Y | — | Y | COVERED | |
| F-PG-083 | Layers header ⋯ | ✅ | 734 | P04 §4, §12 | Y | — | Y | COVERED | Display → ≡; Widen removed |
| F-PG-084 | Search layers | ✅ | 735 | P04 §9; SC-2 | Y | no results, count | Y | COVERED | Change: Esc no longer closes |
| F-PG-085 | Breadcrumb band | ❌ | 736 | — | — | — | — | REMOVED-N/A | |
| F-PG-086 | Layers panel states | ✅ | 737 | P04 §11, LY-05 | Y | loading, error, empty, no results, rejected drop | Y | CONFLICT | empty copy/CTA P04 §11 vs P16 §4.6 (T3-3) |
| F-PG-087 | Display settings | ✅ | 738 | P04 LY-03, §12 | Y | — | Y | COVERED | |
| F-PG-088 | Layer row | ✅ | 739 | P04 §5 | Y | selected, multi, hover, drop, dimmed, locked, hidden-bp, condition | Y | COVERED | |
| F-PG-089 | Names/locks saved with project | ✅ | 740 | P04 §11; P24 #8 | P | — | P | COVERED | |
| F-PG-090 | Dim in editor | ✅ | 741 | P04 §6 | Y | dimmed | Y | COVERED | renamed |
| F-PG-091 | Drag reorder / nest | ✅ | 742 | P04 §7 | Y | rejected drop | Y | COVERED | |
| F-PG-092 | Multi-select / Select mode | ✅ | 743 | P04 §8 | Y | mixed summary | Y | COVERED | |
| F-PG-093 | Multi-select banner | ❌ | 744 | — | — | — | — | REMOVED-N/A | |
| F-PG-094 | Row keyboard | ✅ | 745 | P04 §10 | Y | — | Y | COVERED | |
| F-PG-095 | Layer context menu | ✅ | 746 | P04 §7; SC-3 | Y | lock refusals | Y | COVERED | |
| F-PG-096 | Move to page dialog | ✅ | 747 | P04 §7 | Y | pre-check refusal, Go to page | Y | COVERED | |
| F-PG-097 | Delete a multi-selection | ✅ | 748 | P04 §7; SC-3 | Y | Undo toast | Y | COVERED | Change: confirm removed |
| F-PG-098 | Lock/Unlock + Select children in menu | 🟡 | 749 | P04 §7; SC-3 | Y | — | Y | COVERED | |
| F-PG-099 | Viewer read-only Layers | ✅ | 750 | P04 §11; SC-6 | Y | view only | Y | COVERED | Change: Dim allowed to viewers |
| F-PG-100 | Hover sync | ✅ | 751 | P04 §7 | Y | — | Y | COVERED | |
| F-PG-101 | History location (right column) | ✅ | 757 | P12 §4–5; SC-6; SC-12 (H) | Y | — | Y | COVERED | |
| F-PG-102 | Tabs Session / Saves / Published | ✅ | 758 | P12 §5; IAF-18 E | Y | — | P | COVERED | default tab not restated |
| F-PG-103 | History ⋯ menu | ✅ | 759 | P12 RT-12; P24 §4.6; SC-12 | Y | Clear confirm until K-8 (E-5) | Y | COVERED | |
| F-PG-104 | Remembers last view | ✅ | 760 | P12 RT-12 | Y | — | N | COVERED | |
| F-PG-105 | Viewer read-only History | ✅ | 761 | SC-6; P12 §6; IAF-18 D | Y | read-only | P | COVERED | |
| F-PG-106 | "‹ Activity" back row | ✅ | 762 | P12 §5 Activity; SC-1 | Y | — | Y | COVERED | label → "‹ Back to Activity" |
| F-PG-107 | Saves list | ✅ | 763 | P12 RT-12; IAF-18 E/I | P | empty/filtered/pruned (IAF-18 I) | P | PARTIAL | row anatomy, date groups, "Auto" chip unspecified |
| F-PG-108 | Version row ⋯ menu | ✅ | 764 | P12 RT-12 | Y | — | P | COVERED | |
| F-PG-109 | Saved-version details modal | ✅ | 765 | P12 RT-12 ("details") | P | — | N | PARTIAL | |
| F-PG-110 | Saves filter | ✅ | 766 | CP-reg M03-111 only | N | filtered (IAF-18 I) | N | PARTIAL | register-only (T3-19) |
| F-PG-111 | Restore a version | ✅ | 767 | IAF-18 G; P24 #54; P12 §4.3 | Y | checkpoint fail Retry/Cancel; Undo restore | Y | COVERED | |
| F-PG-112 | Delete a version | ✅ | 768 | P24 #45 → IAF-18 I | P | "deleted, keep explanation" only | N | PARTIAL | no Undo / confirm / Recently deleted decision (T3-6) |
| F-PG-113 | Save a version modal | ✅ | 769 | P12 RT-12, §5 | P | — | N | PARTIAL | name suggestions, modal fields unspecified |
| F-PG-114 | Inline compare | ✅ | 770 | P12 §5; IAF-18 E/F | Y | compare failed | Y | COVERED | + "Open comparison ›" |
| F-PG-115 | Get AI Summary | ✅ | 771 | SC-21; P12 §5; P20 AI-11 | — | — | — | DEFERRED-BY-DECISION | |
| F-PG-116 | Milestone suggestion banner | ✅ | 772 | SC-21 / P20 §0 (hook not mounted); P20 AI-12 | — | — | — | DEFERRED-BY-DECISION | P12 §5 still lists it "Kept" (T3-7) |
| F-PG-117 | Approval band | ✅ | 773 | CP-reg M03-118; P17 §5 stale card (Review side) | P | "edited since" (P17) | N | PARTIAL | History › Saves placement absent from panels |
| F-PG-118 | Retention / prune notes | ✅ | 774 | IAF-18 I "version pruned"; P24 §4.6 divider (Session) | P | pruned | N | PARTIAL | Saves copy not specified |
| F-PG-119 | Saves states | ✅ | 775 | IAF-18 I; P12 §6 | Y | empty, filtered, loading, pruned, restricted, compare failed | P | COVERED | |
| F-PG-120 | "Use Ctrl+Z" hint bug | 🐞 | 776 | CP-reg M03-121 "Fix"; SC-12 platform rule | P | — | N | PARTIAL | SC-12 covers tooltips/dialog, not state copy |
| F-PG-121 | Session undo trail | ✅ | 777 | P24 §4.5; P12 §5 | Y | dividers opened/cleared | Y | COVERED | |
| F-PG-122 | Restore to a step | ✅ | 778 | P24 §4.5–4.6; IAF-18 G | Y | truncation warning, checkpoint fail | Y | COVERED | "Restore to here" |
| F-PG-123 | Session keyboard j/k/g/G | ✅ | 779 | CP-reg M03-124 only | N | — | N | PARTIAL | absent from SC-12 and P18 sheet (T3-19) |
| F-PG-124 | Session footer + states | ✅ | 780 | P12 RT-12 ("Save a version") | P | empty/error not restated | N | PARTIAL | |
| F-PG-125 | Time Travel | ✅ | 781 | P05 §8; P12 §5; SC-12; IAF-18 F/H | Y | no preview, restore confirm | Y | COVERED | Change: band → dedicated area |
| F-PG-126 | Time Travel restore safety | ✅ | 782 | IAF-18 G | Y | checkpoint failed, Restore anyway (session only) | Y | COVERED | |
| F-PG-127 | Time Travel "no preview" point | 🟡 | 783 | IAF-18 H | Y | absent vs render-failed split | Y | COVERED | |
| F-PG-128 | Published tab | ✅ | 784 | P14 PB-16, §5.6; P12 RT-12; SC-11 | Y | pruned release disabled | Y | COVERED | "Republish this release" |
| F-PG-129 | Shared Compare view | ✅ | 785 | P05 §8; IAF-18 E/H; P12 §5 | Y | missing/pruned/denied/failed | Y | COVERED | |
| F-PG-130 | Activity panel | ✅ | 791 | P12 §5; P01 TB-08, §6; SC-6 | Y | — | Y | COVERED | |
| F-PG-131 | Activity filters + rows | ✅ | 792 | P12 RT-13, §5; IAF-18 E | Y | — | Y | COVERED | exact-item open needs API (SC-9) |
| F-PG-132 | Activity states | ✅ | 793 | P12 RT-13 ("states"), §6 | N | not restated | N | PARTIAL | (T3-22) |
| F-PG-133 | Panel frame + header | ✅ | 799 | P03 §8; P04 §10; P12 §4.2; SC-1 | Y | — | Y | COVERED | heights 44/48/56 differ (consistency) |
| F-PG-134 | Panel search field | ✅ | 800 | SC-2; P03 §6.1; P04 §9 | Y | — | Y | COVERED | |
| F-PG-135 | Shared panel states | ✅ | 801 | P04 LY-05; P18 §5.7; P22 §5.9 | P | — | P | PARTIAL | no single shared no-results contract |
| F-PG-136 | Drill-in header | ✅ | 802 | SC-1; P13 §4 | Y | — | Y | COVERED | superseded by SC-1 back slot |
| F-PG-137 | Old sidebar SearchBar | ❌ | 803 | — | — | — | — | REMOVED-N/A | |
| F-AD-001 | Add panel frame + header | ✅ | 830 | P03 §4, §8 | Y | — | Y | COVERED | |
| F-AD-002 | Expand to 700 | ❌ | 831 | P03 §8 | — | — | — | REMOVED-N/A | resize 260–360 |
| F-AD-003 | Paste HTML dialog | ✅ | 832 | P03 §6.8, §5; SC-12 | Y | strip report, lock refusal | Y | COVERED | ⌘⇧V scope ambiguity (T3-21) |
| F-AD-004 | Pinned Paste HTML row | ❌ | 833 | — | — | — | — | REMOVED-N/A | |
| F-AD-005 | Search field | ✅ | 834 | P03 §6.1; SC-2; SC-12 | Y | — | Y | COVERED | |
| F-AD-006 | Search results | ✅ | 835 | P03 §6.1 | Y | count status line | Y | COVERED | Change: grouped by source |
| F-AD-007 | No-results state | ✅ | 836 | P03 §6.1 | Y | no results | Y | COVERED | |
| F-AD-008 | Selection-aware purpose line | ❌ | 837 | P03 §5 (target subtitle replaces) | — | — | — | REMOVED-N/A | |
| F-AD-009 | Group headers | ✅ | 838 | P03 §8, §10 | Y | — | Y | COVERED | |
| F-AD-010 | ★ Favourites + Recent (A10–A11) | ✅ | 839–840 | P03 §6.2, §5 Recents | Y | only when non-empty | Y | COVERED | Fix: all sources; recents on success |
| F-AD-011 | ELEMENTS (54) | ✅ | 841 | P03 §4, §6.3 | Y | — | Y | COVERED | 54 → 37 + Theme toggle |
| F-AD-012 | Collection list element | ✅ | 842 | P03 §4; FD-DYN-01 §10.2 | Y | — | Y | COVERED | + List of {collection} |
| F-AD-013 | Theme toggle element | ✅ | 843 | P03 §6.3 | Y | hidden unless Dark Auto | N | COVERED | unexplained disappearance not addressed |
| F-AD-014 | Upload element | ❌ | 844 | CP-reg M04-A15 Defer | — | — | — | REMOVED-N/A | |
| F-AD-015 | Description bubble | ✅ | 845 | P03 §6.3, §8 | Y | — | Y | COVERED | |
| F-AD-016 | Drag element + drag note | ✅ | 846 | P03 §5 Target | Y | "Locked" refusal | Y | COVERED | |
| F-AD-017 | Disabled "Soon" row | ⏳ | 847 | P03 §9 (disabled-with-reason rows) | Y | disabled reasons | Y | COVERED | state reused for lock / no page |
| F-AD-018 | BLOCKS 8 cards | ✅ | 848 | P03 §6.5 | Y | — | Y | COVERED | label "Sections" |
| F-AD-019 | Block thumbnails | 🟡 | 849 | P03 §6.5 | Y | — | N | COVERED | wireframes kept; slot reserved |
| F-AD-020 | Hover pill + preview card; drag cards (A21–A22) | ✅ | 850–851 | P03 §6.5, §5 | Y | — | Y | COVERED | |
| F-AD-021 | Token-bound blocks footnote | ✅ | 852 | P03 §6.5 | Y | — | — | COVERED | footnote wording vs SC-11 (consistency) |
| F-AD-022 | Blocks no longer in Add | ❌ | 853 | P03 §7 (Defer) | — | — | — | REMOVED-N/A | documented defer |
| F-AD-023 | "✦ Generate a block" row | ✅ | 854 | SC-21; P03 §4, §6.4 | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-024 | BUILT-IN components (14) | ✅ | 855 | P03 §6.3a | Y | — | Y | COVERED | renamed Catalog components; draggable |
| F-AD-025 | Saved components + From library + Manage › (A27–A29) | ✅ | 856–858 | P03 §6.6 | Y | empty, library error, library empty, restricted | Y | COVERED | |
| F-AD-026 | Saved count vs Components panel (L1-024) | 🐞 | 859 | P03 §6.6 vs P13 §4 | Y | — | Y | CONFLICT | scope definitions disagree (T3-1) |
| F-AD-027 | "Page templates ›" link | ✅ | 860 | P03 §4, §6.5; P15 §5.1 | Y | — | Y | COVERED | moved to Sections footer |
| F-AD-028 | First-use tip card | 🟡 | 861 | P03 §10; P16 FR-14 | P | — | P | PARTIAL | L1-029 stacking unresolved (T3-25) |
| F-AD-029 | Tips strip; Quick Picks callout (A33–A34) | ❌ | 862–863 | — | — | — | — | REMOVED-N/A | |
| F-AD-030 | Loading / "Couldn't load library" states | ❌ | 864 | P03 §9 "Catalogue unavailable" | Y | catalogue unavailable | Y | COVERED | doc revives a state INV calls unreachable |
| F-AD-031 | Click-insert placement | ✅ | 865 | P03 §5 | Y | stale target, lock | Y | COVERED | |
| F-AD-032 | Insert toasts | ✅ | 866 | P03 §5 Receipt/Feedback | Y | refusal | Y | COVERED | |
| F-AD-033 | Replace with block… | ✅ | 867 | P03 AD-14, §5; SC-3 | Y | locked refused | Y | COVERED | |
| F-AD-034 | Media insert → Assets | 🟡 | 868 | P03 §5 Media; P02 §5 | Y | Pick / Cancel | Y | COVERED | picker chosen over L1-017 default (SC-22 accepts) |
| F-AD-035 | Doors into Add | ✅ | 869 | P03 §1, §6.6; P16 §4.1; P09 l.84 | Y | — | Y | COVERED | |
| F-AD-036 | Add keyboard | ✅ | 870 | P03 §10; SC-12 | Y | — | Y | COVERED | ARIA grid, F key (DS) |
| F-AD-037 | Block default-content copy debt | 🟡 | 871 | CP-reg M04-A42 "Redesign" only | N | — | N | PARTIAL | register-only; grepped "Aquibra", "© 2024", "sample content", "emoji", "copy pass" (T3-20) |
| F-AD-038 | Live embeds + runtimes | ✅ | 872 | CP-reg M07-48d/48f/62 → FD-INS-02/03 | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | FD-INS annex not read |
| F-AD-039 | Generate a block (B1–B5) | ✅ | 878–882 | SC-21; P03 §6.4; P20 AI-01/02 | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-040 | Quick-add Element Picker modal | ❌ | 888 | CP-reg M04-C1 Defer | — | — | — | REMOVED-N/A | IAF-04 F still mentions "quick-add modal" (stale) |
| F-AD-041 | Components entry points | ✅ | 894 | P13 §4; P02 | Y | — | Y | COVERED | |
| F-AD-042 | "‹ Add" back row | ✅ | 895 | SC-1; P13 §4 | Y | — | Y | COVERED | |
| F-AD-043 | Components list view | ✅ | 896 | P13 §4 | Y | New, Update available, Local changes, Restricted | Y | COVERED | Redesign (workspace) |
| F-AD-044 | Detach-all notice | ✅ | 897 | P13 §6 Detach all ("existing") | P | notice not restated | N | PARTIAL | |
| F-AD-045 | Empty / unavailable / error | ✅ | 898 | P13 §10 | Y | empty, loading, error + Retry | P | PARTIAL | "storage unavailable" state not in target |
| F-AD-046 | "+ Create component" | ✅ | 899 | P13 §4 | Y | capacity | Y | COVERED | |
| F-AD-047 | Create component modal | ✅ | 900 | P13 §5 | Y | capacity, duplicate-name warning | Y | COVERED | |
| F-AD-048 | Old create fields | ❌ | 901 | — | — | — | — | REMOVED-N/A | tags still feed search, unaddressed |
| F-AD-049 | No-selection pre-check | ✅ | 902 | P13 CP-03; P03 §6.6 | P | — | P | COVERED | |
| F-AD-050 | Page-scoped masters | ✅ | 903 | P13 §4 This page | Y | — | Y | COVERED | |
| F-AD-051 | Detail header/rename + Insert (D11–D12) | ✅ | 904–905 | P13 §6 | Y | ADMIN rename reason | Y | COVERED | |
| F-AD-052 | Update from selection… | ✅ | 906 | P13 §6 | Y | Choose on canvas, Cancel | Y | CONFLICT | "existing confirm + Undo" vs SC-15 (T3-2) |
| F-AD-053 | Instance edits survive master update | 🟡 | 907 | P13 §7 (stable node keys); risks IA-X09 | P | — | N | PARTIAL | breakpoint/pseudo-state overrides untracked (T3-14) |
| F-AD-054 | Detach all | ✅ | 908 | P13 §6 | Y | locked skipped | Y | COVERED | "existing" carries a confirm — same SC-15 ambiguity (T3-2) |
| F-AD-055 | Duplicate master | ✅ | 909 | P13 §6 | Y | — | Y | COVERED | Fix: variants + scope kept |
| F-AD-056 | Delete master | ✅ | 910 | P13 §6; SC-15; P24 §4.8 | Y | Undo toast, Recently deleted | Y | COVERED | |
| F-AD-057 | Master preview thumbnail | 🐞 | 911 | P13 §4 rows thumbnail | P | — | N | PARTIAL | L2-020 not addressed (T3-26) |
| F-AD-058 | STRUCTURE + USED ON (D19–D20) | ✅ | 912–913 | P13 §6, §10 subview | Y | — | Y | COVERED | |
| F-AD-059 | No in-place master editing | 🐞 | 914 | P13 §9 | — | — | — | COVERED | decided: Update from selection is the edit path |
| F-AD-060 | Inspector ComponentRow + override dots (D22–D23) | ✅ | 915–916 | P13 §9; FD-INS-02 | Y | "Variant unavailable" | Y | COVERED | |
| F-AD-061 | Instance root hides Layout/Text | ✅ | 917 | CP-reg M04-D24 → FD-INS-02/03 | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | FD-INS annex not read |
| F-AD-062 | Layers instance badge | ✅ | 918 | P04 §5 | Y | — | Y | COVERED | |
| F-AD-063 | Variant authoring | ⏳ | 919 | P13 §9 (IAF-11 K) | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-064 | Rename/Variant modals; JSON export (D27–D28) | ❌ | 920–921 | P13 §8 (PKG-01 packages supersede export) | — | — | — | REMOVED-N/A | |
| F-AD-065 | Server mirror + workspace library | ✅ | 922 | P13 CP-06, §7 | Y | library load failure | Y | COVERED | |
| F-AD-066 | 100-component cap | 🟡 | 923 | P13 §5; SC-9 | Y | "N of 100", at-cap disabled | Y | COVERED | |
| F-AD-067 | 27-component DS catalogue | 🟡 | 929 | CP-reg M04-E1 "Redesign" only | N | — | N | PARTIAL | no panel decides surfacing (T3-15) |
| F-AD-068 | Brand › Components summary | ❌ | 930 | — | — | — | — | REMOVED-N/A | |
| F-AD-069 | Brand › Component styles | 🟡 | 931 | P09 l.84, l.153 | Y | — | Y | COVERED | becomes "Browse section blocks in Add ›"; AI part DEFERRED (SC-21) |
| F-AD-070 | Draggable DS card grid | ❌ | 932 | — | — | — | — | REMOVED-N/A | |
| F-AD-071 | AI placement + doors (F1–F2) | ✅ | 938–939 | SC-21; P12 RT-14, §5; P20 AI-03…06 | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-072 | Removed AI doors | ❌ | 940 | P20 §2.1; SC-3 inactive row | — | — | — | REMOVED-N/A | |
| F-AD-073 | Scope band … pre-run note (F4–F9) | ✅ | 941–946 | SC-21; P20 §4.2; P12 §5 | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-074 | Chat thread; Auto-apply (F10–F11) | ❌ | 947–948 | — | — | — | — | REMOVED-N/A | |
| F-AD-075 | Plan review … privileged confirm (F12–F20) | ✅ | 949–957 | SC-21; P20 §4–7; P12 §5 | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-076 | One-click content actions | 🟡 | 958 | SC-21; P20 (L5-016) | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-077 | AI helpers elsewhere | ✅ | 959 | SC-21 (SEO, alt text, History summary, Brand listed) | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-078 | Build AI workspace spec | ⏳ | 960 | SC-21 ("AI Build tab", later) | — | — | — | DEFERRED-BY-DECISION | |
| F-AD-079 | Engine element types | ✅ | 966 | D brief l.1155 (BIC-01, 69 block records); SC-11 | P | — | — | COVERED | 52 types vs SC-11 "69 types" (T3-18) |

## Principle observations

| PID | Module | Observation (spec-level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P39 | Pages manager | Page reorder is drag-only; no keyboard/non-drag alternative while Layers gets ⌥↑/↓ (WCAG 2.5.7) | High | P11 §5, §11 vs P04 §7 | NEEDS REVISION |
| P31 | Add ↔ Components | "Library" and "This site" scopes are defined differently, recreating the L1-024 count mismatch | High | P03 §6.6 vs P13 §4 | NEEDS REVISION |
| P25 | History › Saves | Named-version delete has no Undo, no Recently deleted, no confirm decision; P24 defers to IAF-18, which is silent | High | P24 #45; IAF-18 H/I | NEEDS REVISION |
| P25 | Pages / Layers / Components delete | One recovery model: Undo toast ≥8 s + 30-day Recently deleted with exact Restore, named states (offline, viewer, failure) | — | SC-15; P24 §4.4, §4.8 | PASS-SPEC |
| P24 | Add insertion | Lock check on every route, stale-target refusal, receipt before toast | — | P03 §5 | PASS-SPEC |
| P23 | Add | Target subtitle ("Adds after Heading") states the result before commit | — | P03 §5 Target | PASS-SPEC |
| P02 / P01 | Add catalogue | De-duplication: each item in exactly one group (54 → 37 + toggle; 13 widgets → Catalog) | — | P03 §4 | PASS-SPEC |
| P05 | Layers | Dim vs live visibility vs lock disambiguated; M/T/D markers with accessible names | — | P04 §5–6 | PASS-SPEC |
| P09 | Templates | 15 s false failure replaced by "Taking longer…" + real completion signal | — | P15 §5.4 | PASS-SPEC (T-2 dependency) |
| P33 | Templates / Components | Both become shell areas with SC-1 back slot and no rail item active | — | P15 §4; P13 §4; SC-1 | PASS-SPEC |
| P08 | Page settings | Two SEO score formulas left to the user (Listings vs SEO tab) | Medium | INV #44; CP-reg M03-44 only | NEEDS REVISION |
| P24 | Page settings | Same indexing value editable in two controls (SEO tab select + Advanced toggle) | Low | P11 PG-10, §7 | NEEDS REVISION |
| P38 | Pages manager | Target relies on "existing" for empty, no-results, legend and folder-row states; nothing restated | Medium | P11 §5, §9 | NEEDS REVISION |
| P35 | Shared drawer states | No-results pattern differs across Add, Layers, Pages, Templates; no shared contract | Low | P03 §6.1; P04 LY-05; P15 §6; INV #8 | NEEDS REVISION |
| P01 | Add first-use tip | Tip can stack with RailCoach and checklist; L1-029 still open | Low | P03 §10; P16 FR-14 | NEEDS REVISION |
| P22 | Pages folders | Removing a page from a folder is menu-only; drag target rules unspecified | Low | P11 §5; INV #35 | NEEDS REVISION |

## Contradictions & gaps

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T3-1 | contradiction | P03 §6.6: three scopes, "each master listed exactly once"; Library = "not yet on this site" | P13 §4: Component library = "all … adopted or not"; This site includes adopted library copies → an adopted item appears twice | Major | One scope definition in SC-11 / P13; P03 counts derive from it |
| T3-2 | contradiction | SC-15 + P24 §4.9: "Any other confirm in panel text is overridden" | P15 §5.3 keeps the Replace confirm; P13 §6 Update from selection "existing confirm + Undo"; Detach all "existing" (has a confirm, INV D15) | Major | Either add these to the SC-15 exception list or replace them with Undo toasts |
| T3-3 | contradiction | P04 §11: empty "No layers yet" + **Add elements** | P16 §4.6: "No elements yet — add a section to start this page" + **Add a section** | Minor | P16 copy wins; edit P04 |
| T3-4 | missing | P04 §7 tree keyboard move (⌥↑/↓, ⌥Home/End) | P11 §11: Pages manager keyboard has F2, ⌘D, ⌫ only; no reorder | Major | Reuse the same chords on focused page rows, plus a "Move up/down" menu item |
| T3-5 | missing | INV #44: Listings score ≠ SEO tab score | Only CP-reg M03-44 "Fix"; no panel picks a model (blocks FG-008) | Major | Pick one model in P11 §7 / P10 SEO; Listings and the tab pill read it |
| T3-6 | missing | P24 #45 "Saved-version delete: out of scope — IAF-18 owns it" | IAF-18 H/I give no Undo, confirm or Recently deleted for a named version | Major | Decide: Undo toast + server soft delete, or a declared SC-15 exception |
| T3-7 | contradiction | P12 §5 History "Kept: … milestone banner" | SC-21 / P20 §0: `useAutoMilestone` not mounted while the flag is off | Minor | Mark the banner inactive (SC-21) in P12 §5 |
| T3-8 | stale | P11 PG-03 keeps the legend ("● unpublished changes") implicitly | P11 §5 renames the dot "● Unsaved"; target silent on the legend | Minor | State whether the legend stays; align its glyph text |
| T3-9 | missing | P15 §5.5 adds a Pages row-menu door "Save as template…" | P11 §5 row-menu list omits it | Minor | Add it to the P11 §5 menu list |
| T3-10 | contradiction | P03 §8: GEO-01 40px row applies to resource lists "(records, assets, pages)" | P11 §5 manager rows 32h; P24 §4.8 Recently deleted rows 32 (P13 list rows 40) | Minor | Pick 32 or 40 for page lists and Recently deleted |
| T3-11 | missing | P23 l.181 / OD-PL-5: page-level custom code is Pro, locked read-only on Free | P11 §7 "Tabs and fields unchanged", no Pro chip or lock state in Advanced | Minor | Add the Pro chip / lock state to P11 §7 Advanced |
| T3-12 | missing | P24 §4.1 #34 covers move-to-folder Undo | Folder delete ("pages kept") recovery and folder-row anatomy are unspecified | Minor | Add a matrix row (toast Undo re-creates folder, like P24 #27) |
| T3-13 | ambiguity | P11 PG-10: SEO tab "Indexed/Hidden" select | P11 PG-10: Advanced "indexing" toggle, both kept | Minor | One writer, one control; the other becomes a read-only line |
| T3-14 | missing | INV D14: Tablet/Mobile/hover edits on an instance are not recorded as overrides | P13 §7 only fixes positional keys for revisions; SC-13 cascade not applied to instances | Major | State the instance-override rule per breakpoint and state in P13 §9 |
| T3-15 | missing | INV E1: 27-component DS catalogue, invisible | P03 §6.3a Catalog components = 14 block ids (different set); only CP-reg names E1 | Minor | Record a disposition (surface in Add, or Defer) in P03 §7 |
| T3-16 | stale | IAF-04 H (module-specifications.md:207): plain Enter = newline, ⌘Enter generates | P03 §6.4 + SC-10: Enter generates, ⌘Enter alias | Minor (deferred) | Mark IAF-04 H superseded |
| T3-17 | stale | CP-reg l.17: IAF-06 home "Add → Templates workspace" | SC-10 / P15: primary entry Pages → New page; SC-11 noun "area" | Minor | Update CP-reg home text |
| T3-18 | ambiguity | SC-11: "Element — any registered type (69 types)" | INV G1: 52 engine element types; 69 = BIC block records | Minor | Say "69 block types (52 element types)" |
| T3-19 | missing | INV #111 Saves filter, #124 Session keys j/k/g/G | Only CP-reg rows; absent from P12, SC-12 and P18 sheet | Minor | List them in P12 §5 History and the shortcuts sheet, or Defer |
| T3-20 | missing | INV A42: sample copy "Aquibra", "© 2024 Buildrick", emoji social icons | Only CP-reg M04-A42 "Redesign"; no content spec | Minor | Add a block sample-content line to P03 §6.5 |
| T3-21 | ambiguity | SC-12: ⌘⇧V Paste HTML is **Canvas scope only** | P03 AD-01/§6.8: ⌘⇧V shown on the Add ⋯ menu (focus in Add) | Minor | Define whether Add-panel focus counts as Canvas scope |
| T3-22 | missing | INV #133: Activity states (no site, empty, error + Retry, permission → dashboard) | P12 §5/§6 say "states" only | Minor | Restate the four states in P12 §5 Activity |
| T3-23 | ambiguity | SC-12: "/" focuses area search (Global) | P11 does not say whether "/" reaches the Pages manager search (sheet, not an area) | Minor | State it in P11 §11 |
| T3-24 | missing | INV #79: built-in templates insert literal colours (L4-024 owner default: re-author on semantic tokens) | P15 §4.1 changes copy only | Minor | Record the re-author decision or a Defer in P15 §11 |
| T3-25 | missing | INV A32: L1-029 tip stacking open | P03 §10 "kept", P16 FR-14 "unchanged"; no arbitration | Minor | One-coach-at-a-time rule in P16 |
| T3-26 | missing | INV D18 / L2-020: master thumbnail blank for light-on-dark | P13 §4 puts a thumbnail on every row; fix not specified | Minor | Specify a thumbnail background / fallback in P13 §4 |
| T3-27 | missing | INV #8: Pages no-results lacks Clear search | P11 target silent | Minor | Adopt the Add/Templates pattern (copy + Clear search) |

## Consistency notes

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

## Counts

Traceability rows: **216** (245 INV table rows; 29 merged into ranges: #3–4, A10–11, A21–22, A27–29, A33–34, B1–5, D11–12, D19–20, D22–23, D27–28, F1–2, F4–9, F10–11, F12–20).

| Coverage | Rows |
|---|---|
| COVERED | 138 |
| PARTIAL | 38 |
| OMITTED | 0 (CP-reg names every row; register-only rows counted PARTIAL) |
| DEFERRED-BY-DECISION | 12 |
| REMOVED-N/A | 24 |
| CONFLICT | 4 (F-PG-071, F-PG-086, F-AD-026, F-AD-052) |

By family: F-PG 137 rows (INV Pages…Shared, 138 rows) · F-AD 79 rows (INV Add…Element types, 107 rows).
Contradictions & gaps: 27 — Critical 0 · Major 6 (T3-1, T3-2, T3-4, T3-5, T3-6, T3-14) · Minor 21. Principle observations: 16 (PASS-SPEC 6, NEEDS REVISION 10).
