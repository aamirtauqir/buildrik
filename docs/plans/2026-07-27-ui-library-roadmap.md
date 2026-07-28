# Roadmap — Figma-driven design system + component library

**Branch:** `ds/fresh-token-system` · **Started:** 2026-07-26 · **Decision:** new library from Figma, all 352 chrome files shift onto it (D5, option B).

## The rule every stage follows

```
build  →  test  →  migrate consumers  →  gate  →  delete the old thing
```

Two systems are never left alive without a **ratchet gate** — a check that locks
the old system's usage at today's number and only lets it go down. That is what
makes a 352-file migration possible without freezing feature work.

Dependencies flow leaf-first: atoms → molecules → organisms → shell → screens.
A screen built before its molecules exist gets rebuilt, which is how the last
system rotted.

---

## Stage 0 · Tokens — DONE

| | |
|---|---|
| Output | `src/themes/tokens.generated.css` + `.ts`, 152 tokens, one flat tier |
| Source | Figma `Primitives` + `Package` → `scripts/tokens/figma-tokens.json` |
| Deleted | 588-token 3-tier system: 11 files, 213 dead tokens, 42 duplicates |
| Migration | 8,491 `var()` refs across 386 files via `legacy-map.json` |
| Gate | `gate:tokens-generated` — checksum + zero legacy tokens |
| Verified | tsc, vite build, 2,836 tests, `gate:tokens` PASS |

## Stage 1 · Atoms — DONE

9 components in `src/editor/ui/`: Button, Input, Select, Checkbox, Radio,
Toggle, Badge, StatusDot, Avatar. 92 token refs, 0 hex, 0 fallbacks, 42 tests.

**Figma → React translation rule** (applies to every later stage):

| Figma variant | Becomes | Why |
|---|---|---|
| `Kind`, `Size`, `Layout`, `Tint` | React prop | a choice the caller makes |
| `rest` / `hover` / `focus` | CSS pseudo-class | the browser's job |
| `disabled`, `loading`, `checked`, `open`, `selected`, `error` | React prop | data the caller owns |

---

## Stage 2 · Molecules — DONE (16 components, 88 tests)

16 components. Each one exists in Figma except `FieldRow`, which four Inspector
sections currently reinvent.

| Component | Figma | Replaces hand-rolled code in |
|---|---|---|
| `ListRow` | 232:6 | Content, Pages, Media panels |
| `TreeRow` | 243:6 | Layers, Pages tree |
| `VersionRow` | 240:6 | History panel |
| `RecordRow` | 240:14 | Content records |
| `FormatRow` | 249:6 | Export screen |
| `IntegrationsRow` | 257:6 | Settings → Integrations |
| `CommentRow` | 17:40 | Review panel |
| `NavItem` | 16:26 | Settings sub-nav, dashboard nav |
| `SectionHeader` | 16:16 | every panel |
| `PanelHeader` | 16:6 | every panel |
| `EmptyState` | 17:18 | 11 empty states |
| `ProgressRow` | 17:23 | onboarding, migrations |
| `Tooltip` | 14:43 | chrome-wide |
| `MediaCard` | 17:6 | Media grid |
| `SiteCard` | 17:9 | Dashboard sites |
| `FieldRow` | — | Inspector Border/Link/Effects/Grid sections |

**How:** one file per component, props from the Figma contract, styles appended
to `ui.css` with the node id in a comment. Contract tests per component.

**Verify:** tsc · vitest · `gate:tokens-generated` (0 hex in new CSS).

**Effort:** human ~1 week / CC ~2 hours.

## Stage 3 · Organisms — DONE (8 + focus trap)

8 components: `Rail`, `Topbar`, `Footer`, `DrawerFrame` (19:46), `ModalFrame`
(19:79), `RightPanelFrame` (19:47), `CommandPalette`, `OverlayMount` (portal +
scrim + focus trap).

**Risk:** these own focus management and z-index. `OverlayMount` is the only
component allowed to touch `document.body` (existing Gate 22 keeps that true).

**Verify:** keyboard traversal test per organism — open, Tab cycle, Esc closes,
focus returns to trigger.

**Effort:** human ~1 week / CC ~2 hours.

## Stage 4 · The shell is ONE component — DONE

`EditorShell` = Topbar + Rail + Drawer + Canvas slot + Inspector + Footer,
assembled once. Every screen renders `<EditorShell>` with a different slot
payload. Per-screen deltas are limited to the active rail item and the drawer
contents.

This is the rule that makes cross-screen drift structurally impossible. Today
the shell is re-described per surface; that is why the 1280 breakpoint variant
and the assembled variant disagree in Figma.

