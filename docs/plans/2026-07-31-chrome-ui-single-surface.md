# chrome-ui as the Single Public Chrome Surface (Option B)

Date: 2026-07-31 · Branch: `flowbite-bigbang` · Founder decision 2026-07-31
Status: rev 3 — Codex reviewed twice; rev-1 5 P1 + 3 P2 and rev-2 1 P2 all incorporated.
Follows: `2026-07-30-flowbite-bigbang-design.md` (rev 4) and its implementation arc.

**Scope is `packages/editor` only.** Repo-wide (measured 2026-07-31): 273 files under `packages/editor/src` (249 of them outside `chrome-ui/`) and 14 of
them are in `packages/dashboard`, which has its own unprefixed Flowbite setup and is
explicitly out of scope. This plan's end-state claims apply to `packages/editor/src`.

## 1. Why

The flowbite big-bang left the editor visually on one system but architecturally on two
import surfaces:

- `src/editor/chrome-ui/` — 45 editor-specific components (Codex-verified 2026-07-31:
  0 have a wholesale flowbite replacement; 16 already compose flowbite primitives; 29 have
  no flowbite equivalent at all).
- **249 files under `packages/editor/src` outside `chrome-ui/` import `flowbite-react`
  directly** — Button 237, TextInput 60, Textarea 17, Checkbox 16, Tooltip 14, Select 13,
  Badge 9, HelperText 6, Label 4, ToggleSwitch 4, Radio 3, Avatar 3.

Two consequences, one of them a live defect source:

1. **"Where do I import X from?" has two answers,** re-litigated in every new file.
2. **The theme contract is opt-in and silently skippable.** `TextInput` and `Select` only
   look right when the consumer passes `theme={BK_TEXT_INPUT_THEME}` /
   `theme={BK_SELECT_BASE_THEME}`. 60 + 13 call sites each carry that obligation.
   Forgetting it is not a type error, is invisible to jsdom tests (they assert class
   strings, never rendered CSS), and yields a subtly off-brand control — the same failure
   shape as the class-list bug that nearly shipped every button unstyled.

## 2. End state

```tsx
// every file under packages/editor/src, chrome-ui/ itself excepted
import { Button, TextInput, Topbar, IssueChip } from "@/editor/chrome-ui";
```

`chrome-ui/index.ts` aggregates three kinds of export:

**(a) Pure re-exports of flowbite, unchanged — names chrome-ui does NOT already own:**
Button, Badge, Avatar, AvatarGroup, Checkbox, Radio, ToggleSwitch, Tooltip, Textarea,
Label, HelperText, RangeSlider, Progress, Card.

> **Collision rule (rev-2 P1):** chrome-ui already exports `Spinner, Kbd, Footer, Drawer,
> Popover, Menu*, Tabs, Slider, Modal*, Toast, TextField` — flowbite's root exports several
> of the same names, and in every one of those cases **ours is the deliberate KEEP** from
> the parent arc's parity work. Those names are NEVER re-exported from flowbite. The barrel
> must be authored against the current export list, not a generic "re-export everything".

**(b) Two pre-themed wrappers — the only ones, and both compose rather than replace:**

| Wrapper | Default theme | Why a wrapper |
|---|---|---|
| `TextInput` | `BK_TEXT_INPUT_THEME` | 60 call sites must not have to remember it |
| `Select` | `BK_SELECT_BASE_THEME` | 13 call sites; two bare variants exist (below) |

Both are **`forwardRef`** — refs are load-bearing today: rename/search focus
(`PageFolder.tsx:146`, `PageList.tsx:155`, `LibraryManager.tsx:267`) and hidden file-input
clicks (`EmptyFolderDropZone.tsx:60`, `UploadZone.tsx:128`). A wrapper that drops or
narrows ref forwarding breaks these immediately.

Both **compose a caller-supplied `theme` on top of the default** (deep-merge, caller wins
per key) rather than ignoring or replacing it. Live overrides that must keep working:
inline TextInput theme at `InputControls.tsx:237`; `BK_SELECT_BARE_UNIT_THEME` at
`InputControls.tsx:282`; `BK_SELECT_BARE_VALUE_THEME` at `InputControls.tsx:335`.
The bare-Select themes stay exported for exactly these call sites.

**(c) The 45 editor components** already exported today, unchanged.

**(d) Non-component symbols — the surface is not just components (rev-2 P2).** Editor code
also reaches for `CustomFlowbiteTheme` (type-only, `settings/shared.tsx:24`), the theme
constants (`BK_TEXT_INPUT_THEME`, `BK_SELECT_BASE/BARE_UNIT/BARE_VALUE_THEME`) and the
label/helper class constants (`InputControls.tsx:11`, `SocialTab.tsx:11`, `SeoTab.tsx:15`,
`InspectorTabContent.tsx:47`). If these keep coming from `flowbite-react/*` subpaths or
from deep `chrome-ui/*Theme` paths, the single-surface claim and the gate contradict each
other. Therefore the barrel ALSO re-exports:
`export type { CustomFlowbiteTheme } from "flowbite-react";` plus every `BK_*` theme and
class constant. Deep `@/editor/chrome-ui/selectTheme`-style imports are re-pointed to the
barrel during the sweep; the gate's ban then holds with no carve-out.

