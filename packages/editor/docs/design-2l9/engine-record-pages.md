# Record pages from a Link row (B5-D84…D98) — design note

Round 31, L-A. Boards `189:27792` (D84), `193:25438`…`193:28433` (D87–D93),
`195:28058`…`195:29753` (D95–D98), `197:29333` (D101).

## What the boards ask

A Card inside a list of Team records, Inspector › Content › Link:

1. **Link to** offers **This record's page** (D84, D91). Chosen, every card
   links to the page of the record it shows (D92, one undo step).
2. When the collection has no page per record, the row says "Team has no page
   per record." with **Create collection page** (D87) — the same dialog as the
   Dynamic pages tab ("Create collection page for Team": URL pattern, fields,
   Layout), opened from the Link row (D88). While it saves, the row shows the
   pending state at its origin (D89); afterwards the Inspector is back on the
   same Card with "Team profile is ready" (D90/D91) and a toast to open it.
3. Page made but the collection link failed: the page stays, "Retry link
   save" retries only the link (D93, D97).
4. The generated page opens with a way back, "‹ Home · Team card" (D98).

## No second generator

A "record page" is exactly what the Dynamic pages tab already makes: one
ordinary template page bound to the collection's fields, plus the
collection's `pageSlugPattern` + `pageTemplatePath`. Publish expands it per
record in `server/services/cms.service.ts` `generateDynamicPages` (with the
shared `applyRecordPass` for conditions / `@page.*` lists). The Link-row flow
reuses all of it:

| Board step | Existing piece reused |
|---|---|
| Create collection page dialog (D88) | `CreateCollectionPageDialog` |
| Make the page, save the link (D89, D93) | `buildCollectionPage` + `saveCollectionLink` / `retryCollectionLink` (`createCollectionPage.ts`; page stays, link retried alone — 187:21035) |
| The record pages themselves | `generateDynamicPages` at publish — unchanged |
| Return to the Card (D90, D98) | `CmsOpenRequest.origin` / the workspace back label ("‹ {origin}") |

No migration: the link is stored on the collection (existing columns), the
per-card link is an ordinary element link.

## What is new

1. **A link target "This record's page"** — a link whose destination is
   resolved per record from the collection's pattern. On a list copy it is
   the copy's record; on a template page, the page's own record. The export
   writes the resolved href per copy (the editor already renders each list
   copy against its row in `RepeaterRenderer`); on a generated page the
   server pass resolves `@page` the same way it does for conditions. Model:
   the element's link binding gains `{ kind: "recordPage" }` beside URL /
   page / anchor. **Inspector UI (Link section) → L-B (REQUESTS A-37).**
2. **Opening the dialog from the Link row** with the Card as origin, and the
   return — the dialog and its pending / failed states are L-A's
   (`CreateCollectionPageDialog` takes an `origin`; the row's state reads
   `unsavedCollectionLinks`).
3. **Unresolvable link** (collection has no pattern, or the record has no
   slug): the link renders as "#" in the editor and is dropped at publish,
   and the Link row shows "Team has no page per record." — never a fake URL.

## Order

L-B adds the `recordPage` link kind + Link row (D84, D87, D91, D92, D101);
L-A then wires the Link row's "Create collection page" to the existing dialog
with origin/return (D88–D90, D93, D97, D98) and D95 (related list on a
generated page, already served by `excludeCurrent` + `@page.*`).
