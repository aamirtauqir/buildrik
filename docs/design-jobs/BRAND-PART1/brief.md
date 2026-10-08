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

- [x] BRP1-M1 … M4 (shipped surfaces) — highest priority, they are live with placeholder styling
- [x] BRP1-M5 … M7 (1b)
- [x] BRP1-M8 … M12 (1c)
- [x] Node ledger below filled in with node IDs

## Node ledger

| Board | State | Node |
|---|---|---|
| BRP1-M1 | Read-only notice · migration-failed | [8222:229015](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-229015) |
| BRP1-M1 | Read-only notice · upgrade-paused | [8222:229636](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-229636) |
| BRP1-M1 | Read-only notice · rolled-back | [8222:230245](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-230245) |
| BRP1-M2 | Review changes · empty | [8222:230854](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-230854) |
| BRP1-M2 | Review changes · list | [8222:231429](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-231429) |
| BRP1-M2 | Review changes · stale | [8222:232022](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-232022) |
| BRP1-M2 | Review changes · one-row-reverted | [8230:232344](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8230-232344) |
| BRP1-M3 | Header without Save · idle | [8222:232627](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-232627) |
| BRP1-M4 | Theme push results · skipped-and-recapture | [8222:233199](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8222-233199) |
| BRP1-M5 | Token usage · counts | [8224:229485](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-229485) |
| BRP1-M5 | Token usage · unknown | [8224:230173](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-230173) |
| BRP1-M5 | Token usage · highlight | [8224:230857](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-230857) |
| BRP1-M6 | Safe delete · replacement-required | [8224:231573](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-231573) |
| BRP1-M6 | Safe delete · unused-confirm | [8224:232280](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-232280) |
| BRP1-M6 | Safe delete · usage-unknown | [8224:232979](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-232979) |
| BRP1-M6 | Safe delete · replaced | [8224:233678](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-233678) |
| BRP1-M7 | Connect to tokens · suggestions | [8224:234362](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-234362) |
| BRP1-M7 | Connect to tokens · choose-token | [8224:234982](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-234982) |
| BRP1-M7 | Connect to tokens · preview | [8224:235608](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-235608) |
| BRP1-M7 | Connect to tokens · applied | [8224:236236](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-236236) |
| BRP1-M7 | Connect to tokens · nothing-to-connect | [8224:236852](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-236852) |
| BRP1-M8 | Dark mode · off | [8224:238726](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-238726) |
| BRP1-M8 | Dark mode · auto | [8224:239369](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-239369) |
| BRP1-M8 | Dark mode · generated-aliases | [8224:240003](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-240003) |
| BRP1-M8 | Dark mode · dark-preview | [8224:240644](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-240644) |
| BRP1-M8 | Dark mode · preview-disabled | [8224:241285](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-241285) |
| BRP1-M8 | Dark mode · auto-dark-preview | [8230:232622](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8230-232622) |
| BRP1-M9 | Colour scale generator · pick-colour | [8224:241925](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-241925) |
| BRP1-M9 | Colour scale generator · generated-scale | [8224:242543](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-242543) |
| BRP1-M9 | Colour scale generator · preview | [8224:243206](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-243206) |
| BRP1-M9 | Colour scale generator · confirmed | [8224:243869](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-243869) |
| BRP1-M10 | Restore points · list | [8224:244521](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-244521) |
| BRP1-M10 | Restore points · empty | [8224:245178](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-245178) |
| BRP1-M10 | Restore points · restored | [8224:245787](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-245787) |
| BRP1-M11 | Brand from logo or website · source | [8224:246458](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-246458) |
| BRP1-M11 | Brand from logo or website · loading | [8224:247084](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-247084) |
| BRP1-M11 | Brand from logo or website · preview | [8224:247700](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-247700) |
| BRP1-M11 | Brand from logo or website · no-colours | [8224:248332](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-248332) |
| BRP1-M11 | Brand from logo or website · timeout | [8224:248970](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-248970) |
| BRP1-M11 | Brand from logo or website · address-refused | [8224:249604](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-249604) |
| BRP1-M11 | Brand from logo or website · confirmed | [8224:250233](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8224-250233) |
| BRP1-M12 | Theme-toggle block · add-panel-auto | [8228:232784](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8228-232784) |
| BRP1-M12 | Theme-toggle block · canvas-light | [8228:233132](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8228-233132) |
| BRP1-M12 | Theme-toggle block · canvas-dark | [8228:233404](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8228-233404) |
| BRP1-M12 | Theme-toggle block · published-auto | [8228:233676](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8228-233676) |
| BRP1-M12 | Theme-toggle block · off-hidden-on-publish | [8228:233827](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8228-233827) |
| BRP1-M12 | Theme-toggle block · published-dark | [8230:232749](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8230-232749) |


## Delivery — 2026-10-07

47 state boards delivered in [Brand · Part 1](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8220-229015), next to the existing Brand section. [Open the clickable handoff index](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8230-233164).

- All 12 families are covered, including 3 read-only reasons, review/revert/stale rows, token usage and safe-delete branches, Connect to tokens, Dark Auto generation and ordinary dark preview, 11-step scale, restore points, extraction errors and fallback, and actual Add/canvas/published theme-toggle views.
- Reused existing Brand/editor shells, token-row layout, native button/input/select/navigation instances, live-preview card and the file’s dining-room photo. UI is editable text and layers; no flattened UI screenshots.
- Verified 48 frames including the handoff index: 1440×900, Inter text, zero scoped auto-layout overflow. Inspected representative screenshots and rechecked visual corrections.
- Prototype links cover representative navigation, preview/confirm/cancel, one-row revert, replacement/delete, restore and light/dark flows. File picking, typing, extraction, saving, undo and usage scanning remain engineering behavior; these boards do not implement runtime logic.
- Native Figma comments were unavailable through the connector. Board annotations, this node ledger and boards.json provide the handoff.

The colours and counts are illustrative. The generator must compute the picked colour’s step and preserve it exactly, as specified in the token-foundation design; these samples do not override that algorithm.
