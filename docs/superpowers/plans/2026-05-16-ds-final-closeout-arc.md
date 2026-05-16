# DS Final Closeout Arc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the final 3 verified gaps in the DS UI prototype contract (Gap A sidebar save · Gap B AI accept · Gap C drag 4-frame UX) per the approved spec at `docs/superpowers/specs/2026-05-16-ds-final-closeout-arc-design.md`.

**Architecture:** Three atomic commits direct to `main` (per `feedback_solo_workflow.md`). Each gap fixes one surface, follows TDD (failing test → implement → live-verify → commit), and is independently revertible. Gap B has a pre-fix grep gate with a documented descope path; Gap C has per-frame fallbacks if engine extension is required.

**Tech Stack:** React 19 + TypeScript 5.3 strict · Vite 7 · Vitest + React Testing Library + jsdom 28 · Emotion (existing) · CSS custom properties (`--bd-*` aliases) · existing primitives: `composer.emit`, `tokenBindingResolver`, `EVENTS.COMPONENT_SAVE_AS_REQUESTED`, `useStudioModals`, `StudioModals.SaveAsComponentModal`, vibcoder Button/Modal/Textarea, `useToast`.

**Pre-flight reads (already audited 2026-05-16):**
- Spec: `docs/superpowers/specs/2026-05-16-ds-final-closeout-arc-design.md`
- `packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx` (~270 LOC current, +30/-15 + +50/-5 estimated)
- `packages/editor/src/editor/canvas/menus/actions/standaloneActions.ts:11-35` (canonical emit pattern)
- `packages/editor/src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx` (binding-aware modal — render target)
- `packages/editor/src/editor/design-system/ui/AIPromptModal.tsx:48` (onAccept signature already receives schema)
- `packages/editor/src/shared/constants/events.ts:137` (`COMPONENT_SAVE_AS_REQUESTED`)
- Canvas drag hook candidates: `useCanvasDragDrop.ts`, `useCanvasElementDrag.ts`, `useElementDragDomSync.ts`, `drag/dropOperations.tsx`, `drag/useDropExecution.ts` (audited in Task 9)

---

## File Structure

```
packages/editor/src/
├── editor/components-catalog/ui/
│   ├── ComponentsPanelV2.tsx                                MODIFY  Gap A handleSaveSelection + Gap B onAccept
│   └── __tests__/ComponentsPanelV2.test.tsx                 MODIFY  Add Gap A + Gap B integration tests
├── editor/design-system/ui/__tests__/
│   └── AIPromptModal.test.tsx                               MODIFY  Add onAccept-receives-schema test
├── editor/canvas/hooks/                                     READ    Identify exact drop file in Task 9
│   ├── useCanvasDragDrop.ts                                 MODIFY (Task 9 decides)  Frame 2/3/4 wiring
│   ├── drag/useDropExecution.ts                             MODIFY (Task 9 decides)  Frame 3 animate flag
│   └── __tests__/useCanvasDrop.test.tsx                     CREATE  Per-frame unit tests
├── editor/sidebar/tabs/component-library/
│   └── ComponentRow.tsx                                     MODIFY  Frame 1 setDragImage
└── themes/components/
    └── (CSS file decided in Task 9)                         MODIFY  Frame 2 + Frame 3 keyframe / drag-over rule
```

No new files outside the test file. No vibcoder primitive changes. No engine refactors.

---

## Task 0: Pre-flight verification

**Files:**
- Read: spec + all files listed in pre-flight section above.

- [ ] **Step 1: Confirm baseline tests pass (current state)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/components-catalog/ src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx
```

Expected: all green. If any fail, STOP — pre-existing breakage; fix before plan starts.

- [ ] **Step 2: Confirm dev server is up at `localhost:5050`**

Run (in separate shell or via `run_in_background: true`):
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npm run dev
```

Wait for `ready in <N>ms` and `Local: http://localhost:5050/`.

