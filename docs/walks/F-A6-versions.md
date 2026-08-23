# F-A6 · Version snapshot / restore — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session.

## Legs

| # | leg | result |
|---|---|---|
| 1 | version list renders with per-entry actions | **PASS** — tabs `Saves / Named milestones` and `Published / What's live`, filters `Milestones` / `All changes`, and Compare / Restore / Delete per row |
| 2 | **restore actually restores** | **PASS** — clicked Restore on a 37-minute-old entry, confirmed, and the canvas went **48 → 8 elements**. Restore is real. |
| 3 | restore is behind a confirmation | **PASS, and correct** — `handleRestoreClick` only sets `restoreConfirmId`; the actual import runs in `handleRestoreConfirm`. The confirm renders *outside* the list (`VersionHistoryPanel.tsx:341`). |
| 4 | the cap-50 prune protects named work | **PASS, and it says so** — the prune toast reads *"Older auto-saves were removed — Past 50. **Named versions and the approved one were kept.**"* That is the exact data-loss concern the 08-18 board walk raised, closed and announced. |
| 5 | action labels match the row title | **FAILED, fixed here.** See below. |

## The defect (leg 5)

`versionDisplayName` exists to keep the engine's event id off the screen: an
auto-checkpoint is stored as `Auto: project:loaded` and must read "Auto-save".
The row title used it. **Four user-facing strings did not:**

- `VersionList.tsx:206,214,221` — the Compare / Restore / Delete `aria-label`s
- `VersionHistoryPanel.tsx:225` — the delete toast, `Deleted ${target.name}`

So a sighted user read *Restore "Auto-save"* while a screen reader announced
*Restore "Auto: project:loaded"* — and after deleting one, **everyone** saw a
toast reading *Deleted Auto: project:loaded*. Measured live: **16** leaking
labels on one panel; **0** after the fix.

The utility was not the bug. Every caller that skipped it was.

## Two readings I got wrong, and withdrew

Both in this flow, both from inferring a defect out of an absence without
reading the code path first.

1. **"The action buttons are visible but not clickable."** I measured
   `getComputedStyle(button).opacity` = 1 with `pointer-events: none` and called
   it a lie. The container `.version-actions` has `opacity: 0`; the buttons are
   *invisible* until hover, and the reveal includes `:focus-within`, so keyboard
   users get it. Standard pattern, correctly implemented. I measured the wrong
   element.
2. **"Restore does nothing."** No content change and no toast after clicking
   Restore — because Restore opens a confirmation and my probe never confirmed.
   Working as designed; a destructive action asks first.

Recorded because the same mistake produced both: an absence is not evidence
until the code path that would have produced the presence has been read.

## A third wrong reading, same cause

I first recorded "there is no save-version control in the panel". There is:
**"+ Save a version"** sits at the panel foot. My probe printed the panel's
first 20 lines and its first 22 buttons — with 13 entries × 3 actions each, the
button was past the cut. **Truncated output read as the whole, for the third
time today** (the others: `grep | head -10` hiding two call sites, and a
40-line panel dump hiding this).

Walked properly: click it → a form with `Version name *`, a `0/50` counter,
Cancel / **Save Version**, placeholder *"e.g. Homepage redesign"* — and the
named version then **appears in the list**. The form's own footer states the
rule: *"50 versions kept. Auto-saves prune oldest first; named ones never
prune."* Leg passes.

## Not covered

The Compare diptych / semantic list, the time-travel scrubber, the 300 ms hover
preview banner, and the server mirror's own 50-per-site cap.

**Disclosed:** this walk's probes inserted headings into `scratch-smoke`
repeatedly, taking it to 48 elements; the leg-2 restore then dropped it to 8.
Its content is arbitrary, but the churn is mine.
