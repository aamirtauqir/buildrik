# V2 Finding → Affected V1 Screens → Implemented → Verified

The founder's checklist shape. One row per Editor v2 finding, 294 in total.

**Implemented** is set only from a read-back — the value Figma returned *after* the
write, in the same call, or a node a pass opened and quoted. Never from a plan and
never from a report.

**Verified** says how the claim was checked a second time:
`verify-invariants.mjs` (loose / overlap / out-of-bounds / dangling, whole page),
`board-baseline.mjs` (per-section board counts diffed against a baseline taken before
the first write), and `verify-applied.mjs`, which re-reads sampled nodes independently
of the code that wrote them — **83 sampled, 82 matched, 1 divergence explained** (a
section name carrying a live board count that `add-state-board` had since bumped).

## Totals

| status | count | meaning |
|---|---|---|
| IMPLEMENTED | 255 | applied and read back |
| IMPLEMENTED-AS-RULE | 6 | stated as a rule on a board; its host screen is not built, and drawing a substitute would be a false claim |
| PARTIAL | 9 | board drawn, one piece owed — each row names which |
| OPEN-DECISION | 3 | drawn as a decision for the founder, not silently resolved |
| NOT-APPLICABLE | 10 | examined, with the reason recorded |
| DEFERRED-BY-DECISION | 1 | deliberate no-op with its reason |
| DO-NOT-IMPLEMENT | 10 | refuted by the QA pass — drawing these would put an overturned claim on a board |
| **PENDING** | **0** | |