**Verify:** the existing `scripts/conformance/` live-DOM runner already measures
the rendered shell. Point it at every screen; the shell's geometry must be
byte-identical across all of them.

**Effort:** human ~3 days / CC ~1 hour.

---

## Stage 5 · Migrate — IN PROGRESS: 261 of 402 done, 141 left (120 production, 21 tests)

Not a big bang. Batches ordered by risk — lowest first, so the mechanics are
proven before touching the canvas.

| # | Batch | Files (approx) | Risk |
|---|---|---|---|
| 1 | Settings (14 screens) | 20 | low — forms only |
| 2 | Pages, Layers, Media, Templates, Components panels | 60 | low |
| 3 | History, Review, Content, AI panels | 45 | medium — async state |
| 4 | Inspector (sections + tabs) | 70 | medium — heavy prop surface |
| 5 | Shell, Rail, Topbar, Footer | 25 | high — every screen depends on it |
| 6 | Canvas + overlays | 40 | highest — drag, selection, hit-testing |
| 7 | Onboarding, collaboration, ecommerce, export, animation | 50 | low |

**Per batch:** codemod the mechanical part (import path + prop rename), do the
structural part by hand, run that batch's tests, screenshot the panel at
`localhost:5050`, commit. One batch = one revertable commit.

**The ratchet gate** lands before batch 1:

```
gate:vibcoder-ratchet — counts files importing editor/shared/vibcoder.
Baseline = today's 249. The number may only go DOWN. New import = build fails.
```

That stops the old library growing while the migration runs, without blocking
anyone's feature work.

**Effort:** human ~4-6 weeks / CC ~1-2 days. This stage is the project.

## Stage 6 · Delete the old library — BLOCKED on stage 5 reaching 0

When the ratchet hits 0: delete `src/editor/shared/vibcoder/` (70 primitives +
tests), `src/shared/extensions/`, `src/shared/ui/`, and their CSS in
`themes/components/`. Retire the gates that policed them (Gate 15, 19, 23,
`gate:ds-alias`, `gate:buildrick`) — they exist to protect a system that will no
longer be there.

Expected deletion: ~4,000 lines and 3 CI gates.

## Stage 7 · Lock it

| Gate | Enforces |
|---|---|
| `gate:tokens-generated` | tokens come from Figma, no legacy token returns |
| `gate:ui-only` | chrome may import from `editor/ui/` only — no raw `<button>`, no ad-hoc rows |
| `gate:no-hex` | zero hex literals in chrome CSS **and** TSX (today: 49 in CSS, 143 in TSX) |
| `gate:shell-parity` | conformance runner: shell geometry identical across screens |

Plus `docs/` updated and `packages/editor/CLAUDE.md` rewritten — it currently
describes Emotion as the styling system, which is stale (2 files use it).

---

## Risks, and how each is caught

| Risk | Detection |
|---|---|
| Canvas drag/selection breaks | canvas test suite + manual drag pass per batch 6 commit |
| Focus/keyboard regressions in overlays | per-organism keyboard test in stage 3 |
| Visual drift nobody notices | conformance live-DOM runner vs Figma geometry |
| Customer sites restyled | `--buildrick-design-*` carve-out in `check-tokens-generated.mjs`; already caught this once |
| Migration stalls half-done | ratchet gate makes the remaining count visible in CI on every PR |

## Rollback

Every stage is one or more standalone commits on `ds/fresh-token-system`.
`git revert <sha>` restores the previous state; nothing depends on a later stage
having landed. The token layer and the component library are independent — the
tokens can ship without the library.

## Out of scope, tracked separately

- **Dashboard package** — still on its own tokens, 34 stale `#406ED6`. Chrome-only was the D3 decision.
- **Customer site output tokens** (`--buildrick-design-*`) — needs version pinning + migration before any change.
- **`gate:buildrick`** — already red on main before this work (baseline 78, actual 111). Not caused here, not fixed here.


---

## Module slices — 2026-07-27

Stage 5's remaining files are being drained **module by module** rather than by
codemod batch. A slice takes one surface, builds only the components that
surface needs, rewires the container, and deletes the old file in the same
commit. Nothing is left running in two versions.

### Slice 1 · Topbar — DONE