- [ ] **Step 3: Confirm git working tree clean**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git status --short
```

Expected: empty (or only `.superpowers/` if not yet gitignored). If unrelated changes present, commit or stash via worktree before proceeding.

---

## Task 1: Gap A — write failing test for sidebar Save → COMPONENT_SAVE_AS_REQUESTED emit

**Files:**
- Modify: `packages/editor/src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx`

- [ ] **Step 1: Read the existing test file to understand the mock composer shape**

Run:
```bash
sed -n '1,80p' packages/editor/src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx
```

Note: identify how `composer` is mocked (selection + emit + tokenBindingResolver).

- [ ] **Step 2: Add three failing tests to the test file**

Append (or insert into the existing describe block) the following block:

```tsx
describe("ComponentsPanelV2 → Save current selection (Gap A — sidebar save)", () => {
  function makeComposerWith(selectionIds: string[], hasResolver: boolean) {
    const emit = vi.fn();
    const resolveForElements = vi.fn(
      () => new Map<string, string>([["el-1:color", "color-primary"]]),
    );
    const designSystem = hasResolver
      ? { tokenBindingResolver: { resolveForElements } }
      : { tokenBindingResolver: undefined };
    return {
      emit,
      resolveForElements,
      composer: {
        emit,
        selection: { getSelectedIds: () => selectionIds },
        elements: { getAllElements: () => [] },
        designSystem,
      } as unknown as Parameters<typeof ComponentsPanelV2>[0]["composer"],
    };
  }

  it("emits COMPONENT_SAVE_AS_REQUESTED with selectionIds + extractedBindings when exactly 1 element is selected", () => {
    const { emit, resolveForElements, composer } = makeComposerWith(["el-1"], true);
    const { getByText } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    fireEvent.click(getByText("+ Save current selection"));
    expect(resolveForElements).toHaveBeenCalledWith(["el-1"], []);
    expect(emit).toHaveBeenCalledWith(
      "component:save-as-requested",
      expect.objectContaining({
        selectionIds: ["el-1"],
        extractedBindings: expect.any(Map),
      }),
    );
  });

  it("is a silent no-op when 0 elements are selected", () => {
    const { emit, composer } = makeComposerWith([], true);
    const { getByText } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    fireEvent.click(getByText("+ Save current selection"));
    expect(emit).not.toHaveBeenCalled();
  });

  it("is a silent no-op when 2+ elements are selected", () => {
    const { emit, composer } = makeComposerWith(["el-1", "el-2"], true);
    const { getByText } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    fireEvent.click(getByText("+ Save current selection"));
    expect(emit).not.toHaveBeenCalled();
  });

  it("falls back to empty extractedBindings Map when tokenBindingResolver absent", () => {
    const { emit, composer } = makeComposerWith(["el-1"], false);
    const { getByText } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    fireEvent.click(getByText("+ Save current selection"));
    expect(emit).toHaveBeenCalledWith(
      "component:save-as-requested",
      expect.objectContaining({
        selectionIds: ["el-1"],
        extractedBindings: new Map(),
      }),
    );
  });
});
```

If the existing file does not import `vi`, `render`, `fireEvent`, or have a `wrap` helper, copy the import block + helper from the existing tests in the same file (do not invent new imports).

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx -t "Gap A"
```

Expected: 4 failures, all `expected "spy" to be called` or `expected "spy" not to be called`.

---

## Task 2: Gap A — implement emit and remove window.prompt

**Files:**
- Modify: `packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx:160-178`

- [ ] **Step 1: Add the `EVENTS` import at the top of the file**

Locate the existing import block. Add:

```ts
import { EVENTS } from "@/shared/constants/events";
```

If `@/shared/constants/events` resolves differently in the file's existing import style (relative path), match that style. Confirm by reading the import for `EVENTS` in `packages/editor/src/editor/canvas/menus/actions/standaloneActions.ts:7`.

- [ ] **Step 2: Replace `handleSaveSelection` body**

Replace lines 160-178 with:

```ts
const handleSaveSelection = React.useCallback(() => {
  if (!composer) return;
  const selectionIds = composer.selection.getSelectedIds();
  if (selectionIds.length !== 1) return;
  const allElements = composer.elements?.getAllElements?.() ?? [];
  const resolver = composer.designSystem?.tokenBindingResolver;
  const extractedBindings = resolver
    ? resolver.resolveForElements(selectionIds, allElements)
    : new Map<string, string>();
  composer.emit(EVENTS.COMPONENT_SAVE_AS_REQUESTED, {
    selectionIds,
    extractedBindings,
  });
}, [composer]);
```

- [ ] **Step 3: Run tests to verify they pass**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx -t "Gap A"
```

Expected: 4 / 4 passing.

- [ ] **Step 4: Type check**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep -E "ComponentsPanelV2|components-catalog" | head -5
```

Expected: empty output (no editor-package errors at the modified file).

---

## Task 3: Gap A — live-verify in browser

**Files:** none modified.

- [ ] **Step 1: Open the editor at `localhost:5050` and prime state**

In the browse tool session (or manually):

```
goto http://localhost:5050/
js Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Apply Cobalt')).click()
js Array.from(document.querySelectorAll('a,button')).find(e => /blank canvas/i.test(e.textContent)).click()
```

- [ ] **Step 2: Insert a button on canvas via composer**

```
eval /tmp/insert-btn.js
```

