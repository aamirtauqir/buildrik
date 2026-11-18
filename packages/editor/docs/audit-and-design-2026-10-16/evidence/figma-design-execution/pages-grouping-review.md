# Pages grouping and clarity review — BD-26 criteria / BD-27 refinement

Date: 2026-10-18. DESIGN ONLY. File `2L9OTGzBrL6kYmU18yA1c7`. This review assesses geometry, grouping/hierarchy, labels/status scope, and interaction/accessibility separately. It is not a repeat of the prior geometry-only acceptance, and does not infer user acceptance.

## Evidence and bounded findings

Native `node.screenshot({scale:1})` renders were used because the external screenshot path showed stale offsets after reparenting. Read-only native bounds supplemented the renders. Source `src/editor/sidebar/tabs/pages/components/PageList.tsx:360–366` confirms the old bottom text is a legend, not a live dirty-state assertion.

### Grouping and hierarchy

The main panel63:6393 now gives each content group a clear purpose. Search and a consistent three-choice view selector remain pinned above one scrolling body. Header More is separated from page-row menus. Folders have a distinct title/privacy helper. Blog post and its Open page/Manage in CMS commands are visibly enclosed in one collection card. Add page is the primary creation command; From template and New folder are visible secondary commands. Normal state reads as navigation → resources → creation.

Contact now uses reusable stacked-status row80:14400 (260×56), keeping name and URL separate from Hidden from publish. Its existing Name/URL/Status properties are preserved. Ordinary rows remain40px; recovery retains its80px exception. This is contextual height selection rather than text reduction.

Native Structure and empty-result renders preserve URL hierarchy and Clear search respectively. Recovery remains a dedicated subview; normal view/search/creation controls are not injected into it.

Two bounded review findings were sent to author: (1) More-menu scene65:17148 used shorter Hidden instead of Hidden from publish; (2) active rename63:14567 showed two equally prominent blue actions, Update URL and pinned Add page. Recommend descriptive status consistency and secondary Add page in this decision state, preserving its action/guard.

### Labels and status scope

The explanatory text “● marks a page with unsaved changes” correctly identifies the dot as a legend and no longer reads as a competing live status beside Saved just now. The global save-status control is retained. My folders / Only visible to you describes the private organization group; the collection group separates template editing from CMS records. Open page is understandable inside the named Blog post card; its accessible name should include that target.

### Geometry

Normal panel remains284px beside56px rail. Header56 + pinned navigation92 + scroll body577 + footer84 fit the812px desktop panel with existing borders/divider. Footer controls remain32px targets. Rename keeps236px input/actions within a260px inline card. Lower content stays in the clipping/scrolling body, not behind an unscrollable footer.

Short78:19785 (1440×600): body277px, footer84 fixed. Narrow78:20392 (1024×768): body445px, footer84 fixed. Native screenshots confirm header/search/views/footer/Help and bottom tabs/status fit. At short height folders begin at the fold; at narrow height collection actions are below it. This is a material discoverability trade-off: implementation needs a visible scroll affordance and must reveal keyboard-focused content. Static fit is not proof of scroll usability.

Row-menu63:14496 is x340/y262,280×330. Header More65:17824 is x56/y108,280×170. Their desktop geometry follows the new triggers. Open-menu clamping at small viewport sizes remains untested.

### Interaction and accessibility

Main Listings/Structure destinations and header More→65:17148 are retained by native readback. Existing Add/Template/New folder and some Open page commands remain unwired; this review does not treat visible controls as executed journeys. Segmented views still need tab semantics, selected state, arrow-key navigation and panel association in implementation. Header More and row menus need distinct accessible names, keyboard operation, dismissal and focus restoration. Icon-only native names are handoff evidence, not browser accessibility verification.

Actual scrolling, prototype playback, keyboard focus/guards, screen readers, contrast measurement, persistence, undo/restore and browser behavior were NOT RUN. Long names, long URLs and translated labels were not stress-tested. No app/Figma changes were made by reviewer.

## Disposition after targeted closure

Geometry, grouping and labels pass bounded representative review. Both reported hierarchy/label findings are now closed by the targeted readback below. Interaction/accessibility remains PARTIALLY VERIFIED by structure only. Full B3 and user visual acceptance remain open.

## Final targeted closure — 2026-10-18

- **Rename action hierarchy closed:** `63:15229` retains its Add page label and268×32 target, with Style=Secondary and State=Default. Update URL is the local primary. The action remains visible; no new disabling behavior was introduced.
- **Status-label consistency closed:** More-scene Contact `65:17741` uses the compatible stacked-status row at260×56, with Name=Contact, URL=/contact and Status=Hidden from publish.
- **Scroll affordance added:** native readback confirms scrollbar specimen `82:12861` for rename and `82:12863` for restored receipt (each4×561); visible short `82:20511` (4×261) and narrow `82:20513` (4×429). These are visual cues, not proof of functioning scrollbar/keyboard behavior.
- Read `pages-grouping-refinement.md`: it records BD-27 implementation of the BD-26 review criteria, pinned navigation/body/footer dimensions,56px descriptive row and80px recovery exceptions, contextual rename priority, legend scope, and explicit unwired/runtime limits.

**No outstanding blocker in this bounded grouping correction.** The previous fit-only pass is not used as evidence of semantic quality: task grouping, hierarchy and status scope were separately reviewed in native renders. Final fixes were verified by targeted properties/readback; no general re-audit or runtime playback was performed. Status remains PARTIALLY VERIFIED and user acceptance is not inferred.
