# T6 — Inspector + Brand: feature inventory → design traceability

Audit only, 2026-10-18. Spec-level judgement; there are no hi-fi screens. Runtime was NOT RUN.

## Scope read

| File | Lines read | Notes |
|---|---|---|
| `_extraction/EXTRACTION-BRIEF.md` | 1–46 | full |
| INV `docs/editor-feature-inventory-2026-10-16.md` | 1545–1881 | Inspector rows 1–112 (+48a–k) = 122; Brand Part A rows 1–65; Part B header (1878–1881) is the chrome kit, which is out of T6 scope and was not traced |
| P/00-SHARED-CONTRACTS.md | 1–360 | full |
| P/06-INSPECTOR-DELTA.md | 1–84 | full |
| P/09-BRAND.md | 1–185 | full |
| D/PRODUCT-DESIGN-BRIEF.md | 528–855, 1012–1166 | FD-INS-01/02/03, IA-02/03/06/08, panel index, IA register, closure records |
| D/BATCH-01A.md | 1–145 | full |
| D/evidence/inspector-2026-10-16/inspector-preservation-map.md (+ .json) | 1–60 (IC-01–03 text), 219–360 (register); JSON `rows[]` id/disposition/new_home/controls for all 122 rows | **Key finding: PM row `M07-n` = INV Inspector row n** (confirmed on n=18, 28, 68, 99, 100, 112) |
| D/evidence/inspector-2026-10-16/integration-closure.md | headings; II-06 109–125 | |
| D/evidence/ia-final-2026-10-16/capability-preservation.md | 1–45, 903, 1025–1089 | **`M08-n` = INV Brand row n**; every home reads only "IAF-10 · Rail → Brand…" (generic) |
| D/evidence/ia-final-2026-10-16/module-specifications.md | 511–567 (IAF-10) | |
| P/04, 05, 07, 12, 13, 15, 16, 18, 19, 22, 24 | grep hits for Inspector/Brand (≈10–20 lines each); P/19 §2, §4 lines 5–39, 56, 81, 108–109 | targeted reads only |
| DESIGN.md (root) | grep hits 30, 129–130, 232, 238 | |
| Synonym greps over P and D (*.md) | Beginner; Duplicate token; Stripe Blue/Linear Dark; L4-024/literal colour; OQ-4; Ignore/suppress; Banned hue/Pure black; search tokens/group headings; Presets read-only; Figma Variables; Migration progress/Restore snapshot; Set your brand/BRAND_APPLIED; Template applied; No brand set; Theme toggle; three/four tabs; Size preset/Font-size token; label width/96px; Mixed; eyedropper/recent colours; scrub; multi-stop; Scroll to element; US English | each one-row OMITTED claim is backed by ≥2 synonyms |

Skipped: the block-coverage-*.md bodies (BIC, ~2,700 lines; I sampled only the headings and B69-navbar), inspector-design.html, and the JSON annex fields other than those named above. They are normative for per-block detail, so 48a–48k "COVERED" rests on the PM rows plus the BIC record headings. Each block record was not re-read.

**Abbreviations.** PDB = PRODUCT-DESIGN-BRIEF.md · PM = inspector-preservation-map.md (row M07-n) · CP = capability-preservation.md (row M08-n) · IC-n = PM shared contract · II-n = integration-closure.md · MS = module-specifications.md · B1A = BATCH-01A.md · DYN = CMS-DYNAMIC-BINDING-DESIGN.md · BIC = block-coverage annex · P0x = panels/0x-*.md · SC-n = P00 section.

## Answers to the flagged questions

| Question | Answer | Evidence |
|---|---|---|
| Property grouping order defined? | **Yes at tab and section level. Partly within sections.** Style: Classes → Children layout → Placement/overflow → Typography → Size → Spacing → Fill → Border → Text inside. Content / Behaviour / Effects / Page appearance orders are also given. Field order inside a section is written out only for Typography (B1A H10–H26, a heading-only slice). Other sections list their controls in PM rows without a stated order. | PDB:676–681; B1A:37,58–72 |
| Value-source / override / reset semantics? | **Yes, specified in depth, but two sources conflict.** IC-03, II-01 and INS-D04 "Source/reset" say: reset names the layer ("Remove Mobile override") and the fallback is resolved first. SC-13 *(R-1017, wins)* says: "blue dot + Tablet label", "Reset to {parent breakpoint}" and section-header "N overrides on Tablet". See T6-4 and T6-5. | PM IC-03; PDB:544,628,715; SC-13 00:263 |
| Mixed values for multi-select? | **Yes, semantically.** Mixed is indeterminate, never blank or zero, and never taken from the first target. Counts are per field (editable/skipped). Batch writes are atomic. There are unit-conversion and progress-max edge cases. **Visual treatment of Mixed is not specified:** INV shows amber; the spec says only "readable without colour". | SC-17; PDB:696,713,766–767; IC-02/04; T-INS-03 |
| Control dimensions (row height, label width)? | **Partly.** Specified: width 300 fixed; tabs ≥32h at ~73px each; header 12/8 padding; section padding 12, related gap 8, 12 between fields; default controls 32; short-height rules; bound row 48h and bind icon 24×24. **Not specified globally:** label-column width, the inline vs stacked threshold, and section-header / "Name +" row heights. Only B1A proposes 96 label + 8 gap + 164 field, 16 padding, 28 controls in 32 rows, for the heading slice, and that conflicts with INS-D07 (T6-9). | PDB:737–750; P06 B5; B1A:27 |

## Traceability

### Inspector (INV 1551–1723)

