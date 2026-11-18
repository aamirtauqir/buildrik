# Buildrik Design Blockers — 4 October 2026

Source: owner brief supplied in this session. This supersedes the open items in Settings Phase B. File `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431`, Settings section `4418:127312`.

[Open the completed Figma handoff board](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8214-229015), with clickable links to the delivered groups.

## Delivery checklist

- [x] Group 1: SEO-M1–M12 and explicitly requested variants.
- [x] Group 2: Settings Search Mode, Access inline password form, Languages and Redirects confirmations.
- [x] Group 3: Existing boards updated to the shipped behavior in the brief.
- [x] Visual and structural verification of delivered groups.
- DNS-M1–M12: paused by owner; excluded from this work.

## Design contract

1440×900 boards, Inter throughout, accent #1A56DB / hover #1E429F, compact 4px spacing grid. Reuse existing editor/Settings shells, navigation, fields, cards, buttons, save bars, modals and light bottom-right toasts. Public preview URLs use `example.com › about.html`.

Group 1 includes default SEO, no keyphrase, mobile, noindex, overlong title, readability and unsupported/empty/CMS variants, linked/unlinked social values and site-default image, advanced web-page/article/canonical-error/noindex states, Fix handoff and dirty guard, site defaults/previews, Organization/Person/local-business/validation, sitemap published/unpublished/indexing-off/manage, overview populated/loading/empty/sort, Pages SEO dot, and verified-primary-domain canonical copy.

Group 2 uses `Full-screen Settings · <Screen> · <state>` names. Search Mode replaces all sidebar navigation and footer until closed; Escape restores it. Access explains the published-site gate and offers inline Save. Both delete confirmations precede mutation.

Group 3: remove duplicate Add page; tab-strip Add page; remove topbar search; dock footer toolbar; Layers selection states; in-panel search; seventh Workspace overview card; Manage DNS on non-primary cards; Languages release note.

## Handoff channel

Native Figma comment posting is not exposed by the available connector. Use board annotations and the node-ID ledger below; no native comment is claimed. Checkboxes are ticked only after the relevant group has been drawn and verified.

## Node ledger

### Group 1 — SEO state ledger

| Board | State | Node |
|---|---|---|
| SEO-M1 | Page drawer · SEO · default | [8197:224150](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8197-224150) |
| SEO-M2a | Page drawer · SEO · no-keyphrase | [8197:224590](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8197-224590) |
| SEO-M2b | Page drawer · SEO · mobile-preview | [8197:225020](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8197-225020) |
| SEO-M2c | Page drawer · SEO · noindex | [8197:225454](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8197-225454) |
| SEO-M2d | Page drawer · SEO · title-too-long | [8197:225890](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8197-225890) |
| SEO-M3 | Page drawer · Readability · default | [8198:225605](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-225605) |
| SEO-M3b | Page drawer · Readability · unsupported-language | [8198:226013](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-226013) |
| SEO-M3c | Page drawer · Readability · empty-page | [8198:226393](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-226393) |
| SEO-M3d | Page drawer · Readability · cms-template | [8198:226773](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-226773) |
| SEO-M4 | Page drawer · Social · linked | [8198:227181](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-227181) |
| SEO-M4b | Page drawer · Social · independent-x | [8198:227594](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-227594) |
| SEO-M4c | Page drawer · Social · site-default-image | [8198:228023](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-228023) |
| SEO-M5 | Page drawer · Advanced · web-page | [8198:228438](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-228438) |
| SEO-M5b | Page drawer · Advanced · article | [8198:228843](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-228843) |
| SEO-M5c | Page drawer · Advanced · invalid-canonical | [8198:229255](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-229255) |
| SEO-M5d | Page drawer · Advanced · hidden-from-search | [8198:229662](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8198-229662) |
| SEO-M6 | Fix hand-off · image-alt-highlighted | [8200:228777](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-228777) |
| SEO-M6b | Fix hand-off · unsaved-edits | [8200:229123](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-229123) |
| SEO-M7 | Full-screen Settings · SEO · defaults-with-previews | [8200:229488](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-229488) |
| SEO-M8 | Full-screen Settings · SEO · structured-data-organization | [8200:229750](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-229750) |
| SEO-M8b | Full-screen Settings · SEO · structured-data-local-business | [8200:230008](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-230008) |
| SEO-M8c | Full-screen Settings · SEO · structured-data-person | [8200:230310](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-230310) |
| SEO-M8d | Full-screen Settings · SEO · structured-data-field-error | [8200:230560](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-230560) |
| SEO-M9 | Full-screen Settings · SEO · sitemap-published | [8200:230866](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-230866) |
| SEO-M9b | Full-screen Settings · SEO · sitemap-not-published | [8200:231111](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-231111) |
| SEO-M9c | Full-screen Settings · SEO · sitemap-indexing-off | [8200:231357](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-231357) |
| SEO-M9d | Full-screen Settings · SEO · sitemap-manage | [8200:231612](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-231612) |
| SEO-M10 | Full-screen Settings · SEO · pages-overview-default | [8200:231914](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-231914) |
| SEO-M10b | Full-screen Settings · SEO · pages-overview-loading | [8200:232199](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-232199) |
| SEO-M10c | Full-screen Settings · SEO · pages-overview-empty | [8200:232445](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-232445) |
| SEO-M10d | Full-screen Settings · SEO · pages-overview-worst-first | [8200:232687](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8200-232687) |
| SEO-M11 | Pages panel · SEO dot | [8202:231195](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8202-231195) |
| SEO-M12 | Full-screen Settings · SEO · indexing-canonical-default | [8202:231596](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8202-231596) |

