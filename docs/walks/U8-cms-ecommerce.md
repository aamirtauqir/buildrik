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