| FID | feature | INV status | INV line | design home (file §) | controls? | states specified | interaction? | coverage status | gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-IN-01 | Tab strip | ✅ 🆕 | 1555 | PDB:672 INS-D01; PDB:744 INS-D07 Tabs; PM M07-1 | Y | active, error indicator, empty tab "No [category] properties", 2×2 fallback | Y (INS-D08 tablist) | CONFLICT | 3→4 tabs (Content added). B1A:51 H05 keeps "Style/Behaviour/Effects same IDs/order" (T6-1). "Behaviour" vs SC-11 US English (T6-8) |
| F-IN-02 | Flat section list (09-16) | ❌ | 1556 | PM M07-2 Keep replacement | — | — | — | REMOVED-N/A | |
| F-IN-03 | Page panel | ✅ 🆕 | 1557 | PDB:681 Page appearance; PDB:698 INS-D03; PM M07-3; P06 C5 | Y | no selection/root, collection-page context, breakpoint shown | Y | COVERED | Order: name → background → max width → font/text colour → spacing → Page settings |
| F-IN-04 | "Select something" empty prompt | ❌ | 1558 | PM M07-4 | — | — | — | REMOVED-N/A | |
| F-IN-05 | Page panel header actions | 🟡 | 1559 | PM M07-5 Fix; PDB:698 | P | — | P | PARTIAL | Says "preserve current menu actions". The one-item ⋯ menu (L2-034) is left undecided (T6-23). AI hidden (SC-21) |
| F-IN-06 | Loading skeleton | ✅ | 1560 | PDB:702 INS-D03; PM M07-6; P22 §error levels | Y | loading, failed load + Retry | Y | COVERED | |
| F-IN-07 | "Template applied!" banner | ✅ | 1561 | PM M07-7 | P | success, dismiss/expiry | P | PARTIAL | The "Set Brand Colors" action and the Connect-to-tokens follow-up are not named (T6-22). Raw `text-white` is not addressed |
| F-IN-08 | Error boundary | ✅ | 1562 | PM M07-8 Fix; PDB:702; P22 §4 levels | Y | render error vs save error, Retry | Y | COVERED | |
| F-IN-09 | AI-run takeover | ✅ | 1563 | SC-21; PM M07-9; II-03 | — | — | — | DEFERRED-BY-DECISION | SC-21 hides all AI |
| F-IN-10 | Whole-site takeover | ❌ | 1564 | PM M07-10 | — | — | — | REMOVED-N/A | |
| F-IN-11 | Theme-toggle inspector | ✅ 🆕 | 1565 | PDB:699; PM M07-11; BIC B69-theme-toggle | Y | Off/Auto, hidden-on-publish | Y | COVERED | PM still routes to "Brand → Colour mode", but P09 renames that page Tools › Dark mode (consistency note) |
| F-IN-12 | Read-only status line | ✅ 🆕 | 1566 | PM M07-12; PDB:700; SC-14 copy | Y | locked, conflict, role denied | Y | COVERED | |
| F-IN-13 | Section display modes | ✅ 🆕 | 1567 | PM M07-13; PDB:746 | Y | open, closed+summary, empty "Name +" | P | COVERED | Section-header and empty-row heights are not given (T6-10) |
| F-IN-14 | Per-section error band | ✅ 🆕 | 1568 | PM M07-14; IC-02; PDB:721 | Y | invalid draft, retained input | Y | COVERED | |
| F-IN-15 | Scroll memory | ✅ | 1569 | PM M07-15; PDB:693 | Y | per object/tab | Y | COVERED | |
| F-IN-16 | SR selection announcement | ✅ | 1570 | PM M07-16; PDB:752 INS-D08 | Y | single, N selected, locked count | Y | COVERED | |
| F-IN-17 | "N of M sections apply" footer | ❌ | 1571 | PM M07-17 | — | — | — | REMOVED-N/A | |
| F-IN-18 | density=fewer mode | ❌ | 1572 | PM M07-18 Defer; PDB:687 | — | — | — | REMOVED-N/A | |
| F-IN-19 | "More settings" disclosure | 🐞 | 1573 | PM M07-19 Fix; PDB:561 INS-18; B1A:26 B01-04 | Y | active-value count, auto-reveal target | Y | CONFLICT | PM keeps the label "More settings". B1A renames it "Advanced typography · 9 / Less typography". UX-05 auto-open is addressed by INS-18 |
| F-IN-20 | ⌘K Jump to property | ✅ 🆕 | 1574 | PM M07-20; P18 §Properties row:160; PDB:756 | Y | unavailable reason | Y | COVERED | |
| F-IN-21 | Hide inspector | ✅ 🆕 | 1575 | PM M07-21; PDB:737 | Y | hidden, overlay | Y | COVERED | ⌘\ is missing from the SC-12 shortcut table |
| F-IN-22 | Breadcrumb path | ✅ 🆕 | 1581 | PM M07-22; P06 D1 compact "… › parent › element" | Y | overflow menu, multi "· N elements" | Y | COVERED | |
| F-IN-23 | Editable element name | ✅ 🆕 | 1582 | PM M07-23; PDB:711 | Y | empty→type label, invalid draft | Y | COVERED | |
| F-IN-24 | ✦ AI chip | ✅ | 1583 | SC-21; SC-3 "Ask AI" inactive | — | — | — | DEFERRED-BY-DECISION | |
| F-IN-25 | Crosshair pick | ❌ | 1584 | PM M07-25 | — | — | — | REMOVED-N/A | |
| F-IN-26 | Select parent button | ❌ | 1585 | PM M07-26 | — | — | — | REMOVED-N/A | |
| F-IN-27 | Header bind popover | ❌ | 1586 | PM M07-27; P06 A10 | — | — | — | REMOVED-N/A | Replaced by per-row bind icon (P06 A1) |
| F-IN-28 | Status marks row | ✅ 🆕 | 1587 | PM M07-28; P06 A5/B1 "🗄 N bindings" | Y | component, bound, missing source, locked | Y | COVERED | Hidden during multi-select is not restated |
| F-IN-29 | ⋯ Element actions menu | ✅ | 1588 | SC-3 table; P06 C7; PM M07-29 | P | disabled reasons | Y | PARTIAL | The SC-3 registry has no rows for "Apply style to all…" or "Reset style", yet INV, M07-29 and B1A H31–H32 all keep them (T6-6) |
| F-IN-30 | Apply style confirm | ✅ 🆕 | 1589 | PDB:719 INS-D04 Bulk; PM M07-30; PDB:560 INS-17 | Y | eligible/skipped count, no-op "No authored styles at this scope" | Y | COVERED | |
| F-IN-31 | Inspector delete modal | ❌ | 1590 | SC-3 (no confirm, Undo); PM M07-31 | — | — | — | REMOVED-N/A | |
| F-IN-32 | Context row placement | ✅ 🆕 | 1596 | PM M07-32; IA-06 PDB:832; PDB:745 | Y | Desktop shown, state, instance, "All breakpoints" | Y | COVERED | |
| F-IN-33 | Scope pill This/All/Whole site | ❌ | 1597 | PM M07-33 | — | — | — | REMOVED-N/A | |
| F-IN-34 | State chip | ✅ | 1598 | PM M07-34; IA-06 PDB:834–836 | Y | non-Base, unknown saved state read-only | Y | COVERED | Pressed/visited/checked are not added (INV gap, kept out) |
| F-IN-35 | State override line | ✅ 🆕 | 1599 | PM M07-35 Merge | Y | — | P | COVERED | |
| F-IN-36 | Breakpoint picker in inspector | ❌ | 1600 | IA-06 PDB:834; SC-13; P05 §5 | — | — | — | REMOVED-N/A | Decided canvas-owned with a read-only mirror. UX-06 is answered by the P05 toolbar |
| F-IN-37 | Breakpoint revert line | ✅ 🆕 | 1601 | PM M07-37 | Y | fallback explained | Y | COVERED | |
| F-IN-38 | Field override dot | ✅ 🆕 | 1602 | PM M07-38; IC-03; SC-13 00:263 | Y | local, inherited, token, class, component, pseudo | Y | CONFLICT | SC-13 says "Reset to {parent breakpoint}". IC-03/INS-D04 say "Remove Mobile override" with the fallback resolved (T6-4) |
| F-IN-39 | Override info repeated | 🐞 | 1603 | PM M07-39 Merge; PDB:561 INS-18; SC-13 | Y | — | P | CONFLICT | SC-13 re-specifies dot + label + section count + note: the UX-14 structure again (T6-5) |
| F-IN-40 | "Editing :hover" banner | ❌ | 1604 | PM M07-40 | — | — | — | REMOVED-N/A | |
| F-IN-41 | Detach pill in context row | ❌ | 1605 | PM M07-41 | — | — | — | REMOVED-N/A | |
| F-IN-42 | Effective values in fields | 🐞 | 1606 | PM M07-42 Fix; II-01; IC-03; PDB:544 INS-01; T-INS-01 | Y | resolved, authored, "source unavailable" | Y | COVERED | |
| F-IN-43 | Multi header | ✅ 🆕 | 1612 | PM M07-43; P06 A8/D1; SC-17 | Y | N selected, eligible/locked | Y | COVERED | |
| F-IN-44 | Align/Distribute/Group bar | ✅ | 1613 | PDB:771–775 INS-D12; PM M07-44 | Y | disabled reasons, no-op, overlap warning | Y | COVERED | Glyph/icon treatment is unspecified |
| F-IN-45 | Intersection + "Mixed" | ✅ 🆕 | 1614 | PM M07-45; PDB:696; SC-17; IC-02/04 | Y | mixed, indeterminate, skipped | Y | COVERED | Mixed visual unspecified (T6-26) |
| F-IN-46 | 5-row batch panel | ❌ | 1615 | PM M07-46 | — | — | — | REMOVED-N/A | |
| F-IN-47 | Capability table | ✅ 🆕 | 1623 | PM M07-47 Redesign; PDB:678,705 | Y | disabled reason, empty tab | Y | COVERED | |
| F-IN-48a | Text types | ✅ | 1624 | PM M07-48a; PDB:677–678 | Y | (per IC-04) | Y | COVERED | |
| F-IN-48b | Button | ✅ | 1625 | PM M07-48b | Y | unset vs false | Y | COVERED | |
| F-IN-48c | Form fields | ✅ | 1626 | PM M07-48c; PDB:723 INS-D05; BIC | Y | mixed, validation | Y | COVERED | |
| F-IN-48d | Media types | ✅ | 1627 | PM M07-48d; P06 B3/B6 | Y | loading, missing, invalid URL | Y | COVERED | |
| F-IN-48e | Spacer/divider | ✅ | 1628 | PM M07-48e | Y | — | Y | COVERED | |
| F-IN-48f | Widgets | ✅ | 1629 | PM M07-48f | Y | — | Y | COVERED | |
| F-IN-48g | Layout primitives | ✅ | 1630 | PM M07-48g; PDB:727 | Y | — | Y | COVERED | |
| F-IN-48h | Containers | ✅ | 1631 | PM M07-48h; BIC B69-* (navbar, tabs, gallery…) | P | — | P | COVERED | Navbar/tabs/gallery get per-block BIC records; commerce is deferred (PDB:789) |
| F-IN-48i | Structural child | ✅ 🆕 | 1632 | PM M07-48i | Y | — | Y | COVERED | |
| F-IN-48j | form/slider/collection-list | ✅ 🆕 | 1633 | PM M07-48j; DYN §11 | Y | — | Y | COVERED | |
| F-IN-48k | Component instance root | ✅ 🆕 | 1634 | PM M07-48k; PDB:697,729 | Y | override count | Y | COVERED | |
| F-IN-49 | Component row | 🟡 | 1640 | PDB:676 INS-D01 header identity subview; PM M07-49; P13 §9 | Y | read-only refusal | Y | CONFLICT | INS-D01 puts it in the header. P13 §9 keeps "Inspector ComponentRow". Labels drift: Edit master / Edit definition / Edit main component (T6-7). Confirms vs SC-15 (T6-28) |
| F-IN-50 | Type block frame | ✅ 🆕 | 1641 | PM M07-50 Redesign (split by owner) | Y | — | Y | COVERED | |
| F-IN-51 | Heading block | ✅ 🆕 | 1642 | PDB:678; PM M07-51; B1A B01-01, H07–H09 | Y | Custom, unresolved token | Y | CONFLICT | "Font-size token" (PDB) vs "Size preset" (B1A). Level is in Content (PDB) vs Heading in Style (B1A) (T6-1, T6-2) |
| F-IN-52 | Text/Paragraph/Link/Label block | ✅ 🆕 | 1643 | PM M07-52 | Y | — | Y | COVERED | B1A keeps "Text style" for non-heading callers; PDB renames all (T6-2) |
| F-IN-53 | Button block | ✅ | 1644 | PM M07-53 | Y | unset/false | Y | COVERED | |
| F-IN-54 | Input/Textarea/Select/Upload | ✅ | 1645 | PM M07-54; PDB:723; INS-06 | Y | name warning, options structure | Y | COVERED | |
| F-IN-55 | Checkbox/Radio/Switch | 🐞 | 1646 | PM M07-55; PDB:723 "Submission value" | Y | empty vs removed | Y | COVERED | Radio/checkbox value gap is closed by the spec |
| F-IN-56 | Image block | ✅ | 1647 | PM M07-56; P06 B6 "Replace…"; PDB:694 | Y | decorative empty alt, custom fit | Y | COVERED | |
| F-IN-57 | Video block | ✅ | 1648 | PM M07-57; P06 B3 | Y | autoplay warning | Y | COVERED | Poster stays a URL field with no picker (INV note); only a bind icon is added |
| F-IN-58 | Audio block | ✅ 🆕 | 1649 | PM M07-58 | Y | — | Y | COVERED | |
| F-IN-59 | SVG block | ✅ | 1650 | PM M07-59 Fix | Y | conversion disclosure | Y | COVERED | |
| F-IN-60 | Icon block | ✅ | 1651 | PM M07-60; PDB:559 INS-16 | Y | custom saved values | Y | COVERED | |
| F-IN-61 | Video embed | ✅ 🆕 | 1652 | PM M07-61 | Y | invalid draft keeps last valid | Y | COVERED | |
| F-IN-62 | Map/Lottie | ✅ 🆕 | 1653 | PM M07-62 | Y | invalid/missing/loading | Y | COVERED | |
| F-IN-63 | Countdown | 🟡 | 1654 | PM M07-63; PDB:558 INS-15 | Y | invalid date error | Y | COVERED | Still a typed date with no picker |
| F-IN-64 | Progress | ✅ 🆕 | 1655 | PM M07-64; PDB:767 INS-D11 | Y | batch reject, legacy corrupt | Y | COVERED | |
| F-IN-65 | Accordion | 🟡 | 1656 | PM M07-65 | Y | — | P | COVERED | Item CRUD is routed to the hierarchy commands, not added to the Inspector |
| F-IN-66 | Flex/Stack block | ✅ 🆕 | 1657 | PM M07-66 | Y | — | Y | COVERED | |
| F-IN-67 | Grid/Columns block | ✅ | 1658 | PM M07-67; PDB:727; INS-07 | Y | reduce-populated choice | Y | COVERED | Its confirm conflicts with SC-15 (T6-28) |
| F-IN-68 | Product type block | ⏳ | 1659 | PM M07-68 Defer; PDB:687 | — | — | — | DEFERRED-BY-DECISION | |
| F-IN-69 | Display + flex | ✅ | 1665 | PM M07-69 | Y | display-change impact | Y | COVERED | |
| F-IN-70 | Grid controls | ✅ | 1666 | PM M07-70 | Y | — | Y | COVERED | |
| F-IN-71 | Position | ✅ | 1667 | PM M07-71; IC-02 | Y | — | Y | COVERED | |
| F-IN-72 | Overflow/Visibility/Float | ✅ | 1668 | PM M07-72 | Y | — | Y | COVERED | Says "readable labels", which addresses the jargon buttons |
| F-IN-73 | Standalone Flex/Grid/Radius | ❌ | 1669 | PM M07-73 | — | — | — | REMOVED-N/A | |
| F-IN-74 | Typography | ✅ | 1670 | PM M07-74; B1A H10–H26 | Y | — | Y | COVERED | The only section with a written field order |
| F-IN-75 | Text inside | ✅ 🆕 | 1671 | PM M07-75 | Y | closed summary | Y | COVERED | |
| F-IN-76 | Font picker | ✅ | 1672 | PM M07-76; II-04; PDB:717,754 | Y | no matches, empty, failed load, missing ref | Y | COVERED | |
| F-IN-77 | Width/Height | ✅ | 1673 | PM M07-77; P06 C9 | Y | live during gesture | Y | COVERED | |
| F-IN-78 | Spacing-token chain | ✅ | 1674 | PM M07-78; IC-11 | Y | bound, unlinked | Y | COVERED | |
| F-IN-79 | Min/Max | ✅ | 1675 | PM M07-79 | Y | unset vs none | Y | COVERED | |
| F-IN-80 | Flex/grid item | ✅ 🆕 | 1676 | PM M07-80 | Y | — | Y | COVERED | |
| F-IN-81 | Inline disabled reason | 🟡 | 1677 | PM M07-81 Fix | Y | disabled+reason | Y | COVERED | |
| F-IN-82 | Spacing box | ✅ | 1678 | PM M07-82; DESIGN.md:130 | Y | token-bound, unset vs 0 | Y | COVERED | The 16px value-target exception is not reconciled with INS-D07's 32px controls (T6-27) |
| F-IN-83 | Pair rows / Gap rows | ❌ | 1679 | PM M07-83 | — | — | — | REMOVED-N/A | |
| F-IN-84 | Fill › Colour | ✅ | 1680 | PM M07-84 | Y | none vs inherited | Y | COVERED | |
| F-IN-85 | Fill › Gradient | 🟡 | 1681 | PM M07-85 | Y | Custom for multi-stop | Y | COVERED | No multi-stop editor (gap kept) |
| F-IN-86 | Fill › Image | ✅ | 1682 | PM M07-86; II-05; P06 B6/C8/C10 | Y | load failure | Y | COVERED | |
| F-IN-87 | Border | ✅ | 1683 | PM M07-87 | Y | — | Y | COVERED | |
| F-IN-88 | Colour row | ✅ | 1689 | PM M07-88; II-06; PDB:716 | Y | bound, unresolved, mixed, invalid | Y | COVERED | |
| F-IN-89 | Colour popover | ✅ 🆕 | 1690 | PM M07-89; II-06 | Y | Light/Dark edit target, "Follows Light" | Y | COVERED | No eyedropper or recents (grep: 0 hits) |
| F-IN-90 | Number + unit | ✅ | 1691 | PM M07-90; IC-02; PDB:766 INS-D11; B1A:84 | Y | invalid, custom expr, conversion disabled | Y | CONFLICT | Unit change: B1A says "preserve number, no conversion". INS-D11 says convert to keep the computed size (T6-3). Scrub is not specified |
| F-IN-91 | Live writes | ✅ | 1692 | PM M07-91; PDB:721; P24 UN-03 | Y | draft, flush | Y | COVERED | |
| F-IN-92 | Read-only + lock gate | ✅ | 1693 | PM M07-92; IC-13; PDB:548 INS-05; SC-14 | Y | locked, conflict | Y | COVERED | |
| F-IN-93 | Opacity | ✅ 🆕 | 1699 | PM M07-93 | Y | unset vs 100% | Y | COVERED | |
| F-IN-94 | Shadow | ✅ | 1700 | PM M07-94; IC-09 | Y | custom layers | Y | COVERED | No visual x/y/blur editor (gap kept) |
| F-IN-95 | Filters | ✅ | 1701 | PM M07-95 | Y | custom functions | Y | COVERED | |
| F-IN-96 | Transform & motion | ✅ | 1702 | PM M07-96; PDB:551 INS-08 | Y | custom value | Y | COVERED | |
| F-IN-97 | Advanced effects | ✅ | 1703 | PM M07-97 | Y | — | Y | COVERED | |
| F-IN-98 | Link | ✅ | 1709 | PM M07-98; P06 B2 | Y | validation, D4 disabled | Y | COVERED | Anchor section picker not addressed |
| F-IN-99 | CMS binding | ✅ 🆕 | 1710 | P06 A1 (overrides PM M07-99); DYN §8 | Y | missing source, no collections, failure | Y | COVERED | "Disconnect" renamed "Unbind" |
| F-IN-100 | CMS-conditional visibility | ⏳ | 1711 | P06 A2 → Content › Conditions; DYN §12 | Y | legacy "Not active" | Y | COVERED | New BD-20 scope; not built |
| F-IN-101 | Visibility | ✅ | 1712 | PM M07-101; P06 B4; P04 markers | Y | indeterminate multi | Y | COVERED | |
| F-IN-102 | Interactions | 🟡 | 1713 | P19 §4.1; PM M07-102 | Y | missing target, conflict | Y | COVERED | No actions beyond animate (OD-I3 "later") |
| F-IN-103 | Element CSS animation | ✅ | 1714 | P19; PDB:735; II-07 | Y | "Plays when rendered" | Y | COVERED | |
| F-IN-104 | CSS classes | ✅ | 1715 | PM M07-104 (→ Style first group) | Y | — | Y | COVERED | |
| F-IN-105 | Attributes | ✅ | 1716 | PM M07-105 | Y | duplicate ID | Y | COVERED | |
| F-IN-106 | data-*/aria-* | 🟡 | 1717 | PM M07-106; PDB:552 INS-09 | Y | empty vs removed, reserved | Y | COVERED | |
| F-IN-107 | Form › Fields | 🟡 | 1718 | PM M07-107; PDB:723–725 | Y | conversion impact | Y | COVERED | Its confirm conflicts with SC-15 (T6-28) |
| F-IN-108 | Form › After submit | 🟡 | 1719 | PM M07-108; PDB:679 | P | admin gate | P | PARTIAL | No Redirect page picker (L3-028); forms still cannot be named (T6-24) |
| F-IN-109 | Slider › Slides | ✅ 🆕 | 1720 | PM M07-109 (→ Content) | Y | — | Y | COVERED | |
| F-IN-110 | Slider › Playback | ✅ 🆕 | 1721 | PM M07-110 | Y | invalid interval | Y | COVERED | |
| F-IN-111 | Collection list | ✅ 🆕 | 1722 | PM M07-111; DYN §11 | Y | empty block | Y | COVERED | |
| F-IN-112 | All CSS | ❌ | 1723 | PM M07-112 Defer | — | — | — | REMOVED-N/A | |

