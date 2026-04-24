# Tab Conformance Matrix — P0d

Date: 2026-04-25
Owner: shahg
Branch: main
Status: READ-ONLY AUDIT (no code changes)

References:
- Plan: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-ds-implementation-20260424-214519.md` (v3 APPROVED)
- Prototypes: `packages/editor/project/left-panel/tab-*.html` (11 files)
- Live: `packages/editor/src/editor/sidebar/tabs/*/` + routed via `editor/rail/tabsConfig.ts` + `editor/sidebar/TabRouter.tsx`

## Purpose

Gate artifact for Week 2 (tab conformance ports). Maps every left-panel HTML prototype to its live React surface, classifies status, and lists high-level deltas per tab. Per-tab granular delta enumeration is Week 2 work; this matrix is the sizing + priority layer.

## Matrix

Legend:
- `shipped-conformant` — live matches prototype spec, no material deltas
- `shipped-needs-reconciliation` — live exists and works, but diverges from prototype (token usage, layout, variants)
- `stub` — live exists as scaffold but incomplete
- `missing` — no live surface
- `routed-differently` — prototype exists as standalone but live absorbs it into another tab

### Summary counts

- **11 prototypes**, **10 live surfaces mapped**, **1 routed-differently** (tab-ai)
- `shipped-needs-reconciliation`: 10 (all of them — token sweep pending per P0c findings)
- `shipped-conformant`: 0 (no tab has passed the `--bd-*` only check yet)
- `stub`: 0
- `missing`: 0
- `routed-differently`: 1 (tab-ai)

### Full matrix

| Prototype | LOC | Live surface | Live LOC | Route ID | Status | Deltas (high-level) |
|-----------|-----|--------------|----------|----------|--------|---------------------|
| `tab-add.html` | 331 | `tabs/build/BuildTab.tsx` | 144 | `add` | shipped-needs-reconciliation | Token sweep; element-palette icons may need parity check; prototype has "Blocks" grid + "Elements" grid — verify both exist in live. |
| `tab-ai.html` | 544 | (inside `BuildTab` feature-flagged) | — | — | routed-differently | Not a standalone tab in live. AI UI is a feature flag inside BuildTab (per TabRouter.tsx line 63 — `aiEnabled`). **Blocker decision required:** (a) port as standalone tab, (b) reconcile into BuildTab's AI view, (c) delete prototype as obsolete. See Open Question 2 in v3 plan. |
| `tab-components.html` | 138 | `tabs/ComponentsTab.tsx` + `tabs/component-library/` | 472 | `components` | shipped-needs-reconciliation | Token sweep; verify `component-library/` subdirectory pattern matches prototype's single-list layout or exceeds it. |
| `tab-design.html` | 197 | `features/design-system/ui/DesignSystemTab` (via bridge `tabs/DesignSystemTab.tsx`) | — | `design` | shipped-needs-reconciliation | Live implementation lives outside `editor/sidebar/tabs/`. Import direction irregularity — chrome tab imports from `features/` which is allowed per editor/CLAUDE.md but worth noting. Token sweep on the actual impl file. |
| `tab-history.html` | 179 | `tabs/history/HistoryTab.tsx` | 205 | `history` | shipped-needs-reconciliation | LOC-proximate. Token sweep likely. Prototype has version-list pattern; verify live renders same row structure. |
| `tab-layers.html` | 273 | `tabs/layers/LayersTab.tsx` | 154 | `layers` | shipped-needs-reconciliation | **Recently rewritten** (commits 1f02f4d + 0ed8d40 + 34189df — selection SSOT, multi-select, child recursion fix). Likely the highest-conformance tab in the tree — still needs token sweep verification. |
| `tab-media.html` | 147 | `tabs/media/MediaTab.tsx` | 317 | `assets` | shipped-needs-reconciliation | Live is 2x prototype LOC — feature-richer. Token sweep; confirm the extra features (stock integrations, folders) don't live-code hex. |
| `tab-pages.html` | 300 | `tabs/pages/PagesTab.tsx` | 286 | `pages` | shipped-needs-reconciliation | LOC-proximate. Token sweep. Prototype flows: page list, page settings modal, folder tree — verify all live. |
| `tab-publish.html` | 185 | `tabs/publish/PublishTab.tsx` | 692 | `publish` | shipped-needs-reconciliation | **Live is 3.7x prototype LOC** — live has significant additional surface (domain hub, SEO, export). Token sweep; possible scope overrun from prototype. Verify new additions follow DS before Week 3 gate flip. |
| `tab-settings.html` | 571 | `tabs/settings/SettingsTab.tsx` + `settings/screens/{PublishingHub,IntegrationsHub,...}` | 331+ | `settings` | shipped-needs-reconciliation | Prototype is LARGE (571). Live splits into SettingsTab + sub-screens. Nav pattern (sidebar-in-tab) needs visual parity check. Token sweep. |
| `tab-templates.html` | 247 | `tabs/templates/TemplatesTab.tsx` | 397 | `templates` | shipped-needs-reconciliation | Templates drawer pattern. Live has modals (`TemplatePreviewModal`, `ApplyProgressOverlay`). Token sweep. |

**Route `assets` note:** prototype `tab-media.html` maps to tab ID `assets` in `tabsConfig.ts`. The tab is called "Media" in UI but IDed as "assets" internally. Worth renaming the ID to `media` for consistency with prototype, or renaming the prototype file. Not blocking.

---

## Per-tab Week 2 port checklist

For each `shipped-needs-reconciliation` tab, Week 2 port work follows the 7-point checklist from the v3 plan:

- (a) All colors via `var(--bd-*)`
- (b) All typography via `--bd-text-*` / `--bd-font-*` / `--bd-weight-*`
- (c) All spacing via `--bd-space-*` (pending alias family addition per P0c finding)
- (d) Uses shared primitives where applicable (Button, TextInput, Popover, Modal, Badge)
- (e) Test covers primary interaction (list page, save setting, apply template, etc.)
- (f) Source CSS + inline styles contain zero hex matches
- (g) Layout diffed against prototype (screenshot comparison)

---

## Recommended Week 2 port order

Priority by (a) user-facing traffic, (b) visual-fidelity gap, (c) blocker-removal for downstream tabs.

### Batch 1 (week 2)
1. **Pages** — highest traffic, live LOC-proximate to prototype, clean target.
2. **Settings** — complex sub-screen nav, catches any nav-pattern bugs early.
3. **Design** — touches token exposure; good coverage stress for the bd-aliases layer.

### Batch 2 (week 3, after adversarial review of batch 1)
4. **Templates** — modal-heavy; exercises Modal primitive conformance (P0c Week 1 dependency).
5. **Media / assets** — stock integrations may surface ID mismatch; smaller scope.
6. **Publish** — largest live surface (692 LOC). Highest scope-overrun risk. Tackle after confidence from batches 1 + 2.

### Deferred / out-of-scope
- **Layers** — already rewritten recently; token sweep only, no visual rework.
- **Build** (tab-add) — depends on AI decision (tab-ai disposition).
- **History** — low traffic, small scope; bundle with any larger batch.
- **Components** — depends on component-library subdirectory conformance pass, may pair with Templates.

### Blocker decisions — status

1. ~~tab-ai disposition~~ **LOCKED 2026-04-25:** reconcile visuals into BuildTab's AI view. No standalone 11th tab. Row in matrix stays `routed-differently`. Week 2 work: port tab-ai.html visuals (conversation thread, suggestion cards, prompt input) into BuildTab's existing `aiEnabled` path.
2. **`assets` ID rename** — still open. Rename `assets` → `media` in `tabsConfig.ts` or keep divergent? Low stakes — defer.
3. **Primitive conformance must land first** — per P0c audit, 4 of 5 primitives need `--bd-*` sweep + missing alias families (`--bd-radius-*`, `--bd-space-*`, `--bd-shadow-*`). Tab token-sweep work is blocked until primitives are ready OR tab-level sweeps tolerate mixed token namespacing during transition.

---

## Cross-cutting findings

- **No tab has passed the `--bd-*` only check yet.** Every live surface mixes `--bd-*` and `--buildrick-*`. Expected per plan Premise 2 ("migrations flow `--buildrick-*` → `--bd-*`") — this audit confirms none has completed the flow.
- **Live LOC skews larger than prototypes on average.** Publish is 3.7x, Media is 2.1x, Components is 3.4x. Two interpretations: (a) live is feature-richer than prototype captured, (b) live has drift/bloat. Per-tab Week 2 review needed to classify.
- **tab-ai is the only routing mismatch.** Everything else has a 1:1 or near-1:1 surface. The AI decision is genuinely load-bearing — it affects whether `tab-ai.html` counts as port-complete, delete-obsolete, or new-work.

---

## Summary

**10 of 11 prototypes have a live React counterpart. 1 needs a disposition decision. 0 are missing outright.**

Week 2 is not "port 10 tabs from scratch." It is "reconcile 10 live surfaces against 11 prototypes on tokens, primitives, and visual fidelity." Scope is materially smaller than v3 draft implied.

**Immediate unlock:** once the primitive-conformance audit (P0c) resolves into Week 1 alias expansion + primitive token sweep, Week 2 tab ports can proceed with `--bd-*` as a hard requirement. Until then, tab-level token sweeps are bounded by what primitives expose.