| V2 finding | module | affected V1 screen · sections | implemented | verified |
|---|---|---|---|---|
| `UX-G-01` | ai | AI panel · not-configured state · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-02` | ai | AI panel — left drawer vs inspector col… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-03` | ai | Inspector · multi-select toolbar → AI p… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-04` | ai | AI panel · quota · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-05` | ai | Pages · SEO tab · 'Write with AI' + Med… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-06` | ai | Media · asset detail (sidebar) vs Media… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-07` | ai | Brand · Components · '✨ Generate with A… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-08` | ai | Brand · Components · AI prompt modal · … · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-09` | ai | History · version compare · 'Get AI Sum… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-10` | ai | AI · one mark, one verb, one contract (board B) — 2846:21490 / 21492 · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-11` | ai | Canvas · AI prompt popover · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-15` | ai | Keyboard shortcuts sheet · Panels · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-16` | ai | ⌘K command palette · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-19` | ai | AI panel · idle · TRY suggestions · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-20` | ai | AI · one mark, one verb, one contract · AI · placement — what earns a door, and what must never have one · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-21` | ai | AI · where the repetition is — Content + Insert doors (board C) — 2846:21601-21603, 21609-21611 · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-22` | ai | AI · placement — what earns a door, and what must never have one · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-23` | ai | AI panel · out-of-credit and not-config… · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-24` | ai | AI · module summary line — TEXT 2872:12431 on board A · 12 · AI (25) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-26` | brand | Brand › Import / export · IMPORT · Reso… · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-27` | brand | Brand › Import / export · IMPORT · deta… · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-28` | brand | Brand › Import / export · IMPORT · drop… · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-29` | brand | Brand › Import / export · IMPORT · deta… · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-30` | brand | Brand › Starters · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-31` | brand | Brand › Tokens › token detail · Rename … · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-32` | brand | Brand · root · preview strip · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-35` | brand | Brand · import-export (153:120) · 07 · Brand (51) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-01` | content | 155:50 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-02` | content | Content panel > root · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-03` | content | Content panel > Conditions · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-05` | content | 155:50 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-06` | content | 155:49 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-07` | content | Content panel > record  vs  Records mod… · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-08` | content | Content panel > record (new) · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-09` | content | Content panel > Dynamic pages · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-10` | content | Inspector > binding popover · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-11` | content | Content panel > Fields  /  Create colle… · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-12` | content | Content panel > record · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-14` | content | Content panel > record  /  Records modal · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-15` | content | 155:47 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-16` | content | Content panel > Sources · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-17` | content | Content panel > Sources · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-18` | content | Content panel > Variables · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-19` | content | 2429:12111 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-20` | content | 1170:4713 · 155:47 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-21` | content | E-commerce collection setup dialog · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-22` | content | Create collection wizard · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-23` | content | Content panel > collection  /  Records … · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-24` | content | Content panel > Conditions · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-27` | content | 162:2 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-28` | content | 1170:4749 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-29` | content | Content panel > collection · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-C-30` | content | 148:2 · 06 · Content (37) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-01` | history | History › Saves › All changes · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-02` | history | History › Time-Travel drawer · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-03` | history | History › Time-Travel drawer · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-04` | history | History › Time-Travel drawer + canvas · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-05` | history | History › Saves › All changes · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-06` | history | History › Saves › All changes · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-07` | history | History › Saves › All changes · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-08` | history | History › Saves · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-09` | history | History › Saves (filter chips) · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-10` | history | History › Time-Travel drawer · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-11` | history | History › Time-Travel drawer · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-12` | history | History › Time-Travel drawer · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-13` | history | History › Time-Travel drawer · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-14` | history | 162:2 · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-15` | history | 2894:12612 · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-16` | history | History › Saves (approval band) · 16 · History (35) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-01` | insert | Canvas (drop from Insert) · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-02` | insert | Block picker modal (canvas + button) · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-03` | insert | 1706:8501 · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-04` | insert | Insert panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-05` | insert | Insert panel · BLOCKS group · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-06` | insert | Insert panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-07` | insert | Insert panel + onboarding checklist · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-08` | insert | Insert panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-09` | insert | Insert panel · ELEMENTS group · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-10` | insert | Insert panel · ELEMENTS group · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-11` | insert | Insert panel · search · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-12` | insert | Insert panel · search · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-13` | insert | Insert panel · search · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-14` | insert | Insert panel · tips band · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-15` | insert | Insert panel · tips band · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-16` | insert | Insert panel · transition callout · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-17` | insert | Insert panel -> Media panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-18` | insert | Insert panel / canvas drop · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-19` | insert | Canvas (dragging from Insert) · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-20` | insert | Insert panel / canvas · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-22` | insert | Insert panel / canvas drop · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-23` | insert | Insert panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-24` | insert | Insert panel · MINE group · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-25` | insert | Insert panel + Components panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-28` | insert | Insert panel · BLOCKS -> CMS modal · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-29` | insert | Insert panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-A-31` | insert | Insert panel · 26 · REVIEW · Insert (3) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-01` | inspector | Inspector · no selection · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-02` | inspector | Inspector · locked element · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-03` | inspector | Inspector · multi-selection · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-06` | inspector | Inspector · scope pill ('Whole site') · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-08` | inspector | Inspector · slider / tabs / accordion /… · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-09` | inspector | Inspector · form element · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-10` | inspector | Inspector · whole panel · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-11` | inspector | Inspector · section headers · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-12` | inspector | Inspector · Spacing, Size, Position, Fl… · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-13` | inspector | Inspector · Flexbox · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-14` | inspector | Inspector · Animation + Interactions · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-15` | inspector | Inspector · Interactions · animation pi… · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-16` | inspector | Inspector · Interactions · 'Choose Trig… · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-17` | inspector | Inspector · footer 'N of M sections app… · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-18` | inspector | Inspector · Visibility · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-20` | inspector | Inspector · breakpoint-override strip · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-21` | inspector | Inspector · state pill (':hover') · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-22` | inspector | Inspector · 'All CSS' and schema Border · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-23` | inspector | Inspector · 'Element properties' · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-24` | inspector | Inspector · CSS classes · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-25` | inspector | Inspector · every property row · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-26` | inspector | Inspector · collapsed sections · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-27` | inspector | Inspector · simplified density · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-28` | inspector | Inspector · Interactions · delete · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-D-29` | inspector | 807:8342 · 08 · Inspector (41) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-14` | layers | Layers panel · tree row · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-15` | layers | Layers panel · tree row · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-16` | layers | Layers panel · tree row · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-17` | layers | Layers panel · tree row eye toggle · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-18` | layers | Layers panel · tree row rename · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-19` | layers | Layers panel · right-click menu · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-20` | layers | Layers panel · right-click menu · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-21` | layers | Layers panel · tree · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-22` | layers | Layers panel · tree · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-23` | layers | Layers panel · tree row eye/lock buttons · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-24` | layers | Layers panel · drag-to-reorder · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-25` | layers | Layers panel · header · 03 · Layers (29) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-01` | media | Media drawer (SlimLauncher, 320) · asse… · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-02` | media | Media drawer · Browse stock overlay · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-03` | media | Media drawer · Browse stock overlay · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-04` | media | Media drawer · Browse stock overlay vs … · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-05` | media | Media drawer · Browse stock / Icons · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-06` | media | Media drawer · Upload · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-07` | media | Media drawer · folder row · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-08` | media | Media drawer · folder row · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-09` | media | Asset detail drill-in (146:2) · Alt text · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-10` | media | Asset detail drill-in (146:2) · hub · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-11` | media | Media drawer · asset grid · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-12` | media | Media drawer · upload progress rows · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-13` | media | Media drawer · header expand · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-H-33` | media | 1160:52 · 144:46 · 144:47 +23 more · 05 · Media (61) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-02` | pages | Page settings — Advanced · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-03` | pages | Page settings — any tab · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-10` | pages | Page settings — SEO / Advanced · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-13` | pages | Pages panel — Add page · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-14` | pages | Page settings modal · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-15` | pages | 1717:17234 · 435:2348 · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-16` | pages | Page settings — SEO — URL slug · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-17` | pages | Pages panel — folders · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-18` | pages | Pages panel — folders · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-19` | pages | Pages panel — Listings vs Page settings · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-20` | pages | Pages panel — Listings view · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-21` | pages | Page settings — Social · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-22` | pages | Page settings — SEO · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-23` | pages | Page settings — SEO / Social · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-24` | pages | Page settings — Advanced · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-25` | pages | 140:15 · 140:16 · 140:2 +2 more · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-26` | pages | Pages panel — command palette · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-28` | pages | 1717:17234 · 435:2348 · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-29` | pages | Pages panel — row and context menu · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-30` | pages | Page settings — Social · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-31` | pages | 140:2 · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-32` | pages | 140:2 · 1717:17234 · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-B-33` | pages | Pages panel — Structure view · 04 · Pages (26) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-02` | publish | Publish panel + Topbar · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-03` | publish | Publish panel · publishing state · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-05` | publish | Published CMS detail pages · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-06` | publish | Publish wizard · Review step · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-07` | publish | Publish panel · failed state · View log · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-08` | publish | Publish panel · publishing state · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-09` | publish | Publish panel · publishing state · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-10` | publish | Publish panel · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-11` | publish | Publish wizard · Review step · Fix links · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-12` | publish | Topbar Publish → Confirm publish modal · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-14` | publish | Export modal · Preview / Code / Export … · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-15` | publish | Export modal · footer · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-16` | publish | Export modal · Options tab · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-17` | publish | Preview overlay · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-18` | publish | Preview overlay · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-19` | publish | Pages · page settings · SEO tab · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-20` | publish | Settings · SEO / Pages · page settings … · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-21` | publish | Pages · page settings · Advanced · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-22` | publish | Content · collection · dynamic pages · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-23` | publish | Confirm publish (both doors) · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-24` | publish | Publish outcome (toast + panel) · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-25` | publish | Publish panel · failed state / publish … · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-26` | publish | Publish panel · just-published state · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-27` | publish | Publish panel · footer · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-28` | publish | Publish panel · Environment · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-29` | publish | Publish panel · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-30` | publish | Publish wizard (no site id) · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-E-31` | publish | 641:2652 · 14 · Preview (8) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-18` | review | Review bar (under the topbar) · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-19` | review | Review bar vs Review panel · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-20` | review | Review › Compare with approved · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-21` | review | Review › Compare with approved · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-22` | review | Review panel · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-23` | review | Topbar pill / Review bar / Review panel · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-24` | review | Publish gate (stale-approval modal) · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-25` | review | Review › round history strip · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-26` | review | Review › reply composer · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-27` | review | Review › Compare › List mode · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-28` | review | Review bar · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-29` | review | History › Saves → Review › Compare · 19 · Client… | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-31` | settings | Settings › any section · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-32` | settings | Settings › Headers, Localization · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-33` | settings | Settings › Redirects · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-34` | settings | Settings › Forms › Submissions · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-35` | settings | Settings (all sections) · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-36` | settings | Settings › savebar · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-37` | settings | Settings › root nav · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-38` | settings | Settings › Custom code, Integrations (s… · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-39` | settings | Settings › Export, Domains, Members, Bi… · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-40` | settings | Settings › all server-backed sections · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-I-41` | settings | Settings › General vs Pages › Page sett… · 21 · Settings/S7 (46) | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-01` | shell | left rail · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-02` | shell | left rail · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-03` | shell | top bar · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-04` | shell | 1177:4804 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-05` | shell | Shortcuts · one screen (? and ⌘/) · 2875:12449 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-06` | shell | Cmd+K palette · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-08` | shell | Issues panel · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-09` | shell | Quick preview overlay · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-10` | shell | 66:225 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-11` | shell | top bar · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-12` | shell | site menu / Settings · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-13` | shell | full-page mode (Settings, Media library) · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-14` | shell | Shell · below 1024 — desktop-only · 2844:12149 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-15` | shell | left drawer · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-16` | shell | Topbar · location line — site › page › panel · 2844:12121 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-18` | shell | canvas · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-19` | shell | canvas · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-20` | shell | top bar · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-21` | shell | top bar · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-22` | shell | canvas / footer · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-23` | shell | Canvas · keyboard, zoom and viewport (one owner each) · 2855:12407 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-24` | shell | canvas · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-26` | shell | Notifications · unread (165:2) · 963:4474 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-27` | shell | footer / Structure popover · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-28` | shell | Canvas · keyboard, zoom and viewport (one owner each) · 2855:12407 · 2875:12448 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-29` | shell | site menu (...) · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-30` | shell | site menu / Publish panel · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-31` | shell | Shortcuts · one screen (? and ⌘/) · 2844:12025 · 2875:12449 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-32` | shell | canvas overlay toggles · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-33` | shell | canvas empty state · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-34` | shell | status footer · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-35` | shell | 2272:11904 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-36` | shell | 2844:12121 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-F-37` | shell | 2844:12025 · 13 · Command palett… | IMPLEMENTED | VERIFIED — read-back |
| `UX-G-12` | ai | Inspector column when AI is open · 12 · AI (25) | IMPLEMENTED-AS-RULE | VERIFIED — read-back |
| `UX-G-13` | ai | AI panel · chat · applied edit · 12 · AI (25) | IMPLEMENTED-AS-RULE | VERIFIED — read-back |
| `UX-G-14` | ai | AI panel · agent run · auto-apply · 12 · AI (25) | IMPLEMENTED-AS-RULE | VERIFIED — read-back |
| `UX-C-13` | content | Inspector > binding popover · 06 · Content (37) | IMPLEMENTED-AS-RULE | VERIFIED — read-back |
| `UX-C-26` | content | Inspector > binding popover · 06 · Content (37) | IMPLEMENTED-AS-RULE | VERIFIED — read-back |
| `UX-D-19` | inspector | Inspector · Visibility → Layers · 08 · Inspector (41) | IMPLEMENTED-AS-RULE | VERIFIED — read-back |
| `UX-B-04` | pages | Pages panel — Delete page confirm · 04 · Pages (26) | PARTIAL | PARTIAL — 1 landed, 0 refused, 1 missing — UX-B-04 — IMPLEMENTED. Board 2898:2217… |
| `UX-B-06` | pages | Pages panel — page tree · 04 · Pages (26) | PARTIAL | PARTIAL — 1 landed, 0 refused, 1 missing — UX-B-06 — IMPLEMENTED (board), DOOR OW… |
| `UX-B-07` | pages | Pages panel — page tree · 04 · Pages (26) | PARTIAL | PARTIAL — 1 landed, 0 refused, 1 missing — UX-B-07 — IMPLEMENTED (board), DOOR OW… |
| `UX-B-08` | pages | Pages panel — inline rename · 04 · Pages (26) | PARTIAL | PARTIAL — 1 landed, 0 refused, 1 missing — UX-B-08 — IMPLEMENTED (board), DOOR OW… |
| `UX-B-09` | pages | Canvas page tab bar — rename · 04 · Pages (26) | PARTIAL | PARTIAL — 2 landed, 0 refused, 1 missing |
| `UX-B-11` | pages | Pages panel — bulk delete · 04 · Pages (26) | PARTIAL | PARTIAL — 2 landed, 0 refused, 1 missing — UX-B-11 — IMPLEMENTED (board), DOOR OW… |
| `UX-B-12` | pages | Pages panel — bulk toolbar · 04 · Pages (26) | PARTIAL | PARTIAL — 2 landed, 0 refused, 1 missing — UX-B-12 — IMPLEMENTED (board), DOOR OW… |
| `UX-B-27` | pages | Pages panel — after a failed load · 04 · Pages (26) | PARTIAL | PARTIAL — 3 landed, 0 refused, 1 missing |
| `UX-F-25` | shell | Notifications · unread (165:2) · 963:4474 · 963:4761 · 13 · Command palett… | PARTIAL | PARTIAL — 3 landed, 1 refused, 0 missing |
| `UX-D-04` | inspector | Inspector · scope pill ('This ▾') · 08 · Inspector (41) | OPEN-DECISION | VERIFIED — read-back |
| `UX-D-05` | inspector | Inspector · scope pill ('All like this') · 08 · Inspector (41) | OPEN-DECISION | VERIFIED — read-back |
| `UX-D-07` | inspector | Inspector · properties registry · 08 · Inspector (41) | OPEN-DECISION | VERIFIED — read-back |
| `UX-G-17` | ai | Dashboard · Settings · AI credits · 'Mo… · 12 · AI (25) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-G-18` | ai | Dashboard · /onboarding/ai/* vs /dashbo… · 12 · AI (25) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-A-21` | insert | Canvas · 26 · REVIEW · Insert (3) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-A-26` | insert | Command palette · 26 · REVIEW · Insert (3) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-A-27` | insert | Canvas context menu · Insert submenu · 26 · REVIEW · Insert (3) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-A-30` | insert | NO SCREEN — the fix is a code deletion (`handleQuickAdd` renders nothing); recorded as open decision 5 | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-A-32` | insert | Insert panel · 26 · REVIEW · Insert (3) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-A-33` | insert | NO SCREEN — module summary; used as the door inventory the other 32 Insert findings were walked against (137:2) | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-H-34` | layers | NO SCREEN — module summary; exactly the union of UX-H-14/17/18 and UX-H-21/22 | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-B-34` | pages | NO SCREEN — module summary, no fix field; its thesis is the union of the Pages findings | NOT-APPLICABLE | N/A — examined, not applicable; reason recorded in REGISTER.md |
| `UX-F-17` | shell | page tabs / Pages panel · 13 · Command palett… | DEFERRED-BY-DECISION | VERIFIED — read-back |
| `UX-C-04` | content | Content panel > record / Records modal · 06 · Content (37) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-C-25` | content | Command palette · 06 · Content (37) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-B-01` | pages | Pages panel — page row · 04 · Pages (26) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-B-05` | pages | Pages panel — page tree · 04 · Pages (26) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-E-01` | publish | Publish panel (rail · U) · 14 · Preview (8) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-E-04` | publish | Publish panel · no publish path · 14 · Preview (8) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-E-13` | publish | Export modal · 14 · Preview (8) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-I-17` | review | 161:11 · 161:12 · 19 · Client… | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-I-30` | settings | Settings (full page) vs Project setting… · 21 · Settings/S7 (46) | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
| `UX-F-07` | shell | Issues panel · 13 · Command palett… | DO-NOT-IMPLEMENT | N/A — refuted, must not be drawn |
