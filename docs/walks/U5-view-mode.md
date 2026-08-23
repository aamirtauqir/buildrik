# U5 · View mode (was "client editor") — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session.
**All three of this section's PRD steps are stale.** The behaviour is coherent
and better than what was written down.

## Measured, both params side by side

| | `?view=readonly` | `?view=client` |
|---|---|---|
| rail | **no tabs at all** | full six (`Insert … Brand`) |
| topbar | `‹ Back to editing · scratch-smoke` | `‹ Exit · scratch-smoke · Saved · **Publish**` |
| Delete key | **10 → 10, refused** | **10 → 9, MUTATED** |

`?view=client` is not a restricted mode. It does nothing at all — the param was
renamed to `readonly` on the 2026-08-23 founder call and the old value now falls
through to the ordinary editor, Publish and all.

That reads worse than it is: `editorViewMode.ts`'s own header records that
**nothing in the codebase ever set this parameter** — "the only door is the
owner's own site menu" — so no link in the wild carries it. The fiction lived in
the doc, not in the product. **No code added for a case that cannot occur**;
the PRD is corrected instead.

## The three stale steps

1. *"Full reload with param → 4-tool rail + density `fewer`"* — view mode has
   **no rail**, not a four-tool one. Stripped chrome, not a trimmed one.
2. *"Edits identical engine path (no scoped permissions client-side)"* — was
   true, and is not any more. `Composer.readOnly` now gates every mutating
   command at the command centre, so the Delete key is refused. Measured above.
   This one went stale **inside this session**.
3. *"Ship = Send for review popover"* — `StudioHeader.tsx:644` deliberately
   leaves that slot empty in view mode, with the reason in the file: *"sending a
   site for review is the owner's act"*. `SendForReview` renders from the
   owner's Review tab (`ReviewTab.tsx:434`) instead.

## Read-only holds where it matters

The gate is the thing this flow exists to protect, and it holds in the real
flow, not just in a unit test: with `?view=readonly`, selecting an element and
pressing Delete leaves the element count unchanged. Chrome is withheld AND the
document is protected — the earlier failure was that only the chrome was.

## Not covered

The `/share/<token>` and `/review/<token>` pages — the surfaces a client
actually receives — and the Review tab's own submit → `reviews.submit` round
trip. Those are U6's ground and this walk did not enter it.
