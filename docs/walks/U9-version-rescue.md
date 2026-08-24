# U9 · Version rescue — walk record

Walked 2026-08-25 · localhost:3000, 1440×900, real session, site `scratch-smoke`
(12 server-backed version rows, all auto-checkpoints).

Picks up the four legs `F-A6-versions.md` closed by naming them **"Not covered"**:
the Compare diptych / semantic list, the time-travel scrubber, the 300 ms hover
preview banner, and the server mirror's own 50-per-site cap.

## Legs

| # | leg | result |
|---|---|---|
| 1 | server mirror's 50-per-site cap | **PASS (code)** — see below |
| 2 | hover preview after 300 ms | **PASS, precondition unmet** — see below |
| 3 | Compare — semantic list | **FAILED, fixed here** — printed the engine's event id |
| 4 | Compare — Visual/Semantic toggle | **FAILED, fixed here** — the group had no ground |
| 5 | time-travel scrubber | **NOT COVERED** — still open, see the bottom |

## Leg 1 — the cap, and it is a matched pair

Two implementations, both `50`, both evicting **auto-saves only**:

- `server/services/site-version.service.ts:71` `pruneSiteVersions`
- `packages/editor/src/engine/storage/VersionHistoryStorage.ts:223` `pruneVersions`

Each computes `excess = all.length - 50` and takes `excess` rows from the OLDEST
end of the auto-saves alone, returning early when there are none. A site whose
named versions exceed the cap keeps them all — the panel's own printed rule,
*"50 versions kept. Auto-saves prune oldest first; named ones never prune."*

Verified by reading both, not by producing 51 versions. Stated plainly: **the
eviction was not exercised live.**

## Leg 2 — the hover preview is fine; my list could not trigger it

Nothing appeared after 1000 ms of hover. That is not a defect:
`VersionList.tsx:134` returns early when `!version.visualSnapshot`, and
`VersionTimelineManager.ts:237` sets `visualSnapshot: null` for auto-checkpoints
with the comment *"Skip visual snapshot for auto-checkpoints to save storage"*.
All twelve rows on this site are auto-checkpoints, so there was nothing to
preview. The same fact disables the Visual compare tab, which says so in its own
`title`.

**Not verified:** the preview on a NAMED version, which is the case that can
actually render.

## Leg 3 — the fifth place the engine's event id reached a user

Expanding Compare on an auto-save printed, in plain sight:

```
Nothing changed since “Auto: project:loaded”.
```

`versionDisplayName` is the SSOT that turns that into "Auto-save". The 2026-08-24
sweep fixed four callers that skipped it — three `aria-label`s and the delete
toast — and stopped there. Three more raw `version.name` uses sat beside this one
(`CompareView.tsx:140,141`, `VersionList.tsx:233`); those only render for a
version that HAS a visual snapshot, and today only named versions do, so they
could not leak *yet*. All four now route through the SSOT.

Measured after the fix: **`Nothing changed since “Auto-save”.`**

The new test is written against the FILE rather than four string literals, so the
next one is caught by construction.

## Leg 4 — and a whole class of light-theme residue behind it

The Visual/Semantic toggle group was `rgba(255,255,255,0.04)`. Measured, its
parent was `rgb(255,255,255)`: white at 4% on white. Only its border rendered, so
the two pills floated with nothing holding them together.

It is a dark-theme value that outlived the 2026-04-18 theme unification, and it
is silent — nothing throws, and **Gate 16 ratchets HEX, so `rgba()` is invisible
to it**. Grepping the class found two more of exactly the same shape:

| where | was | over | now |
|---|---|---|---|
| `CompareView` toggle group | `rgba(255,255,255,0.04)` | `#FFFFFF` | `var(--bk-bg-subtle)` |
| `StudioPanels.canvasPattern` dot grid | `rgba(255,255,255,0.03)` | `--bk-bg-panel` = `#FFFFFF` | `var(--bk-border)` |
| `CanvasButton` default variant | `rgba(255,255,255,0.06)` | a light card | `CANVAS_COLORS.bgPanelSecondary` |

