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

---

## Addendum, 2026-08-25 — the harness blocker found; the chain still not closed

Lane 6 of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. The override-survival
chain is **still not walked**. What this pass did is find the real reason the
08-24 attempt failed, which was not either of the two reasons that record gave.

### The actual blocker: the dev overlay sits where the inspector sits

The 08-24 record concluded *"my canvas click did not select — the inspector
still read 'Select something on the canvas to edit it'"*. Both halves are
wrong, and the second explains the first.

Measured A/B this pass: **canvas selection works, with or without stripping any
overlay.** Clicking a canvas node by its box selects it and the inspector
switches to `TYPOGRAPHY / Family / Size`. The click was never the problem.

The problem is the **read**. A right-column scrape returns this:

```
["v3.0.2","Output Detail","Standard","React Components","Hide Until Restart",
 "Marker Color","Clear on copy/send","Block page interactions",
 "Manage MCP & Webhooks","MCP Connection","Webhooks","Auto-Send", …]
```

That is the **agentation dev overlay**, not the inspector. It occupies the same
screen region on the right. Any probe that reads "the right column" in dev gets
the overlay's text, sees no element name, and concludes nothing is selected —
which is precisely the false reading the 08-24 record filed and then correctly
distrusted.

**Strip it before reading, not before clicking.** This is trap 4 in
`scripts/baseline/editor-rig.mjs`, and it is more dangerous than the header
says: it does not merely add noise, it *impersonates the panel you are trying
to measure*.

### Method that now works, for the next attempt

| problem | solution |
|---|---|
| identifying canvas nodes | `[data-buildrick-id]`. **`data-element-id` does not exist** — a probe written against it silently matches nothing |
| reading the inspector | strip every `body > *` with `z-index >= 9000`, plus the agentation panel, **then** scope the read to `x > 1140` |
| elements below the fold | `el.scrollIntoView({block:"center"})` **then** re-read the box — a coordinate click outside the viewport does nothing and reports no error |
| multi-step chains | one browser session. Each `openEditor()` is a fresh context; an instance created in run N is not reliably present in run N+1 |

### What was built and what was reached

- Component **created** from the canvas Button via right-click → Save as
  component → dialog (Name / Category / Tags) → `Create Component`. Library
  then reads `1 components found · U4 Override Probe · 0 instances ›`.
- Drill-in confirmed: `Back to Components / Components / U4 Override Probe`,
  `No Preview`, `Type: UI component`, `Tags: No tags`, and the four actions
  **Insert Component · Duplicate · Update · Delete**.
- **Instance inserted** — canvas went from one `Click Me` node to two, then
  three on a second insert.
- **The override step was not reached.** Selecting the instance to change a
  style needs the instance in view in the same session, and the two attempts
  that got that far ran out of runway.

### Observed, NOT filed — instance persistence is inconsistent

One inserted instance (`el-mt89zsa3-187dr4t1cru`) was still present on a later
fresh load; a second (`el-mt8a3o1z-6dfutlzmzp`) was not. That is either an
autosave-timing artifact of closing the context quickly, or a real persistence
gap. One observation cannot tell them apart and this record will not guess.
Handed to whoever closes this chain: insert, wait for the save pill to settle,
reload, and count.

### Still not walked

The override-survival chain itself, variant swap via `VariantSection`, detach
(pro-DS-mode only), the `componentSync` master mirror, the 27-component
read-only catalog and its ⛔ drag-to-canvas stub, and the MAX-100 cap.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.

---

## Addendum 2, 2026-08-25 — the real blocker: instances are locked by construction

The addendum above blamed the dev overlay for the 08-24 failure. That was one
of two causes and not the deeper one.

Retried the chain end to end in a single session with the fixed rig: library →
`Insert Component` → instance appears on canvas (node count went 1 → 4 across
runs) → select it. Selection produced nothing, and this time the screenshot
showed why — a toast in the **bottom-right**:

> **"This element is locked. Unlock it in the Layers panel."**

