# Brand Part 1 — Designer brief (UI surfaces)

Date: 2026-10-07 · Owner decision D15 (eng/CEO review of
`docs/superpowers/specs/2026-10-05-brand-token-foundation-design.md`): engine and
server work ships first; **every UI surface below waits for its board**, and the
build verifies board vs live screenshot (editor CLAUDE.md, "The build loop").

File `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431` (Editor v3 · IA). Put the new
boards in a section named **Brand · Part 1** next to the existing Brand boards.

## Design contract

1440×900 boards, Inter, accent `#1A56DB` / hover `#1E429F`, compact 4px grid,
light chrome, no purple/violet/indigo. Reuse the existing Brand panel shell
(rail → Brand), token rows, cards, chrome-ui buttons, fields, popovers, modals and
the light bottom-right toasts. Name boards `Brand · <Surface> · <state>`.

Sample data is illustrative; the **shape** is the contract (founder rule).

## What changed underneath (so the boards match behaviour)

- **Autosave.** Brand has no Save / Apply button any more. Every edit applies to
  the canvas at once and is one ⌘Z step, shared with the canvas undo.
- **Two layers.** Primitives (fixed palette values, e.g. `Blue 600`) → Semantic
  tokens (`Primary`, `Text`, `Surface`…). Elements use semantic tokens. Editing a
  semantic token never repaints its siblings; editing a primitive repaints every
  token that uses it.
- **Light / Dark per site.** A site has *Dark mode: Auto* (follows the visitor's
  device) or *Off*. Existing sites start Off; new sites start Auto.

## Boards needed

### Already shipped in 1a with placeholder UI — need a real board

| ID | Surface | States |
|----|---------|--------|
| BRP1-M1 | **Read-only notice** (top of Brand; inputs disabled) | 3 reasons — copy below |
| BRP1-M2 | **Review changes** popover (header button "Review changes · N") | empty · list of edits (label, before → after) · row with **Revert** · stale row "Changed since — use ⌘Z" (Revert disabled) |
| BRP1-M3 | **Brand header without Save** | idle · just-saved hint (optional; currently none) |
| BRP1-M4 | **Theme push results** (dashboard › Theme manager) | two new statuses: "Brand rolled back — skipped", "New brand format — re-capture theme" (with tooltip) |

Read-only notice copy (shipped, `shared/constants/brandReadOnly.ts`):
- migration failed — "We couldn't upgrade this site's brand — nothing was changed. Editing is paused."
- switch off — "Brand editing is paused while we upgrade brand tokens."
- rolled back — "This site's brand was rolled back — editing is paused."

### 1b — Binding (build after boards)

| ID | Surface | States |
|----|---------|--------|
| BRP1-M5 | **Token usage** on each token row: "Used by N" chip; click highlights those elements on the canvas | 0 uses · N uses · unknown ("Can't count right now") · canvas highlight |
| BRP1-M6 | **Safe delete**: deleting a token in use asks for a replacement first | in-use → replacement picker · unused → plain confirm · unknown usage → refused with reason |
| BRP1-M7 | **Connect to tokens** (a check in Brand): exact-match suggestions for raw values on old sites | list ("`#1A56DB` · 14 elements → Primary") · tie → user picks token · preview on canvas · Apply (one ⌘Z) · nothing to connect |

### 1c — Generators (build after boards)

| ID | Surface | States |
|----|---------|--------|
| BRP1-M8 | **Dark mode setting** (Auto / Off) and the **Auto switch flow** | Off · Auto · switching to Auto on a site with missing dark values → generated dark aliases shown → canvas preview in dark → Confirm / Cancel · editor Dark preview disabled when Off ("Dark mode is off for this site") |
| BRP1-M9 | **One colour → full scale** (generator) | pick colour · generated 50…950 scale + light/dark aliases · preview · confirm |
| BRP1-M10 | **Restore points** list | rows (time, reason: theme push / generator / dark-auto / connect / logo) · Restore · empty |
| BRP1-M11 | **Brand from logo / website URL** | drop zone + URL field · loading · preview with extracted colours/fonts ("replaced X with Y") · no colours found (picker fallback) · "That site took too long to answer" · "This address can't be used" |
| BRP1-M12 | **Theme-toggle block** (Add panel + canvas + published) | Add-panel tile (only when Dark mode is Auto) · light / dark states on canvas · hidden-on-publish note when Dark mode is Off |

## Delivery checklist

- [ ] BRP1-M1 … M4 (shipped surfaces) — highest priority, they are live with placeholder styling
- [ ] BRP1-M5 … M7 (1b)
- [ ] BRP1-M8 … M12 (1c)
- [ ] Node ledger below filled in with node IDs

## Node ledger

| Board | State | Node |
|---|---|---|
| | | |
