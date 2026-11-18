# B3 first slice — Pages management

> **Current Pages composition: BD-27.** See [grouping refinement](pages-grouping-refinement.md) for consistent view controls, contextual collection actions, explicit creation footer and page-indicator legend. Earlier width-only checks do not establish clarity or user acceptance.

> **BD-25 — compact Pages width, 2026-10-18:** normal Pages/Structure/rename/recovery manager is284px, matching Add/Layers. Rail56px + panel284px =340px. Supersedes earlier560px normal manager width; expanded Listings remains720px. See the canonical brief and `pages-compact-width.md` evidence.

> **BD-24 — latest owner correction, 2026-10-18:** Pages management is in the left rail after Layers. The bottom bar contains created-page tabs and save status. This overrides earlier bottom Pages-button / no-Pages-in-rail instructions in this record and its historical references. The manager anchors beside the 56px rail, below the 56px topbar, above the 32px bottom bar; existing widths, guard/return and permission contracts remain. See the canonical decision in PRODUCT-DESIGN-BRIEF.md and `evidence/figma-design-execution/pages-placement-correction.md`.

2026-10-18 · DESIGN ONLY · user authorized starting the next phase.

Scope: begin B3 with the existing Pages manager and an off-page settings/rename/recovery flow. B3's canvas, Layers, command palette, Share preview and full navigation coverage remain separate pending work. Earlier B0–B2 evidence gaps are not implicitly closed.

Actor and fixture: Editor managing About while Home / Text / Desktop /52% remains the canvas context. Existing page identifiers, settings and URLs survive cancellation and recoverable failure. No live project data is changed by this Figma fixture.

Evidence: P11 §§4–11/PG-01–13; P24 page delete/restore and SC-15; current PageContextMenu.tsx, RenameUrlDecision.tsx, PagesTab.tsx and SeoTab.tsx source read. Source currently still routes page deletion to a confirm; approved P11/P24 require immediate delete with Undo and Recently deleted. That difference is a design requirement/engineering gap, not verified app behavior.

Integration (BD-24): Pages management enters from the left rail after Layers. A compact284px manager opens beside that rail; detailed Listings expands to720px with viewport clamping. The bottom bar shows created-page tabs and status. Settings retain a bounded720px dialog with sticky tabs/footer and one scrolling body; managing another page does not switch the active canvas page.

Compact28px fields/radius4 reuse the latest library. Page resource rows remain40px, actions32px. Reuse shared Buttons, Search, Input, Select, icons and field tokens; only add a scoped reusable page resource row if the existing generic row cannot represent page identity/URL/status/actions.

Represent: manager and row actions; name/URL decision; SEO/Social/Advanced settings with one indexing writer; URL consequence and saved redirect offer; save failure preserving input; leave-draft guard; delete/Undo/Recently deleted/restore; Listings/Structure and search-empty. Prototype only selected safe deterministic paths; annotate dynamic values, keyboard, guard, writer, URL redirect and Undo behavior that static Figma cannot prove.

Checks: native nodes/component reuse; fonts/tokens; fit at1440×900; readable long name; selected/focus/error states; captured About target with unchanged Home canvas; screenshot review and independent guard review. Actual application/prototype keyboard execution, persistence, save/reopen, restore-ID integrity,100-page performance and full responsive behavior remain NOT RUN.

This record extends the existing execution plan and brief; it is not a new product decision or full B3 completion.

## First design checkpoint

**Status: PARTIALLY VERIFIED.** Independent review closed the observed targeted defects in the inspected branches. The represented desktop design and selected route graph have been reviewed; unrepresented endpoints/states and unrun playback/runtime checks prevent whole-slice or full-phase readiness.

27 native Figma frames now represent the initial Pages slice. The main editor's left-rail Pages button enters the manager (BD-24 correction). Compact fields reuse the existing library; new PageResourceRow62:1576 combines page identity/URL/status/actions. Lucide house65:1584 comes from the installed library source. The shared Textarea's content now fills its available width; other dimensions and public properties remain.

Selected prototype links cover manager/settings tabs, rename with Keep URL versus Change URL, live-URL consequence, contextual redirect repair/saved/exact SEO return, settings save/failure/guard, delete/Undo/Recently deleted/Restore and view navigation. Link readback is structural evidence, **not executed playback**. The kept-/about and changed-/our-story branches have separate editor/reopen destinations to avoid silently changing the URL.

| Frame | Figma |
|---|---|
| B3-P01 · Pages / manage without switching | [63:6393](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-6393) |
| B3-P02 · About / page actions | [63:13820](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-13820) |
| B3-P03 · Rename / URL choice | [63:14567](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-14567) |
| B3-P04 · Live URL / consequence | [63:15255](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-15255) |
| B3-P05 · Page settings / SEO | [63:15939](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-15939) |
| B3-P06 · Page settings / Social | [63:16507](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-16507) |
| B3-P07 · Page settings / Advanced | [63:17061](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-17061) |
| B3-P08 · URL changed / redirect offer | [63:17617](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-17617) |
| B3-P09 · Settings / save failed | [63:18189](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-18189) |
| B3-P10 · Settings / unsaved close | [63:18758](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-18758) |
| B3-P11 · About deleted / Undo | [63:19334](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-19334) |
| B3-P12 · Recently deleted / Restore | [63:20001](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-20001) |
| B3-P13 · About restored | [63:20585](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-20585) |
| B3-P14 · Pages / Listings | [63:21262](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-21262) |
| B3-P15 · Pages / Structure | [63:21939](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-21939) |
| B3-P16 · Pages / no results | [63:22616](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-22616) |
| B3-P17 · Rename saved / keep URL | [63:23182](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=63-23182) |
| renamed | [64:10927](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=64-10927) |
| saved | [64:18356](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=64-18356) |
| B3-P20 · Pages / more actions | [65:17148](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=65-17148) |
| B3-P21 · SEO score / breakdown | [65:17860](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=65-17860) |
| B3-P22 · Redirect / captured repair | [65:18435](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=65-18435) |
| B3-P23 · Redirect saved / return | [65:18981](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=65-18981) |
| B3-P24 · Redirect saved / exact SEO return | [67:11341](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=67-11341) |
| B3-P25 · Home retained / page renamed | [67:11915](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=67-11915) |
| B3-P26 · Home retained / About deleted | [67:12583](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=67-12583) |
| B3-P27 · Home retained / URL kept | [69:19044](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=69-19044) |

