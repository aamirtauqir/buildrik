# Product flow gaps — 2026-09-03

**The question, founder's:** we are churning out screens; the flows are not built
the way this editor should have them. What are the gaps — measured, not assumed?

**The finding that reframes everything else:** the Figma prototype is *finished*.
All six pages measure **100% reachable, 0 orphans, 0 dead ends, 0 dangling
destinations** (2229 edges). So the flows exist **as design**. Every gap below is
the distance between "the board exists and is wired" and "a user can finish the
job in the running product."

That distance is this repo's single commonest defect, and it has a name here
already: **a finished, tested surface with no way in.**

---

## Part 1 — Doors (structural, mechanically verified)

### 1a. Surfaces nothing mounts

A scan of 466 exported components for any reference outside their own file
(tests excluded, `demo/` included, `index.tsx` counted as a real mounting site,
identifier references counted rather than JSX alone).

**The number moved 88 → 42 → 63 → 10 across four passes, and the first three were
wrong.** Recording that, because the wrong versions were each plausible:

| pass | count | what was wrong with it |
|---|---|---|
| 1 | 88 | counted `MODAL_*_CLASS` and `ROW_*_CLASS` — CSS constants, not components |
| 2 | 42 | excluded every `index.tsx` as a barrel. `LayersNoResults` came back an orphan; it is mounted at `panels/layers/index.tsx:418`. An index can be a real door. |
| 3 | 63 | matched only JSX `<Name`. Missed registry mounting and anything mounted from outside `src/` — it flagged **`AquibraStudio`**, the root shell. |
| 4 | **10** | any identifier reference, anywhere, `demo/` included |

Ten survive. Five are dead icon exports (`VersionsIcon`, `ActivityIcon`,
`ClearIcon`, `SaveIcon`, `PublishingIcon`) — housekeeping, not product. The five
that matter:

| surface | board | status |
|---|---|---|
| `InsertLoadingSkeleton` | 775:4053 | built, boarded, unit-tested, **never mounted** |
| `InsertLoadError` | 781:4154 | built, boarded, unit-tested, **never mounted** |
| `PagesLoadingSkeleton` | — | built, **never mounted** |
| `ExportDropdown` | — | never mounted (`ExportModal` was already a confirmed no-door case) |
| `DragTooltip` | — | never mounted |

**`BuildTab` has no loading or error branch at all** — its only failure response
is a toast, `BuildTab.tsx:86` *"Couldn't add component. Try again."* So the Insert
panel cannot enter the two states that were designed, built and tested for it.

**`PagesTab` is the sharper case**: it *does* wire `loadError` (`:232`, `:259`)
but never a loading state. The gap is per-state, not per-panel — which is why a
panel-level audit would have called Pages covered.

### 1b. Doors confirmed missing by direct observation

Found today, third-party confirmed, reproduced on three separate loads:

- **Site menu → "Site settings" and "Getting started" do nothing.** Click reports
  success. No panel, no route, no tab, **zero console errors**. `SiteMenu.tsx:188`
  wires `onOpenSiteSettings` and `SettingsTab` renders a full-page `PanelFrame`,
  so the handler or its prop is the suspect. This is a **DEAD DOOR on a top-level
  menu item** and is ranked first.
- **The 1280 drawer-overlay mode is fully built with no trigger.**
  `LayoutShell.tsx:248,287` plus its CSS; `drawerPinned` has exactly one caller
  (`StudioPanels.tsx:411`) which never passes it, and the pin its board's title
  depends on was deliberately removed.
- **Icon picker** sits behind `media-type-chip-ico`, which renders **disabled** on
  an empty library (`title="No svg files in this library yet"`), so
  `IconBrowserOverlay` never mounts. This is a **CLOSED DOOR**, not a missing one
  — the distinction matters and is defined below.

### 1c. Prior confirmed no-doors — the precedent

Seven surfaces shipped **with passing tests** and no way in: Publish panel
(641:2652), History › Published tab, `ExportModal`, Share preview link,
Site health · Activity log, `UpgradeModal` (1175:4804), Toast-on-mount. The
Publish panel's cause is the one to remember: `publishNow = onVercelPublish ??
onOpenPublish ?? handleExport`, where the first is a `useCallback` and therefore
never undefined — so both fallbacks were dead code.

Two tRPC procedures were the same defect from the API side: `media.moveAsset`
(the dashboard could create, rename and delete folders but never move an asset
into one) and `sites.unarchive` (Archive in the row menu, Archive in the bulk
bar, an "Archived · N" filter to go and look, and nothing that brought a site
back — schema and handler branch already written).

### 1d. Unequal doors

- **`DetachInstanceButton`** (`ProInspector.tsx:438`) detaches on a **single click
  with no confirm**, while the component-library door for the same destructive
  action requires one.

---

## Part 2 — States that were never designed (~48)

Not "not built" — **not specified**. Whatever renders is improvised.

- **Settings family: one board per screen, zero loading / empty / error /
  save-error variants** — ~24 states across Domains, Redirects, Forms, Headers,
  Localization, Webhooks, Analytics/SEO.
- Publish-history load / error / empty.
- Content sub-view empties. CMS records modal × 4 states. Media drill-in empties.
- Inspector error boundary; page-settings error boundary.
- **Nine surfaces with no board family at all**: `BlockPickerModal`, canvas
  `AiPromptPopover`, `StructurePopover`, Brand `AIPromptModal`,
  `StockSourceModal`, page-settings error boundary.

---

## The vocabulary this audit uses

Four passes of my own false positives produced these; they are the difference
between a finding and a guess.

- **NO DOOR** — nothing renders an entry point.
- **CLOSED DOOR** — the control renders but is `disabled`/`aria-disabled`. Say
  what would open it. *A disabled control is not a missing door* — four
  "contrast failures" today were disabled buttons WCAG does not govern.
- **DEAD DOOR** — renders, enabled, clicked, nothing happens, no console error.
  The most valuable of the three.
- **NOT BUILT** vs **NOT DESIGNED** — code has no branch, versus code has a
  branch no board ever specified.
- A **number without its box is not evidence.** Four wrong-box readings in one
  day: a 0×0 `[role=dialog]` wrapper, a transparent row wrapper instead of the
  field, a bare `<input>` instead of the input+unit pair, and a sidebar node
  that silently included the 60px rail.

---

## Part 3 — Journeys (five walks in the running app)

*In progress. Activation, Content/CMS, Publish/go-live, Review sign-off, and
Failure/Recovery are being driven end-to-end against the server-backed fixture.
Results append here; each step is recorded as WORKS / BROKEN / NOT MEASURED, and
"not measured" is never counted as a pass.*
