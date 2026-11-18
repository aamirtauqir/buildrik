# Phase 5 dedicated workspace design review

10 October 2026. Twelve native 1440×900 workspace screens are delivered on the separate TO-BE page `8312:2`. They are design proposals with explicit simulated states and engineering dependencies. They do not establish that backend recovery, permissions, delivery or persistence works. This closes the assigned workspace drawing and review scope; the parent audit owns the overall Phase 5 gate and Phase 6 prototype wiring.

## Delivered native screens

| ID | State | Native frame | Final comparison image |
|---|---|---|---|
| TB-W01 | CMS records | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-9) | [PNG](evidence/tobe-workspace-validation/TB-W01.png) |
| TB-W02 | CMS record conflict | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-103) | [PNG](evidence/tobe-workspace-validation/TB-W02.png) |
| TB-W03 | Media / Library | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-201) | [PNG](evidence/tobe-workspace-validation/TB-W03.png) |
| TB-W04 | Media / Metadata not saved | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242017) | [PNG](evidence/tobe-workspace-validation/TB-W04.png) |
| TB-W05 | Media / Upload incomplete | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242115) | [PNG](evidence/tobe-workspace-validation/TB-W05.png) |
| TB-W06 | Brand palette and token | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242215) | [PNG](evidence/tobe-workspace-validation/TB-W06.png) |
| TB-W07 | Brand typography and spacing | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242322) | [PNG](evidence/tobe-workspace-validation/TB-W07.png) |
| TB-W08 | Settings / SEO draft | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242436) | [PNG](evidence/tobe-workspace-validation/TB-W08.png) |
| TB-W09 | Settings / Unsaved exit | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242558) | [PNG](evidence/tobe-workspace-validation/TB-W09.png) |
| TB-W10 | Settings / Analytics | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242691) | [PNG](evidence/tobe-workspace-validation/TB-W10.png) |
| TB-W11 | Template preview | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242809) | [PNG](evidence/tobe-workspace-validation/TB-W11.png) |
| TB-W12 | Templates backup failure | [Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242887) | [PNG](evidence/tobe-workspace-validation/TB-W12.png) |

The [screen and behavior specification](PHASE5-WORKSPACE-DESIGN-SPEC.md) preserves the advanced capabilities and distinct save models. The [machine-readable frame and action ledger](evidence/figma-tobe-workspaces.json) contains exact IDs, bounds, named action nodes, form controls and native structure counts for the Phase 6 handoff.

## Verification and corrections

All twelve final frames were exported and visually reviewed at 1440×900. The final PNG files were checked for their PNG signature and exact dimensions. Structural readback found 1204 native descendants, 508 text nodes, 59 Auto Layout frames and 92 shared button component instances. The nine raster fills are content-only media thumbnails; editor chrome, table content, navigation, forms and dialogs remain native/editable. All twelve frames returned no text bounds outside the frame. This boundary check is a useful clipping check, not proof of every nested overlap or accessibility behavior.

Review corrected clipped field rows, duplicate Media search, a CMS navigation overlap, contextual Back labels wrapping after the shared button text update, and the Analytics integration door wrapping. The selected Media item has an explicit blue outline. CMS conflict Save remains disabled, the server value is read-only, and Analytics has disabled save/discard in its clean state. Brand has an editable native contextual preview and a visible active color mode. The common controls inherit the shared #8591A3 active border and canonical #1A56DB accent; decorative separators remain distinct. No whole-screen screenshot is used as a design layer.

## Finding and ownership trace

- CMS keeps records/schema service persistence separate from document binding Undo, and retains Fields, Dynamic pages, collection settings and import access. UX-15/16/17 and IA-06/07/10 guide the entry and context contract.
- Media failure designs address WS-01 and RT-01: transferred bytes, asset registration and metadata persistence are separate facts. Retained edits and retry are proposed service contracts; the designs do not close the underlying findings.
- Brand clarifies global token scope versus a local property binding and restores useful type/spacing access (UX-18/19). Known usage is bounded; it is not an all-elements guarantee.
- Settings separates draft footer saves, immediate object operations and workspace dashboard doors. UX-21/22 inform validation/dirty focus; WS-04 keeps Buildrick event evidence separate from GA delivery. WS-05 remains a security dependency beyond masking a design input.
- Templates separates Create page from Replace Home, names style provenance, and exposes backup failure before replacement (UX-03/04/08). The recovery checkpoint is a History version. The design does not guarantee transactional rollback.

## Prototype handoff and limits

The ledger identifies 222 named action nodes across the twelve frames, including disabled controls. These are purpose labels for the Phase 6 action audit, not 222 implemented interactions. No reactions were added in this assigned task. Root should connect the representative workspace journeys and explicitly classify secondary doors, text entry and complex service actions in the shared prototype ledger.

Native coverage is representative desktop states. The specification carries responsive drill-in/scroll/focus contracts; these twelve frames do not prove 1024px layout, 200% zoom, keyboard operation, screen-reader semantics or responsive implementation. CMS fields/import/dynamic setup, Media editing/versions/folders/fonts, extra Brand token kinds/presets/classes, remaining Settings categories and template gallery filters are preserved contractually, not claimed as twelve additional rendered journeys. Provider requests, real uploads, conflict resolution, template import, autosave, undo, secure storage and role enforcement require implementation or runtime verification and must not be simulated as successful backend work.

The existing AS-IS page and original pages were preserved. No application code, browser state, user project, test, migration or provider configuration changed. No app test run was appropriate for these Figma and audit-document changes.

Supplementary entry, recovery, first-collection and validation designs are reviewed in [the supplementary report](PHASE5-SUPPLEMENTARY-WORKSPACE-REVIEW.md).