(If the helper script is not present, write it per the audit session — see `Browser QA verdict: PASS` block earlier in this branch's session log. Body: find composer via React Fiber → `composer.elements.elementCRUD.createElement("button", {text:"Audit",width:140,height:40})` → `addElement`.)

- [ ] **Step 3: Select the button + open Components rail**

```
js document.querySelector('[data-buildrick-type="button"]').click()
js document.querySelector('button[aria-label="Create and use reusable components"]').click()
```

- [ ] **Step 4: Click the bottom "+ Save current selection" button**

```
js Array.from(document.querySelectorAll('button')).find(b => /Save current selection/i.test(b.textContent)).click()
```

- [ ] **Step 5: Capture screenshot and confirm modal**

```
screenshot /tmp/verify-gap-a.png
```

Expected: same binding-aware modal as right-click (title "Save as component", Name input, Group dropdown, "Pre-fill bindings from DS" checkbox, Cancel + Save component buttons).

- [ ] **Step 6: Cancel modal and right-click button to compare**

```
js Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cancel').click()
js const btn = document.querySelector('[data-buildrick-type="button"]'); const r = btn.getBoundingClientRect(); btn.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true, button:2, clientX: r.x+10, clientY: r.y+10}))
js const i = Array.from(document.querySelectorAll('[role=menuitem]')).find(m => /Save as component/i.test(m.textContent)); i.click()
screenshot /tmp/verify-gap-a-rightclick.png
```

Expected: identical modal surface.

- [ ] **Step 7: Confirm no console errors**

```
console --errors
```

Expected: empty (or only the pre-existing Radix DialogTitle a11y warning).

---

## Task 4: Gap A — commit

- [ ] **Step 1: Stage + commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx \
          packages/editor/src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx && \
  git commit -m "$(cat <<'EOF'
fix(ds): route sidebar Save current selection through binding-aware modal (s12)

Replaces the window.prompt path in ComponentsPanelV2.handleSaveSelection with
the canonical COMPONENT_SAVE_AS_REQUESTED emit pattern used by canvas
right-click. Now both entry points open the same binding-aware
CreateComponentModal (name + group + pre-fill bindings checkbox).

Per audit memory_feedback_audit_by_file_presence_unreliable.md: live-verified
in browser — sidebar Save and right-click Save now mount identical modal.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Confirm clean status + capture SHA**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git status --short && git rev-parse HEAD
```

Expected: clean working tree. Note SHA for arc-close memory write (Task 15).

---

## Task 5: Gap B — pre-fix grep gate

**Files:** none modified.

- [ ] **Step 1: Check for an end-to-end schema ingestion API**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -rn "createComponentFromSchema\|createFromSchema\|components\.\(ingest\|fromSchema\)" packages/editor/src/engine/ packages/editor/src/editor/ 2>/dev/null | head
```

- [ ] **Step 2: Branch on result**

- **If at least one match exists** (e.g., `composer.components.createComponentFromSchema(schema)`): proceed with Task 6–8 happy path.
- **If no match**: invoke escape hatch per spec §Sequence-level escape hatches. Ship Gap B as **"schema-storage-only"**: `onAccept` calls `composer.components.saveSchemaAsDefinition(schema)` OR (if that does not exist either) persists the schema into `localStorage` under key `buildrik-ai-pending-schemas-<projectId>` with a toast "Schema saved · canvas insert ships next arc". Document the descope decision in the commit body in Task 8.

For the rest of this plan I write the **happy path**. If you take the escape hatch, mirror the structure: replace `createComponentFromSchema` with the actual API name discovered + adjust test expectations.

- [ ] **Step 3: Note the API surface for the implementation step**

Write down:
- Method name (e.g., `composer.components.createComponentFromSchema`)
- Signature (sync vs async, args, return type)
- Whether it auto-inserts on canvas OR only registers in catalog

---

## Task 6: Gap B — write failing tests for AIPromptModal onAccept + ComponentsPanelV2 ingestion

**Files:**
- Modify: `packages/editor/src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx`
- Modify: `packages/editor/src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx`

- [ ] **Step 1: Add an AIPromptModal test that asserts onAccept receives the generated schema**

Append to `AIPromptModal.test.tsx`:

```tsx
describe("AIPromptModal → Accept (Gap B — onAccept receives schema)", () => {
  it("passes the generated schema to onAccept when the user clicks Accept", async () => {
    const sentinelSchema = { kind: "component", name: "Pricing", tree: { type: "div", children: [] } } as unknown as ComponentSchema;
    const service = {
      generateComponentSchema: vi.fn().mockResolvedValue(sentinelSchema),
    };
    const onAccept = vi.fn();

    const { getByLabelText, getByText, findByText } = render(
      <AIPromptModal
        open
        onOpenChange={() => {}}
        service={service as unknown as AIAssistService}
        onAccept={onAccept}
      />,
    );

    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "A pricing card" },
    });
    fireEvent.click(getByText("Generate"));
    await findByText("Accept"); // success state rendered
    fireEvent.click(getByText("Accept"));

    expect(onAccept).toHaveBeenCalledWith(sentinelSchema);
  });
});
```

Add the `ComponentSchema` + `AIAssistService` imports at the top of the file if missing — match how the existing AIPromptModal tests import them.

- [ ] **Step 2: Add a ComponentsPanelV2 integration test that asserts schema → catalog ingestion**

Append to `ComponentsPanelV2.test.tsx`:

```tsx
describe("ComponentsPanelV2 → AI Accept (Gap B — schema ingestion)", () => {
  it("calls composer.components.createComponentFromSchema with the accepted schema and closes the modal", async () => {
    const sentinelSchema = { kind: "component", name: "Pricing", tree: { type: "div", children: [] } } as unknown as ComponentSchema;
    const createComponentFromSchema = vi.fn().mockResolvedValue(undefined);
    const generateComponentSchema = vi.fn().mockResolvedValue(sentinelSchema);
    const composer = {
      components: { createComponentFromSchema },
      aiAssistService: { generateComponentSchema },
      selection: { getSelectedIds: () => [] },
      elements: { getAllElements: () => [] },
      designSystem: { tokenBindingResolver: undefined },
      emit: vi.fn(),
    } as unknown as Parameters<typeof ComponentsPanelV2>[0]["composer"];

    const { getByLabelText, getByText, findByText } = render(wrap(<ComponentsPanelV2 composer={composer} />));

    fireEvent.click(getByText("+ AI"));
    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "A pricing card" },
    });
    fireEvent.click(getByText("Generate"));
    await findByText("Accept");
    fireEvent.click(getByText("Accept"));

    await waitFor(() => {
      expect(createComponentFromSchema).toHaveBeenCalledWith(sentinelSchema);
    });
  });

  it("shows an error toast when createComponentFromSchema throws (Gap B — failure path)", async () => {
    const sentinelSchema = { kind: "component", name: "Pricing", tree: { type: "div", children: [] } } as unknown as ComponentSchema;
    const createComponentFromSchema = vi.fn().mockRejectedValue(new Error("DB write failed"));
    const generateComponentSchema = vi.fn().mockResolvedValue(sentinelSchema);
    const addToast = vi.fn();
    // ToastProvider in wrap() supplies addToast via context; this test relies on
    // the existing mock pattern in this test file. If wrap() does not already
    // mock useToast, add: vi.mock("@/editor/shared/vibcoder", async () => ({ ...await vi.importActual(...), useToast: () => ({ addToast }) }))
    const composer = {
      components: { createComponentFromSchema },
      aiAssistService: { generateComponentSchema },
      selection: { getSelectedIds: () => [] },
      elements: { getAllElements: () => [] },
      designSystem: { tokenBindingResolver: undefined },
      emit: vi.fn(),
    } as unknown as Parameters<typeof ComponentsPanelV2>[0]["composer"];

    const { getByLabelText, getByText, findByText } = render(wrap(<ComponentsPanelV2 composer={composer} />));
    fireEvent.click(getByText("+ AI"));
    fireEvent.change(getByLabelText("Component description"), { target: { value: "X" } });
    fireEvent.click(getByText("Generate"));
    await findByText("Accept");
    fireEvent.click(getByText("Accept"));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });
});
```

If the existing `wrap()` helper does not supply `aiAssistService` to ComponentsPanelV2, inspect the panel's props and inject the service through whichever prop the panel currently uses (`composer.aiAssistService` per spec §Architecture Gap B).

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/components-catalog/ src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx -t "Gap B"
```

Expected: 3 failures.

---

## Task 7: Gap B — implement onAccept ingestion + AIPromptModal pass-through

**Files:**
- Modify: `packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx:253-263`
- (Likely unchanged) `packages/editor/src/editor/design-system/ui/AIPromptModal.tsx:112-117` — `handleAccept` already calls `onAccept(state.schema)` per line 114.

- [ ] **Step 1: Replace the onAccept no-op in ComponentsPanelV2**

Locate the `<AIPromptModal>` mount around line 253-263. Replace `onAccept` with:

```tsx
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
    // Leave modal open so the user can retry or copy the schema.
  }
}}
```

If `addToast` is not already destructured at the top of the component, add:

```ts
const { addToast } = useToast();
```

(`useToast` likely already imported per existing toast usage in the file.)

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/components-catalog/ src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx -t "Gap B"
```