| Deleted | Replaced by |
|---|---|
| `shell/Topbar.tsx` (755 lines, 45 props) | `ui/Topbar.tsx` (13 props, Figma 681:122) |
| `shell/PublishDropdown.tsx` (308) | the Publish button + the live-URL items in `SiteMenu` |
| `shell/NotificationBell.tsx` (198) | `Topbar`'s bell + `shell/NotificationPanel.tsx` |
| `PresenceIndicators.tsx` body (300) | `ui/Presence.tsx`; the file is now a 70-line adapter |
| `shell/__tests__/Topbar.test.tsx` (506) | `shell/__tests__/StudioHeader.test.tsx` (38 cases) |
| `vibcoder/Topbar.tsx` + test | nothing — the shell topbar was its only consumer |
| `themes/components/organisms/topbar.css` | `ui.css` `.bk-topbar` block |
| `themes/design-system/bd-topbar-overrides.css` (11.7 KB) | — the override layer had nothing left to override |
| `preview/vibcoder-topbar.{tsx,html}` | — a gallery for a component nothing rendered |

New in the library: `Topbar`, `SaveStatus`, `Presence`, `Avatar` tones, and a
compound `Menu` (`Menu > MenuGroup > MenuLabel + MenuItem`) whose roving focus
is computed from the DOM, so groups and conditional items work.

New in the shell: `SiteMenu`, `SendForReview`, `NotificationPanel`, `header.css`.
`StudioHeader` is now the single container — the wrapper-around-a-wrapper is gone.

**Design decisions taken during the slice**, each one narrowing rather than
widening what ships:

- `connecting` and `reconnecting` both read as "Reconnecting…". The user's
  question is identical in both — are my edits landing — and the design has one
  answer.
- Per-user avatar hex is gone. Tone is derived from the user id against the
  token ramp, so the same person is the same colour in every session.
- The publish split-button's extra actions (View live site, Copy URL) moved into
  the site menu. The Figma component has one publish button, not a split one.
- `SaveStatus` gained an `error` state, and the Figma set (697:461) gained the
  matching variant in the same pass. Save failure is a real state the product
  produces; mapping it onto "conflict" would have been a lie.
- The review pill takes `{ label, tone }` instead of a count, so all five review
  states share one shape — and it is a `<button>` only when it goes somewhere.

Deleting the vibcoder skin drained 2 of the 4 grandfathered `selectorDuplicates`
(`.bd-topbar`, `.bd-topbar__brand`) — the CSS had outlived the markup by one
migration. The reduced-motion rule for `.bd-topbar__status-dot` went with it.

**Pre-existing red, untouched by this slice** (recorded so it is not mistaken for
new damage): `gate:buildrick` sits at 111 against a baseline of 78 — red on main
before this work started. `gate:ds-ssot` flags `.bd-depth-badge` in Canvas.css;
that is the same grandfathered violation as before, at a new line number after an
earlier codemod shortened the file.

### Slice 2 · Rail + Drawer — next

---

## Progress log — 2026-07-28 · MIGRATION COMPLETE

| Stage | State |
|---|---|
| 0 · Tokens | done — 152 flat tokens, generated, gated |
| 1 · Atoms | done — 10 components |
| 2 · Molecules | done — 16 components |
| 3 · Organisms | done — 8 + useFocusTrap |
| 4 · EditorShell | done |
| 5 · Migration | **done — 402 of 402, ratchet 141 → 0** (slices 2–6, 2026-07-28) |
| 6 · Delete old library | **done** — `editor/shared/vibcoder/` (70 primitives), `shared/extensions/`, `shared/ui/`, `themes/components/` (76 CSS files), all 54 preview galleries deleted; Gates 20/23 retired, Gate 15 repurposed as a --bd-* resurrection ban |
| 7 · Final gates | tokens-generated live · ratchet locked at **0** (= the legacy-import ban / gate:ui-only first half) · no-hex = Gate 16 hex ratchet (49 CSS + 143 TSX to drain — separate arc) · shell-parity: conformance runner exists, CI wiring pending |

Library at close: 50+ components + useFocusTrap, ~200 contract tests, 0 hex, 0 fallbacks.
Additions during the final slices: Slider (92:30), BreakpointSwitcher (ported),
CopyButton, SkeletonCompounds, UpgradeModal, HelpTooltip, PanelHeaderActions,
`editor/shared/elementIcons` (element-type glyph map), ModalClose self-wiring
via ModalRoot context, Popover `top-end` + `block` anchor, Cluster `gap="xs"`.

Slice history: 1 topbar `eaa9a393` · 2 rail+drawer `c5a64252` · 3 tooltip drain
`8c0d4f4f` · 4 modals `a67f6779` · infra `579d5b1e` · 5 forms/compounds/mech
`73a0cbd1` · 6 extensions+shared/ui drain + stage-6 delete (this commit).

Residual Emotion: 4 files (canvas.tokens.ts, ReviewTab, CodePreview + test) — tracked for a cleanup pass, not load-bearing for the DS.
