# DS Final Closeout Arc — Design Spec

**Date:** 2026-05-16
**Author:** brainstormed via `/superpowers:brainstorming` session
**Reference prototype:** `~/.gstack/projects/aamirtauqir-buildrik/designs/ds-components-prototype-20260507/index.html` (16 screens, s00–s15)
**Live audit screenshots:** `/tmp/audit-s07-inspector.png`, `/tmp/audit-s08-ai.png`, `/tmp/audit-s09-lint.png`, `/tmp/audit-components-panel.png`, `/tmp/audit-s12-modal.png`
**Predecessor arcs:** `2026-05-15-ds-prototype-parity-arc-design.md` · `2026-05-15-ds-prototype-full-rewrite-arc-design.md` · `2026-05-15-ds-styles-s03-parity-arc-design.md` · Arc D 2026-05-16 (D1–D6 shipped, ending with commit `e53df7c6`)

---

## Goal

Close out the final 3 verified gaps in the Design System UI prototype contract. Editor live-audit on 2026-05-16 revealed 12 of 15 prototype screens shipped, 3 remaining gaps. This arc closes all 3 in sequence (A → B → C) under one spec, one plan, three atomic commits.

## Context

The 16-screen DS prototype (s00–s15) has been the design contract since 2026-05-08. Prior arcs (DS prototype-parity, full rewrite, Styles s03, Arc D) shipped 12 screens fully. Live-verify on 2026-05-16 (post-render-loop fix) walked the editor at `localhost:5050` with a real composer + non-empty designTokens and confirmed:

- **s07 Inspector chip variants** — SHIPPED (Typography binding chip `Inter · var(--buildrick-desi...)` visible · Style/Element/Effects tabs · responsive `Desktop · 1200+` + `+ state` pills present). Promoted from PARTIAL based on memory.
- **s09 DS lint · 3 surfaces** — SHIPPED (Tokens · "Issues (2)" filter chip → salmon card *"2 tokens with low contrast — fails WCAG AA."* + Fix all (2) CTA). All three surfaces (inline TokenLintRow + DSLintBanner + aggregate Issues card) confirmed.

The 3 remaining gaps:

1. **Gap A — sidebar "+ Save current selection" stub** — `ComponentsPanelV2.tsx:160-178` `handleSaveSelection` uses `window.prompt + composer.components.createComponent` directly. Bypasses the binding-aware `CreateComponentModal` (reached only via canvas right-click).
2. **Gap B — AIPromptModal Accept is no-op** — `ComponentsPanelV2.tsx:253-263` deliberately closes the modal without ingesting the generated schema. Inline comment cites a "follow-up arc" that never landed.
3. **Gap C — s11 drag E2E + 4-frame UX** — Cards are `draggable={true}` and canvas has `.buildrick-canvas` drop target. Programmatic `dataTransfer` drag dispatch did not insert during live audit. The 4-frame UX (ghost · drop highlight · insert animation · auto-select) was deferred in the parity arc.

## Out of scope

- No DS architecture changes (registries stay as-is post 2026-05-16 render-loop fix in commit `0c1a6b53`).
- No prototype-v3 net-new screens beyond the 3 audited gaps.
- No backend AI provider swap or env var work — verify-only.
- Drag-from-Components-rail is in scope. Drag-from-Add-panel (Elements), drag-from-Templates-rail, and drag-from-Media-rail are NOT in scope.
- Nested-container drop targets within canvas not in scope; only root-level drop.
- Touch/iOS drag parity is a separate arc.

---

## Architecture per gap

### Gap A — sidebar Save stub → emit `COMPONENT_SAVE_AS_REQUESTED`

**Where**
- `packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx:160-178` — `handleSaveSelection` uses `window.prompt + composer.components.createComponent` directly.
- Canonical path: `packages/editor/src/editor/canvas/menus/actions/standaloneActions.ts:29` emits `EVENTS.COMPONENT_SAVE_AS_REQUESTED` with `{selectionIds, extractedBindings}`. `packages/editor/src/editor/shell/hooks/useEditorEventListeners.ts:98` picks it up → `useStudioModals` sets context → `StudioModals` renders binding-aware `packages/editor/src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx`.

**Change**

Replace the body of `handleSaveSelection` in `ComponentsPanelV2.tsx`:

```ts
const handleSaveSelection = React.useCallback(() => {
  if (!composer) return;
  const selectionIds = composer.selection.getSelectedIds();
  if (selectionIds.length !== 1) return; // silent guard
  const extractedBindings = composer.tokenBindingResolver
    ?.resolveForElements?.(selectionIds) ?? new Map<string, string>();
  composer.emit(EVENTS.COMPONENT_SAVE_AS_REQUESTED, {
    selectionIds,
    extractedBindings,
  });
}, [composer]);
```

