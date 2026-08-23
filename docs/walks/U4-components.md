# U4 · Component flow — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, 1440×900, real session.

## Legs walked

| # | leg | result |
|---|---|---|
| 1 | ⇧A opens the component library | **PASS** — and the empty state teaches instead of just being empty: *"No components yet. Select an element on the canvas and save it as a component to reuse it everywhere."* with a **Create component** action. |
| 2 | "Save as component" in the context menu | **PASS** — the right-click menu is `Edit ›`, `Insert ›`, `Layout ›`, `Quick Style ›`, **Save as component**, `Reveal in Layers`, `Select Parent ←`, `Lock`. |
| 3 | the create dialog | **PASS** — Name\*, Description, Category, Tags ("Comma-separated tags for easier searching"), **Variant Options** ("This is a variant set"), and "Pre-fill from DS styles / 0 styles will bind to…". |
| 4 | the component appears and tracks usage | **PASS** — `1 components found / YOUR COMPONENTS / WalkProbe Card / **0 instances** ›`. Counting instances on the card is the kind of thing a library needs and often lacks. |
| 5 | drill-in and instantiate | **PASS** — `Back to Components / Components / WalkProbe Card`, then **Insert Component · Duplicate · Update · Delete**. Insert took the canvas 9 → 10. "Update" is the master-edit push that shipped recently. |

## Observation, not a defect

The component detail reads **"No Preview"**. For a library you pick from by
sight, a thumbnail-less card is a real gap — but it may simply be that a
freshly-created component has not been captured yet, and one probe cannot tell
those apart. Recorded as a question, not a finding.

## NOT walked, and honestly so

**The override-survival chain — F1a's "style+attr survive a master edit" — was
not exercised.** Two probe attempts failed on the harness, not the product:

- No canvas DOM node carries a component/instance/master attribute, so I could
  not identify the inserted instance from the DOM. The Layers tree does show a
  `◇` glyph, which is likely the instance marker, but flattening the panel's
  text loses which row it belongs to.
- My canvas click did not select — the inspector still read *"Select something
  on the canvas to edit it"* — so the "no colour input in the inspector"
  reading that followed was worthless.

Both of those would have become confident wrong findings if I had reported them.
Four times today a truncated or mis-targeted probe produced a "this is missing"
claim about something present, so this flow stops here rather than adding a
fifth.

Also not covered: variant swap via `VariantSection`, detach (pro-DS-mode only),
the `componentSync` master mirror, the 27-component read-only catalog and its
⛔ drag-to-canvas stub, and the MAX-100 cap.
