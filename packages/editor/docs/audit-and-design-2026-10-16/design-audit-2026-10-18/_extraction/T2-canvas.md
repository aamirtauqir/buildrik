# T2 — Canvas feature inventory and traceability (INV lines 361–616)

Audit only. Spec level only: no hi-fi screens exist, runtime NOT RUN, no Figma, no browser.

## Scope read

| File | Lines read | Notes |
|---|---|---|
| `_extraction/EXTRACTION-BRIEF.md` | all | |
| INV `docs/editor-feature-inventory-2026-10-16.md` | 355–616 | Canvas chapter. Its §1–§16 tables cover 361–593 (154 rows). Lines 595–606 are "Not verified" and the status counts. Lines 609–616 start the next chapter (Pages/Templates), which is out of scope. |
| P/00-SHARED-CONTRACTS.md | 1–360 (all) | |
| P/05-CANVAS.md | 1–201 (all) | |
| D/PRODUCT-DESIGN-BRIEF.md | 1012–1166 (as assigned), plus 150–215 | 150–215 hold the P1-D register and the FI-01/FI-02 integrity rows, which several canvas rows cite. |
| P/04-LAYERS.md | 15–42, 78–141, 159–183 | Show in Layers, menu, multi-select, lock, dim, hover |
| P/24-UNDO-COVERAGE.md | 4–118 | coverage matrix rows 1–37 |
| P/21-COLLABORATION.md | 12–36, 52–96, 121–228 (grep-targeted) | |
| P/19-INTERACTIONS.md | 9–39, 54–117, 218–231, 275 (grep-targeted) | |
| P/17-CLIENT-REVIEW.md | 23–35, 67–112, 160–255 (grep-targeted) | |
| P/16-FIRST-RUN.md | 26, 42, 51–67, 92, 138, 153–154 | |
| P/18-COMMAND-PALETTE-AND-HELP.md | 43–62, 114–137, 186–190, 245–255 (grep-targeted) | |
| P/22-GLOBAL-STATES.md | 28–39, 75–96, 137, 151–156, 215–216 (grep-targeted) | |
| P/03-ADD.md, P/08-ASSETS.md, P/01-TOPBAR.md, P/06, P/12, P/13 | grep hits only | |
| P/REVIEW-2026-10-17-pro-product-design.md | 41, 59–77, 137–138 | |
| P/ENGINEERING-BACKLOG-2026-10-17.md | grep for canvas, FI, U-1 | |
| D/CMS-DYNAMIC-BINDING-DESIGN.md | 30, 49, 65, 83, 102, 266–328 (grep-targeted) | |
| D/REMAINING-IA-HANDOFF.md | 100–125 | |
| D/evidence/ia-final-2026-10-16/capability-preservation.md | 1–30, 203–356 (rows M02-1.1 … M02-16.2) | The FD-IA-09 register maps every canvas INV row to a disposition. |
| D/evidence/ia-final-2026-10-16/module-specifications.md | 63–117 (IAF-02) | |
| /buildrik/DESIGN.md | 41, 205–216, 511, 532 | accent usage rule |

**Skipped:** P/02, 07, 09–15, 20, 23 and 25, except for grep hits (none had canvas-specific content beyond what is cited). REPORT.md, ARCHITECTURE-DECISION.md (SUPERSEDED) and IMPROVEMENT-PLAN.md were excluded from the evidence for coverage. REPORT.md predates the panel set.

**Abbreviations:** P05 = P/05-CANVAS.md · SC-n = P/00-SHARED-CONTRACTS.md · REG = capability-preservation.md row `M02-x.y` · IAF-02 = module-specifications.md:63-117 · FDB = PRODUCT-DESIGN-BRIEF.md · FD-DYN = CMS-DYNAMIC-BINDING-DESIGN.md.

**Coverage rule applied:**
- **COVERED** — a panel or SC section gives the location, and either lists the controls and states directly or keeps them by explicit reference to an enumerated "Today" row (for example "CV-10 kept").
- **PARTIAL** — named, but missing controls, states or a decision. "REG-only" means the only mention is a one-line disposition in the FD-IA-09 register: it names the home "IAF-02 · canvas" but gives no controls and no states. Every canvas INV row has a REG row, so no row is strictly OMITTED. REG-only rows are the closest equivalent.

## Traceability