A right-column scrape never sees a bottom-right toast. That is why two probes
in a row reported "nothing is selected" without saying why.

### It is by design, in one line

`engine/elements/ElementSerialization.ts:119`:

```js
return this.getData().locked === true || this.isComponentInstance();
```

**Every component instance is locked**, not because someone locked it, but
because `isLocked()` returns true for instances by construction. The three
selection guards in `useSelectionBehavior.ts` (`:90`, `:108`, `:136`) all fire
the same toast.

So the override-survival chain **cannot be reached by clicking the instance on
canvas at all** — not on 08-24, not today, not by any probe. The PRD's F1a
("style+attr survive a master edit") implies overriding an instance; the only
route to that is the toast's own escape hatch: unlock it in the Layers panel
first.

That is a real contract nobody had written down, and it changes what the leg
even is.

### Still not completed, and the exact next step

The Layers panel lists the instances (four `Button` rows on this fixture — the
original plus three inserts). The per-row lock control was not found at the
x-range this pass guessed, so the unlock was not performed.

**Next step, precisely:** open Layers, find the instance row, click its lock
glyph, confirm the canvas selection now succeeds, then override a style and edit
the master. Everything before that is now known and does not need rediscovering.

### Corrected from addendum 1

Addendum 1 said the dev overlay was "the real harness blocker". It is *a*
blocker — it impersonates the inspector on read — but the instance lock is the
one that makes the click itself a no-op. Both are true; the lock is the reason
the chain is unreachable.

---

## Addendum 3, 2026-08-25 — the escape hatch the toast names cannot work

Addendum 2 found that instances are locked by construction and said the route
was "the toast's own escape hatch: unlock it in Layers first". **Walked it. It
does not work, and it cannot.**

### What was done

Layers rows carry no element id — only `role="treeitem"`, `aria-label="Button,
button element"` and the text `Button ◇ ⚡`. **The `◇` is the instance marker**
(the 08-24 record guessed that correctly). Selecting instance rows by `◇` found
**3**, matching the three inserts, and each carries a
`button[aria-label="Lock element"]` at x≈337 — not the x-range addendum 2
guessed, which is why that pass missed it.

Clicked the toggle on the instance row. Then selected the instance on canvas.
**Still nothing** — inspector empty, no `Font size` input.

### Why it cannot work — two lines

`engine/elements/ElementSerialization.ts:118-127`:

```js
isLocked(): boolean {
  return this.getData().locked === true || this.isComponentInstance();
}

isComponentInstance(): boolean {
  return !!this.getComposer().components?.findInstanceContainingElement(this.getSelf().getId());
}
```

The Layers toggle sets `data.locked` (`Element.ts:153`). Clearing it leaves the
**second half of the `||` still true**, so `isLocked()` stays true and the
selection guards keep refusing.

**So the message is a dead end.** *"This element is locked. Unlock it in the
Layers panel."* points at a control that, for the case that produced the
message, changes nothing. A user follows the instruction, sees the lock toggle
flip, tries again, and gets the same toast.

### What this means for F1a

The PRD's F1a — *"style + attr survive a master edit"* — is **not reachable
through the UI as described**. An instance cannot be selected, and it cannot be
unlocked. The only route that changes `isComponentInstance()` is **detach**,
which this record already lists as uncovered and *pro-DS-mode only* — and once
detached the element is no longer an instance, so "does the override survive a
master edit" no longer applies to it.

That may be a coherent design (instances are immutable; detach to edit). What is
not coherent is the toast: it names an escape hatch that cannot open for the
case that triggers it.

### Status of this leg — closed with an answer, not a walk

The override-survival chain is **not walkable through the UI**. Three sessions
of probing produced that answer rather than the measurement, and the answer is
the more useful result: the leg was never blocked by harness trouble, it is
blocked by the product.

Two things to decide, both product calls:
1. Should the toast point at **detach** instead of the Layers lock?
2. Is F1a still a real contract, given nothing in the UI can exercise it?
