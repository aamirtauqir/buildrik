# R29 — Editor panels and preview normalization
Date: 2026-10-13
Status: Implemented in the existing improved Figma file; bounded QA below. Full Editor/product parity remains open.

## File and scope
File: [Buildrick — Product](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-3).
Page: 04 PRODUCT DESIGN / Flow reconciliation (`8463:2`).
Original baseline, production source and Build screens were not changed.

## Implemented mapping
| ID | Existing destination | Change | Validation |
|---|---|---|---|
| R29-01 | History `8539:9190` | Existing task content now occupies the 352px right inspector region. Transparent overlay retains the actual caller canvas. Close restores the inspector. Session/Published lead to their existing specific states. | Native layout and Desktop open/close playback passed |
| R29-02 | Publish `8539:9433` | Same right panel geometry, corrected project identity, shared destination select and explicit Close. Destination opens existing targets. | Native layout and Desktop open/close playback passed |
| R29-03 | Pages `8539:9579` | Temporary 352px left drawer with existing pages/settings, shared text controls, SEO entry, creation affordance and Close. | Native layout and Desktop open/close playback passed |
| R29-04 | Preview `8539:9339` | Focused Desktop visual preview, current committed heading binding, scrolling stage, one Back to editor action. | Desktop preview and exact caller return visually inspected |
| R29-05 | Desktop/Mobile box model | “Apply 32px padding” renamed “Set all sides to 32px”, accurately describing the existing four-variable action. | Both native text labels inspected |

## Component and architecture record
- Reused existing Ghost buttons (`8314:7`), Select (`8531:330`), Text (`8531:318`), semantic variables and UI text styles.
- Panel header, task body, card copy and footer relationships use auto-layout.
- Existing overlay IDs and incoming routes remain intact.
- Old duplicate chrome/canvas layers are hidden within those same overlays; no original baseline nodes were removed.
- Full-size transparent prototype carriers preserve the underlying caller. They block interaction behind an open drawer; this is a temporary overlay simulation, not runtime docking/resizing.
- Pages covers a portion of the canvas while open. The caller canvas does not resize in this Figma simulation.
- Advanced History, SEO and publication destinations retain their existing dedicated workspaces.

## Evidence
Construction: `evidence/r29-editor-panels.js`, `r29-editor-panels-receipt.json`.
Desktop playback: `evidence/r29-editor-walk.json.receipt.json`; screenshots of History, Publish, Pages, Preview and return inspected, not inferred solely from unchanged overlay URLs.
Follow-up playback: `evidence/r29-editor-walk-02.json.receipt.json`. Mobile Main section remains visible under History and returns with Mobile/selection intact; publication destination opens the existing Targets workspace; return and Pages retain the Mobile caller. Screenshots were inspected. A final native fit correction reduced shared field widths from 320 to their 318px parent content width; `r29-final-field-widths.json` supersedes the earlier field widths.
Shared field and final geometry readbacks are saved separately.

## Unresolved issues
| Severity | Location | Remaining work |
|---|---|---|
| High | Publish | Existing Save and run checks is still unwired; destination selection, checks and release require feature-specific simulation and service contracts. No save or publication was executed. |
| High | Pages | Existing page creation, page switching/search and editable page fields are not a working CRUD prototype. Their presence is not completion. |
| Medium | Preview | Authored Home/Desktop content; arbitrary responsive styles, different pages and every caller's image/content do not automatically propagate. Heading binding alone is not a full document model. |
| Medium | Advanced task views | Existing dedicated History/SEO/Publish screens still need consistency and action coverage review. |
| Open | Product audit | Earlier generic outcomes, responsive state fixtures and full original-to-improved parity remain unresolved in prior audit records. |

No completion percentage or full Editor completion claim is made.