| FID | Feature | INV | Line | Design home | Ctrl | States specified | Inter. | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-CV-001 | Page card on grey canvas | ✅ | 365 | P05 §4, §9 (wrapper 24 gutter, frame radius 12) | Y | authored frame width; Fit | P | COVERED | 1440 frame (P05 §5) is wider than the 752 px column, so behaviour rests on Fit. REVIEW §7:71: about 52 % zoom on laptops, unresolved |
| F-CV-002 | Auto fit-to-width on load | ✅ | 366 | P05 §5 Desktop width ("Fit zoom on load is unchanged"), Remember view | Y | load → Fit; reload → Desktop + Fit | Y | COVERED | Sub-100 % default is where INV 6.4/7.6 bite; resize compensation specified, marquee compensation not |
| F-CV-003 | Click grey surround to deselect | ✅ | 367 | P05 CV-08 kept; P04 §7 "Empty-canvas click … deselects only" | Y | deselect; Layers stays open (Change) | Y | COVERED | |
| F-CV-004 | Page links/forms can't navigate editor | ✅ | 368 | P05 CV-18 "DOM render … with navigation guard" kept | P | — | P | PARTIAL | Named only; no states (for example feedback when a link click is swallowed) |
| F-CV-005 | Live widget runtimes on canvas | ✅ | 369 | REG M02-1.5 Keep | N | — | N | PARTIAL | REG-only. Relation to "canvas never runs interactions" (P19 §5.3) not stated |
| F-CV-006 | CMS preview + Collection list repeat | 🟡 | 370 | FD-DYN §12–13, D5; P05 §5 Record ▾, View › Show drafts | Y | published default, Show drafts, 0 records, inert copies 2..N, status line | Y | COVERED | Resolves L3-017 (D5: canvas follows Show drafts) |
| F-CV-007 | Animations + global custom CSS live on canvas | ✅ | 371 | REG M02-1.7 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-008 | Locked element styling | ✅ | 372 | P05 §8 Locked element; SC-14 | Y | dotted outline, not-allowed, no handles, badge | Y | COVERED | Canvas marker for SC-14 *inherited* (descendant) lock not specified; Layers only (T2-29) |
| F-CV-009 | Hidden (Layers eye) element | ✅ | 373 | P04 §6 "Dim in editor" | Y | dimmed; selectable from Layers; tooltip "still published" | Y | COVERED | Renamed. Canvas 25 % rendering kept implicitly ("same behaviour", P04:163) |
| F-CV-010 | Hidden-per-breakpoint | ✅ | 374 | SC-13; IAF-02 I; P04 §5 markers | Y | hidden at current breakpoint; reachable via Layers | P | COVERED | |
| F-CV-011 | Empty container placeholder copy | 🐞 | 375 | REG M02-1.11 Fix | N | — | N | PARTIAL | REG-only. The stale hint names a removed "+" control; no doc gives the new copy (T2-23) |
| F-CV-012 | Empty column label | ✅ | 376 | REG M02-1.12 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-013 | Src-less image placeholder | ✅ | 377 | REG M02-1.13 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-014 | Drop/insert flash + settle | ✅ | 378 | REG M02-1.14 Keep | N | — | N | PARTIAL | REG-only. No motion spec, no reduced-motion rule for chrome |
| F-CV-015 | Layers-row ↔ canvas hover | ✅ | 379 | P05 §6 Hover; P04 §7 "Hover locate" | Y | two-way hover; crumb hover | Y | COVERED | |
| F-CV-016 | Read-only / view mode | ✅ | 380 | P05 §8 Read-only; SC-6 Canvas row | Y | withheld actions; breadcrumbs select-only; Undo/Redo hidden | Y | COVERED | Change: Undo/Redo hidden for viewers |
| F-CV-017 | "Pick an element" mode | ✅ | 381 | P05 §8 "Choose on canvas" (Components); P19 §4.3 "Pick on canvas…" | P | banner, eligible hover, not-allowed + reason, Esc | P | PARTIAL | The spec covers only the Components and Interactions pickers. The general Inspector crosshair mode (INV 1.17) is not named and is not shown to share that contract |
| F-CV-018 | Screen-reader live region | ✅ | 382 | P05 §10 | Y | selection announcement copy | Y | COVERED | |
| F-CV-019 | Breakpoint switch | 🟡 | 388 | P05 §5 Breakpoint segments; SC-13; §7 "Editing Tablet" | Y | active segment non-colour; label in frame; cascade | Y | COVERED | Fixes UX-06 |
| F-CV-020 | Wide 1920 | ❌ | 389 | P05 §5 Width field presets; SC-13 | Y | Desktop preset, not a breakpoint | Y | COVERED | Revived by the docs as a preset. REG says Defer: stale (T2-15). IAF-02 F still lists Wide alongside the breakpoints |
| F-CV-021 | Watch device | ❌ | 390 | — | — | — | — | REMOVED-N/A | No doc revives it |
| F-CV-022 | Re-fit zoom on breakpoint switch | ✅ | 391 | P05 §5 Remember view | N | — | P | PARTIAL | Remember view keeps zoom per page. It does not say whether a breakpoint switch still re-fits (T2-21) |
| F-CV-023 | Width label under page | ✅ | 392 | — (P05 §5 width field + §7 "Editing Tablet" label) | N | — | N | PARTIAL | Not mentioned. Whether it is replaced or kept is undecided (REG Keep) |
| F-CV-024 | Custom width | ✅ | 393 | P05 §5 Width field; IAF-02 H | Y | invalid draft + inline error, Enter/Esc, saved per site | Y | COVERED | Modal retired. Strict parsing (T-CV-06, T-CV-15) |
| F-CV-025 | Device frame | 🟡 | 394 | P05 §5 View ▾ "Show device frame" | Y | Tablet/Mobile only | Y | COVERED | Moving it into the View menu removes the inline-style button |
| F-CV-026 | "Desktop" = three widths | 🟡 | 395 | P05 §5 Desktop authoring width; SC-8; P01 §5.8 | Y | 1440 canvas = Preview = export | Y | COVERED | |
| F-CV-027 | Zoom menu | ✅ | 401 | P05 §5 Zoom | Y | presets, Fit, Zoom to selection, ⌘/Ctrl+scroll, pinch, 10–400 | Y | COVERED | Adds the Zoom-to-selection row that INV says is missing |
| F-CV-028 | View › Zoom submenu | ✅ | 402 | P05 §5 View ▾ (row list omits Zoom ▸/Breakpoint ▸) | P | — | P | PARTIAL | Removal of the duplicate door is implied, not stated. P05 §11 "CV-03 … Keep + extend" is ambiguous |
| F-CV-029 | Zoom keys | ✅ | 403 | SC-12 (⇧1, ⇧2, ⇧0, ⌘0 alias); P05 §5 | Y | per-browser acceptance | Y | COVERED | INV 3.4 "(also ⌘K)" zoom-to-selection alias is not addressed. ⌘K is the palette (T2-20) |
| F-CV-030 | Zoom to fit / to selection | ✅ | 404 | P05 §5 Zoom | Y | — | Y | COVERED | |
| F-CV-031 | Zoom-aware overlays | 🟡 | 405 | P05 §6 Resize ("bounds zoom-compensated") | P | — | P | PARTIAL | Only resize is compensated. Marquee (7.6) and W×H pill placement are not (T2-12) |
| F-CV-032 | Empty-page CTA | 🟡 | 411 | P16 §4.1 (supersedes P05 §8) | Y | one primary path, Start blank persisted | Y | PARTIAL | UX-01 (clips at 1280×720) and UX-02 (competes with tips) have no geometry or short-height rule (T2-25) |
| F-CV-033 | Template cards in empty CTA | 🟡 | 412 | P16 §4.1 | Y | card → that template's preview (Replacing mode) | Y | COVERED | Fixes UX-03. Board 4428:44164 stale (F-5) |
| F-CV-034 | Add a block / Describe doors | ✅ | 413 | P16 §4.1 "+ Add a section"; SC-21 | Y | Describe hidden | Y | COVERED | Describe = DEFERRED-BY-DECISION (SC-21) |
| F-CV-035 | Start blank | ✅ | 414 | P16 §4.1 | Y | persisted per page per user (F-2) | Y | COVERED | |
| F-CV-036 | Loading skeleton | ✅ | 415 | P05 §8 "Existing skeleton"; P22 §5 boot "one shell skeleton" | P | "Opening {site}…" | P | COVERED | Which skeleton survives is ambiguous: canvas skeleton or the single shell skeleton (T2-27) |
| F-CV-037 | Project unavailable | ✅ | 416 | P22 §4.2 global banner slot; GS-05 | Y | banner kinds, Retry, priority | Y | COVERED | Canvas render error is NEW (P05 §8) |
| F-CV-038 | Default hover | ✅ | 422 | P05 CV-09 kept, §6 Hover | Y | outline + label | Y | COVERED | |
| F-CV-039 | Alt-hover hierarchy | ✅ | 423 | P05 CV-09 "Alt parent chain" kept | Y | — | P | COVERED | No discoverable door (INV note). Not in the P18 sheet BASICS either (T2-37) |
| F-CV-040 | Alt+Shift box model | ✅ | 424 | P05 CV-09 kept | Y | — | P | COVERED | Raw hex in badge and orange/green/blue fills are not tokenized (T2-26) |
| F-CV-041 | Clone badge (⌘ held) | ✅ | 425 | REG M02-5.4 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-042 | Inspector mode (I key) | ❌ | 426 | — | — | — | — | REMOVED-N/A | Also I = AI task (SC-12, inactive) |
| F-CV-043 | Hover drag grip | ✅ | 427 | REG M02-5.6 Keep | N | — | N | PARTIAL | REG-only. Grip is the primary drag affordance but is not in P05 |
| F-CV-044 | Selection box | ✅ | 433 | P05 CV-10, §6 | Y | single / multi / locked / CMS | Y | COVERED | |
| F-CV-045 | Selection tag | ✅ | 434 | P05 CV-10 tag "Type · name" kept | Y | page root "Page" (SC-11) | P | COVERED | |
| F-CV-046 | Resize handles | ✅ | 435 | P05 CV-10; §9 handles 12/8 + focus ring | Y | focusable | Y | COVERED | |
| F-CV-047 | Resize at zoom ≠ 100 % | 🐞 | 436 | P05 §6 Resize (Fix FI-01); FDB FI-01/T-FI-01 | Y | zoom-compensated bounds | Y | COVERED | Engineering fix; specified as acceptance |
| F-CV-048 | Esc cancels resize | 🐞 | 437 | P05 §6 Resize; T-CV-03; P24 row 5 | Y | gesture-only cancel, one Undo step | Y | COVERED | |
| F-CV-049 | NaN risk in resize | 🐞 | 438 | P05 §6 "finite valid values only"; T-FI-01 | P | — | P | COVERED | |
| F-CV-050 | Resize modifiers | ✅ | 439 | P05 CV-12 "with modifiers" | P | — | P | PARTIAL | Modifiers (Shift, Alt, Ctrl snap, min sizes) are not enumerated in any doc. No hint surface |
| F-CV-051 | Multi-select resize | 🐞 | 440 | FDB FI-01 (T-FI-01 "multi-selection"); IAF-02 I | N | — | N | PARTIAL | No decision on hiding handles or wiring multi-resize. REVIEW §7:73 flagged it; not resolved in SC-17 or P05 (T2-6) |
| F-CV-052 | Rotation handle | ✅ | 441 | P05 CV-10 kept | Y | Shift 15°, slider semantics | Y | COVERED | |
| F-CV-053 | Size label while resizing | ✅ | 442 | P05 CV-10; §9 collapse step 2 | Y | — | P | COVERED | Misplacement at zoom ≠ 100 % is folded into FI-01 |
| F-CV-054 | CMS-bound badge | ✅ | 443 | P05 §6 badges | Y | single only | P | COVERED | |
| F-CV-055 | Locked badge | ✅ | 444 | P05 §6; SC-14 one lock copy | Y | "Locked — unlock to edit" | Y | COVERED | Resolves the copy mismatch |
| F-CV-056 | Selection toolbar (single) | ✅ | 445 | P05 CV-11, §6 | Y | inside/outside small elements | Y | COVERED | |
| F-CV-057 | Toolbar caption overlap | 🟡 | 446 | REG M02-6.14 Redesign | N | — | N | PARTIAL | REG-only. P05 §6 "buttons unchanged" is silent on the caption (T2-22) |
| F-CV-058 | Old toolbar actions (parent, + child, wrap, AI…) | ❌ | 447 | P05 §5 Breadcrumbs; SC-3; SC-2 Esc → parent | Y | — | Y | REMOVED-N/A | The capabilities moved: parent via breadcrumbs and Esc, Move/Wrap via the SC-3 menu. AI is SC-21 |
| F-CV-059 | Add-child modal; Edit-with-AI popover | ❌ | 448–449 | — | — | — | — | REMOVED-N/A | AI part also SC-21 |
| F-CV-060 | Bottom breadcrumb bar | ❌ | 450 | P05 §5 Breadcrumbs (toolbar) | Y | overflow, multi "· 3 elements", none = "Page" | Y | COVERED | Revived in the top toolbar. REG Defer is stale |
| F-CV-061 | Footer selection readout | ✅ | 451 | P05 §5 Breadcrumbs last crumb "· 640 × 48"; §11 | Y | dropped at collapse step 2 | Y | COVERED | Move |
| F-CV-062 | Click / Shift / ⌘ cycle / dbl / triple | ✅ | 452 | P05 §6 Selection + Double-click (Fix) | Y | locked → toast | Y | COVERED | Fixes the double-click conflict (T-CV-08) |
| F-CV-063 | Spacing spots | ✅ | 453 | P05 CV-14, §6 Spacing chips; View ▾ Spacing | Y | default off | P | COVERED | |
| F-CV-064 | Multi-select box | ✅ | 459 | P05 CV-10 "combined multi box" | Y | primary solid / others dashed (INV only) | P | COVERED | Visuals are kept only by reference |
| F-CV-065 | Canvas align/distribute toolbar | ❌ | 460 | FDB INS-D12 (Inspector) | — | — | — | REMOVED-N/A | Capability lives in the Inspector |
| F-CV-066 | Toolbar hidden in multi-select | 🟡 | 461 | SC-17 Multi-selection (Duplicate · Delete · Group · More) | P | — | P | PARTIAL | SC-17 adds a multi toolbar. P05 CV-11/§6 still say single-only. Anchor/placement on the combined box is unspecified (T2-1) |
| F-CV-067 | Multi-delete confirm | ✅ | 462 | SC-3 "Delete … never asks"; P24 row 2 | Y | toast "N elements deleted · Undo" | Y | COVERED | Change: confirm removed. REG Keep is stale (T2-16) |
| F-CV-068 | Marquee select | 🟡 | 463 | P05 CV-08/§6 "marquee kept" | P | — | P | PARTIAL | The start rule (only the 20 px strip works) and parent+child co-selection are not addressed (T2-11) |
| F-CV-069 | Marquee at zoom ≠ 100 % | 🐞 | 464 | REG M02-7.6 Fix | N | — | N | PARTIAL | REG-only (T2-12) |
| F-CV-070 | Double-click to edit text | ✅ | 470 | P05 §6 Double-click, Inline text; SC-14 lock | Y | lock refused | Y | COVERED | P21 §4.3 adds the "Ana is typing here" confirm |
| F-CV-071 | Inspector "Edit text on canvas" | ✅ | 471 | REG M02-8.2 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-072 | Floating rich-text toolbar | ✅ | 472 | P05 CV-15 "format bar kept" | Y | — | P | COVERED | Stays an inline-style toolbar outside chrome-ui; migration not specified (P35) |
| F-CV-073 | Inline commit / cancel | 🟡 | 473 | P05 CV-15 (Enter commit, Esc revert); SC-17 field undo; P24 row 7 | Y | field undo → one step | Y | PARTIAL | Enter-always-commits is kept, so the format bar's lists can't get a second item and there are no line breaks (T2-9) |
| F-CV-074 | "Type here..." placeholder | ✅ | 474 | REG M02-8.5 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-075 | View ▾ menu | ✅ | 480 | P05 §5 View ▾ | Y | "View · N", contextual rows | Y | COVERED | UX-06 fixed by moving Breakpoint out |
| F-CV-076 | Overlay chords | ✅ | 481 | SC-12 (⇧R, ⌥B, ⌥X; Canvas scope) | Y | scope Canvas only | Y | COVERED | The scope fixes the "fire behind full-page tools" problem |
| F-CV-077 | Snap / smart guides | ✅ | 482 | P05 §5 View ▾ "Snap guides" | P | — | N | PARTIAL | Toggle only. Guide visuals (magenta lines, red labels) are not specified or tokenized (T2-26) |
| F-CV-078 | Grid overlay + size | 🟡 | 483 | P05 §5 "Grid + pane" | P | — | P | PARTIAL | 10 px default not a preset; unresolved (T2-31) |
| F-CV-079 | Snap-to-grid follows Grid | ✅ | 484 | REG M02-9.5 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-080 | Rulers + guides | ✅ | 485 | P05 §5 "Rulers ⇧R" | P | — | N | PARTIAL | Guide create, move, remove and lock gestures are unspecified (T2-32) |
| F-CV-081 | Guides saved with site | ✅ | 486 | REG M02-9.7 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-082 | Badges; X-Ray | ✅ | 487–488 | P05 §5 View ▾ (⌥B, ⌥X) | Y | — | P | COVERED | |
| F-CV-083 | Component view / Outlines / Dev mode | ❌ | 489 | — | — | — | — | REMOVED-N/A | |
| F-CV-084 | Overlay state remembered | ✅ | 490 | P05 §5 Remember view (breakpoint, width, zoom only) | N | — | N | PARTIAL | Overlay persistence is not stated |
| F-CV-085 | Docked footer bar | ✅ | 496 | P05 §4, §11 (toolbar above canvas) | Y | 44h / two rows 88h | Y | COVERED | Move (BD-10) |
| F-CV-086 | Undo / Redo buttons | ✅ | 497 | P05 §5 Undo/Redo; P24 | Y | disabled, "Undo {label}", area-aware | Y | COVERED | Labels depend on P24 problem 6 (machine words) |
| F-CV-087 | Inspector toggle; Help on bar | ❌ | 498–499 | P18 §4.5 Help popover; ⌘\ | — | — | — | REMOVED-N/A | |
| F-CV-088 | Toasts anchored to canvas | ✅ | 500 | P05 §9 Moved anchors; P22 §5.10 | Y | 16 above toast floor | Y | COVERED | |
| F-CV-089 | Open menu: right-click / Shift+F10 / ⋯ | ✅ | 506 | P05 CV-16; SC-3 columns | Y | multi kept on member hit | Y | COVERED | |
| F-CV-090 | Menu structure | ✅ | 507 | SC-3 registry; P05 CV-16 | P | — | P | PARTIAL | No order or grouping is defined after SC-3 adds rows. IA-02 (clipboard buried, Delete next to AI) is unresolved. The menu is one generic registry, not per type (T2-3, T2-4) |
| F-CV-091 | Keyboard in menu | ✅ | 508 | P05 §10 "Canvas keys unchanged"; P04 §10 (Layers) | P | — | P | PARTIAL | Submenu keyboard is not respecified for canvas |
| F-CV-092 | Menu viewport clamping | 🐞 | 509 | REG M02-11.4 Fix; P04 §10 (Layers menu clamps) | N | — | N | PARTIAL | Canvas menu clamp is not specified (T2-13) |
| F-CV-093 | Disabled-row reasons | 🟡 | 510 | SC-3 ("refusals same for every surface"); SC-14; SC-18 (palette) | P | lock copy | N | PARTIAL | How the reason renders in a canvas menu row is not specified (T2-14) |
| F-CV-094 | Duplicate / Delete rows | ✅ | 511 | SC-3; P24 rows 2–3 | Y | Undo toast | Y | COVERED | |
| F-CV-095 | Copy / Cut / Paste | ✅ | 512 | SC-3 | Y | Paste greyed when empty (INV) | P | COVERED | |
| F-CV-096 | Wrap / Unwrap | ✅ | 513 | SC-3 "Group ≠ Wrap" | Y | — | Y | COVERED | |
| F-CV-097 | Replace with block… | ✅ | 514 | SC-3 (sections) | Y | locked greyed | P | COVERED | Term clash: SC-11 says "Section", not "block" |
| F-CV-098 | Save as component… | ✅ | 515 | SC-3; P13 | Y | — | P | COVERED | |
| F-CV-099 | Arrange front/back | ✅ | 516 | SC-3; SC-12 ⌘⌥]/[ | Y | — | P | COVERED | The label implies z-index but the action moves DOM order; not addressed (T2-33) |
| F-CV-100 | Copy / Paste style | ✅ | 517 | SC-3 | Y | disabled until copied | P | COVERED | |
| F-CV-101 | Lock / Unlock | ✅ | 518 | SC-3 ⌘⇧L; SC-14 | Y | descendants locked | Y | COVERED | |
| F-CV-102 | Group / Ungroup lock gate | 🐞 | 519 | SC-3; P04 §8 "Group … refuse … (existing)"; REG Fix | Y | — | Y | CONFLICT | P04 §8 calls the lock refusal "existing"; INV 11.14 and REG call it a bug (T2-10) |
| F-CV-103 | Bind to CMS field… | ✅ | 520 | SC-3; P06 A1 (binding section retired → per-row bind icon) | P | — | P | PARTIAL | The menu row's landing target after A1 is unspecified (T2-28) |
| F-CV-104 | Add interaction | ✅ | 521 | P19 §5.1; SC-10 | Y | opens Add picker; root disabled + reason; multi "Select one element" | Y | COVERED | |
| F-CV-105 | Improve with AI | ✅ | 522 | SC-21; SC-3 row inactive | — | hidden | — | DEFERRED-BY-DECISION | SC-21 |
| F-CV-106 | Insert rows; Layout "make it…"; Quick Style | ❌ | 523–525 | — (Add drawer; Inspector ⋯ Reset) | — | — | — | REMOVED-N/A | |
| F-CV-107 | Reveal in layers / Select parent rows | ❌ | 526 | SC-3 "Show in Layers ⇧L"; P04 §7; P05 §6 | Y | — | Y | COVERED | Revived as Show in Layers. Select parent comes via breadcrumbs, ←, Esc |
| F-CV-108 | Menu closes on deselect/delete/scroll | ✅ | 527 | SC-2 step 2 (Esc) only | P | — | P | PARTIAL | Close-on-scroll, resize and deselect are not stated |
| F-CV-109 | Windows shortcut hints | ✅ | 528 | SC-12 Platform | Y | — | Y | COVERED | |
| F-CV-110 | Drop highlight / between cue / inside cue | ✅ | 534–536 | P05 CV-13 "drop feedback" kept; IAF-02 H; P03 §5 Target | N | — | P | PARTIAL | No design doc specifies drag-feedback visuals (valid, invalid, between, inside, path pill). Kept only as "existing" (T2-38) |
| F-CV-111 | Add-drawer "Drop into" cue | ✅ | 537 | P03 §5 Target "drag shows existing drop indicator + path note"; SC-14 | P | locked drop refusal "Locked — drop somewhere else" | P | PARTIAL | Same as above |
| F-CV-112 | Invalid-drop badge + messages | ✅ | 538 | IAF-02 H "rejects invalid nesting"; P03 §5 (click reasons) | P | — | P | PARTIAL | Drag messages are not enumerated. P03 click-reason copy ("Can't go inside Heading…") is not reconciled with the drag badge copy |
| F-CV-113 | Drop sources | ✅ | 539 | P03 AD-12/AD-20; P08 "OS file drop on canvas" | Y | — | Y | COVERED | |
| F-CV-114 | Insert toast + Undo | ✅ | 540 | P24 row 1; P22 §5.10 | Y | ≥8 s Undo; selection restore (SC-17) | Y | COVERED | |
| F-CV-115 | Media drop toast text bug | 🐞 | 541 | REG M02-12.8 Fix | N | — | N | PARTIAL | REG-only (T2-24) |
| F-CV-116 | Media drop insert vs replace | ✅ | 542 | P08 §1 (1) picker "replace a selected image"; P08 §3 problem 1 / IAF-09 E "explicit Replace" | P | — | P | PARTIAL | Drop onto an image replaces implicitly, against IAF-09 E's explicit-Replace rule. The docs do not settle it (T2-36) |
| F-CV-117 | OS image drop | ✅ | 543 | P08 §5 "OS file drop on canvas kept", Uploading / Waiting to sync chips; FI-03 | Y | uploading, local-only | Y | COVERED | |
| F-CV-118 | Drop while inline editing | ✅ | 544 | REG M02-12.11 Keep | N | — | N | PARTIAL | REG-only |
| F-CV-119 | Auto-scroll near edges | ✅ | 545 | P05 CV-13 kept | P | — | P | COVERED | |
| F-CV-120 | Nesting rules | ✅ | 546 | IAF-02 H; P03 §5 Eligibility; SC-14 | Y | — | Y | COVERED | |
| F-CV-121 | Drag-move element | ✅ | 552 | P05 CV-13; IAF-02 H (Esc cancels before drop) | P | — | Y | COVERED | Ghost-card and fade visuals are kept only by reference |
| F-CV-122 | ⌘-drag clone | 🐞 | 553 | FDB FI-02 / P1-D17 (clone-drag styles) | N | — | N | PARTIAL | A cancelled clone leaving its copy is in no doc (T2-8) |
| F-CV-123 | Multi-element drag | ✅ | 554 | P05 CV-13 "multi" | P | — | P | COVERED | |
| F-CV-124 | Duplicate/paste keep styles | 🐞 | 555 | FDB FI-02 / T-FI-02; IAF-02 K | N | — | N | PARTIAL | No panel: P05 has no acceptance and P24 row 3 says "Keep" (T2-7) |
| F-CV-125 | Touch long-press drag | ❌ | 556 | P22 OD-2 (phone: no editing) | — | — | — | REMOVED-N/A | |
| F-CV-126 | Section reorder grips | ✅ | 557 | P05 CV-13 "section grips" kept; SC-13 toast | P | "Moved · applies to all breakpoints · Undo" off Desktop | P | COVERED | |
| F-CV-127 | Arrow-key selection nav | ✅ | 558 | P05 CV-21, §10 | Y | — | Y | COVERED | Tab conflict with keyboard resize (T2-5) |
| F-CV-128 | Keyboard nudge | ✅ | 559 | P05 CV-13 nudge, in-flow toast kept | Y | positioned only | Y | COVERED | |
| F-CV-129 | ⌥↑/↓, ⌥Home/End reorder | ✅ | 560 | P05 CV-13; P04 §7 (reused in tree); SC-3 | Y | — | Y | COVERED | |
| F-CV-130 | ⌘Z behind full-page tools | 🐞 | 561 | P24 ⛔ U-1; SC-9; SC-12 scope; BK-006/034 | Y | "Nothing to undo here — Open Editor to undo" | Y | COVERED | Blocked by U-1 (interim guard mandatory) |
| F-CV-131 | Clipboard & edit chords | ✅ | 562 | SC-3; SC-12 (⌘⇧V Canvas scope) | Y | — | Y | COVERED | |
| F-CV-132 | App chords | ✅ | 563 | SC-12; P18 §5.9 | Y | per-browser acceptance | Y | COVERED | ⌘H→H, ⌘J/⌘⇧A AI inactive |
| F-CV-133 | Canvas palette ⌘⇧P | ❌ | 564 | SC-12 (⌘⇧P alias to ⌘K) | — | — | — | REMOVED-N/A | |
| F-CV-134 | Keyboard shortcuts sheet | ✅ | 565 | P18 §4.4, §5.9 | Y | generated from one table; single-key toggle | Y | COVERED | |
| F-CV-135 | Keyboard legend card | ✅ | 566 | P18 §9; SC-10 | — | retired; rows → sheet BASICS | — | COVERED | Removed by decision. REG Keep is stale (T2-15) |
| F-CV-136 | Comment mode toggle | ✅ | 572 | P01 §5 Comments; P05 §8 Comment mode | Y | C key, Esc exits, disabled in non-Editor areas | Y | COVERED | |
| F-CV-137 | Pins | ✅ | 573 | P17 §4.4; P05 §8 | Y | visible in comment mode + Review task; "Client" label | Y | COVERED | No count badge on the button (INV), unchanged |
| F-CV-138 | New-comment popover | ✅ | 574 | P05 CV-17 kept | Y | 2000 max, ⌘Enter | Y | COVERED | |
| F-CV-139 | Re-pin detached comment | ✅ | 575 | P17 CR-16 "reattach" kept; §5.4 | P | — | P | COVERED | |
| F-CV-140 | Orphan comments modal | ✅ | 576 | P05 CV-17; P17 §5.4 Locate (located / page-only / gone) | P | — | P | COVERED | |
| F-CV-141 | Replies / threads / @mentions | ⏳ | 577 | P17 §4.3, R-3 (replies + audience) | P | — | P | PARTIAL | Replies specified. @mentions are in no doc (T2-35) |
| F-CV-142 | Start collaboration | 🚩 | 583 | P21 §5.1 (auto-join; "People on this site…") | Y | flag off "Planned" | Y | COVERED | Planned. ⛔ MP-3/4/5 |
| F-CV-143 | Presence avatars + pill | 🚩 | 584 | P21 §4.1 | Y | N here / Live / Reconnecting / Offline | Y | COVERED | INV "up to 3" vs P21 "≤2" (T2-19) |
| F-CV-144 | Remote cursors | 🚩 | 585 | P21 §4.2 | Y | same page+breakpoint, Hide my cursor, fade, max 10 | Y | COVERED | ⛔ MP-11 fallback: cursors hidden |
| F-CV-145 | Remote selections / editing / soft-locks | ⏳ | 586 | P21 §4.2–4.3 | Y | tone outline + tag, "· editing", typing confirm | Y | COVERED | Blocked by Phase A/B deps |
| F-CV-146 | Interaction runtime | ✅ | 592 | P19 §5.3–5.5 | Y | canvas Play only; Preview under IXD-3 | Y | COVERED | INV "plays in preview" contradicts P19 IX-11 (T2-17) |
| F-CV-147 | Reverse on leave/blur | ⏳ | 593 | P19 §4.3 "Reverse when the pointer / focus leaves" | Y | — | P | PARTIAL | UI specified, but no IXD row makes reverse work in the published runtime (UNKNOWN whether WAAPI implements it) (T2-18) |

## Principle observations

| PID | Module | Observation (spec-level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P29 | Element context menu | The menu is **one generic registry** (SC-3). Per-type behaviour is limited to eligibility filters: Replace with block (sections), Bind to CMS (type list), Group (2+), Ungroup (container), Add interaction (not root). No type-specific actions are specified. Examples: Edit text, Replace image / Edit alt, Edit link, Go to main component / Detach for instances, Open collection for a Collection list | Users leave the canvas for common per-type tasks; instance actions live only in the Inspector | SC-3 table; P05 CV-16; P13 CP-05; INV 11.2 | NEEDS REVISION |
| P02 / P11 | Context menu | SC-3 adds Move to page, Select children, Move ×4 and Show in Layers to the canvas menu, which already has 3 submenus. Neither SC-3 nor P05 defines order, grouping or a row cap. IA-02 (clipboard buried, Delete beside AI) is carried forward | Long, unordered menu | SC-3; P05 §6; INV 11.2 | NEEDS REVISION |
| P23 / P38 | Drag & drop | Drag feedback (valid, invalid, between, inside, path pill, Add-drawer cue) is kept only as "existing". There are no state tables, copy or tokens. Only the SC-14 locked-drop copy is new | Redesign can silently drift; no acceptance | P05 CV-13; P03 §5 Target; IAF-02 H | NEEDS REVISION |
| P38 | Multi-select | SC-17 defines the toolbar set, Mixed values and insertion target. It does not define toolbar anchor on the combined box, handle behaviour (multi-resize) or marquee rules | Partial multi-select spec | SC-17; P05 §6; REVIEW §7:73 | NEEDS REVISION |
| P24 | Resize | Esc cancels only the gesture, one Undo step, zoom compensation and finite values are all specified with acceptance | — | P05 §6; T-CV-03/04; FDB T-FI-01 | PASS-SPEC |
| P25 | Delete / recovery | Delete has Undo everywhere and no confirm, with a ≥8 s toast | — | SC-3; P24 rows 1–3; P22 §5.10 | PASS-SPEC |
| P25 | Duplicate / clone | The style-loss fix (FI-02) has no panel acceptance. Cancelled clone-drag residue is unspecified | Silent data loss persists through the redesign | FDB FI-02; P24 row 3 | NEEDS REVISION |
| P05 / P11 | Toolbar | Breadcrumbs, visible breakpoint segments, "Editing Tablet" label and the width field replace hidden View ▸ Breakpoint | — | P05 §5, §7 | PASS-SPEC |
| P39 | Keyboard | Keyboard resize, nav landmark for breadcrumbs, toolbar roving focus and live region are specified. The **Tab conflict** (Tab enters handles vs Tab cycles elements) is unresolved | Keyboard trap or ambiguity | P05 §6, §10, CV-21; REVIEW §7:77 | NEEDS REVISION |
| P26 | Hover/drag modifiers | Alt hierarchy, Alt+Shift box model, ⌘-drag clone, resize modifiers, ruler-guide gestures and spacing spots have no visible door. The legend card is retired, and the P18 BASICS rows do not name them | Hidden power features | P05 CV-09; P18 §4.4; INV 5.2 | NEEDS REVISION |
| P36 | Canvas overlays | No doc defines overlay colour tokens: snap guides (magenta/red), box model (orange/green/blue), amber lock badge, green clone badge, raw hex. DESIGN.md §Accent limits accent to selection outlines and similar ("Nowhere else"), yet INV shows accent on the Drop-here pill, CMS badge, W×H pill, reorder grip, pins, badge chips and marquee | Off-system colours; accent overuse | DESIGN.md:213; INV 5.3, 9.3, 12.2, 6.10, 13.6 | NEEDS REVISION |
| P34 | Toolbar / empty state | The toolbar collapse order and two-row fallback are specified. The empty-CTA short-height clipping (UX-01) has no rule | Clipped primary path at 1280×720 | P05 §9; P16 §4.1 | NEEDS REVISION (empty CTA); PASS-SPEC (toolbar) |
| P35 | Inline text / device frame | The format bar is "kept", but it stays an inline-style toolbar outside chrome-ui, with no migration noted. The device frame moves into the View menu, which fixes the hand-rolled button | Inconsistent chrome | P05 CV-15, §5 View | NEEDS REVISION |
| P06 | Arrange | "Bring to front / Send to back" moves DOM order, not z-index. The label is unchanged | Wrong mental model | INV 11.11; SC-3 | NEEDS REVISION |
| P08 | Double-click | Double-click is now decided by the element under the pointer, which removes the edit vs select-child conflict | — | P05 §6; T-CV-08 | PASS-SPEC |
| P20 | Frame / zoom | The fixed 1440 Desktop frame means Fit is about 52 % at laptop widths. Handle size and text legibility at that zoom are not considered | Precision loss | P05 §5; REVIEW §7:71 | NEEDS REVISION |
| P31 | Menus | Viewport clamp is specified for the Layers menu (P04 §10), Review popovers (−16) and the status popover (−24), but not for the canvas menu | Inconsistent overflow | P04 §10; P17 §8; P11 | NEEDS REVISION |

## Contradictions & gaps

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution (design-level) |
|---|---|---|---|---|---|
| T2-1 | contradiction | SC-17: multi-selection toolbar "Duplicate · Delete · Group · More" | P05 CV-11 / §6: toolbar for single selection, "buttons unchanged"; INV 7.3 hidden in multi | Major | Amend P05 §6 to SC-17. Specify anchor (combined box) and the small-box rule |
| T2-2 | stale | SC-3 canvas column adds Move to page, Select children, Move up/down/into/out | P05 §6: "CV-16 kept + Show in Layers" only | Minor | Align P05 §6 and §11 with SC-3 |
| T2-3 | missing | SC-3 lists actions without order | No menu order or grouping for the canvas menu; IA-02 (INV 11.2) unresolved | Major | Define one group order for the SC-3 surfaces (edit / clipboard / structure / arrange / state / destructive last) |
| T2-4 | missing | INV 11.2 / SC-3: one registry, eligibility-filtered | No per-element-type actions (text, image, link, instance, Collection list) on canvas | Major | Decide whether a type-context group sits at the top of the menu, from the existing registry actions only |
| T2-5 | contradiction | P05 §6: "Tab from selection box enters handles" | P05 CV-21 / §10: "Tab cycles elements … Canvas keys unchanged"; REVIEW §7:77 | Major | Pick one key to enter handle mode (for example Enter on the selection), keeping Tab = element cycle |
| T2-6 | missing | INV 6.8: multi-resize handles only resize the primary element | P05 CV-10 "kept"; no hide-or-wire decision; REVIEW §7:73 | Major | Decide: hide handles in multi-selection, or specify proportional multi-resize with acceptance |
| T2-7 | missing | FDB FI-02 / T-FI-02: duplicate/paste must keep breakpoint and :hover styles | No panel acceptance; P24 row 3 "Duplicate, paste … Keep" | Major | Add T-FI-02 as a P05 or P24 acceptance row |
| T2-8 | missing | INV 13.2: cancelled ⌘-drag clone leaves the copy | Not in any doc (FI-02 covers styles only) | Major | Esc / cancelled clone-drag removes the copy; add to P05 §6 Esc ladder step 1 |
| T2-9 | contradiction | P05 CV-15: format bar has bullets/numbers; "Enter commit" kept | INV 8.4: Enter always commits, so lists can't get a 2nd item and there are no line breaks | Major | Define Shift+Enter (line break) and Enter-in-list behaviour; commit = blur / ⌘Enter / outside click |
| T2-10 | contradiction | P04 §8: Group refuses locked members "(existing)" | INV 11.14 + REG M02-11.14 Fix: Group/Ungroup skip the lock gate | Major | Mark P04 §8 Group refusal as Fix, not existing; include Ungroup of a locked container |
| T2-11 | missing | INV 7.5: marquee only starts in a 20 px strip; selects parent+children | P05 "marquee kept" | Major | Specify the start rule (for example a modifier-drag from inside the page) and same-depth selection |
| T2-12 | missing | INV 7.6, 3.5: marquee and W×H pill not zoom-compensated | P05 compensates resize bounds only | Minor | Extend the compensation rule to all overlays |
| T2-13 | missing | INV 11.4: canvas menu unclamped | P04 §10 clamps the Layers menu only | Minor | One clamp rule for every menu and popover (viewport −16) |
| T2-14 | missing | SC-18: disabled actions show their reason (palette) | No rendering rule for reasons in canvas menu rows (INV 11.5) | Minor | Reuse the SC-18/P18 disabled-with-reason row pattern in the canvas menu |
| T2-15 | stale | REG M02-13.15 Keep (legend), M02-2.2 Defer (Wide), M02-6.18 Defer (breadcrumbs) | P18 §9 retires the legend; P05 revives Wide (preset) and breadcrumbs | Minor | Annotate the register rows as superseded by Panels 05/18 |
| T2-16 | stale | REG M02-7.4 Keep (multi-delete confirm) | SC-3: delete never confirms | Minor | Annotate the register |
| T2-17 | stale | INV 16.1: runtime "plays in preview/published" | P19 IX-09/IX-11: never runs on canvas; preview strips scripts | Minor | INV correction; P19 is authoritative |
| T2-18 | ambiguity | P19 §4.3 exposes "Reverse when the pointer / focus leaves" | No IXD dependency implements reverse in the published runtime; editor reverse is a placeholder (P19 §13-15); UNKNOWN for WAAPI | Major | Add an IXD row or hide the toggle until reverse runs in output |
| T2-19 | contradiction | INV 15.2: up to 3 avatars | P21 CO-08 / §4.1: ≤2 avatars + "+N" | Minor | Re-read `Presence.tsx`; fix whichever doc is wrong |
| T2-20 | ambiguity | INV 3.4: zoom to selection also on ⌘K | SC-12: ⌘K = palette (Global incl. Field); P05 Zoom omits ⌘K | Minor | State explicitly that the ⌘K zoom alias is removed |
| T2-21 | missing | INV 2.4 (re-fit on switch), 2.5 (width label under page) | P05 §5 Remember view and width field are silent | Minor | State: breakpoint switch → Fit if the frame doesn't fit; width label replaced by the toolbar width field |
| T2-22 | missing | INV 6.14 / UX-07: caption overlaps content | REG Redesign only; P05 §6 silent | Minor | Remove the caption (tooltips carry shortcuts) or place it outside the element |
| T2-23 | missing | INV 1.11: placeholder copy names the removed "+" control | No doc | Minor | New copy pointing to Add / drag |
| T2-24 | missing | INV 12.8: "added ✓ added" toast | REG Fix only | Minor | Toast copy rule: "{name} added · Undo" (P22 §5.10) |
| T2-25 | missing | INV 4.1 UX-01: empty CTA clips at 1280×720 | P16 §4.1 has no geometry or short-height rule | Major | Add a short-height layout (cards → row of 2 / scroll) to P16 §4.1 |
| T2-26 | missing | DESIGN.md:213 accent only for selection outlines and the like | Canvas overlay colours (guides, box model, badges, Drop here, pins, reorder grip) undefined; raw hex (INV 5.3) | Major | Define a canvas-overlay token set in P05 §9, with the accent restricted to selection/drop-target |
| T2-27 | ambiguity | P05 §8 Loading: "Existing skeleton" (canvas) | P22 §5: one shell skeleton replaces two (Fix GS-04) | Minor | State whether the canvas skeleton remains inside the shell skeleton |
| T2-28 | ambiguity | SC-3: "Bind to CMS field…" on the canvas menu | P06 A1: CMS binding section retired → bind icon per property row | Minor | Define the landing: open Inspector Content › Dynamic bindings summary, or the first bindable row |
| T2-29 | missing | SC-14: descendants of a locked element are locked | Canvas shows lock styling only on the element (INV 1.8); inherited lock is marked only in Layers | Minor | Specify canvas treatment of inherited lock (cursor + click toast) |
| T2-30 | ambiguity | P05 §5: Desktop frame 1440 + Fit | REVIEW §7:71: about 52 % at laptop widths; handles and text at that zoom not considered | Minor | Add a minimum effective handle hit area at low zoom (§9 Handles) |
| T2-31 | missing | INV 9.4: default grid 10 px is not a preset | P05 "Grid + pane" | Minor | Show the actual size, or add 10 to the presets |
| T2-32 | missing | INV 9.6/9.7: ruler guide create/move/remove/lock, persisted | P05 lists the Rulers toggle only | Minor | Specify the guide gestures and keyboard alternative |
| T2-33 | ambiguity | SC-3 "Arrange (front/back)" | INV 11.11: moves sibling order, not z-index | Minor | Relabel ("Move to first/last", aligned with Move up/down) or specify z-index |
| T2-34 | stale | P05 §12 acceptance order T-CV-13, 14, 15 before 11, 12 | — | Minor | Renumber |
| T2-35 | missing | INV 14.6: @mentions | P17 R-3 covers replies and audience only | Minor | Mark @mentions Deferred explicitly |
| T2-36 | contradiction | INV 12.9: media dropped on an image replaces it | P08 §3 problem 1 / IAF-09 E: replace must be explicit | Major | Drop-on-image → insert, with an explicit "Replace image" drop zone / affordance, or declare it the explicit gesture |
| T2-37 | missing | INV 5.2, 5.4, 5.6, 6.7: Alt hover, clone badge, hover grip, resize modifiers | REG-only or a one-word mention; no discoverability surface after the legend is retired | Minor | List the modifiers in the P18 sheet BASICS / Canvas group |
| T2-38 | missing | INV 12.1–12.5: full drag feedback set | P05 CV-13 "drop feedback" kept; no states, copy or tokens | Major | Add a drag-feedback state table to P05 §6 (valid / invalid + reason / between / inside / locked) |

## Consistency notes

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

## Counts

- INV rows in scope: **154** (§1–§16). The table has **147 FID rows** after 7 merges: 6.16+6.17, 9.8+9.9, 10.3+10.4, 11.18–11.20 (3→1), 12.1–12.3 (3→1).
- INV status in scope (per INV line 606): ✅ 106 · 🟡 13 · 🐞 12 · 🚩 3 · ⏳ 3 · ❌ 17.
- Coverage by FID row (147): **COVERED 89 · PARTIAL 46 · CONFLICT 1 · DEFERRED-BY-DECISION 1 · REMOVED-N/A 10 · OMITTED 0.**
  - OMITTED is 0 because every canvas INV row has a one-line disposition in the FD-IA-09 register.
  - REG-only PARTIAL rows: 16 (F-CV-005, 007, 011, 012, 013, 014, 041, 043, 057, 069, 071, 074, 079, 081, 115, 118).
  - REG / brief-anchored rows with no panel acceptance: F-CV-092, 122, 124.
  - The 17 ❌ INV rows become 13 FID rows after merges. The docs revive 3 of them (Wide as a preset, breadcrumbs, Show in Layers / parent), which are counted COVERED; the other 10 are REMOVED-N/A.
  - The ✅ legend card (F-CV-135) is retired by decision and counted COVERED.
- Contradictions & gaps: **38** (Major 15 · Minor 23). Contradiction 6 · ambiguity 6 · missing 21 · stale 5.
- Principle observations: 17 rows (PASS-SPEC 4 · NEEDS REVISION 12 · mixed 1).

**Answers to the specific questions**
- **Context menu:** one generic menu from the SC-3 registry. Per type it varies only by eligibility filters (sections, CMS-bindable types, 2+ for Group, containers for Ungroup, not-root for Add interaction). No type-specific actions are specified (T2-4), and no order or grouping is specified (T2-3).
- **Multi-select:** partly specified. SC-17 gives the toolbar set, Mixed values and insertion target, and SC-3 makes Delete undo-only. Toolbar placement, multi-resize (T2-6) and marquee rules (T2-11) are open, and P05 contradicts SC-17 (T2-1).
- **Drag feedback:** not specified. It is kept only as "existing", with no states, copy or tokens (T2-38). Only the SC-14 locked-drop copy is new.
- **Selection visuals:** specified by reference to CV-10: box, tag, handles 12/8, rotation, W×H pill, CMS and lock badges, plus P21 remote-selection outline. Overlay colour tokens are undefined (T2-26).