The canvas backdrop grid had therefore **drawn nothing at all** since the flip.
Measured after: dots `rgb(229,231,235)` on `rgb(243,244,246)`.

`CANVAS_COLORS` carries a note saying its dark values were repointed at the light
tokens, *"one edit for twenty-six call sites"*. `CanvasButton`'s own literal was
not one of the twenty-six.

**Not verified live:** the `CanvasButton` default variant — it did not render in
this walk's states. Its value is `bgPanelSecondary` → `var(--bk-bg-subtle)` →
`#F3F4F6`, which is arithmetic, not a measurement.

A guard now scans chrome for a below-0.5-alpha white literal, with three
allowlisted files that each carry their reason (a dark device bezel, a white spot
on the accent-coloured multi-select chip, and the customer-facing dark template
HTML, which is not chrome).

**That guard lied on its first draft** and was rewritten. It anchored on
`background…rgba(…)` within one line; two mutations failed it and the third — the
canvas dot grid, the exact bug it was written for — passed, because the value
lives inside a multi-line template literal and the property name sits on the line
above. It now matches the literal itself, wherever it is assigned.

## Not covered

The **time-travel scrubber** (`sidebar/tabs/history/components/TimeTravelScrubber.tsx`,
378 lines) was never reached: it renders in the History tab's other view and this
walk stayed in Saves. Its own header documents a real tradeoff — it previews from
the nearest NamedVersion's `visualSnapshot` rather than rendering each frame — so
on a site of pure auto-checkpoints it has no frames to show, the same precondition
that made leg 2 a no-op. That is the next thing to walk.

Also not covered: the AI summary button, and the Published / What's live tab.

## Harness note, cost me two runs

Serving the dashboard on **:3001** makes every tRPC call fail with
`Failed to fetch` — the client still calls **:3000** — and the panel then renders
its honest empty state, *"No saved versions yet"*. It looks exactly like a site
with no history. Run the dashboard on 3000.

And the first reading of "a `<div>` intercepts the Compare button" was also the
harness: `history.css:498-522` reveals `.version-actions` on `:hover` /
`:focus-within`, and the probe had parked the mouse in the corner.

## The board says three modes. The app ships two.

Read from Figma during this walk (`get_design_context`, board `168:82`
*Compare · no-changes*, the one the code's own comment quotes):

```
mode strip:  seg/Side by side   seg/Overlay   seg/List
copy:        "Nothing changed since v3."
             "No panes render — an empty diff view reads as broken."
palette:     #e5e7eb  #f3f4f6  #111827  #6b7280   (light; no white-alpha anywhere)
frame:       1080 × 776, a card with its own "Compare bar" header
```

Two facts fall out of that.

**The colours are settled and the board needed no change.** Its palette names
`#f3f4f6` and `#e5e7eb` — exactly `--bk-bg-subtle` and `--bk-border`, the two
tokens leg 4 moved the code onto. The board was already light; the code was the
stale side. Nothing to update in Figma for that fix.

**The shape is not settled.** The board draws a **three**-segment mode strip —
*Side by side* / *Overlay* / *List* — inside a 1080×776 card with its own header.
The app renders a **two**-pill toggle — *Visual* / *Semantic* — inline beneath a
version row in a ~330px sidebar. Mapping the two: the board's *Side by side* and
*Overlay* are two distinct visual comparisons and the app has only one, so
**Overlay does not exist in the product**; *List* is the app's *Semantic*.

This is not one board drifting. All eight `Compare · *` boards are
`status: "active"` in `scripts/conformance/boards.json` — none is design-ahead —
and two of them (`168:82`, `168:2`) carry `authority: "code:cites-board"`, so the
code claims to follow boards it does not match in shape.

Per the founder's precedence — behaviour follows the code contract, **everything
visual follows the board** — the Compare surface is owed a rebuild against its
family, not a patch. Recorded here rather than started: it is eight boards and a
change of container, which is a unit of work, not a leg of this walk.
