# Engine model · Collection list query (C-14)

Owner-approved 2026-10-30. Boards: B5-D76 `189:22915` (+ `189:23428`), B5-D94 `195:27443` (+ `195:28651`), and the list-query rows of B5 (Filter / Sort / Show / Skip).

## Data shape

The query lives on the list's existing collection binding (`CMSCollectionBinding`, saved in `project.cmsBindings.collection[listId]`), so it travels, undoes and duplicates with the list:

```ts
interface CMSCollectionBinding {
  …existing: collectionId, itemVar, limit ("Show"), status, repeat
  filter?: CmsCondition;               // the SAME rule model as element conditions (engine-conditions.md)
  sort?: { field: string; dir: "asc" | "desc" }[];   // 0..3 keys, first wins ("Then by")
  skip?: number;                       // 0..CMS_COLLECTION_LIMIT_MAX
}
```

Shared schema: `cmsCollectionBindingSchema` gains `filter` / `sort` / `skip` (bounded), so the save filter keeps them.

**Sort keys:** any field, plus `_updated` / `_created` (the record's own timestamps — "Updated" on the board). Comparison: numbers numerically, dates as ISO strings, everything else `localeCompare`; empty values last in both directions. No sort = today's order (newest first, the store's order).

**Filter rule values** are literals. The board's "This page’s category" (a value read from the template page's own record, D76/D94 related lists) is a `value` of the form `{"page": "<field>"}` — encoded in `rule.value` as `@page.<field>`. It can only be evaluated per generated page → server (REQUESTS B-27). In the editor it evaluates against the template page's preview record.

## Evaluation — one function, `applyCmsListQuery(records, binding, ctx)`

`filter` (evaluateCmsCondition per record, `@page.x` values read from `ctx.pageRecord`) → `sort` → `skip` → `limit`. Pure, in `packages/shared/schemas/cmsConditions.ts` beside the condition evaluator, so the server can run the same thing.

Used by `RepeaterRenderer` for both the canvas and the export/publish expansion (`expandCollectionLists`), which is the one place lists become copies — the canvas and the published page cannot disagree. Publish renders from `cms.publishSnapshot` (server rows) in the scratch composer.

A list on a template page whose filter reads `@page.*` cannot be expanded once for every record; the export writes the list's query as `data-bk-query` and the server must re-expand per record — REQUESTS B-27. Without it the published list shows the unfiltered-by-page result (today's behaviour plus the literal rules).

## Editor UI (Content › Collection list)

Source · Open collection › · **Filter** (None / "{n} rule(s)" → rule card: field · operator · value, "Remove filter"; "+ Add filter") · **Match** All/Any · **Sort** field + **Direction** Newest/Oldest first (A–Z / Z–A for text) · "+ Then by" (≤3) · **Show** (limit) · **Skip**. Each change is one history step ("Filter list", "Sort list", …).

## Existing projects

A binding without `filter` / `sort` / `skip` renders exactly as today.
