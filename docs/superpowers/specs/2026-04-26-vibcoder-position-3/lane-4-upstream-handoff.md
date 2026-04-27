# Lane 4 — Vibcoder Upstream Radix Handoff

**Date:** 2026-04-28
**Bundle pin:** `ac36d363d424a76c0f13d6290bcd2e71d82867d6413004f7b39e82aab5fb07fb` (144 files, 2026-04-26)
**Purpose:** Prep doc for upstream vibcoder bundle changes that unblock Phase 5 Buckets A + B.
**Companion:** `poc-findings.md` § "Phase 5 handoff list" (lines 634-661) — canonical bucket definitions.

## What this doc is

Lane 4 is the parallel track that prepares vibcoder upstream changes while Phase 5 proper (Bucket C shim deletion) executes. Phase 5 Buckets A + B require **upstream vibcoder bundle edits** — adding Radix backing to vibcoder Popover/Tooltip + adding ContextMenu primitive. Those edits happen in the vibcoder source repo, then re-vendor into `themes/components/` via `npm run vibcoder:vendor` with a new `.bundle-version` pin.

This doc captures the **exact change set** so the upstream work is scoped, not exploratory.

## Inventory snapshot (2026-04-28)

Verified via grep — counts match `poc-findings.md` Phase 5 handoff:

| Shim | Consumers | Bucket | Upstream req |
|---|---|---|---|
| `Popover.tsx` | 3 | A | vibcoder Popover gains Radix.Popover backing |
| `Tooltip.tsx` | 7 | B | vibcoder Tooltip gains Radix.Tooltip backing |
| `Toast.tsx` | 26 | B (conditional) | NotificationCenter gains queue/provider API |
| `ContextMenu.tsx` | 1 | B | vibcoder gains ContextMenu primitive (needs Radix.ContextMenu) |
| `HelpTooltip.tsx` | 2 | B (cascades) | Ports in same commit as Tooltip |

Popover consumers (Bucket A blast radius):
- `editor/inspector/sections/SizeSection.tsx`
- `editor/inspector/sections/typography/FontControls.tsx`
- `editor/inspector/shared/controls/ColorInput.tsx`

Tooltip consumers (Bucket B Tooltip):
- `editor/canvas/CanvasFooterToolbar.tsx`
- `editor/canvas/controls/toolbar/ToolbarActionsSection.tsx`
- `editor/canvas/controls/toolbar/ToolbarNavSection.tsx`
- `editor/inspector/shared/controls/InputControls.tsx`
- `editor/shell/StatusIndicators.tsx`
- `editor/shell/Topbar.tsx`
- `editor/sidebar/tabs/pages/page-settings/SeoTab.tsx`

ContextMenu consumer (single):
- `editor/canvas/hooks/drag/dropOperations.tsx`

HelpTooltip consumers:
- `editor/inspector/sections/layout/DisplayControls.tsx`
- `editor/inspector/sections/layout/PositionControls.tsx`

`useFocusTrap` live call sites — only `shared/ui/Popover.tsx:62`. Modal docstring mentions it but Modal does NOT call it (T5 dropped — Radix.Dialog handles internally). Confirms Popover is the **single** load-bearing dependency for the hook.

## Editor-side Radix package state

Currently installed in `packages/editor/package.json`:

```
@radix-ui/react-dialog    ^1.1.15
@radix-ui/react-popover   ^1.1.15
@radix-ui/react-portal    ^1.1.10
@radix-ui/react-slot      ^1.2.4
```

Required for Phase 5 Buckets A + B (latest as of 2026-04-28):

```
@radix-ui/react-tooltip       ^1.2.8
@radix-ui/react-toast         ^1.2.15   (only if Toast Bucket B activates)
@radix-ui/react-context-menu  ^2.2.16
```