### Brand workspace (INV 1754–1864)

| FID | feature | INV status | INV line | design home (file §) | controls? | states specified | interaction? | coverage status | gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-BR-01 | Rail Brand (B) | ✅ 🆕 | 1760 | P09 BR-01, §11; P02 | Y | viewer disabled | Y | COVERED | inert + `data-bk-surface` added |
| F-BR-02 | Other ways in | ✅ 🆕 | 1761 | P09 §9 "Edit token ›"; P18; P12 RT-15 | P | — | P | PARTIAL | The theme-toggle door and the template "Connect to tokens" toast are not respecified (T6-22) |
| F-BR-03 | Nav column | ✅ 🆕 | 1762 | P09 §4, §4.1 | Y | counts on Colours/Checks | Y | COVERED | Grouped Tokens / Reusable styles / Tools |
| F-BR-04 | Leave Brand | ✅ 🆕 | 1763 | P09 §11; SC-1, SC-2 | Y | — | Y | COVERED | Change: Esc no longer leaves |
| F-BR-05 | Page header | ✅ 🆕 | 1764 | P09 §5; SC-10 | Y | Undo/Redo disabled with reason | Y | COVERED | 56 minimum |
| F-BR-06 | Autosave + one undo | ✅ 🆕 | 1765 | P09 §9; IA-02 PDB:794–804; SC-4 | Y | applied locally / saved | Y | COVERED | |
| F-BR-07 | Review changes | ✅ 🆕 | 1766 | P09 §5; SC-15 | P | — | Y | COVERED | Empty/stale states are kept by reference only |
| F-BR-08 | Read-only banner | 🚩 | 1767 | P09 §10 | Y | switch_off, held, failed | Y | COVERED | |
| F-BR-09 | "No brand set." card | ✅ 🆕 | 1768 | P09 §10 | Y | first run | Y | PARTIAL | The L4-029 reword decision is left open (T6-19) |
| F-BR-10 | Live preview column | ✅ 🆕 | 1769 | P09 §8 | Y | preview source lock, collapse <1280 | Y | CONFLICT | P09 fixes it at 360–520 (default 468). MS:537 IAF-10 F says "preview flex" (T6-12) |
| F-BR-11 | Light/Dark preview switch | ✅ 🆕 | 1770 | P09 §8 | Y | disabled (Off / previewing) | Y | COVERED | |
| F-BR-12 | Beginner/Pro toggle | ❌ | 1771 | P09 §12 "Keep (Pro)"; CP M08-12 Defer | — | — | — | REMOVED-N/A | Inspector users stay stuck in Beginner mode, and this is unaddressed (T6-15) |
| F-BR-13 | Drawer-era frame | ❌ | 1772 | — | — | — | — | REMOVED-N/A | |
| F-BR-14 | Focus isolation | 🐞 | 1773 | P09 §11 | Y | inert | Y | COVERED | |
| F-BR-15 | Colours table | ✅ 🆕 | 1779 | P09 §4 sketch, §6 | P | usage unknown | Y | PARTIAL | The sketch drops the DARK column. UX-18 palette presentation is not decided (T6-16) |
| F-BR-16 | Table keyboard | ✅ 🆕 | 1780 | P09 §11 | Y | — | Y | COVERED | |
| F-BR-17 | Used by highlight | ✅ 🆕 | 1781 | P09 BR-10, §6, §8 | Y | "Can't count right now" | Y | COVERED | Large-reach note >20 is new |
| F-BR-18 | + Add token | 🐞 | 1782 | P09 §9 copy fix | Y | — | Y | COVERED | |
| F-BR-19 | Token card | ✅ 🆕 | 1783 | P09 §6 | Y | dark via alias | Y | COVERED | |
| F-BR-20 | "About drafts" hint | 🐞 🆕 | 1784 | P09 §9 | Y | — | — | COVERED | |
| F-BR-21 | Colour picker | ✅ 🆕 | 1785 | P09 §6; II-06 | Y | invalid draft | Y | COVERED | |
| F-BR-22 | Rename token | ✅ 🆕 | 1786 | P09 §6 | P | disabled reason | P | COVERED | |
| F-BR-23 | Delete token | ✅ 🆕 | 1787 | P09 §6 | Y | usage unknown + Retry | Y | COVERED | |
| F-BR-24 | Reset to default | ✅ 🆕 | 1788 | P09 §6 | P | — | P | COVERED | |
| F-BR-25 | Duplicate token | ⏳ | 1789 | CP M08-25 Defer | — | — | — | DEFERRED-BY-DECISION | |
| F-BR-26 | Colours action row | ✅ 🆕 | 1790 | P09 §4 sketch, §4.1 | Y | — | Y | COVERED | Connect moves to Checks; From logo moves to Starters |
| F-BR-27 | Scale generator | ✅ 🆕 | 1791 | P09 §4.1, §8, BR-10 | P | preview lock | Y | COVERED | |
| F-BR-28 | Drawer colour list | ❌ | 1792 | — | — | — | — | REMOVED-N/A | INV asks whether groups/search come back; no doc decides (T6-16) |
| F-BR-29 | Add/Replace token modals | ❌ | 1793 | CP M08-29 | — | — | — | REMOVED-N/A | |
| F-BR-30 | Dark mode card | ✅ 🆕 | 1799 | P09 §7 Dark mode | Y | impact card, restore point | Y | COVERED | |
| F-BR-31 | Per-token dark values | ✅ 🆕 | 1800 | P09 §4.1, §6, §7 | Y | "No dark value" | Y | COVERED | One write op from both surfaces |
| F-BR-32 | Theme-toggle block | ✅ 🆕 | 1801 | CP M08-32; BIC B69-theme-toggle; PM M07-11 | Y | Off hidden on publish | Y | COVERED | |
| F-BR-33 | Fonts & type styles | ✅ 🆕 | 1807 | P09 §4.1, §6 | P | — | P | COVERED | Where type styles live is ambiguous (T6-17) |
| F-BR-34 | Font popover | ✅ 🆕 | 1808 | P09 §6 | P | — | P | COVERED | |
| F-BR-35 | + Add a font | ✅ 🆕 | 1809 | P09 §4.1 → Assets › Fonts; P08 §7 | Y | — | Y | COVERED | Renamed "Manage site fonts ›" |
| F-BR-36 | Styles page | ✅ 🆕 | 1810 | P09 §4.1 Reusable styles | P | read-only label | — | COVERED | |
| F-BR-37 | Drawer type-scale editor | ❌ | 1811 | — | — | — | — | REMOVED-N/A | |
| F-BR-38 | Spacing page | ✅ 🆕 | 1812 | P09 §6 | Y | — | P | COVERED | |
| F-BR-39 | Other 11 kinds | 🟡 | 1813 | P09 §4.1 Other kinds, §6 | Y | — | P | COVERED | |
| F-BR-40 | Drawer generic rows | ❌ | 1814 | — | — | — | — | REMOVED-N/A | |
| F-BR-41 | Component styles | 🟡 | 1820 | P09 §4.1 → "Browse section blocks in Add ›" | Y | — | Y | COVERED | |
| F-BR-42 | ✦ Generate with AI | 🚩 | 1821 | SC-21; P09 §5, §7 | — | — | — | DEFERRED-BY-DECISION | CP M08-42 still reads "Keep" (T6-18) |
| F-BR-43 | Classes | ✅ 🆕 | 1822 | P09 §4.1; MS:543 H | P | no selection | P | PARTIAL | The page's controls and states are not specified in P09 |
| F-BR-44 | Presets | 🟡 | 1823 | P09 §4.1 "Read-only catalogue" | P | — | N | PARTIAL | The inert binding-row affordance is not addressed (T6-20) |
| F-BR-45 | Brand checks list | ✅ 🆕 | 1829 | P09 §7 Checks | P | — | P | PARTIAL | Open action, "Nothing to fix" and error-first ordering are not restated (T6-13) |
| F-BR-46 | Rules | ✅ | 1830 | P09 §7 (implicit) | N | — | — | PARTIAL | No rule list in any doc (grep "Banned hue" / "Pure black" = 0) |
| F-BR-47 | Run checks | ✅ 🆕 | 1831 | P09 §7 | Y | — | Y | COVERED | |
| F-BR-48 | Ignore (suppress) | ✅ | 1832 | CP M08-48 only | N | — | N | PARTIAL | Not in P09 (T6-13) |
| F-BR-49 | Connect to tokens | ✅ 🆕 | 1833 | P09 §4.1, §7, §8 | Y | preview lock | Y | COVERED | Restore point not decided (T6-21) |
| F-BR-50 | Templates bind literal colours | 🐞 | 1834 | P15 §4.1 Brand line; CP M08-50 Fix | P | — | P | PARTIAL | Only the copy is made honest; the Brand value gap stays open (T6-22) |
| F-BR-51 | Starters | 🐞 | 1840 | P09 §7 Starters | Y | preview, offline restore-point notice | Y | PARTIAL | Real-brand names and indigo/violet primaries are not addressed (T6-14) |
| F-BR-52 | Brand from logo/URL | 🚩 | 1841 | SC-21; P09 §7 | — | — | — | DEFERRED-BY-DECISION | Flagged PLANNED; hidden this version |
| F-BR-53 | Restore points | ✅ 🆕 | 1842 | P09 §5, §7, §10; SC-15 | Y | empty, unavailable | Y | COVERED | SC-11 definition is narrower (T6-21) |
| F-BR-54 | Theme push / Recapture | ⏳ | 1843 | CP M08-54 Defer | — | — | — | DEFERRED-BY-DECISION | Dashboard scope |
| F-BR-55 | Starter grid / pill | ❌ | 1844 | CP M08-55 | — | — | — | REMOVED-N/A | |
| F-BR-56 | Import/export panel | ✅ | 1850 | P09 §5, §7; MS:543 | Y | — | Y | COVERED | Gains the header |
| F-BR-57 | Figma Variables row | ❌ | 1851 | — | — | — | — | REMOVED-N/A | |
| F-BR-58 | Import | 🟡 | 1852 | P09 §7 Import | Y | detected/valid/errors/conflicts, dry-run | Y | COVERED | "Tailwind config (AST)" detection label not addressed |
| F-BR-59 | Legacy Export dropdown | ❌ | 1853 | — | — | — | — | REMOVED-N/A | |
| F-BR-60 | Migration modal | ✅ | 1854 | P09 BR-13, §12 Keep; CP M08-60 | P | — | P | PARTIAL | Kept by reference; Restore snapshot/Retry not restated |
| F-BR-61 | Server token boundary | 🚩 | 1855 | P09 §10; root CLAUDE env | Y | held ≠ denied | Y | COVERED | |
| F-BR-62 | Lint aggregate banner | ❌ | 1856 | — | — | — | — | REMOVED-N/A | |
| F-BR-63 | Canvas token application | ✅ | 1862 | P09 §1, T-BR-02 | Y | — | Y | COVERED | |
| F-BR-64 | Checks feed Issues | ✅ | 1863 | P12 RT-15; CP M08-64 | Y | — | Y | COVERED | |
| F-BR-65 | Onboarding "Set your brand" | ✅ | 1864 | P16 step 3 | Y | role gate | Y | COVERED | |

