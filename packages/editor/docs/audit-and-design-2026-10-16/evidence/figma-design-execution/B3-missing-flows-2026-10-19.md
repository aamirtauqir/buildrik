# B3 missing flows — execution and independent QA

2026-10-19 · Figma design only · BOUNDED CHECKPOINT DELIVERED / PARTIALLY VERIFIED

User requested execution of the remaining Figma plan with an independent QA agent. This record extends the existing execution ledger; the brief, P11/P15 and SC-24 remain canonical.

Current inspection confirmed P01 manager and P10 guard exist in the destination file. P01–43 already represent the earlier Pages work; preserve them and extend the genuine missing branches. The metadata page-list endpoint returned only Read me; the Plugin API confirmed all ten existing pages and P28. Do not mistake that partial endpoint result for a blank file.

First task: resolve About page-settings drafts and return to the captured Pages manager while Home remains active. Extend P10 for saving, failure, offline and validation continuation; preserve Keep editing as safe primary and no background navigation under modal. Follow with blank/template creation and organization per B3 ordering. Applied-but-unsynced and ordinary autosave must not acquire a false Discard operation.

Integration: retain Pages284 + rail56, Inspector300, topbar56, bottom32. Keep guard480 and page-settings720; adapt short-height body scrolling while footer stays reachable. Reuse existing shell, semantic variables, Inter/Geist Mono styles and Button/Input instances. No new permanent panel or token system. A generic toast-only treatment was rejected because it cannot resolve a draft before navigation; widening Pages was rejected because a bounded modal already owns this task.

Discovery: no Code Connect files found in this editor package; existing native scenes provide Button, Input, Select, PageResourceRow, navigation and status components. Local variables and text/effect styles were read. New work is an extension of the existing design output, not a current-product claim based on Figma. Source NewPageModal confirms name/source/nav fields and delayed template creation; P11/P15 govern intended changes.

Validation method: inspect native structure, actual screenshot composition and route graph; independent `figma_qa` checks all four dimensions. Static links do not prove playback, keyboard focus, server saving or Undo. Results and exact new node IDs follow.

## Delivered Figma output

**40 additional native states, P44–P83, on Editor page `3:4`** in [Buildrick design](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=101-29978). P01–43 remain; their existing manager/guard entry points were connected to the new states. The file's Start here note now records this checkpoint and the correct rail/bottom-bar ownership.

| Slice | States and entry | Represented behavior |
|---|---|---|
| About settings draft and return | [P44](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=101-22426), P44–53 | Retained input, saving, rejected save, offline guard, validation correction with pending return, navigation cancellation while save continues, late completion staying in settings, short-height guard |
| Blank creation | [P55](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=101-36828), P54–63 | Source/name/navigation choice; empty name; capacity reached/checking/unavailable; rejected/offline create; submitting; named empty-page result |
| Create from template | [P64](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=104-28892), P64–71 | Ten source-grounded catalog entries; SaaS Landing preview; interim consequence confirmation; progress/delay; page-created/import-failed recovery; successful Services page and exact settings return |
| Template operation recovery | [P69](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=106-37394), P72–76 | Delete confirmed-empty created page with Undo; inspect existing empty page; cancel before import; unknown outcome; retry import into the same Services page |
| QA-driven continuity companions | P77–83 | Retained ten-page manager; invalid URL draft and its own guard; empty name retained when switching source; Undo restores Services while Home stays active; offline short-height retained form/manager |

The [native ledger](b3-missing-flows-ledger.json) records each ID, frame size, native node/instance counts, font families, visible receipt bounds and actionable route graph. The fresh final inventory reports **40 frames, 114 nodes carrying actions, Inter/Geist Mono only, zero image-filled nodes**. These are structural counts, not test or feature-coverage counts. Every new screen is editable native content; the single new `PageTemplateCard` component is `103:30360`, using existing semantic variables, styles and Button instances. No new token collection was introduced.

Capacity fixtures distinguish static pages from the collection definition: the ordinary five-static-page fixture consumes six of ten slots; its new Services result consumes seven; the limit fixture contains nine static pages plus the collection definition. These illustrative counts do not prove the capacity service.

## Independent QA and corrections

[Independent QA report](B3-independent-QA-2026-10-19.md) records the findings, fresh readbacks and screenshots. **No outstanding blocker remains from that bounded review.** Findings were corrected before this checkpoint: conflicting save labels, stale saved text, hidden receipts, wrong offline/viewer returns, links attached to background instead of modal controls, lost invalid/empty-name drafts, lost ten-page/short-height context, and Undo unexpectedly changing the active page. Template success now has matching section rows and the same canonical Services settings destination from Inspector and receipt.

| Dimension | Checkpoint result |
|---|---|
| Geometry | Representative 1440×900/600 compositions inspected; visible actions/receipts and scrolling bodies checked. Not every viewport/frame is measured. |
| Grouping and hierarchy | Source selector, task action, scope, recovery choices and safe Keep editing emphasis reviewed independently. |
| Labels and status | Scoped Page versus settings feedback, page identity, exact returns and count consistency checked in sampled states. |
| Interaction/accessibility | Relevant prototype destinations and disabled controls inspected structurally. Real keyboard/focus/assistive-technology behavior remains NOT RUN. |

**Playback attempted but not executed:** Figma stayed on Loading and reported WebGL initialization failure (with 403/login-provider errors). No design-frame click completed in the browser. This is a host rendering limitation, not a pass or a product defect. See the QA report's saved loading screenshot. No application implementation, server save, history operation or runtime regression claim follows from this design work.

## Prototype conventions and remaining coverage

- Field hotspots simulate an explicitly corrected value; they do not accept typing. Timed progress transitions illustrate selected confirmed outcomes; elapsed time is not the product's save-success rule. Error/offline states have separate starting points rather than a fake server toggle inside product UI.
- P75 → P73 represents one confirmed-empty reconciliation outcome. Found-and-populated, still-pending, inaccessible and missing outcomes remain to be drawn. Retrying P69/P73 imports into the existing Services page instead of creating another page.
- Only SaaS Landing has a connected preview/create journey. Other cards, catalog search/filters/device views and copied context menus outside this journey remain visual contracts. Card thumbnails are schematic; the authored sample is illustrative, not final template content acceptance. Full Templates/B6 is open.
- B3.1 is still partial: CMS/Brand/Site settings and multi-owner guards, access/target changes, applied-but-unsynced outcomes and complete keyboard behavior remain. No Discard is added to applied shared-history edits.
- B3.2 is still partial: unchecked navigation, all validation/permission/reconciliation branches, replacement, plan gates and the T4 creation-Undo dependency remain. The interim confirmation is retained until the documented T4 guarantee exists.
- B3.3 organization/folders/reordering/bulk/recovery breadth, B3.4 Canvas/Layers, B3.5 navigation doors, B3.6 integrated traceability, B4–B10 and research/implementation acceptance remain open. This checkpoint does not complete B3 or the whole editor.

Continue from the existing B3 packet order and canonical contracts; do not redraw P01–83 or treat frame count as completion. Application `src`/`demo` files were not changed by this execution.