**Install timing:** package.json edits land in the same commit that consumes the new primitive (don't pre-install; bundle bloat with no usage trips Gate 24 review).

## Bucket A — Popover Radix upgrade

**Upstream change (vibcoder bundle):**
- Wrap `<Popover>` family with Radix.Popover root/portal/content
- Honor `open`, `onOpenChange`, `anchor` props on the root
- Keep bd-popover CSS skin on Content
- Provide arrow as `RadixPopover.Arrow` re-export (resolves deferred issue #93)

**Buildrik delete-list (after vibcoder re-vendor):**
1. `shared/ui/Popover.tsx:62` — `useFocusTrap(contentRef, isOpen)` call (Radix.Popover focus management replaces it)
2. Positioning math (current shim computes `coords` via `getBoundingClientRect`) — Radix.Popover.Content handles this
3. Outside-click listener + Escape handler — Radix.Popover handles
4. After delete, shim collapses to a thin prop translator (`trigger`/`content`/`triggerOn`) — then Bucket C T6 deletes the whole shim

**Hook deletion:**
- `shared/hooks/useFocusTrap.ts` — delete file
- `shared/hooks/index.ts` — drop export
- `shared/hooks/__tests__/useFocusTrap.test.tsx` — delete

**PopoverArrow (#93):** vibcoder's `<span aria-hidden>` decorative arrow swaps to `RadixPopover.Arrow` re-export in the same upstream commit. Reconciles Phase 3 deferral.

## Bucket B — Tooltip / ContextMenu / (Toast)

### Tooltip + HelpTooltip

**Upstream change:** vibcoder Tooltip wraps Radix.Tooltip root/portal/content/provider. Keep `bd-tooltip` skin. Honor `delayDuration`, `disableHoverableContent`.

**Buildrik delete-list:**
- `shared/ui/Tooltip.tsx` — codemod 7 consumers to direct `@/editor/shared/vibcoder` import, then delete shim
- `shared/ui/HelpTooltip.tsx` — codemod 2 consumers in the same commit (cascades because HelpTooltip composes Tooltip)

**Codemod scope:** import-rename only. No prop translation needed if vibcoder Tooltip preserves API.

### ContextMenu

**Upstream change:** vibcoder gains a ContextMenu primitive backed by Radix.ContextMenu. New CSS file `themes/components/organisms/bd-context-menu.css`. New wrapper `editor/shared/vibcoder/ContextMenu.tsx`.

**Manifest update:** `docs/reference/vibcoder/components/COMPONENTS.md` gets a new entry — required for `vibcoder:check-port` gate to pass.

**Buildrik delete:**
- Single consumer `editor/canvas/hooks/drag/dropOperations.tsx` — codemod or manual rewrite
- `shared/ui/ContextMenu.tsx` — delete shim

### Toast (gated)

**Trigger condition:** NotificationCenter organism gains `useNotifications()` hook with `id` / `dedupe` / `auto-dismiss` API surface matching `Toast.tsx` queue contract.

**Status:** NotificationCenter exists as gallery only (`src/preview/vibcoder-notification-center.tsx`) — no production queue. Until queue ships, Toast stays as keep-as-extension.

**If activated:** 26 consumers — largest blast radius in the entire arc. Should ship as its own commit, NOT bundled with Tooltip/ContextMenu.

## Sequencing recommendations

Solo-workflow merge thrash is the dominant cost (per memory: lanes 2/3/4 parallelism real but coordination expensive). Suggested upstream batch order:

1. **Vibcoder upstream commit 1:** Popover + Radix.Popover + PopoverArrow re-export (Bucket A unblocker + #93 close)
2. **Vibcoder upstream commit 2:** Tooltip + Radix.Tooltip (Bucket B Tooltip unblocker)
3. **Vibcoder upstream commit 3:** ContextMenu primitive + Radix.ContextMenu (Bucket B ContextMenu unblocker)
4. **(Conditional) Vibcoder upstream commit 4:** NotificationCenter queue/provider API (Bucket B Toast unblocker)

Each upstream commit triggers a buildrik-side `npm run vibcoder:vendor` + `.bundle-version` re-pin + Phase 5 task to consume.

## Risks / open questions

- **Codemod re-runs.** If upstream lands mid-Phase-5, all 19 buildrik codemods may need re-run against the new bundle. Mitigation: batch upstream changes into 1-2 vendor cycles, not 4.
- **Bundle delta.** Phase 4 absorbed +4.4% raw / +6.4% gzip-main from Radix adoption. Adding tooltip + context-menu (+ optional toast) will push another delta. Document in commit body.
- **Radix.Popover focus trap defaults.** Need to verify Radix.Popover focus management is equivalent to current `useFocusTrap` behavior (especially Tab cycling within popover content). Validation step before Bucket A delete.
- **API drift.** If vibcoder Tooltip API differs from legacy `<Tooltip content="..." shortcut="..." />` shape, codemod becomes prop-translator not import-rename. Cost goes from 1-line edit per consumer → multi-line.

## What's done before upstream work starts

- [x] Consumer counts verified (3/7/26/1/2)
- [x] `useFocusTrap` confirmed single-consumer (Popover only)
- [x] Radix package gap identified (3 missing, versions noted)
- [x] NotificationCenter queue confirmed absent (Toast stays gated)
- [x] Roadmap counts cross-checked vs grep — match exactly
- [x] PopoverArrow #93 disposition confirmed (folds into Bucket A upstream commit)

## What unblocks Lane 4 → Phase 5 merge

Lane 4 is **prep**. Actual gate to enter Phase 5 Bucket A consumption:

1. Vibcoder upstream commit 1 lands
2. `npm run vibcoder:vendor` runs cleanly on buildrik side
3. New `.bundle-version` hash committed
4. Gate 19 / 21 / vibcoder-port all pass on new bundle
5. Buildrik commit deletes useFocusTrap + Popover hybrid shell

After 1-5, Phase 5 Bucket A is closed and Bucket C T6 (Popover shim deletion) becomes runnable.