INV "Gaps still not built" (1725–1732), not counted as rows. Type-specific navbar/tabs/modal: BIC per-block records exist, with commerce deferred. Interaction actions: OD-I3 "later". Scrub / eyedropper / recents / multi-stop: not addressed (multi-stop kept as Custom). Custom CSS: deferred (M07-112). ARIA rows: M07-106. Pressed states: not added. Breakpoint in Inspector: decided against (IA-06).

## Principle observations

| PID | module/panel | observation (spec-level) | risk | evidence | suggested status |
|---|---|---|---|---|---|
| P04 | Inspector | Disclosure is well specified (section modes, More settings with active count, no auto-expand of defaults), but the label pattern conflicts (More settings vs Advanced typography · N) | Inconsistent disclosure wording across sections | PM M07-19; PDB:561; B1A:26 | NEEDS REVISION |
| P05 | Inspector | Source/provenance shown per field ("Computed value · source unavailable"; never fake defaults) | — | PDB:715; II-01 | PASS-SPEC |
| P11/P37 | Inspector | Tab and section order is defined purpose-first (define → shape → paint; Layout = children vs Placement = self) | Field order inside most sections is unwritten | PDB:676–683 | NEEDS REVISION (field order) |
| P16/P20 | Inspector | Spacing system defined (12/8/12, 32 controls, 300w), but label-column width is not, and B1A contradicts it | Implementers invent label widths per section | PDB:746; B1A:27 | NEEDS REVISION |
| P23 | Inspector | Override feedback is specified at 4–5 levels by SC-13. FD-INS argues for one authoritative level | Re-creates UX-14 noise | SC-13; PDB:561; PM M07-39 | NEEDS REVISION |
| P24/P25 | Inspector | Error prevention: draft retention, invalid-draft preflight before Preview/Publish, lossless compound edits | — | PDB:721, 768–769, 718 | PASS-SPEC |
| P25 | Inspector + SC-15 | Recovery model conflicts: INS-D05 confirms column/field-type destruction while SC-15 bans unlisted confirms | Implementer ambiguity on destructive structure edits | PDB:725–727; SC-15 00:275–276 | NEEDS REVISION |
| P31 | Inspector/Brand | Nouns drift: Text style / Size preset / Font-size token / Type styles; master / definition / main component; Colour mode / Dark mode | Users meet several names for one concept | PDB:678; B1A:23; P09 §4.1; P13 §9; SC-11 | NEEDS REVISION |
| P31 | All | SC-11 mandates US English, but tabs say "Behaviour" and Brand says "Colours" | Copy drift at build | SC-11 00:231; PDB:672; P09 | NEEDS REVISION |
| P38 | Inspector | Many states are distinguished (empty/zero/inherited/bound/override/mixed/invalid/custom), but Mixed has no visual/text spec | Mixed renders inconsistently | PDB:624; INV 1614 amber | NEEDS REVISION (minor) |
| P35/P36 | Brand ↔ Inspector | One colour picker and one write op are specified for dark values; II-06 defines local vs shared edits | — | P09 §6; II-06 | PASS-SPEC |
| P32 | Brand | Nav grouping (Tokens / Reusable styles / Tools) and Other kinds pages fix the hidden 11 kinds | — | P09 §4.1 | PASS-SPEC |
| P23 | Brand | Starters gain preview + restore point; impact note when >20 uses | — | P09 §6, §7 | PASS-SPEC |
| P34 | Brand | Width budget and collapse rules are given, but they conflict with IAF-10 F | Two sources for preview width | P09 §8; MS:537 | NEEDS REVISION |
| P39 | Inspector | Tablist, labels, non-colour indicators and non-drag reorder are specified. The 16px spacing-box targets (owner exception) are not reconciled with 32px controls | WCAG 2.5.8 exception is undocumented in the spec | PDB:752; DESIGN.md:130; INV 1678 | NEEDS REVISION (minor) |
| P40 | Brand | Open owner decisions are carried forward unresolved (L4-024, L4-028, L4-029, UX-18) | Core Brand value gap stays open | INV 1834, 1840, 1768, 1779 | BLOCKED (owner decisions) |