**`Label` gets NO wrapper (rev-2 P1).** There is no `BK_LABEL_THEME` — `labelTheme.ts`
exports `BK_LABEL_CLASS` / `BK_HELPER_CLASS` / `BK_HELPER_ERROR_CLASS`, i.e. the Label
contract is `className`-based and consumers already pass it (`FormField.tsx:46`,
`SliderField.tsx:59`, `AdvancedTab.tsx:86`). Label and HelperText are plain re-exports;
the CLASS constants remain exported.

**Settings-local wrappers** (`sidebar/tabs/settings/shared.tsx:23,103,150`) already wrap
flowbite with their own theme. They are consumers like any other: re-point their flowbite
imports to the barrel, keep their local theming, and note them in the report — they are
NOT part of the closed wrapper set.

## 3. The one real risk, and its guard

The barrel is exactly where the deleted in-house library originally grew: someone adds
`export const Button = (p) => <FlowbiteButton size="sm" {...p} />` and the fork restarts.

**`gate:chrome-ui-surface` (ships WITH the first sweep commit, not last — rev-2 P2)
asserts:**

1. **No specifier matching `^flowbite-react(/.*)?$` anywhere under `packages/editor/src`
   outside `chrome-ui/`** — subpaths included. This is not hypothetical: `flowbite-react/types`
   is live today at `sidebar/tabs/settings/shared.tsx:24`. Also covers
   `flowbite-react/components/*`, `/dist/*`, `/store`, and `import("flowbite-react")`.
2. **Barrel purity:** every flowbite-sourced export in `chrome-ui/index.ts` is
   `export { X } from "flowbite-react"` re-export syntax — never a component definition.
3. **Closed wrapper set of exactly 2** (TextInput, Select), each with its default theme
   documented in-file. A third wrapper fails the gate until the list is deliberately
   amended in the same commit — that amendment is the review checkpoint.

Proven by negative test before it is trusted (two silent-pass gate bugs were already found
in this arc): plant a direct import → must fail; plant a subpath import
(`flowbite-react/types`) → must fail; plant a wrapping export in the barrel → must fail;
clean tree → must pass.

**Why the barrel is architecturally allowed:** CLAUDE.md bans a file existing only to
re-export *one* target and explicitly permits aggregation of many. Recorded in the gate
header so the next reader does not relitigate it.

**Bundle/type safety (rev-2 P2, verified):** `flowbite-react` is ESM with
`"sideEffects": false`, the editor builds through Vite/Rollup, and tsconfig uses
`moduleResolution: "bundler"` — so `export { X } from "flowbite-react"` tree-shakes and
preserves type identity. This holds only while the re-exports stay pure, which is what
guard #2 enforces. HMR fan-out widens (the barrel already has 152 consumers) — accepted.

## 4. Tasks

- [ ] **B1 — barrel + wrappers.** `chrome-ui/TextInput.tsx`, `chrome-ui/Select.tsx`
  (forwardRef + theme-compose), barrel additions per §2 with the collision list honored.
  Tests: each wrapper renders themed with NO consumer theme; a caller theme deep-merges
  (assert a caller key wins and a default key survives); ref reaches the real `<input>` /
  `<select>`; each pure re-export is identity-equal to its flowbite export.
- [ ] **B2 — gate.** `scripts/check-chrome-ui-surface.mjs` per §3 + `verify:ds` wiring,
  with the four negative tests run and their output pasted into the report. Lands in the
  same commit as the first sweep surface so the branch cannot backslide.
- [ ] **B3 — sweep, in surface-sized commits.** Re-point all 249 files: inspector →
  sidebar (largest) → shell → design-system/forms/templates → canvas/media/export/panels/
  rest. Per commit: `npx tsc --noEmit` clean, that surface's tests green, remaining
  direct-import count strictly decreasing.
  **Theme props are dropped ONLY where they are byte-identical to the wrapper default**
  (`theme={BK_TEXT_INPUT_THEME}` / `theme={BK_SELECT_BASE_THEME}`). The inline override and
  the two bare-Select sites keep their `theme` prop — the wrapper composes it. Every drop
  is a diff the reviewer can check; a blanket codemod is banned here.
- [ ] **B4 — docs.** `packages/editor/CLAUDE.md` chrome routing rules name chrome-ui as the
  single surface and the closed 2-wrapper set; the arc outcome doc records the decision.

## 5. Verification (before this is called done)

- `rg -l 'from "flowbite-react' packages/editor/src | grep -v chrome-ui/` → empty, and the
  same for subpath specifiers.
- `npx tsc --noEmit` clean; `npm run verify:ds` green including the new gate; `npx vite build`
  succeeds and compiled CSS still carries only `tw:`-prefixed utility rules (the canvas
  no-collision invariant from the parent arc must survive).
- Full editor suite within the known flake band (below), with each failing test identified
  and confirmed to be in that band — never assumed.

**Flake band (measured in the parent arc's Task 14):** three consecutive full-suite runs
gave 43 / 0 / 1 failures out of ~7900, all load-dependent, all passing in isolation and
under surface-level load. Suite wall time roughly doubled post-migration (1224s → 2438s)
because flowbite renders heavier in jsdom. A small nonzero count is the band, not evidence
of a B-introduced regression — but identify each one.