### Groups 2–3 — feedback and added selection states

| Board | State | Node |
|---|---|---|
| SET-SEARCH-0 | Full-screen Settings · Sidebar · resting | [8205:233317](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8205-233317) |
| SET-SEARCH-1 | Full-screen Settings · Sidebar · search-open | [8205:233516](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8205-233516) |
| SET-SEARCH-2 | Full-screen Settings · Sidebar · search-typing | [8205:233726](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8205-233726) |
| SET-SEARCH-3 | Full-screen Settings · Sidebar · search-empty | [8205:233946](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8205-233946) |
| SET-ACCESS-off | CURRENT DESIGN · Full-screen Settings · Access · password-off | [8136:216319](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8136-216319) |
| SET-ACCESS-form | CURRENT DESIGN · Full-screen Settings · Access · set-password | [8136:216535](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8136-216535) |
| SET-ACCESS-set | CURRENT DESIGN · Full-screen Settings · Access · password-set | [8136:216089](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8136-216089) |
| SET-LANG-CONFIRM | Full-screen Settings · Languages · remove-without-translations | [8205:234203](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8205-234203) |
| SET-REDIRECT-CONFIRM | Full-screen Settings · Redirects · delete-confirm | [8205:234403](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8205-234403) |
| DRIFT-LAYERS-0 | Layers · select-mode | [8210:227936](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8210-227936) |
| DRIFT-LAYERS-1 | Layers · three-selected | [8210:228440](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8210-228440) |
| DRIFT-LAYERS-2 | Layers · all-selected | [8210:228950](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8210-228950) |

### Group 3 — existing boards changed in place

| Node | Board |
|---|---|
| 8137:216346 | CURRENT DESIGN · Full-screen Settings · Overview · archived |
| 8137:216089 | CURRENT DESIGN · Full-screen Settings · Overview · pending-deletion |
| 8136:214348 | CURRENT DESIGN · Full-screen Settings · Domains · several |
| 8135:214023 | CURRENT DESIGN · Full-screen Settings · Languages · default |
| 4418:100087 | CURRENT DESIGN · Insert · searching |
| 4418:81300 | CURRENT DESIGN · Editor · Bella Cucina / Home / Layers |
| 4418:79139 | CURRENT DESIGN · Build · Organize layers |
| 4418:92256 | CURRENT DESIGN · Pages · searching |
| 4418:59771 | CURRENT DESIGN · Build · Choose media |
| 6819:59209 | CURRENT DESIGN · CMS · Menu items · searching “mar” |
| 4418:123573 | CURRENT DESIGN · Editor · Home / drawer closed |
| 5936:44788 | CURRENT DESIGN · Canvas · selected · Hero |
| 4428:44164 | CURRENT DESIGN · Canvas · empty page · About |

The CMS search is inside the collection’s **Records** content (`8212:229160`), below its tabs, not in the CMS collection-navigation sidebar. The input is 32px tall.

The retired `141:124` / `141:164` IDs do not resolve. Their current one-page-note equivalents are `4418:94718` / `4418:94720` and `4418:182366` / `4418:182368`. The duplicate note actions were hidden there; the footer Add page action remains.

Shared navigation component `3450:14390` now has a Search entry (`8206:2313`) instead of a permanent field. All six topbar variants in `4418:144989` hide their search control. The existing sidebar/navigation component relationships are retained.

SEO checks use five local reusable components in `8205:231793`. Social cards and the image-alt handoff reuse the file’s dining-room photo; no UI screenshot was flattened into a board.

## Interaction coverage and limits

Linked representative paths: SEO tabs, Desktop/Mobile previews, Fix → dirty guard → image alt, sitemap Manage/Cancel/Save, Search entry and close/Escape, Settings result destinations, Access toggle/change/remove, delete confirmation → Undo state, Layers Select/Select all/Deselect all/Done, page-tab Add page → Pages panel. The three-selected board is a drawn range-selection state. Figma typing, actual saving/deleting, clipboard, network calls and browser new-tab semantics are specifications rather than runtime behavior.

The empty Access password form uses a disabled inline Save until a password is entered; its bottom bar shows status only. This avoids competing Save actions. The default, set-password and saved-password Access boards keep their existing IDs.

## Verification

Delivered 33 SEO states, six new Settings feedback states, three Layers selection states, and the handoff board, alongside updates to existing boards. Structural checks covered 59 boards: all 1440×900, UI text in Inter, and the shared accent resolves to #1A56DB. Scoped layout checks passed; all six shared topbar variants have no visible search control.

Representative screenshots were inspected across SEO, Settings feedback, and existing-board updates. Final corrections to non-primary domain action spacing, the zero-translation French row, the long-title input, and structured-data validation were visually rechecked. The current one-page boards are `4418:94702` and `4418:182355`.

DNS-M1–M12 remain paused and were not drawn. Native comments were not posted; the Figma handoff board, annotations, and this ledger provide the node-ID handoff.