## Contradictions & gaps

| ID | type | statement A (cite) | statement B or what is missing (cite) | severity | proposed resolution |
|---|---|---|---|---|---|
| T6-1 | stale | B1A:51 H05 "Style/Behaviour/Effects tabs — same IDs/order"; B1A:37 Heading block in Style | PDB:672 INS-D01 four tabs, with Heading level in Content (PDB:677) | Major | Mark B1A tab/placement rows superseded by FD-INS-02; keep only its H-row census |
| T6-2 | contradiction | PDB:678 rename to **"Font-size token"** (all callers) | B1A:23 **"Size preset"** + "Links font size only", heading only; P09 §4.1 "Type styles"; INV "Text style" | Major | Pick one noun in SC-11 and apply it in both the Inspector and Brand |
| T6-3 | contradiction | B1A:84 "Unit changes preserve number and change the stored unit (no implicit conversion)" | PDB:766 INS-D11: convert to preserve the computed size; disable when unresolvable | Major | INS-D11 governs; state in B1A that §Shared control behavior is the as-built baseline |
| T6-4 | contradiction | SC-13 00:263 "per-property **Reset to {parent breakpoint}**" (wins per precedence) | PDB:544 INS-01 "do not label every reset 'Reset to Desktop'"; IC-03 / PDB:628,715 "Remove Mobile override", fallback resolved first | Major | Amend SC-13: label names the removed layer, and the tooltip names the resolved fallback source |
| T6-5 | contradiction | SC-13: dot + "Tablet" label + section header "N overrides on Tablet" + tooltip + first-time note | PM M07-39 Merge; PDB:561 INS-18 "one persistent scope summary… not repeating the same warning five times" | Major | Amend SC-13 to the M07-39 three-level model (context, section count, field source) |
| T6-6 | missing | INV 1588 / PM M07-29 / B1A H31–H32 keep "Apply style to all … on this page" and "Reset style" in Inspector ⋯ | SC-3 00:42–61 registry has no row for either | Major | Add both rows to SC-3 with surface columns |
| T6-7 | contradiction | PDB:676 component variant/reset/detach in the header identity-details subview; PM M07-49 "Edit definition" | P13 §9 "Inspector ComponentRow… Edit main component" (unchanged); SC-11 "Main component", not master | Minor | Align P13 §9 to INS-D01 placement; one label "Edit main component" |
| T6-8 | contradiction | SC-11 00:231 "US English in UI copy (Color…)" | PDB:672 tab "Behaviour"; P09 "Colours", "Colour mode" (sketch "Colors") | Minor | Declare the tab/section labels (Behavior, Colors) or add an exception to SC-11 |
| T6-9 | missing | PDB:746 INS-D07: 32px controls, 12px section padding, stacked labels "for long/complex fields" | No label-column width or inline/stacked threshold. B1A:27 proposes 96/8/164 with 16px padding and 28px controls in 32 rows (conflicts) | Major | Add an Inspector row-anatomy spec (label width, control height, row height, threshold) to INS-D07; retire the B1A numbers |
| T6-10 | missing | PDB:746 section padding given | Section-header height, "Name +" empty-row height and More-settings row height not given | Minor | Add to INS-D07 table |
| T6-11 | stale | B1A:35 "Rail60 + drawer280 + Inspector300" | PDB:750 / GEO-01 rail 56 + panel 284 | Minor | Update B1A or mark it historical |
| T6-12 | contradiction | P09 §8 preview "fixed width, min 360… default 468, no splitter"; nav 240 | MS:537 IAF-10 F "nav 240/detail 320, preview flex" | Minor | P09 governs (later, panel-level); annotate MS |
| T6-13 | missing | INV 1829–1832: rules list, Open action, "Nothing to fix", Ignore + ignored count | P09 §7 says only "findings with Fix actions"; Ignore appears only in CP M08-48 | Minor | Add the Checks page anatomy (row actions, empty state, ignore/restore) to P09 §7 |
| T6-14 | missing | INV 1840 L4-028: starters named after real brands (Stripe, Notion, Apple, Linear, Vercel); two indigo/violet primaries | P09 §7 Starters specifies only preview/apply; grep for the names = 0 | Major | Owner decision: rename starters generically and recolour to pass the banned-hue rule |
| T6-15 | missing | INV 1771: Inspector reads persisted Beginner mode, with no control to change it | P09 §12 "Beginner/pro colour filter → Keep (Pro)" (Brand only); CP M08-12 Defer; nothing for the Inspector | Major | Decide: force Pro in the Inspector too, or delete the Beginner path; record it in P06 |
| T6-16 | missing | INV 1779 UX-18 / 1792: ~58 code-named tokens, groups/search decision | P09 §4 sketch is a flat list; no grouping/search decision | Minor | Decide grouping (semantic/primitive) and search in P09 §6 |
| T6-17 | ambiguity | P09 §4.1 "type styles are no longer listed here — they live in Reusable styles" | P09 §6 Typography "Family, size scale"; Inspector Font-size token binds font-size tokens (PDB:678) | Minor | State which page owns font-size tokens and which page owns type styles |
| T6-18 | stale | CP M08-42 / M08-52 "Keep" (AI generate, logo/URL) | SC-21 hides all Brand DS-AI entries | Minor | Annotate CP rows "inactive per SC-21" |
| T6-19 | missing | INV 1768 L4-029 open: reword "No brand set." → "Using default tokens." | P09 §10 keeps "No brand set." without deciding | Minor | Record the decision in P09 §10 |
| T6-20 | missing | INV 1823: preset binding rows look clickable but do nothing | P09 §4.1 says only "Read-only catalogue" | Minor | Specify non-interactive row styling or a link to the token |
| T6-21 | ambiguity | SC-11 00:223 Restore point = "before a starter or import" | P09 §7 / INV 1842: also created by scale, Dark Auto, logo and theme push; Connect (OQ-4) undecided | Minor | Widen the SC-11 definition; decide Connect |
| T6-22 | missing | INV 1834 L4-024: templates bind literal colours, so Brand edits don't recolour them; INV 1761 template toast "Connect to tokens" | P15 §4.1 fixes only the copy; neither P09 nor P15 specifies the post-template Connect offer | Major | Specify the post-apply Connect-to-tokens entry (P15 → P09 §7) and its owner decision |
| T6-23 | missing | INV 1559 L2-034: one-item Page ⋯ menu | PM M07-5 "Preserve current menu actions" | Minor | Decide the page actions set |
| T6-24 | missing | INV 1719 L3-028: no Redirect page picker; forms unnamed | PM M07-108 lists "Redirect to" without a picker | Minor | Reuse the Link page picker (M07-98) for Redirect |
| T6-25 | missing | INV 1575 Hide inspector "⌘\" | SC-12 table has no ⌘\ row (browser-conflict check not done) | Minor | Add to SC-12 with three-browser acceptance |
| T6-26 | missing | INV 1614 Mixed shown amber | PDB:752 "readable without colour"; no text/visual token | Minor | Specify the Mixed placeholder copy and token |
| T6-27 | missing | INV 1678: spacing-box numbers 16px tall (owner WCAG 2.5.8 exception) | PDB:746 default 32px controls; exception not recorded | Minor | Record the exception in INS-D07 or enlarge the targets |
| T6-28 | contradiction | PDB:725–727 INS-D05: field-type conversion "before confirmation; default Cancel"; column reduction "Remove contents… confirmation"; INV 1640 component Reset/Detach "each with a confirm" | SC-15 00:275–276 lists the only allowed confirms; "Any other confirm in panel text is overridden" | Major | Add these to SC-15 exceptions or restate them as Undo-only |

## Consistency notes

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

## Counts

| Group | Rows | COVERED | PARTIAL | OMITTED | DEFERRED-BY-DECISION | REMOVED-N/A | CONFLICT |
|---|---|---|---|---|---|---|---|
| Inspector (INV 1555–1723, 48a–k counted separately) | 122 | 91 | 4 | 0 | 3 | 17 | 7 |
| Brand Part A (INV 1760–1864) | 65 | 39 | 11 | 0 | 4 | 10 | 1 |
| **Total** | **187** | **130** | **15** | **0** | **7** | **27** | **8** |

Contradictions & gaps: 28 (T6-1…T6-28). Of these, 11 are Major and 17 are Minor; none is Critical. Principle observations: 16 rows.
