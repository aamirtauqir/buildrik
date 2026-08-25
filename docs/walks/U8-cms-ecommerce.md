# U8 · CMS / ecommerce — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, real session.

## Established

| # | leg | result |
|---|---|---|
| 1 | Content panel IA | **PASS** — `COLLECTIONS 1 → Products (4) ›`, `+ New collection`, then a `DATA` group: `Sources (0) ›`, `Variables (0) ›`, `Conditions`. Two levels, counted, drill-in. |
| 2 | a Products collection exists with 4 entries | **PASS** — created by an earlier session, still intact. |
| 3 | ecommerce blocks in the Insert catalog | **PASS — the PRD's ⛔ is stale, and it also undercounts.** |

## The ⛔ and the count

The PRD says *"Drop e-com block (product-card/grid/detail; ⛔ **not in build-tab
catalog**)"*. Measured:

- default view: **53** insert items (the ELEMENTS group, which is what the "53
  elements" line elsewhere refers to)
- after expanding every collapsed accordion group: **127** items, including
  `insert-block-product-card`, `insert-block-product-grid`,
  `insert-block-product-detail` **and `insert-block-cart-button`**

So there are **four** ecommerce blocks, not three, and they are in the catalog —
one accordion click away, which is how an exclusive-accordion catalog is
supposed to work. Search finds them too (`product` → all three product hits).

**I nearly filed the opposite.** My first probe read "zero ecommerce" because
the groups start collapsed, and I was one step from calling this a
discoverability defect. Expanding first is the difference between a finding and
a fabrication.

## NOT established

The rest of U8 was not reached. Two attempts to click a product block — once
from the expanded accordion, once through search — both timed out on an
unactionable element, so **the `CollectionSetupModal`, the 8-field Products
collection creation with its optional 3 samples, `BindingPopover`, `cmsSync`'s
server mirror and retry queue, and the ⛔ "dynamic pages have no editor
front-door" claim are all unverified here.** Stopped at two attempts rather than
grinding — the rule this walk has been applying all day.

---

## Addendum, 2026-08-25 — the e-com ⛔ is stale, confirmed a third time

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`.

Ch.11 §11.2 U8 step 1 carried **"⛔ not in build-tab catalog"** for the
product-card / grid / detail blocks. Walked live: typing `product` into the
Insert panel search returns

```
Product Card    BLOCKS
Product Grid    BLOCKS
Product Detail  BLOCKS
```

They are in the catalog and they are searchable — no need to know they live
under "Advanced".

**This is the third independent confirmation.** Ch.12 §12.6 struck the same
claim on 2026-08-23 (*"wrong, corrected — reachable under 'Advanced'"*), this
record's own 08-24 walk counted four blocks in the catalog, and now a live
search finds three by name. Ch.11 was still carrying the ⛔ through all of it.

That is the pattern this arc keeps hitting: **the two PRD chapters correct
themselves independently and nothing propagates between them.** Ch.11 is now
struck with a pointer to both prior confirmations.

### Content panel — the empty state teaches

`Content` rail tab on a site with no collections:

> "Collections turn a spreadsheet into pages — one page per row, updated when
> the data changes." · **Create a collection**

One sentence that explains what a collection *is* in terms of what it does, not
what it is called. Recorded as good, not as a defect.

### Still not covered

The CollectionSetupModal itself, `ProductCollectionService` creating the
Products collection (8 fields, optional 3 samples), field types, data sources,
variables, conditions, and the record editor.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.