## Preservation and boundaries

| Capability | Evidence / design mapping | Remaining evidence |
|---|---|---|
| Manage another page without switching | P11 PG-01/03/10; P01/P05–10 keep Home/Text/Desktop/52% while targeting About | Actual context store, focus and switching guards NOT RUN |
| Page row actions | P11 PG-05; P02 menu preserves rename/duplicate/home/templates/reorder/copy/settings/delete doors | Duplicate/template/reorder/copy and folder disabled states not simulated |
| Rename and URL | current RenameUrlDecision/PagesTab; P03/P04/P08/P17/P18/P25/P27 separate commit and cancel histories | Runtime one-step Undo; stale-name/duplicate-name rejection NOT RUN |
| SEO/Social/Advanced | P11 PG-10; P05–07,09–10 use single SEO indexing writer, read-only Advanced summary, multiline fields/direct social URL | Full validation, readonly Pro, collection-page and long-text matrix pending |
| SEO score | calculateSeoScore(title28,desc61,slugabout,indexed)=80; changed title43 gives90 | Listings uses same fixture value; other pages show unprovided score as—, not invented metric |
| Redirect repair | SeoTab + RedirectRepairCard; P22/P23/P24 carry /about→/our-story and return to exact SEO | Dirty cross-area guard, old-path-taken suppression, error retry and concurrent change remain specified, not represented |
| Delete/recover | P11 PG-06/08 and P24 §§4.8–4.9; P11–13 remove inactive page without switching Home, then restore | Persistent30-day same-ID restore requires **U-7**. Until implemented: named session Undo/toast only. No runtime restore proof |
| Listings/Structure | P11 PG-02; P14/P15 real columns and URL hierarchy; private folder grouping stays in Pages | Long lists, sorting/filtering, nested paths and collection-detail handling pending |
| No search result | P11 T-PG-17/SC-2; P16 exact query/Clear search | Actual search/keyboard execution NOT RUN |

Recently deleted is48px and role-scoped: this Editor fixture has Restore; permanent delete belongs to Admin+ with typed confirmation, not an unguarded Editor action. Offline/collision/missing-folder/expiry/bulk variants remain unrepresented. Restore offers Open, but **the About editor destination is not simulated in this slice**; no automatic page switch occurs.

Settings are staged: Save awaits writer acknowledgement; failure retains draft; Cancel discards only the settings draft. A previously committed page rename is not cancelled by leaving settings. Guard title follows the shared “Leave without saving?” contract, with Keep editing, Discard changes and Save and leave. Save and leave cannot navigate after a failed write. Current Home's bottom Saved receipt is separate from About's settings draft/failure.

Modal background is inert by contract; focus stays in the topmost dialog, Escape closes only that layer and returns to its captured trigger. Bodies are marked vertical scrolling with fixed headers/footers. These are prototype/specification settings, not browser accessibility verification. Default1440×900 screenshots inspected; short-height/narrow/200% text and keyboard/screen-reader checks remain NOT RUN.

The contextual Redirects specimen preserves240px settings navigation,56px rail and exact back target; other settings interiors and unlinked navigation are deferred to B8. No new endpoint or permission is claimed. Other unlinked doors (including More→Recently deleted in the undeleted fixture) remain annotated future coverage; current prototype's recovery path starts at the delete receipt.

## Validation and next step

Final reviewed desktop screenshots: [Pages manager](b3-manager.png), [SEO](b3-seo.png), [URL structure](b3-structure.png), [contextual redirect repair](b3-redirect.png). These replace earlier screenshots taken before the modal, field-width and navigation corrections. Independent review is recorded in [b3-independent-review.md](b3-independent-review.md).

Native readback across the first26 frames found only Inter/Geist Mono and zero image-filled UI nodes; the final kept-URL editor is a native clone with two inspected branch links. Structural link mutations, source comparisons and reviewer corrections are stored in b3-mutation-ledger.json. Screenshot results and independent review define the bounded outcome; full B3 completion is not claimed.

Continuation2026-10-19: [Pages open/scale/access slice](B3-pages-continuation.md) adds16 states for About opening/exact return,100-page desktop/short lists, offline and Viewer access. Remaining Pages work includes creation/template catalog, capacity/failure, switch-draft guards, folders/reorder, long-list search/navigation and100-page narrow-width behavior. Then continue B3 Canvas/Layers editing/navigation, command palette/Help, Share preview and per-FID reconciliation. B0–B2 full-matrix gaps and B4–B10 remain separately pending. Application source, generated tokens, production data and deployment were not changed.