**Why** — single SSOT for the save flow. Per CLAUDE.md "No duplicate logic / Semantic duplication NAHI" the `window.prompt` path duplicates what the event chain already does. After fix every save path enters via one event.

**Edge cases**
- 0 or 2+ selected: silent no-op (matches existing pre-fix behaviour where the prompt logged TODO and returned).
- `tokenBindingResolver` absent on dev composer: optional chain yields empty Map; emit proceeds. Modal renders without binding card section.

---

### Gap B — AI accept wires schema → catalog

**Where**
- `packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx:253-263` — `<AIPromptModal ... onAccept={() => setAiOpen(false)}>` deliberate no-op. Inline comment: *"Accept handler wiring (catalog ingestion of generated schema) ships in a follow-up arc."*
- `packages/editor/src/editor/design-system/ui/AIPromptModal.tsx:48` — `/** Called when the user confirms the generated schema. */`.

**Pre-fix grep gate** (mandatory before implementation per Section 3 caveat)

```bash
grep -rn "createComponentFromSchema\|createFromSchema\|components.create" \
  packages/editor/src/engine/ | head
```

- If `composer.components.createComponentFromSchema(schema)` exists → write tests against it and ship Gap B with full canvas ingestion.
- If absent → fall back per "Sequence-level escape hatches" below.

**Change (happy path)**

Replace ComponentsPanelV2 onAccept with:

```ts
onAccept={async (schema) => {
  if (!composer) return;
  try {
    await composer.components.createComponentFromSchema(schema);
    setAiOpen(false);
  } catch (e) {
    addToast({
      tone: "error",
      description: e instanceof Error ? e.message : "Component creation failed",
    });
    // modal stays open so user can retry / copy
  }
}}
```

If `onAccept` does not currently receive a schema arg, also extend the prop signature in `AIPromptModal.tsx:48`-area to pass the generated schema through.

**Why** — completes a documented TODO. The comment explicitly cites a "follow-up arc" — this is it.

**Edge cases**
- Generate fails (network / provider error) — `AIPromptModal` already surfaces error state per its existing tests; `onAccept` never fires.
- Schema malformed downstream — try/catch + toast on failure; modal stays open.
- AI provider env var missing in dev (the `VITE_*` AI key in the monorepo-root `.env.local`) — Generate fails before Accept fires; tests use mocked service; live verify documents the exact env var name once the live walkthrough confirms which provider is wired.

---

### Gap C — drag E2E + 4-frame UX

**Where**
- `packages/editor/src/editor/sidebar/tabs/component-library/ComponentRow.tsx:20-54` — has `onDragStart` prop + `draggable={true}`.
- Canvas drop side lives in `packages/editor/src/editor/canvas/hooks/` — exact file identified during pre-fix audit step.

**4-frame contract per prototype s11**

| Frame | Spec | Owner | Risk |
|---|---|---|---|
| 1. Drag ghost | Translucent card preview follows cursor | `ComponentRow.onDragStart` sets `dataTransfer.setDragImage` | Low — likely already shipped |
| 2. Drop target highlight | Canvas zone gets blue dashed border + "Drop here" overlay during drag-over | Canvas `onDragOver` + CSS `[data-buildrick-canvas].is-drag-over` rule | Medium — overlay rule may be missing |
| 3. Insert animation | New element appears with ≤180ms fade-in | Canvas `onDrop` → `composer.elements.elementCRUD.addElement` + animation flag | Medium-high — animation flag plumbing may need engine extension |
| 4. Auto-select after drop | New element becomes `composer.selection.selected` so Inspector mounts | Same `onDrop` dispatches `composer.selection.select(newElement.id)` | Low — standard pattern |

**Pre-fix audit (read-only)**

```bash
grep -rn "onDrop\|dataTransfer\|drag-over\|setDragImage" \
  packages/editor/src/editor/canvas/hooks/ \
  packages/editor/src/editor/sidebar/tabs/component-library/ | head -25
```

Catalogues current drop wiring per frame. Implementation fixes only what's missing.

**Change (per missing frame)**
- Frame 1 missing → `e.dataTransfer.setDragImage(node, 0, 0)` in `ComponentRow.onDragStart`.
- Frame 2 missing → add `data-drag-over` toggle in canvas drop hook + matching CSS rule in `themes/components/`.
- Frame 3 missing → add `animate: true` flag on the `element:created` payload + 180ms fade-in keyframe (reuse existing `bd-history-fade-in` if compatible). Fallback if engine signature is fixed: set `data-just-added` on DOM node + CSS animation triggered by attr + `removeAttribute` after 200ms.
- Frame 4 missing → `composer.selection.select(newElement.id)` in onDrop after insert.