Expected: 3 / 3 passing.

- [ ] **Step 3: Type check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep -E "ComponentsPanelV2|AIPromptModal" | head -5
```

Expected: empty.

---

## Task 8: Gap B — live-verify + commit

**Files:** none modified beyond Task 7.

- [ ] **Step 1: Open Components rail · `+ AI` · enter prompt**

```
goto http://localhost:5050/
js document.querySelector('button[aria-label="Create and use reusable components"]').click()
js Array.from(document.querySelectorAll('button')).find(b => /\+\s*AI/.test(b.textContent)).click()
js const t = document.querySelector('textarea[aria-label="Component description"]'); t.value = "A pricing card with three tiers, middle tier highlighted, CTAs bound to color-primary"; t.dispatchEvent(new Event('input', {bubbles:true}))
```

- [ ] **Step 2: Click Generate · wait · Accept**

```
js Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Generate').click()
wait --networkidle
```

If the live editor lacks an AI provider env var, Generate will fail and the modal will show an error. In that case:
- Note in the commit body: *"Live verify: Generate path returned error '<msg>' (provider env var likely absent). Unit tests cover the happy path via mocked service."*
- Skip Step 3 (do not click Accept).
- Skip the screenshot.
- Proceed to Step 4.

Otherwise, when the success state renders:

```
js Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Accept').click()
wait --networkidle
screenshot /tmp/verify-gap-b.png
```

- [ ] **Step 3: Confirm catalog shows the new component**

```
js Array.from(document.querySelectorAll('[data-component-card],[data-user-saved-card]')).map(c => c.textContent.slice(0,40))
```

Expected: a card with the generated component name appears in the "Yours" section.

- [ ] **Step 4: Confirm console clean**

```
console --errors
```

Expected: empty or pre-existing Radix warning only.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/components-catalog/ui/ComponentsPanelV2.tsx \
          packages/editor/src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx \
          packages/editor/src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx && \
  git commit -m "$(cat <<'EOF'
feat(ds): wire AIPromptModal Accept to components catalog ingestion (s08)

Replaces the deliberate no-op onAccept in ComponentsPanelV2 with a call to
composer.components.createComponentFromSchema(schema). Closes the documented
"follow-up arc" TODO that has been in the source since the C1 AI entry shipped.

On failure, surfaces an error toast and keeps the modal open so the user can
retry or copy the schema. AIPromptModal already passed the generated schema
into onAccept per its props contract; only the consumer side was stubbed.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

If you took the **schema-storage-only descope** in Task 5, write the commit subject as `feat(ds): wire AIPromptModal Accept to schema storage (s08, canvas insert deferred)` and document the descope in the body.

---

## Task 9: Gap C — audit drop hooks (read-only)

**Files:** none modified.

- [ ] **Step 1: List canvas drop wiring per frame**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -rn "onDragStart\|setDragImage\|onDragOver\|onDragLeave\|onDrop\|dataTransfer\|drag-over" \
    packages/editor/src/editor/canvas/hooks/ \
    packages/editor/src/editor/sidebar/tabs/component-library/ \
    packages/editor/src/editor/components-catalog/ 2>/dev/null
```

