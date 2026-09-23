> **VOID — 2026-08-25, before any of it was built.**
>
> This plan rests on a comparison that was invalid. The eight `Compare · *`
> boards belong to the REVIEW flow and are already implemented to them by
> `panels/version-history/ApprovedCompareView.tsx` (three modes verbatim at
> line 149, the `N changes · M of N` stepper at 158-159, page filtering at 134),
> mounted from `ReviewTab.tsx:465`. I matched those boards against
> version-history's `CompareView`, a different component, and wrote up the
> difference as drift.
>
> Nothing below was executed. Kept as the record of the mistake and because its
> board measurements are accurate and will be useful if the founder decides
> version-history's unboarded Compare should become the same view.
>
> See `docs/walks/U9-version-rescue.md` § "Correction".

# Compare family rebuild — plan

Founder call, 2026-08-25: rebuild the Compare surface against its board family
rather than patch it. Eight boards, all `status: active` in
`scripts/conformance/boards.json`, two carrying `authority: code:cites-board`.

Origin: `docs/walks/U9-version-rescue.md`. The walk found the app two pills wide
where the board is three modes wide, and inline in a ~330px sidebar where the
board is a 1080-wide card.

## What the boards actually say

Read via `get_design_context` on 2026-08-25. Metrics below are the board's, not
an interpretation.

**The card** — 1080 × 748 (the 776 frame includes three prototype hotspots at
`top: 741` that are not UI). `bg-panel` white, `1px #e5e7eb`, `radius 12`,
`shadow 0 25px 50px -12px rgba(0,0,0,0.25)`. That shadow is a **modal**, not a
panel section — which settles the container question the walk left open.

**Compare bar** — `h 48`, `bg-card`, `border-b #f3f4f6`. Five things in it:

| x | what | type |
|---|---|---|
| 16 | `Compare` | Inter Medium 14/21, ink |
| 100 | mode strip | see below |
| 380 | `Home  ▾` | Inter Regular 12/18, ink |
| 470 | `12 changes · 3 of 12` | **Geist Mono Medium 11/16**, ink-muted |
| 1052 | `✕` | Inter Regular 13/20, ink-muted |

The **page selector** at 380 is new information: the diff is scoped to one page
and the user switches pages inside Compare. Nothing in the app or the PRD said
so. The mono counter at 470 is a **stepper** — `3 of 12` — so changes are
walkable one at a time, which the app also does not have.

**mode strip** — `bg-subtle #f3f4f6`, `radius 6`, segments `px-14 py-5 radius-6`;
the active segment is `bg-card` white with ink text, the inactive two are
ink-muted. Three segments, always: `Side by side` · `Overlay` · `List`.

**Body** — `h 700`.

- *Side by side* (`168:2`, and `169:2` for a single page): two panes at
  `left 16` and `left 548`, each `516 × 660`, `radius 8`, `bg-card` — a 16px
  gutter, and 16+516+16+516+16 = 1080 exactly. Left pane is labelled
  `v3 · approved` in **success-text #057a55**; right pane is `Current`. Changed
  regions carry an `accent-tint #ebf5ff` ground with an 11px `changed` caption in
  `accent-text #1a56db`, and a changed line of text gets a 28px accent-tint strip
  behind it.
- *Overlay* (`168:26`): ONE pane, `Current, with changes marked`, plus the
  board's own note — *"A deletion has no “after”, so it gets a strip rather than
  a tint."* This mode does not exist in the product at all.
- *List* (`168:48`): change rows labelled `<section> · <field>` —
  `Hero · headline`, `Hero · subtitle`, `Opening hours`, `Gallery`
  (`2 images added`), `Happy hour banner`.

Remaining states: `no-changes` (168:82), `loading-render` (169:28),
`restore-confirm` (169:60), `resend-confirm` (169:92).

## The code contract, and the one place it does not reach

Per the founder's precedence, behaviour follows the CODE. Reading it:

```ts
// shared/types/versions.ts:151
interface VersionChange { type: ChangeType; property: string; before: string; after: string }
interface CompareResult { elementName: string; changes: VersionChange[]; summary: CompareSummary }
```

`before`/`after` already carry the real text — that is what the board's panes
show, so Side-by-side and Overlay are buildable from today's data.

**List is not.** The board's rows are `<section> · <field>`, and a
`VersionChange` carries no element identity: `compareVersions`
(`VersionTimelineManager.ts:749`) iterates elements and pushes changes with only
`type/property/before/after`, so which element changed is discarded at the moment
it is known. For an added or removed element, `before`/`after` hold the raw
element **id**. `elementName` exists but sits on the RESULT and is a title
string: `` `Version Comparison (${current.name} → ${target.name})` ``.

The page selector needs the same thing at page granularity — `flattenSnapshot`
flattens across pages, so a change cannot currently be attributed to one.

So Phase 1 is an additive engine change, not a UI decision.

## Phases

1. **Engine** — carry identity on each change: `elementId`, `elementLabel`,
   `pageId`, `pageName`. Additive; every existing consumer keeps working. Covered
   by tests that assert a change knows where it came from.
2. **Chrome — the shell** — `CompareModal` in `chrome-ui`'s Modal at 1080×748:
   Compare bar, three-segment mode strip, page selector, mono stepper, close.
3. **Chrome — the three bodies** — Side by side, Overlay, List, to the metrics
   above.
4. **The four remaining states** — no-changes, loading-render, restore-confirm,
   resend-confirm.
5. **Wire and delete** — `handleCompare` opens the modal; the inline expansion in
   `VersionHistoryPanel` and the two-pill `CompareView` go, with their tests
   rewritten in the same commit rather than deleted.

Each phase: build → live screenshot against the board by eye at 1440×900 → codex
review → fix its findings → commit. The conformance probes are a regression net,
never the acceptance.

## Not yet read

`169:28`, `169:60`, `169:92` — the three states Phase 4 needs. Deliberately left
until Phase 4 to keep the Figma read budget for the states being built.