**Why** — prototype s11 4 frames are the design contract. Per `feedback_audit_by_file_presence_unreliable.md` we trust live walkthrough, not file existence.

**Edge cases**
- Drop outside canvas → no insert (existing browser drop semantics).
- Drag while another element is selected → after insert, selection moves to new element (Frame 4).
- Two-finger touchpad drag on macOS → live-verify on macOS only this arc; touch parity is a separate arc.

---

## Tests + verification

### Per-gap unit + integration tests

**Gap A** — `packages/editor/src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx`

| Test | Asserts |
|---|---|
| `handleSaveSelection emits COMPONENT_SAVE_AS_REQUESTED with correct payload` | Mock composer + 1-element selection → click bottom Save → `composer.emit` called with `{selectionIds, extractedBindings: Map}` |
| `handleSaveSelection silent no-op when 0 or 2+ selected` | 0 elements → no emit; 2 elements → no emit |
| `extractedBindings falls back to empty Map when tokenBindingResolver absent` | Composer without `tokenBindingResolver` → emit with empty Map, no throw |

**Gap B** — `packages/editor/src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx` (extend) + `ComponentsPanelV2.test.tsx`

| Test | Asserts |
|---|---|
| `AIPromptModal onAccept receives schema arg` | `service.generateComponentSchema` returns sentinel schema · click Generate · click Accept · `onAccept` called with sentinel schema |
| `AI Accept ingests schema into catalog (happy path)` | Mock components manager · open AI modal · stub service · Generate then Accept · expect manager call with schema · modal closes |
| `AI Accept failure shows error toast` | Mock manager to throw · expect toast `tone: 'error'` · modal stays open |

**Gap C** — `packages/editor/src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx` (create or extend)

| Test | Asserts |
|---|---|
| Frame 1 — onDragStart sets dataTransfer.setDragImage | Spy on `setDragImage` · dispatch dragstart on a ComponentRow · spy called with node + offsets |
| Frame 2 — onDragOver sets `data-drag-over` on canvas | dragover → attr present; dragleave → attr removed |
| Frame 3 — onDrop inserts element with animate flag | Spy on `elementCRUD.addElement` · drop with valid `dataTransfer.getData("application/x-buildrik-component")` → addElement called with `{..., animate: true}` (or equivalent) |
| Frame 4 — onDrop auto-selects new element | After drop, `composer.selection.select` called with new element id |

### Live-verify (per gap, browser at `localhost:5050`)

**Gap A**
1. Apply Cobalt Default · insert button via composer · click button to select.
2. Open Components rail · scroll to bottom · click "+ Save current selection".
3. Expect: same binding-aware modal as right-click (Name + Group + Pre-fill bindings checkbox).
4. Cancel · re-open via right-click `Save as component` · confirm identical surface.

**Gap B**
1. Components rail · `+ AI` · type *"Pricing card with 3 tiers, middle tier highlighted, CTAs bound to color-primary"*.
2. Click Generate · wait for schema render.
3. Click Accept · expect new component appears in "FROM YOURS" + toast confirms.
4. Click the new card · expect bindings reference `color-primary` token.
5. If backend not wired (env var missing) — log explicitly; do not claim Gap B shipped.

**Gap C**
1. Components rail · drag Button card with real pointer (or `$B drag` if browse tool supports).
2. Mid-drag: confirm ghost preview follows cursor (Frame 1).
3. Hover canvas: confirm dashed blue border + "Drop here" overlay (Frame 2).
4. Release: confirm element fades in ≤180ms (Frame 3).
5. Post-release: confirm Inspector shows new element selected (Frame 4).
6. Console clean throughout.

### Cross-arc verification gates (Phase Final)

Before claiming arc closed:

| Gate | Pass criterion |
|---|---|
| Unit tests | `npx vitest run src/editor/components-catalog/ src/editor/design-system/ src/editor/canvas/` returns 0 failures |
| Type check | `npx tsc --noEmit` clean in editor package |
| TDD discipline | Each gap test FAILS before implementation lands, PASSES after — recorded in commit body |
| Live verify | 3 screenshots (one per gap) attached to spec close-out note |
| Console clean | Zero "Maximum update depth", zero unexpected errors during full A → B → C walkthrough |
| Memory | `project_ds_final_closeout_arc_shipped_20260516.md` written + indexed in MEMORY.md |

---