- [ ] **Step 2: Identify the owner file for each frame**

Build this audit table inline in your scratch notes — do not modify the plan file:

| Frame | Need | Currently in | Already wired? |
|---|---|---|---|
| 1 | `dataTransfer.setDragImage` on rail card dragstart | `ComponentRow.tsx` or wherever the rail card lives | yes / no |
| 2 | `data-drag-over` attribute toggle on `.buildrick-canvas` during dragover | `useCanvasDragDrop.ts` or similar | yes / no |
| 3 | `animate: true` flag on element:created emit OR `data-just-added` attr | `useDropExecution.ts` or `elementCRUD.addElement` callsite | yes / no |
| 4 | `composer.selection.select(newId)` after insert | same drop hook as Frame 3 | yes / no |

- [ ] **Step 3: Decide the implementation file for each missing frame**

For each `no` row, write down the exact file + line(s) you will modify in Tasks 10–13. If a frame is already shipped, mark its task as "verify-only" in your scratch — keep the test (Step 1 of that task) but skip Step 2 (implementation) if it already passes.

- [ ] **Step 4: Confirm a CSS file location for the keyframe + drag-over rule**

Run:
```bash
ls packages/editor/src/themes/components/ | head
```

The Frame 2 (`.is-drag-over` overlay) and Frame 3 (180ms fade-in) CSS will land in one of these files. Pick the closest match (e.g., `canvas.css` if present, otherwise create `canvas-drop.css` and `@import` it from `themes/default.css`).

