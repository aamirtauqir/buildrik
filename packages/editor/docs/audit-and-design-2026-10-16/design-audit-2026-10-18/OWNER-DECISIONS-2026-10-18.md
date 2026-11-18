# Owner decisions — 2026-10-18

Source: decision sheet https://claude.ai/artifact/VJc2iexSu7zeSSAfNPs4aA (collection `decisions`, read back 2026-10-18).
Owner chose **"Accept recommendations for unanswered"**: all 45 decisions = option **A** (the recommended option), no notes, saved 2026-10-17 21:01 UTC.
Status: **APPROVED by owner.** Not yet applied to the panel docs (fix list: FINAL_DESIGN_QA_REPORT §4).

| ID | Decision (option A) |
|---|---|
| S1 | "Restore my edits" checks the server first; server newer → Download my copy + Compare, never silent overwrite |
| S2 | SC-15 three classes: Undo-only · consequence confirm · typed confirm (lists in CROSS_SCREEN_CONSISTENCY_AUDIT CS-01) |
| S3 | One unsaved-changes dialog: Keep editing · Discard changes · Save and leave (Save only where an explicit Save exists) |
| S4 | Overwrite first saves "Before overwrite" to History › Saves |
| S5 | Named-version delete = Undo + 30-day Recently deleted (needs server soft delete) |
| S6 | CMS conflict shows field diff; Keep mine rebases only changed fields |
| S7 | Blocking publish check when the Vercel plan can't password-protect |
| S8 | Password field type hidden for new forms; existing ones keep working with an Inspector warning |
| P1 | E-commerce deferred; existing product blocks render, text/images editable, "Commerce editing is planned" |
| P2 | Export "Soon" tiles removed until planned |
| P3 | Brand "From logo or URL" ships this version (not AI); engineering moves it off the dsAi flag |
| P4 | Component variant authoring deferred |
| P5 | 27-component DS catalogue stays in code, no UI (reserved for future AI Build tab) |
| P6 | Classes selector deferred to the classes arc |
| P7 | Pro everywhere; Beginner path removed |
| P8 | Scheduled-publish stub removed until built |
| P9 | Light chrome only this version |
| P10 | No per-record CMS history this version; phrase removed from FD-DYN |
| P11 | Multi-reference fields deferred; "contains any of" hidden |
| P12 | Removed features stay gone except those the panel docs revived |
| C1 | Keep 1440 Desktop frame + Fit; selection chrome zoom-independent; one-click 100% |
| C2 | Context menus: fixed group order everywhere + element-type group on canvas (registry actions only) |
| C3 | Multi-select hides resize handles this version |
| C4 | Tab cycles elements; Enter on selection = keyboard resize; Shift+Enter line break; Enter in list = new item; Esc/click-out commits |
| C5 | Marquee = Shift+drag anywhere, selects at one depth |
| C6 | Image dropped on image inserts; centre "Replace image" zone replaces |
| C7 | Instance edits at Tablet/Mobile/hover recorded as overrides (SC-13 cascade) |
| N1 | "Components ›" in Add header + Layers instance link (no rail item) |
| N2 | This site = local masters + adopted library items (once); Library = not yet on this site |
| N3 | One SEO score (SEO-tab model) shown in Listings too |
| N4 | Issues chip left of Publish only when Blocking/errors exist |
| N5 | URL keeps area, record, task; IA-07 fallback |
| N6 | One bell grouped This site / Other sites |
| N7 | Templates re-authored on Brand tokens, no purple; interim "Connect to Brand colours" offer |
| N8 | Starters renamed generically, violet recoloured |
| V1 | 40px rows for thumbnail resource lists (Pages included); tool lists 32 |
| V2 | Info banners neutral grey + icon |
| V3 | Red alignment guides |
| V4 | Menus/popovers get `shadow-drag`; anti-slop #10 reworded "no decorative shadows" |
| V5 | Motion tokens only 100/160/240; no pulse |
| V6 | Header ladder: area 20/600 · panel/task 14/600 · section 12/600 sentence case |
| V7 | Popover widths 240/280/360 |
| V8 | Brand preview fixed 468 (Panel 09 wins over IAF-10 F) |
| V9 | Keep ink token #111827; reword DESIGN.md NO BLACK rule |
| R1 | User validation before first-run Figma: 5 interviews now, 5-user prototype test with first Figma pass |

Consequence: DS-OD-1…12 in DESIGN_SYSTEM_SPECIFICATION §7 and OD-A1…A10 in FINAL_DESIGN_QA_REPORT §5 are now decided as recommended. DESIGN.md changes (V1, V4, V5, V6, V9 and §6 corrections) are approved deviations per CLAUDE.md.

Note: **P3 supersedes OD-A4.** The audit's earlier OD-A4 recommendation (hide Brand "From logo or URL") was written before Panel 20 confirmed the feature is not AI; the decision sheet's P3 (ship it, decouple from dsAi) is the approved one.

## Round 2 — 16 follow-up questions (asked in chat, 2026-10-18)

Status: **APPROVED and APPLIED 2026-10-18** (marked *(R-1018b)* in the docs). Q12 found Sources today = pasted JSON only, in-memory, consumed only by legacy Conditions — spec in panels/07-CMS.md §10.1 covers that scope; two follow-ups open (fetching source type, binding element properties to Sources).

| ID | Question | Owner answer |
|---|---|---|
| Q1 | Exit with pending page autosave — "Save and leave"? | **Yes** (flushes the save). SC-24 as reconciled |
| Q2 | Unsaved Settings + Publish/Preview — separate "Save settings first?" prompt? | **Yes**, named variant of SC-24 (Save and publish / Publish without them) |
| Q3 | Brand "applied locally" — guard on leave? | **Only while a save is pending or failed**; no dialog when saved |
| Q4 | Site settings shortcut | **None** — topbar button + ⌘K only (⌘, conflicts with browser settings) |
| Q5 | ⌘\ hides what? | **All panels (focus mode)**, Figma/Framer convention |
| Q6 | Preview vs canvas font/colour drift | **Parity required** (engineering dependency) **+ interim note** in Preview bar until fixed |
| Q7 | Canvas "Bind to CMS field…" lands where? | **Inspector › Content with the field picker open** |
| Q8 | Inherited lock on canvas | **Hover/click badge** "Locked by {parent} — unlock in Layers" |
| Q9 | Brand "Connect" makes a restore point first? | **Yes** ("Before connect") |
| Q10 | One shared bulk bar (Pages, CMS, Assets, Recently deleted)? | **Yes** — "N selected · actions · Clear" |
| Q11 | Per-form filter in submissions inbox? | **Yes** |
| Q12 | CMS › Data › Sources (not persisted today) | **Build it this version** — owner: "is ko bhee karna hai abhi". Design fully; persistence is an engineering dependency (supersedes the "hide until built" option and T4-12) |
| Q13 | Two icon pickers | **One picker, two doors** (Assets › Icons manages; Inspector opens the same picker) |
| Q14 | Auto alt-text toggle (AI) | **Later, with the AI Build tab** (SC-21); manual alt field + publish check stay |
| Q15 | Topbar Publish while in CMS/Assets/Brand area | **Publish opens in the tray** in place (SC-7 pattern) |
| Q16 | Saved-template delete | **Undo + 30-day Recently deleted** (SC-15 class a) |

Not asked (no real choice): dimmed-row text keeps ≥4.5:1 contrast (WCAG); Issues damage-scan copy is writing work — designer drafts it.