## Rollout

### Commit boundaries

3 atomic commits direct to `main` per `feedback_solo_workflow.md`. Each commit independently revertible.

| # | Commit | Files | Approx LOC |
|---|---|---|---|
| 1 | `fix(ds): route sidebar Save current selection through binding-aware modal (s12)` | `ComponentsPanelV2.tsx` + test | +30 / -15 |
| 2 | `feat(ds): wire AIPromptModal Accept to components catalog ingestion (s08)` | `ComponentsPanelV2.tsx` + `AIPromptModal.test.tsx` + test | +50 / -5 |
| 3 | `feat(ds): drag-from-Components-rail 4-frame UX (s11)` | `useCanvasDrop.ts` + `ComponentRow.tsx` + CSS + tests | +120 / -20 |

### Risks per gap

**Gap A — LOW**
- `tokenBindingResolver.resolveForElements` may be absent on dev composer → optional chain yields empty Map, no throw.
- Bottom button now silently no-ops on multi-select → existing prompt path was also silent (TODO log + return).
- Unit test covers 0 + 2+ selection cases.

**Gap B — MEDIUM**
- *Top risk:* `composer.components.createComponentFromSchema` may not exist as a single call. Pre-fix grep catches this. Fallbacks below.
- Generated schema fails Zod validation downstream → toast + modal stays open.
- AI provider env var missing in dev (the `VITE_*` AI key in monorepo-root `.env.local`) → Generate fails before Accept fires.

**Gap C — HIGHEST**
- *Top risk:* Frame 3 animation flag may need engine API extension. Fallback: `data-just-added` attr-driven CSS animation cleared after 200ms.
- Nested-container drop targets out of scope (only root drop).
- Two-finger touchpad drag generates different events than mouse drag → macOS-only live verify this arc.
- Frame 4 auto-select races with React state propagation → `composer.selection.select` is sync; new element should commit before microtask drain. Wrap in `flushSync` if flaky in tests.

### Cross-arc risks

- **Render-loop reopen** — Gap C touches canvas mount which contains DS provider chain. Any new `useCallback`/`useEffect` must not introduce identity churn post the `useResetAllKinds` fix (`0c1a6b53`). No `react-hooks/exhaustive-deps` disables in new code.
- **Single-tenant assumption** — all 3 fixes assume one composer per editor mount.

### Rollback plan

- Each commit independently revertible via `git revert <sha>`.
- Gap A revert restores `window.prompt` path — visible regression but functional.
- Gap B revert restores Accept no-op — modal still opens; user loses ingestion path; no data corruption.
- Gap C revert restores pre-arc drag behaviour.
- No DB / persistence changes → no data migration on rollback.

### Sequence-level escape hatches

- After Gap A ships + verifies → freeze decision. Unexpected issues → hold B + C, file as separate arcs.
- After Gap B verify, if `createComponentFromSchema` does not exist and the multi-call fallback (chain `createComponent(name, rootElementId)` + walk schema tree) would require engine extension → ship Gap B as "descope to schema-storage-only" (Accept persists schema into the user-saved component definition map without canvas insertion) and file canvas-insert as a follow-up arc; do not block Gap C.
- Gap C is biggest; if Frame 3 (animation) requires engine API change, ship Frames 1+2+4 (visible polish) and defer Frame 3 as polish-only follow-up.

### Memory hygiene (after arc closes)

- Write `project_ds_final_closeout_arc_shipped_20260516.md` — 3 commits, what each unlocked, anything descoped.
- Update MEMORY.md under "Shipped arcs · DS UI tier rollouts".
- If Gap C reveals patterns worth saving (e.g., 4-frame drag pattern as reusable contract for Templates / Media drags), file a separate `feedback_*.md`.

### Out-of-band concerns

- *Dev server* — running on `localhost:5050`; arc uses HMR.
- *Feature flags* — none needed; all 3 surfaces user-visible immediately.
- *Backend deploy* — none. Pure editor-package changes.
- *Public docs* — no public-facing doc updates. CLAUDE.md unchanged.
- *DESIGN.md compliance* — no new colors, fonts, or motion outside the 180ms fade-in (matches existing `bd-history-fade-in` token). Single accent cobalt preserved.

---

## Acceptance criteria for arc close

1. All 3 gaps live-verified in browser via real click-through.
2. Each gap committed separately so any one can be reverted independently.
3. Live editor walkthrough at `localhost:5050` with one screenshot per gap.
4. Memory updated: `project_ds_final_closeout_arc_shipped_20260516.md` collapsing all 3.
5. Unit tests, type check, console-clean gates all pass (see Phase Final table).