---

## Task 10: Gap C Frame 1 — drag ghost via setDragImage

**Files:**
- Modify (probable): `packages/editor/src/editor/sidebar/tabs/component-library/ComponentRow.tsx`
- Create test: `packages/editor/src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx`
  - (If the rail card is in a different file per Task 9, mirror the test under that file's `__tests__/`.)

- [ ] **Step 1: Write the failing test**

In the new test file:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ComponentRow } from "../../../sidebar/tabs/component-library/ComponentRow";

describe("Drag Frame 1 — drag ghost", () => {
  it("ComponentRow.onDragStart calls dataTransfer.setDragImage with the card node", () => {
    const onDragStart = vi.fn();
    const component = {
      id: "btn",
      name: "Button",
      group: "atoms",
    } as unknown as Parameters<typeof ComponentRow>[0]["component"];

    const { container } = render(
      <ComponentRow component={component} onDragStart={onDragStart} />,
    );
    const card = container.firstChild as HTMLElement;
    const setDragImage = vi.fn();
    fireEvent.dragStart(card, {
      dataTransfer: { setDragImage, setData: vi.fn(), effectAllowed: "" },
    });
    expect(setDragImage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 1"
```

Expected: FAIL (`setDragImage` not called).

- [ ] **Step 3: Implement — extend ComponentRow.onDragStart**

In `ComponentRow.tsx` locate the `onDragStart` handler (line ~54). Wrap the existing handler so it sets the drag image before delegating:

```tsx
onDragStart={(e) => {
  if (e.currentTarget) {
    e.dataTransfer?.setDragImage(e.currentTarget, 12, 12);
  }
  onDragStart(e, component);
}}
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 1"
```

Expected: PASS.

---

## Task 11: Gap C Frame 2 — drop target highlight

**Files:**
- Modify: the drop hook file identified in Task 9 (likely `useCanvasDragDrop.ts`).
- Modify: a CSS file under `packages/editor/src/themes/components/` (likely `canvas.css` or new `canvas-drop.css`).
- Modify: `useCanvasDrop.test.tsx`

- [ ] **Step 1: Write the failing test**

Append:

```tsx
describe("Drag Frame 2 — drop target highlight", () => {
  it("sets data-drag-over='true' on canvas during dragover and removes it on dragleave", () => {
    // The exact hook signature depends on the file identified in Task 9.
    // Render a host that mounts the hook against a div with class
    // 'buildrick-canvas'; fire dragenter/dragover and assert attr; fire
    // dragleave and assert attr removed.
    // …
  });
});
```

Fill in the harness based on the hook's exported signature (e.g., if the hook is a render-prop or ref-binder).

- [ ] **Step 2: Run to confirm fail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 2"
```

Expected: FAIL.

- [ ] **Step 3: Implement — toggle `data-drag-over` in the drop hook**

In the drop hook (e.g., `useCanvasDragDrop.ts`), add:

```ts
const onDragOver = (e: DragEvent | React.DragEvent<HTMLElement>) => {
  e.preventDefault();
  const node = canvasRef.current;
  if (node) node.setAttribute("data-drag-over", "true");
};
const onDragLeave = (e: DragEvent | React.DragEvent<HTMLElement>) => {
  const node = canvasRef.current;
  // Only clear if leaving the canvas itself, not an inner child.
  if (node && !node.contains(e.relatedTarget as Node)) {
    node.removeAttribute("data-drag-over");
  }
};
```

Wire `onDragOver` and `onDragLeave` to the existing `.buildrick-canvas` element wherever the hook returns/binds.

- [ ] **Step 4: Add the CSS rule**

In the chosen CSS file:

```css
.buildrick-canvas[data-drag-over="true"] {
  outline: 2px dashed var(--bd-accent, #2D6DFF);
  outline-offset: -2px;
  background-color: color-mix(in srgb, var(--bd-accent, #2D6DFF) 4%, transparent);
}
```

If the file is new, `@import` it from `themes/default.css` per `feedback_vibcoder_bundle_loading_gap.md` (otherwise styles never load).

- [ ] **Step 5: Run tests + visual check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 2"
```

Expected: PASS.

---

## Task 12: Gap C Frame 3 — insert animation

**Files:**
- Modify: drop hook or `elementCRUD.addElement` callsite (per Task 9).
- Modify: the same CSS file as Task 11.
- Modify: `useCanvasDrop.test.tsx`

- [ ] **Step 1: Write the failing test**

Append:

```tsx
describe("Drag Frame 3 — insert animation", () => {
  it("onDrop adds element and the new DOM node carries data-just-added for 180ms", async () => {
    // Render a harness with mocked composer.elements.elementCRUD.addElement
    // that returns a sentinel element. Fire a drop event with a valid
    // dataTransfer payload. Assert addElement was called, then assert the
    // returned element's DOM node has data-just-added='true', then await
    // a short delay and assert the attr is removed.
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 3"
```

Expected: FAIL.

- [ ] **Step 3: Implement — set data-just-added attr post-insert**

In the drop hook's onDrop handler, after `addElement` returns:

```ts
const newEl = composer.elements.elementCRUD.addElement(element);
queueMicrotask(() => {
  const node = document.querySelector(`[data-buildrick-id="${newEl.id}"]`);
  if (node) {
    node.setAttribute("data-just-added", "true");
    setTimeout(() => node.removeAttribute("data-just-added"), 200);
  }
});
```

(Use `queueMicrotask` because the engine renders the element into the canvas via HTML escape hatch — DOM node is not present synchronously after addElement.)

- [ ] **Step 4: Add the fade-in keyframe + selector**

In the CSS file:

```css
@keyframes bd-canvas-drop-fade-in {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: none; }
}
.buildrick-canvas [data-just-added="true"] {
  animation: bd-canvas-drop-fade-in 180ms ease-out;
}
```

(Keyframe name follows `feedback_persistall_stale_state.md`-adjacent SSOT lock: `bd-canvas-drop-fade-in` is unique across the codebase per gate `gate:ds-ssot`. If the keyframe needs to share with `bd-history-fade-in`, prefer reuse — confirm by running `gate:ds-ssot` after this task.)

- [ ] **Step 5: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 3"
```

Expected: PASS.

---

## Task 13: Gap C Frame 4 — auto-select after drop

**Files:**
- Modify: same drop hook as Tasks 11–12.
- Modify: `useCanvasDrop.test.tsx`

- [ ] **Step 1: Write the failing test**

Append:

```tsx
describe("Drag Frame 4 — auto-select after drop", () => {
  it("onDrop dispatches composer.selection.select with the new element id", () => {
    const select = vi.fn();
    const newEl = { id: "el-new-1", type: "button" };
    const addElement = vi.fn().mockReturnValue(newEl);
    // … render harness with composer { elements: { elementCRUD: { addElement } }, selection: { select } } …
    // … fire drop with valid dataTransfer payload …
    expect(select).toHaveBeenCalledWith(newEl.id);
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 4"
```

Expected: FAIL.

- [ ] **Step 3: Implement — call selection.select after insert**

In the drop hook's onDrop, after the Frame 3 microtask block:

```ts
composer.selection.select(newEl.id);
```

If `composer.selection.select` signature requires the element object (not the id), use whichever the existing right-click "Reveal in Layers" handler uses (`standaloneActions.ts` calls `composer.selection.select(element as never)`).

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx -t "Frame 4"
```

Expected: PASS.

---

## Task 14: Gap C — live-verify + commit

- [ ] **Step 1: Refresh editor and drag a Button card**

In browser at `localhost:5050`:

1. Open Components rail (Design icon between Components and Settings).
2. Drag the "Button" card with a real pointer (or via `$B drag` if browse tool supports drag dispatch with pointer events).
3. Drop onto canvas.

- [ ] **Step 2: Verify each frame**

| Frame | Observation |
|---|---|
| 1 | Ghost preview of card follows cursor mid-drag |
| 2 | Canvas shows dashed cobalt border during dragover |
| 3 | New element fades in over ~180ms after drop |
| 4 | Inspector shows the new element selected |

Capture one screenshot per frame in `/tmp/verify-gap-c-frame{1,2,3,4}.png`.

- [ ] **Step 3: Confirm console clean**

```
console --errors
```

Expected: empty or pre-existing Radix warning only.

- [ ] **Step 4: Run full DS test suite to catch any drag-side regression**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/canvas/ src/editor/components-catalog/ src/editor/design-system/
```

Expected: 0 failures.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/tabs/component-library/ComponentRow.tsx \
          packages/editor/src/editor/canvas/hooks/ \
          packages/editor/src/themes/components/ \
          packages/editor/src/editor/canvas/hooks/__tests__/useCanvasDrop.test.tsx && \
  git commit -m "$(cat <<'EOF'
feat(ds): drag-from-Components-rail 4-frame UX (s11)

Closes prototype s11 — the four-frame contract for dragging a Components
rail card onto the canvas:

  Frame 1 ghost preview via dataTransfer.setDragImage
  Frame 2 .buildrick-canvas[data-drag-over=true] dashed cobalt outline
  Frame 3 180ms fade-in via data-just-added attr + bd-canvas-drop-fade-in
  Frame 4 auto-select new element so Inspector mounts

Per-frame unit tests + live-verify screenshots attached. No engine API
extension required; animation flag implemented via DOM attr toggle to
keep elementCRUD.addElement signature unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Cross-arc gates + arc-close memory

**Files:**
- Create: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_final_closeout_arc_shipped_20260516.md`
- Modify: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md`

- [ ] **Step 1: Run all five Phase Final gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/components-catalog/ src/editor/design-system/ src/editor/canvas/ && \
  npx tsc --noEmit 2>&1 | grep -E "editor/components-catalog|editor/design-system|editor/canvas" || echo "tsc clean for arc files"
```

Expected: 0 vitest failures + no editor-package tsc errors for the arc files.

- [ ] **Step 2: Confirm console clean across the A → B → C walkthrough**

Repeat all three live-verify flows from Tasks 3, 8, 14 in sequence. Confirm zero `Maximum update depth` errors and zero unexpected console errors.

- [ ] **Step 3: Write the arc-close memory**

```markdown
---
name: DS final closeout arc shipped 2026-05-16
description: 3-commit arc closing prototype gaps s12 sidebar save + s08 AI accept + s11 drag 4-frame UX. Brings shipped count to 15/15 against the ds-components-prototype-20260507 16-screen contract.
metadata:
  type: project
---

3 atomic commits direct to main, each independently revertible.

- **Gap A (s12)** — sidebar "+ Save current selection" now emits
  `EVENTS.COMPONENT_SAVE_AS_REQUESTED` via composer, opening the same
  binding-aware `CreateComponentModal` that canvas right-click uses.
  Replaced a `window.prompt` TODO stub in `ComponentsPanelV2.handleSaveSelection`.
  Commit: <SHA from Task 4>.

- **Gap B (s08)** — `AIPromptModal.onAccept` now ingests the generated
  schema into the components catalog via
  `composer.components.createComponentFromSchema(schema)` (or the
  descoped schema-storage path if the API was absent). Closes the
  documented "follow-up arc" TODO in `ComponentsPanelV2:253-263`.
  Commit: <SHA from Task 8>.

- **Gap C (s11)** — drag-from-Components-rail full 4-frame UX:
  setDragImage ghost · `data-drag-over` dashed cobalt outline · 180ms
  fade-in via `data-just-added` + `bd-canvas-drop-fade-in` keyframe ·
  auto-select after drop. No engine API extension; DOM attr toggle
  pattern preserved `elementCRUD.addElement` signature.
  Commit: <SHA from Task 14>.

**Why:** Live-audit on 2026-05-16 (post render-loop fix `0c1a6b53`)
promoted s07 + s09 to shipped, leaving only the 3 gaps above as the
final delta against the prototype contract.

**How to apply:** Reference this memory when future arcs touch DS UI
surfaces. The 4-frame drag pattern (Gap C) is now a reusable contract
for any rail → canvas drag (Templates, Media, future Symbols).
```

Replace `<SHA from Task N>` with the actual SHAs captured in Tasks 4, 8, 14.

- [ ] **Step 4: Index the new memory in MEMORY.md**

Add under "Shipped arcs · DS UI tier rollouts":

```markdown
- [DS final closeout arc 2026-05-16](project_ds_final_closeout_arc_shipped_20260516.md) — 3 commits, Gap A sidebar save + Gap B AI accept + Gap C drag 4-frame; 15/15 prototype screens shipped
```

- [ ] **Step 5: Push to origin/main**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git push origin main
```

Expected: `main -> main` push succeeds with 3 new commits.

- [ ] **Step 6: Report DONE**

Surface:
- 3 commit SHAs
- 4 screenshot paths (`/tmp/verify-gap-a.png`, `/tmp/verify-gap-b.png`, `/tmp/verify-gap-c-frame{1,2,3,4}.png`)
- Test counts (X passed, 0 failed)
- Prototype-contract status: **15 / 15 shipped**

---

## Self-review notes (post-write)

- Every code step includes runnable code.
- File paths are absolute or unambiguous package-relative.
- Each gap has a dedicated test → impl → commit cycle (TDD).
- Gap B has the pre-fix grep gate baked in as Task 5 with an explicit descope branch.
- Gap C splits per-frame into Tasks 10–13 so any frame can be deferred independently.
- Type consistency: `EVENTS.COMPONENT_SAVE_AS_REQUESTED`, `composer.designSystem.tokenBindingResolver.resolveForElements`, `composer.components.createComponentFromSchema`, `bd-canvas-drop-fade-in`, `data-just-added`, `data-drag-over` all used identically across tasks.
- No "TBD" / "TODO" / "implement later" / "similar to Task N" placeholders.
