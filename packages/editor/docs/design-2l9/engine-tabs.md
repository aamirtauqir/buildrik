# Engine model · Tabs tab↔panel pairs (B-21)

Boards: C01 `245:36832` (Tabs / explicit pairs and initial state). Owner approval 2026-10-30.

## Data shape — attributes on the elements

The pair lives in the markup, so every path that already carries attributes
(save, history snapshot, copy/paste, duplicate, HTML import, export) carries it
with no new project field.

| Element | Attribute | Meaning |
|---|---|---|
| Tabs root (`type: "tabs"`) | `data-tabs-initial="<key>"` | the pair shown first (published page and canvas) |
| tab button (`role="tab"`, inside `role="tablist"`) | `data-tab-key="<key>"` | its pair |
| panel (`role="tabpanel"`, child of the root) | `data-tab-key="<key>"` | its pair |

`<key>` is a stable, label- and position-independent id (`tab-01`, `tab-02`, …,
unique within one Tabs root). Board copy: "tab-01 → panel-01 · Stable IDs · no
pairing by label or position".

HTML `id` / `aria-controls` / `aria-labelledby` are **not** stored: element ids
are remapped on duplicate, so the runtime derives them per page load
(`bk-tabs-<n>-<key>-tab` / `-panel`).

## Engine (`src/engine/widgets/tabsModel.ts`)

Pure functions over the composer, each one history step (a composer
transaction):

- `readTabs(composer, rootId)` → `{ pairs: [{ key, tabId, panelId, label }], initial }`.
  Pairs by key; a root without keys (every Tabs block saved before this model)
  pairs **by position** as a read-only fallback, and reports `legacy: true`.
- `ensureTabKeys(rootId)` — writes keys (and `data-tabs-initial` from the tab
  currently `aria-selected="true"`, else the first). The editor calls it before
  the first edit of a legacy block; nothing runs on load.
- `setInitialTab(rootId, key)`, `addTab(rootId, label?)` (button + panel, new
  key, appended), `moveTab(rootId, key, toIndex)` (button and panel move
  together), `removeTab(rootId, key)` (both go; refused for the last pair).

## Editor UI

The Tabs block writes keys and `data-tabs-initial` from now on. The Inspector's
Tabs section (pairs list, "Button and panel move together.", "Add tab",
Relationships "Overview tab-01 → panel-01", Tab actions "Move Details before
Overview", Initial state) is L-B's (REQUESTS B-21 reply) on top of these
functions. Layers names ("Overview · tab", "Overview · panel") follow from the
pair label.

## Canvas

`useTabsModalRuntime` runs the runtime with `interactive: false`: the initial pair's
panel shows, the others hide — except a panel that holds the current selection,
which is revealed while selected (temporary, never saved).

## Published / export

`src/engine/export/tabsRuntime.ts` (`initTabsRuntime`), one import-free
function, run by the canvas and serialized into the published page by
`lib/publish-widgets.ts` (pages containing `role="tablist"`). It:

- finds every `[role="tablist"]` and its root (the tablist's parent);
- pairs tabs and panels by `data-tab-key`, else by position (legacy);
- sets `id`, `aria-controls`, `aria-labelledby`, `aria-selected`, roving
  `tabindex` (0 on the selected tab, −1 on the rest), `hidden` on inactive
  panels, `tabindex="0"` on panels;
- activates on click and on ArrowLeft / ArrowRight (wrapping), Home, End
  (automatic activation, WAI-ARIA Tabs pattern);
- swaps the block's own active / inactive tab look: the inline `style` the
  initially-selected tab carries vs. the others', plus the `active` class on
  tab and panel — so legacy blocks styled inline keep their look when switched;
- is idempotent per root (`data-bk-tabs-init`) and returns a cleanup.

## Existing projects

No migration. A legacy block (no keys, no `data-tabs-initial`) loads unchanged;
on the canvas and the published page the runtime pairs it by position and opens
the tab already marked `aria-selected="true"` (else the first) — i.e. what it
showed before, now switchable. The first editor edit writes keys.
