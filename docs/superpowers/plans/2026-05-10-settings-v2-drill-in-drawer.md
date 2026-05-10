# Settings v2 Drill-in Drawer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert SettingsTab from peer-layout (140px snav + 1fr pane, side-by-side) to drill-in drawer (root snav stacks under section view; 180ms slide animation; codex-revised Escape contract; ConfirmDialog replaces SettingsNavGuard) per `docs/designs/settings-v2.md` §3, §5-§7, D1-D20.

**Architecture:** Dual-mount stack (`bd-set-stack` holds `bd-set-screen--root` + `bd-set-screen--section` simultaneously). `usePanelNavigation` keeps `currentScreen`; new local state `isRoot` / `sectionMounted` / `transitioning` / `guardOpen` drives visual + lifecycle. Section uses existing `DrillInHeader` primitive (extended with `focusTarget` + `enableDocumentEscape` opt-out). SettingsTab owns Escape (knows `guardOpen` / `isRoot` / `transitioning` / `screenIsDirty`); DrillInHeader's document Escape opted out via prop. ConfirmDialog gets explicit `onEscapeKeyDown` cast so dismiss does not propagate to SettingsTab handler. Reduced-motion path skips animation + input lock entirely (instant transition).

**Tech Stack:** React 19 (per `packages/editor/package.json:46`) · TypeScript 5.3 strict · Vite 7 · Vitest + React Testing Library + jsdom 28 · Emotion (existing styles untouched) · CSS custom properties (`--bd-*` tokens via `themes/design-system/bd-aliases.css`) · existing primitives `usePanelNavigation` (`shared/usePanelNavigation.ts`), `DrillInHeader` (`shared/DrillInHeader.tsx`), `ConfirmDialog` (`shared/extensions/ConfirmDialog.tsx`), `TabFrame` (`shared/extensions/TabFrame.tsx`), `useReducedMotion` (`shared/hooks/useReducedMotion.ts`). Note: `inert` is a native boolean prop in React 19 — no cast needed (codex pass 2 fix).

**Spec reference:** `docs/designs/settings-v2.md` (locked 2026-05-08, codex-revised 2026-05-09; 8 codex findings resolved across passes 1-5).

**Pre-flight reads (already audited 2026-05-10):**
- `packages/editor/src/editor/sidebar/shared/DrillInHeader.tsx` (182 LOC, current backwards-compat surface)
- `packages/editor/src/shared/extensions/ConfirmDialog.tsx` (91 LOC, no `onEscapeKeyDown` today)
- `packages/editor/src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:153-161` (only existing DrillInHeader consumer; defaults must not break)
- `packages/editor/src/editor/sidebar/shared/usePanelNavigation.ts` (170 LOC, `navigateTo` accepts only valid screen IDs — no synthetic root; v2 uses `isRoot` local state instead)
- `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx` (545 LOC current, +80/-100 estimated)
- `packages/editor/src/editor/sidebar/tabs/settings/shared.tsx:230-276` (`SettingsNavGuard` — to delete)
- `packages/editor/src/editor/sidebar/tabs/settings/settings.css` (494 LOC; lines 7-15 root grid, 148-161 pane, 460-494 guard modal)
- `packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx` (242 LOC, 14 tests; mocks `useSettingsScreen` to dodge infinite-render loop — preserve mock)
- `packages/editor/src/shared/hooks/useReducedMotion.ts` (returns `boolean`; jsdom-safe via `matchMedia` guard)

---

## File Structure

```
packages/editor/src/
├── editor/sidebar/shared/
│   └── DrillInHeader.tsx                  MODIFY  Add focusTarget + enableDocumentEscape props (back-compat)
├── shared/extensions/
│   └── ConfirmDialog.tsx                  MODIFY  Add onEscapeKeyDown prop-object cast
├── editor/sidebar/tabs/settings/
│   ├── SettingsTab.tsx                    MODIFY  Drill-in stack layout, state machine, ConfirmDialog swap
│   ├── settings.css                       MODIFY  Drop bd-set-root grid + bd-set-pane + bd-set-guard-*; add bd-set-stack + bd-set-screen* + animation
│   ├── shared.tsx                         MODIFY  Delete SettingsNavGuard component + export
│   └── __tests__/
│       └── SettingsTab.test.tsx           REWRITE Stack-layout assertions + Escape + ConfirmDialog
└── editor/sidebar/shared/__tests__/
    └── DrillInHeader.test.tsx             CREATE  Cover focusTarget + enableDocumentEscape opt-out (back-compat)
```

No new files at `shared/extensions/`. No vibcoder primitive changes (ModalContent prop-widening is OUT of scope per design §7).

---

## Task 0: Pre-flight verification

**Files:**
- Read: all files in pre-flight section above.
- Read: `docs/designs/settings-v2.md` §3 (Layout transition), §6 (Animation spec), §7 (Component contract), §13 (Resolved questions).

- [ ] **Step 1: Confirm baseline tests pass (current state)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx
```

Expected: 14 / 14 passing. If any fail, STOP — pre-existing breakage; fix before plan starts. Re-run after fix.

- [ ] **Step 2: Confirm DrillInHeader has zero `focusTarget` + `enableDocumentEscape` references in repo**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -rE "focusTarget|enableDocumentEscape" packages/editor/src/ 2>/dev/null
```

Expected: empty output. Confirms zero existing usage of new props (Task 1 will introduce both).

- [ ] **Step 3: Confirm `SettingsNavGuard` callers are limited to `SettingsTab.tsx`**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -rn "SettingsNavGuard" packages/editor/src/
```

Expected: 4 lines — `shared.tsx` (definition + export at 245 + JSDoc 21 + 236) and `SettingsTab.tsx` (import 37 + render 525). If extra consumers appear, add to migration scope.

- [ ] **Step 4: Confirm `useReducedMotion` available + test-safe**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -n "matchMedia\|useReducedMotion" packages/editor/src/shared/hooks/useReducedMotion.ts | head
```

Expected: hook exports `useReducedMotion(): boolean`; uses `window.matchMedia` with jsdom guard (returns `false` when `matchMedia` undefined). No additional mock needed in tests.

---

## Task 1: DrillInHeader — add `focusTarget` + `enableDocumentEscape` props (back-compat)

**Files:**
- Modify: `packages/editor/src/editor/sidebar/shared/DrillInHeader.tsx`
- Create: `packages/editor/src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx`

Per design §7 "DrillInHeader extensions". Two new optional props; defaults preserve existing behavior so `ComponentDetailScreen.tsx:156` keeps working.

- [ ] **Step 1: Write failing test for default `focusTarget="back"` behavior**

Create `packages/editor/src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx`:

```tsx
/**
 * DrillInHeader tests — covers focusTarget + enableDocumentEscape props
 * added for settings v2 (codex pass 3 resolution).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { DrillInHeader } from "../DrillInHeader";

afterEach(cleanup);

describe("DrillInHeader — focusTarget", () => {
  it("defaults to focusing the back button (back-compat)", async () => {
    render(
      <DrillInHeader title="General" parentName="Settings" onBack={vi.fn()} />,
    );
    // Effect uses setTimeout(50). Wait for it.
    await new Promise((r) => setTimeout(r, 80));
    const backBtn = screen.getByRole("button", { name: /back to settings/i });
    expect(document.activeElement).toBe(backBtn);
  });

  it("focuses the breadcrumb-current span when focusTarget='breadcrumb-current'", async () => {
    render(
      <DrillInHeader
        title="General"
        parentName="Settings"
        breadcrumb={["Site", "General"]}
        focusTarget="breadcrumb-current"
        onBack={vi.fn()}
      />,
    );
    await new Promise((r) => setTimeout(r, 80));
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("General");
    expect(heading.getAttribute("aria-label")).toBe("General, Site");
    expect(document.activeElement).toBe(heading);
  });

  it("re-focuses breadcrumb-current span when title changes (section→section nav)", async () => {
    // Codex pass-2 P1 (new): navigateBetweenSections keeps DrillInHeader
    // mounted; only `title` + `breadcrumb` props change. Effect deps
    // include `title` so focus refires.
    const { rerender } = render(
      <DrillInHeader
        title="General"
        parentName="Settings"
        breadcrumb={["Site", "General"]}
        focusTarget="breadcrumb-current"
        onBack={vi.fn()}
      />,
    );
    await new Promise((r) => setTimeout(r, 80));
    expect(document.activeElement?.textContent).toBe("General");
    // Move focus elsewhere to prove refocus is the test, not initial mount.
    (document.activeElement as HTMLElement | null)?.blur?.();
    rerender(
      <DrillInHeader
        title="SEO"
        parentName="Settings"
        breadcrumb={["Site", "SEO"]}
        focusTarget="breadcrumb-current"
        onBack={vi.fn()}
      />,
    );
    await new Promise((r) => setTimeout(r, 80));
    expect(document.activeElement?.textContent).toBe("SEO");
  });
});

describe("DrillInHeader — enableDocumentEscape", () => {
  it("invokes onBack on Escape by default (back-compat)", () => {
    const onBack = vi.fn();
    render(<DrillInHeader title="General" parentName="Settings" onBack={onBack} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does NOT attach document Escape when enableDocumentEscape=false", () => {
    const onBack = vi.fn();
    render(
      <DrillInHeader
        title="General"
        parentName="Settings"
        enableDocumentEscape={false}
        onBack={onBack}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onBack).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx
```

Expected: 2 PASS (default cases) + 2 FAIL (`focusTarget="breadcrumb-current"` and `enableDocumentEscape=false`). Failure messages mention missing prop / unsatisfied assertion.

- [ ] **Step 3: Edit DrillInHeader.tsx — add props, breadcrumb-current focus, document-escape opt-out**

Open `packages/editor/src/editor/sidebar/shared/DrillInHeader.tsx`. Replace the existing `DrillInHeaderProps` interface with:

```ts
export interface DrillInHeaderProps {
  /** Current screen title (e.g., "Elements") */
  title: string;
  /** Parent screen name (e.g., "Build") */
  parentName: string;
  /** Breadcrumb path (e.g., ["Build", "Elements"]) */
  breadcrumb?: string[];
  /** Callback when back button is clicked (and no dirty state) */
  onBack: () => void;
  /** True if the current screen has unsaved changes */
  isDirty?: boolean;
  /** Fires instead of onBack when isDirty=true — use to show an unsaved-changes guard */
  onBackAttempt?: () => void;
  /** Whether the panel is pinned */
  isPinned?: boolean;
  /** Callback when pin button is clicked */
  onPinToggle?: () => void;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /**
   * Where to send focus on mount.
   * "back" (default) preserves current behavior.
   * "breadcrumb-current" focuses the breadcrumb's current-page span as a
   *   heading-like landmark — used by settings v2 for screen-reader
   *   announcement of "section, group" combined.
   */
  focusTarget?: "back" | "breadcrumb-current";
  /**
   * When false, DrillInHeader skips its document-level Escape listener.
   * Settings v2 passes false so the parent SettingsTab can handle Escape
   * with knowledge of modal state (guardOpen / isRoot / transitioning).
   * Default true for backwards-compat with ComponentDetailScreen.
   */
  enableDocumentEscape?: boolean;
}
```

Replace the component body (after the destructured props, lines 36-129) with:

```tsx
export const DrillInHeader: React.FC<DrillInHeaderProps> = ({
  title,
  parentName,
  breadcrumb,
  onBack,
  isDirty,
  onBackAttempt,
  isPinned = false,
  onPinToggle,
  onHelpClick,
  onClose,
  focusTarget = "back",
  enableDocumentEscape = true,
}) => {
  const handleBackClick = () => {
    if (isDirty && onBackAttempt) {
      onBackAttempt();
    } else {
      onBack();
    }
  };

  // Focus target on mount + on title change for keyboard accessibility.
  // Codex pass-2 P1 (new): include `title` in deps so section→section
  // navigation (which keeps DrillInHeader mounted) re-focuses the
  // breadcrumb-current span when the title flips. Without this, focus
  // stays on the prior section's heading and screen readers do not
  // re-announce the new section.
  const backBtnRef = React.useRef<HTMLButtonElement>(null);
  const breadcrumbCurrentRef = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (focusTarget === "breadcrumb-current") {
        breadcrumbCurrentRef.current?.focus();
      } else {
        backBtnRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [focusTarget, title]);

  // Handle keyboard navigation (Escape → go back, unless user is in an input).
  // Opt-out via enableDocumentEscape=false; settings v2 owns Escape at parent
  // because it must consult guardOpen / isRoot / transitioning.
  React.useEffect(() => {
    if (!enableDocumentEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        const target = e.target as HTMLElement;
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        if (isDirty && onBackAttempt) {
          onBackAttempt();
        } else {
          onBack();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack, isDirty, onBackAttempt, enableDocumentEscape]);

  const breadcrumbPath = breadcrumb || [parentName, title];
  const groupLabel = breadcrumbPath[0];
  const headingAriaLabel =
    focusTarget === "breadcrumb-current" && groupLabel
      ? `${title}, ${groupLabel}`
      : undefined;

  return (
    <header style={drillInHeaderContainerStyles}>
      <div style={leftSectionStyles}>
        <Button
          ref={backBtnRef}
          onClick={handleBackClick}
          style={backButtonStyles}
          title={`Back to ${parentName}`}
          aria-label={`Back to ${parentName}`}
        >
          <BackArrowIcon />
          <span>Back to {parentName}</span>
        </Button>

        <nav style={breadcrumbStyles} aria-label="Breadcrumb">
          {breadcrumbPath.map((item, index) => {
            const isCurrent = index === breadcrumbPath.length - 1;
            const isFocusableCurrent =
              isCurrent && focusTarget === "breadcrumb-current";
            return (
              <React.Fragment key={index}>
                {index > 0 && <span style={breadcrumbSeparatorStyles}>/</span>}
                {isFocusableCurrent ? (
                  <span
                    ref={breadcrumbCurrentRef}
                    role="heading"
                    aria-level={2}
                    aria-label={headingAriaLabel}
                    tabIndex={-1}
                    style={{ ...breadcrumbItemStyles, ...breadcrumbCurrentStyles }}
                  >
                    {item}
                  </span>
                ) : (
                  <span
                    style={{
                      ...breadcrumbItemStyles,
                      ...(isCurrent ? breadcrumbCurrentStyles : {}),
                    }}
                  >
                    {item}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
      <HeaderActions
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
        style={{ marginTop: 2 }}
      />
    </header>
  );
};
```

- [ ] **Step 4: Run test to verify pass**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx
```

Expected: 5 / 5 passing (codex pass-2 added title-change refocus test).

- [ ] **Step 5: Run typecheck**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/shared/DrillInHeader.tsx \
          packages/editor/src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx && \
  git commit -m "$(cat <<'EOF'
feat(drill-in-header): add focusTarget + enableDocumentEscape props for settings v2

Default focusTarget="back" + enableDocumentEscape=true preserve existing
ComponentDetailScreen behavior. Settings v2 passes focusTarget=
"breadcrumb-current" + enableDocumentEscape=false so SettingsTab can own
Escape with knowledge of guardOpen/isRoot/transitioning state (codex
pass 3 resolution per docs/designs/settings-v2.md §7).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ConfirmDialog — add `onEscapeKeyDown` prop-object cast

**Files:**
- Modify: `packages/editor/src/shared/extensions/ConfirmDialog.tsx`
- Test: `packages/editor/src/shared/extensions/__tests__/ConfirmDialog.test.tsx` (create if missing, or extend)

Per design §7 codex pass 3: `ModalContent` does not expose `onEscapeKeyDown` in its TS type even though it spreads unknown props through to `RadixDialog.Content` at runtime. Use prop-object cast (NOT component-level cast like `UnsavedWarningModal.tsx:28-34`).

Reason: when SettingsTab passes `enableDocumentEscape=false` to DrillInHeader, the document-Escape listener moves to SettingsTab. ConfirmDialog must call `e.preventDefault()` on its Escape so SettingsTab's listener (which checks `e.defaultPrevented`-equivalent via `if (guardOpen) return`) never sees a runaway Escape that pops the section while the dialog is dismissing.

- [ ] **Step 1: Write failing test for onEscapeKeyDown propagation**

Check whether `packages/editor/src/shared/extensions/__tests__/ConfirmDialog.test.tsx` exists:

```bash
ls packages/editor/src/shared/extensions/__tests__/ConfirmDialog.test.tsx 2>/dev/null
```

If missing, create it with:

```tsx
/**
 * ConfirmDialog tests — covers Escape preventDefault + onClose dispatch.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

afterEach(cleanup);

describe("ConfirmDialog — Escape handling", () => {
  it("calls onClose AND preventDefault on Escape", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Discard?"
        message="Unsaved changes."
      />,
    );
    // Find the focused dialog content via Radix.
    const dialogContent = screen.getByRole("dialog");
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    dialogContent.dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/shared/extensions/__tests__/ConfirmDialog.test.tsx
```

Expected: FAIL — `event.defaultPrevented` is `false` (Radix calls `onClose` via `onOpenChange` but does not preventDefault by itself; it only respects `onEscapeKeyDown` when host calls `preventDefault`).

- [ ] **Step 3: Edit ConfirmDialog.tsx — add prop-object cast**

Open `packages/editor/src/shared/extensions/ConfirmDialog.tsx`. Replace the file with:

```tsx
/**
 * ConfirmDialog — small confirmation prompt built on vibcoder Modal.
 *
 * Renders a titled modal with a message body and Cancel / Confirm buttons.
 * Uses Radix.Dialog focus trap, scroll lock, and Esc close out of the box.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
  Button,
} from "@/editor/shared/vibcoder";

type ModalContentExtendedProps = React.ComponentProps<typeof ModalContent> & {
  /**
   * Radix.Dialog.Content forwards this prop at runtime even though
   * ModalContent's TS type does not declare it. Settings v2 needs explicit
   * preventDefault so SettingsTab's document-Escape listener (which moved
   * out of DrillInHeader) does not also fire and pop the section while the
   * dialog is dismissing.
   */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmDialogProps) {
  return (
    <OverlayMount>
      <Modal
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <ModalContent
          size="lg"
          {...({
            onEscapeKeyDown: (event: KeyboardEvent) => {
              event.preventDefault();
              onClose();
            },
          } as ModalContentExtendedProps)}
        >
          <ModalTitle>{title}</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
            <p style={{ margin: 0 }}>{message}</p>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <Button variant="ghost" onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/shared/extensions/__tests__/ConfirmDialog.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: zero errors. The `as ModalContentExtendedProps` cast is the explicit escape hatch — design §7 chose prop-object cast over component-level cast (different shape from `UnsavedWarningModal.tsx`'s pattern).

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/shared/extensions/ConfirmDialog.tsx \
          packages/editor/src/shared/extensions/__tests__/ConfirmDialog.test.tsx && \
  git commit -m "$(cat <<'EOF'
feat(confirm-dialog): explicit onEscapeKeyDown preventDefault for settings v2

ModalContent's TS type does not declare onEscapeKeyDown but Radix.Dialog
forwards it at runtime. Settings v2 needs the explicit preventDefault so
SettingsTab's document-Escape listener (taking over from DrillInHeader's
opt-out) does not also fire and pop the section while the dialog is
dismissing. Uses prop-object cast per docs/designs/settings-v2.md §7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: SettingsTab — state machine + Escape handler (no render change yet)

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`

Goal: introduce `isRoot`, `sectionMounted`, `transitioning`, `prefersReducedMotion`, `sectionRef`, `screenIsDirtyRef`, `lastFocusedRowRef`, `navigate`, `navigateToRoot`, `navigateBetweenSections`, `handleStackTransitionEnd`, parent-owned Escape effect, focus-handoff helpers. Keep current peer-layout JSX for now — Task 4 swaps the render. Splitting into two tasks isolates state-machine churn from JSX churn.

> **Codex pass 6 fixes baked in:**
> - **P0 #1 dirty-state race:** screens push `onDirtyChange` from a post-render `useEffect`. Click on snav row in the same gesture as a field edit can read stale `screenIsDirty=false` from React state. Solution: shadow `screenIsDirty` into `screenIsDirtyRef` via a sync effect, and have `navigate` / `navigateToRoot` / Escape handler read the ref (not the state).
> - **P0 #2 focus handoff:** `aria-hidden` flips with no focus move. Solution: track `lastFocusedRowRef` (which snav row was clicked), call `(document.activeElement as HTMLElement | null)?.blur()` BEFORE flipping `isRoot`, and explicitly focus the breadcrumb-current span post-mount (not just rely on DrillInHeader's mount-only effect, which won't refire on Discard→jump).
> - **P0 #3 section→section nav:** Branding's `onJumpTo` and ConfirmDialog discard with pending-nav both want in-section→in-section transitions. The push state machine deadlocks if invoked while already in a section. Solution: separate `navigateBetweenSections(next)` that swaps `currentScreen` + remounts section content via `resetKey` increment; no animation, no transitioning lock.

- [ ] **Step 1: Add state declarations + refs + reduced-motion hook**

Open `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`. After line 38 (`SettingsNavGuard,` import — keep for now; deleted in Task 6), add:

```ts
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
```

Inside `SettingsTab` component body, immediately after the existing `usePanelNavigation` call (current line 240-244), add:

```ts
const prefersReducedMotion = useReducedMotion();

// v2 layout state — see docs/designs/settings-v2.md §3.
//
// `isRoot=true` shows the snav root; `isRoot=false` shows the drilled-in
// section. `sectionMounted` is the lifecycle gate: section is mounted when
// user clicks a row (BEFORE isRoot flips, so CSS has a node to animate),
// unmounted only after pop transitionend completes. `transitioning` blocks
// re-entrant nav during the 180ms animation window (D20).
const [isRoot, setIsRoot] = React.useState(true);
const [sectionMounted, setSectionMounted] = React.useState(false);
const [transitioning, setTransitioning] = React.useState(false);
const sectionRef = React.useRef<HTMLDivElement | null>(null);

// Codex P0 #1: shadow screenIsDirty into a ref so click-handlers (navigate,
// Escape) read the LATEST value synchronously, not the post-render state.
// Screens push dirty via a post-render useEffect — without this ref, a click
// in the same gesture as an edit reads stale false.
//
// Codex pass-3 acknowledged limitation: BOTH the screen's onDirtyChange
// effect AND this ref-mirror effect are post-render. A truly synchronous
// edit+click within the SAME microtask (no event-loop boundary) could still
// see stale false. This is unreachable for human input — browser keystroke
// and click events are separated by paint cycles, so React commits the
// edit's effects before processing the click. Tests drive both via
// `fireEvent` + `waitFor` so the propagation chain has time to land.
//
// Architectural fix (deferred): change useSettingsScreen to publish dirty
// SYNCHRONOUSLY via a ref prop instead of via post-render onDirtyChange.
// Touches 4 screens (Site, Advanced, SEO, Analytics) + the hook contract.
// Out of v2 scope — separate arc when programmatic edit+nav becomes a real
// path (e.g., hotkey-driven save+navigate gesture).
const screenIsDirtyRef = React.useRef(false);
React.useEffect(() => {
  screenIsDirtyRef.current = screenIsDirty;
}, [screenIsDirty]);

// Codex P0 #2: track last-focused snav row so pop can restore focus.
// Set in renderRow's onClick (Task 4); read in navigateToRoot transitionend.
const lastFocusedRowRef = React.useRef<HTMLButtonElement | null>(null);

// Forward-declare the breadcrumb-current focus target. Section assigns this
// ref via DrillInHeader's internals — but DrillInHeader's existing mount
// effect handles initial focus. We only need a ref here for re-focus after
// section→section nav (when section stays mounted).
const sectionFocusRef = React.useRef<HTMLElement | null>(null);
```

- [ ] **Step 2: Replace `handleNav` with v2 `navigate` + add `navigateToRoot` + `navigateBetweenSections` + `handleStackTransitionEnd`**

Locate the existing `handleNav` callback (around current line 282-293). Replace it with:

```ts
// Push: snav root → section. Mounts section first, then flips isRoot on next
// rAF tick so CSS transition has a starting state. Reduced-motion path skips
// both the animation AND the input lock — render is instant.
//
// Codex P0 #1: read screenIsDirtyRef.current (not state) — click in same
// gesture as edit must see latest dirty.
// Codex P0 #2: blur active element before flipping isRoot so focus does not
// remain inside what becomes aria-hidden=true. DrillInHeader's mount effect
// will then place focus on breadcrumb-current.
const navigate = React.useCallback(
  (nextId: InTabNavId) => {
    if (transitioning) return;
    if (nextId === currentScreen && !isRoot) return;
    // Section→section nav: caller is already drilled-in. Route through
    // navigateBetweenSections to avoid the push state-machine deadlock
    // (Codex P0 #3).
    if (!isRoot) {
      navigateBetweenSections(nextId);
      return;
    }
    if (screenIsDirtyRef.current) {
      pendingNavRef.current = nextId;
      setGuardOpen(true);
      return;
    }
    // Codex P0 #2: blur the clicked snav row before root becomes aria-hidden.
    (document.activeElement as HTMLElement | null)?.blur?.();
    navigateTo(nextId);
    setSectionMounted(true);

    if (prefersReducedMotion) {
      setIsRoot(false);
      return;
    }
    setTransitioning(true);
    requestAnimationFrame(() => setIsRoot(false));
  },
  // navigateBetweenSections is hoisted via function-declaration below — not
  // in deps array (function-decl identity is stable across renders).
  [currentScreen, isRoot, navigateTo, transitioning, prefersReducedMotion],
);

// Pop: section → snav. Section stays mounted during animation; transitionend
// handler unmounts it AND restores focus to the originating snav row.
// Reduced-motion path unmounts immediately + restores focus inline.
//
// Codex P0 #1 pass-2 hardening: navigateToRoot also reads
// screenIsDirtyRef.current (NOT the prop chain through DrillInHeader's
// isDirty) so back-button + Escape + any other pop path are guarded.
// DrillInHeader's onBackAttempt prop fires on stale-but-positive isDirty
// reads; navigateToRoot fires on stale-and-negative isDirty reads. Both
// safety paths converge here.
//
// Codex P0 #2: blur active element so focus does not stay inside the
// section as it becomes aria-hidden=true.
const navigateToRoot = React.useCallback(() => {
  if (transitioning) return;
  // Codex P0 #1: dirty re-check at navigate-time, not just at click-time.
  // A dirty edit landing in the same gesture as a back-click can leave
  // DrillInHeader's prop view as isDirty=false; trust the ref.
  if (screenIsDirtyRef.current) {
    pendingNavRef.current = null; // null = back-attempt path (not pending-nav)
    setGuardOpen(true);
    return;
  }
  (document.activeElement as HTMLElement | null)?.blur?.();
  if (prefersReducedMotion) {
    setIsRoot(true);
    setSectionMounted(false);
    // Restore focus to the row that opened this section (best effort).
    setTimeout(() => lastFocusedRowRef.current?.focus(), 0);
    return;
  }
  setTransitioning(true);
  setIsRoot(true);
}, [transitioning, prefersReducedMotion]);

// Section→section nav (in-section→in-section, no animation, no lock).
// Used by:
//   - Branding section's onJumpTo (jumps to general / seo)
//   - ConfirmDialog discard branch when pendingNav targets a different
//     section while user is already drilled-in
//
// Force-remounts the section content via resetKey so focus + screen-state
// fully reset; sectionMounted stays true; isRoot stays false.
//
// Function declaration (not useCallback) so navigate's deps array stays
// stable — function-decl identity does not change across renders.
function navigateBetweenSections(nextId: InTabNavId) {
  if (nextId === currentScreen) return;
  if (transitioning) return;
  navigateTo(nextId);
  setResetKey((k) => k + 1);
  setScreenIsDirty(false);
  setDirtyCount(0);
  // DrillInHeader unmounts + remounts because of resetKey-keyed wrapper —
  // its own mount effect will refire and focus breadcrumb-current.
}

const handleStackTransitionEnd = React.useCallback(
  (e: React.TransitionEvent<HTMLDivElement>) => {
    // Only act on transform completion (filter out opacity events).
    if (e.propertyName !== "transform") return;
    // Section's pop animation completed → unmount it + restore focus.
    if (e.target === sectionRef.current && isRoot) {
      setSectionMounted(false);
      // Codex P0 #2: focus the row that opened this section so keyboard
      // users land back in a meaningful place after the pop.
      setTimeout(() => lastFocusedRowRef.current?.focus(), 0);
    }
    // Either screen finishing its transform clears the navigation block.
    setTransitioning(false);
  },
  [isRoot],
);
```

- [ ] **Step 3: Add SettingsTab-owned Escape listener**

Below the previous block, add:

```ts
// Settings v2 owns Escape. DrillInHeader is opted out via
// enableDocumentEscape={false}. ConfirmDialog handles its own Escape via
// onEscapeKeyDown preventDefault (Task 2).
//
// Codex P0 #1: read screenIsDirtyRef.current (sync), not state — Escape in
// the same tick as an edit must see the latest dirty value. The ref-shadow
// effect (Step 1) guarantees ref is at-most-one-render stale; for click +
// keydown handlers, that's already the latest value.
React.useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (guardOpen) return; // ConfirmDialog will handle via onEscapeKeyDown
    if (isRoot) return;    // already at root, nothing to pop
    if (transitioning) return;
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
      return; // input handles its own Escape (blur/clear)
    }
    e.preventDefault();
    if (screenIsDirtyRef.current) {
      setGuardOpen(true);
    } else {
      navigateToRoot();
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [guardOpen, isRoot, transitioning, navigateToRoot]);
```

- [ ] **Step 4: Update `handleDiscard` to also reset to root + update screen-change reset effect**

Locate the `handleDiscard` callback (currently line ~295-299). Leave behavior the same (Discard stays on current section per design §3 — nav-pending is the only path that pops to root). The existing effect on line 264-271 (`setScreenIsDirty(false); setDirtyCount(0); setGuardOpen(false); screenSaveHandlerRef.current = null;`) stays. No change needed.

- [ ] **Step 5: Run typecheck (must pass; tests still on old layout assertions, will be rewritten in Task 7)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: zero errors. Existing tests still target old layout — they may fail at runtime once Task 4 ships, but typecheck must stay green throughout.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx && \
  git commit -m "$(cat <<'EOF'
feat(settings-v2): add isRoot/sectionMounted/transitioning state machine

State machine + parent-owned Escape handler land before render swap so the
Task-4 commit is JSX-only. navigate / navigateToRoot / handleStackTransitionEnd
match docs/designs/settings-v2.md §3 + §6 contract. Reduced-motion path
skips animation AND input lock entirely (codex pass 4 resolution).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: SettingsTab — render swap (peer-layout → drill-in stack)

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`

Replace the `return (...)` block at the bottom of the component with the v2 render contract. Keep all helper functions (`renderRow`, `renderWorkspaceLink`, `renderContent`, `navByGroup`, `current` lookup) — only the JSX shape changes.

- [ ] **Step 1: Replace the return block — single dual-mount stack with DrillInHeader + ConfirmDialog**

Open `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`. Replace lines 434-541 (everything from the `return (` line through the closing `</TabFrame>` and `<SettingsNavGuard ... />`) with:

```tsx
return (
  <TabFrame>
    <div className="bd-set-panel-h">
      <div className="bd-set-panel-h-ttl">
        <h2>{isRoot ? "Settings" : current.title}</h2>
        {!isRoot && current.subtitle ? (
          <span className="bd-set-panel-sub">{current.subtitle}</span>
        ) : null}
      </div>
      <div className="bd-set-panel-acts">
        {onHelpClick ? (
          <Button
            type="button"
            className="bd-set-icon-btn"
            onClick={onHelpClick}
            aria-label="Help"
            title="Help"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 17v-.5 M12 8a2 2 0 012 2c0 2-2 2-2 3.5" />
            </svg>
          </Button>
        ) : null}
        {onClose ? (
          <Button
            type="button"
            className="bd-set-icon-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l16 16M20 4L4 20" />
            </svg>
          </Button>
        ) : null}
      </div>
    </div>
    <TabFrame.Body noScroll>
      <div
        className={`bd-set-stack${transitioning ? " transitioning" : ""}${prefersReducedMotion ? " no-motion" : ""}`}
        onTransitionEnd={handleStackTransitionEnd}
      >
        {/* Root screen — ALWAYS mounted (codex P2 #7 contract: aria-hidden flips, mount stays).
            inert + aria-hidden={!isRoot} means assistive tech ignores it AND focus cannot land
            inside it during the section animation. Codex P0 #2 focus contract relies on this. */}
        <div
          className={`bd-set-screen bd-set-screen--root${isRoot ? " on" : " off"}`}
          aria-hidden={!isRoot}
          // Cast as inert prop is React 18.3-aware via DOM attribute; React types
          // accept 'inert' as a string boolean attribute.
          inert={!isRoot}
        >
          <nav className="bd-set-snav" aria-label="Settings sections">
            <div className="bd-set-snav-list">
              {(Object.keys(navByGroup) as NavGroupId[]).map((groupId) => (
                <React.Fragment key={groupId}>
                  <div className="bd-set-snav-group">{GROUP_LABELS[groupId]}</div>
                  {navByGroup[groupId].map(renderRow)}
                </React.Fragment>
              ))}
              <div className="bd-set-snav-group">
                WORKSPACE <span className="bd-set-snav-group-hint">opens dashboard ↗</span>
              </div>
              {WORKSPACE_LINKS.map(renderWorkspaceLink)}
              {onReplayTour ? (
                <Button
                  type="button"
                  onClick={onReplayTour}
                  className="bd-set-snav-row bd-set-snav-row-sep"
                >
                  <span className="bd-set-snav-icon">
                    <TourIcon />
                  </span>
                  <span className="bd-set-snav-label">Tour</span>
                </Button>
              ) : null}
            </div>
          </nav>
        </div>
        {/* Section screen — mount-on-push, unmount-on-pop-transitionend.
            inert + aria-hidden={isRoot} during the pop animation prevents focus retention
            inside the departing subtree (codex P0 #2). */}
        {sectionMounted && (
          <div
            ref={sectionRef}
            className={`bd-set-screen bd-set-screen--section${isRoot ? " departing" : " entered"}`}
            aria-hidden={isRoot}
            inert={isRoot}
          >
            <DrillInHeader
              title={current.title}
              parentName="Settings"
              breadcrumb={[GROUP_LABELS[current.group], current.title]}
              focusTarget="breadcrumb-current"
              enableDocumentEscape={false}
              onBack={navigateToRoot}
              isDirty={screenIsDirty}
              onBackAttempt={() => setGuardOpen(true)}
              onHelpClick={onHelpClick}
              onClose={onClose}
            />
            <div className="bd-set-pane-body" key={resetKey}>
              {renderContent()}
            </div>
            <div
              className={`bd-set-savebar${screenIsDirty ? " on" : ""}`}
              role="region"
              aria-label="Unsaved changes"
              aria-hidden={!screenIsDirty}
            >
              <span className="bd-set-savebar-note">
                <span>{dirtyCount} unsaved</span>
              </span>
              <div className="bd-set-savebar-actions">
                <Button type="button" className="bd-set-btn sec" onClick={handleDiscard}>
                  Discard
                </Button>
                <Button type="button" className="bd-set-btn pri" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TabFrame.Body>
    <ConfirmDialog
      isOpen={guardOpen}
      onClose={() => {
        pendingNavRef.current = null;
        setGuardOpen(false);
      }}
      onConfirm={() => {
        const next = pendingNavRef.current;
        // Codex P1 #6 pass-3 hardening: warn FIRST (with full state snapshot)
        // before any setters mutate the state we want to diagnose.
        //
        //   isRoot=false, next=null  → back-attempt while dirty → pop to root
        //   isRoot=false, next=id    → pending-nav while dirty (in-section) →
        //                              swap section content (no animation)
        //   isRoot=true,  next=null  → UNREACHABLE: root view has no dirty
        //                              state (section is unmounted; savebar
        //                              never shows). Guard openable only from
        //                              section-mounted view.
        //   isRoot=true,  next=id    → UNREACHABLE: navigate() opens dialog
        //                              when entering section while parent
        //                              still has stale dirty (impossible —
        //                              dirty resets on screen change).
        if (isRoot) {
          console.warn(
            "[settings-v2] ConfirmDialog onConfirm reached unreachable branch — pre-mutation state:",
            {
              isRoot,
              next,
              screenIsDirty: screenIsDirtyRef.current,
              guardOpen: true,
            },
          );
        }
        pendingNavRef.current = null;
        setGuardOpen(false);
        setScreenIsDirty(false);
        setDirtyCount(0);
        if (!isRoot && next === null) {
          navigateToRoot();
          return;
        }
        if (!isRoot && next !== null) {
          navigateBetweenSections(next);
          return;
        }
        // Defensive — does NOT touch state past the mutations above. If we
        // ever land here, the branch is genuinely impossible AND stateful
        // operations have already been committed; log alone is sufficient.
        if (next !== null) navigate(next);
      }}
      title="Discard changes?"
      message="You have unsaved changes. Switching will discard them."
      confirmText="Discard"
      cancelText="Keep editing"
      variant="danger"
    />
  </TabFrame>
);
```

- [ ] **Step 2: Update `renderRow` to call `navigate` + capture `lastFocusedRowRef`**

Locate `renderRow` (around current line 393-412). Replace with:

```tsx
const renderRow = (n: NavDef) => {
  const active = currentScreen === n.id;
  const locked = isScreenLocked(n.id, userPlan);
  const Icon = n.icon;
  return (
    <Button
      key={n.id}
      type="button"
      onClick={(e) => {
        // Codex P0 #2: capture clicked row so navigateToRoot's transitionend
        // can restore focus when the user pops back.
        lastFocusedRowRef.current = e.currentTarget as HTMLButtonElement;
        navigate(n.id);
      }}
      className={`bd-set-snav-row${active ? " on" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="bd-set-snav-icon">
        <Icon />
      </span>
      <span className="bd-set-snav-label">{n.title}</span>
      {locked ? <span className="bd-set-snav-badge">Pro</span> : null}
    </Button>
  );
};
```

Delete the now-unused `handleNav` declaration if Step 2 of Task 3 already replaced it (it should have been replaced — confirm).

- [ ] **Step 3: Update Branding section's `onJumpTo` to use `navigateBetweenSections`**

Locate the Branding render call (current line 344-349). Change:

```tsx
case "branding":
  return (
    <BrandingSection
      onOpenPalette={onOpenDesignTab}
      onJumpTo={(screenId) => navigateTo(screenId)}
    />
  );
```

to:

```tsx
case "branding":
  return (
    <BrandingSection
      onOpenPalette={onOpenDesignTab}
      // Codex P0 #3: section→section nav must go through navigateBetweenSections,
      // not navigateTo. navigateTo would update currentScreen but skip the
      // resetKey bump + dirty reset, leaving stale screen state visible.
      onJumpTo={(screenId) => navigateBetweenSections(screenId)}
    />
  );
```

- [ ] **Step 4: Run typecheck**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Run existing tests (will fail — expected)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx
```

Expected: SOME failures. The current 14 tests assert peer-layout behavior (snav + pane visible simultaneously) which no longer holds at root. Note which tests fail — they get rewritten in Task 7.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx && \
  git commit -m "$(cat <<'EOF'
refactor(settings-v2): peer-layout JSX -> drill-in stack with DrillInHeader + ConfirmDialog

Render contract per docs/designs/settings-v2.md §3 + §5. Root screen
stays MOUNTED with aria-hidden=true + inert during section view (codex
P2 #7 + P0 #2 focus contract). Section screen drills in via DrillInHeader
(focusTarget=breadcrumb-current, enableDocumentEscape=false). Branding
onJumpTo wired to navigateBetweenSections (codex P0 #3). ConfirmDialog
replaces SettingsNavGuard (deletion in Task 6) with branched onConfirm
(codex P1 #6). Tests rewritten in Task 7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: settings.css — drain peer-layout + add drawer animation

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/settings.css`

Per design §6 + §7. Drop:
- `.bd-set-pane` + `.bd-set-pane-body` (lines 148-161) — section now wraps body inline
- `.bd-set-snav { border-right: ... }` (line 19) — snav is full-width root screen now
- `.bd-set-snav-h` (lines 25-30) — header now lives in `.bd-set-panel-h`
- `.bd-set-guard-*` (lines 460-494) — ConfirmDialog handles modal styling

Keep (verify, don't rewrite):
- `.bd-set-root` (lines 7-15) — codex P2 #8 found that v2 JSX renders `<TabFrame>` directly without a `.bd-set-root` wrapper, so the rule is dead code. Verified absent from Task-4 JSX. Action: DELETE the rule entirely instead of rewriting.

Add:
- `.bd-set-stack` + `.bd-set-screen` + `.bd-set-screen--root` + `.bd-set-screen--section` rules
- `@media (prefers-reduced-motion: reduce)` override

- [ ] **Step 1: Delete `.bd-set-root` (lines 7-15) + add stack/screen rules**

In `packages/editor/src/editor/sidebar/tabs/settings/settings.css`, replace lines 7-15 (the `.bd-set-root { display: grid; ... }` block) with:

```css
/* ── Shell (drill-in stack — replaces peer-layout grid) ──
 * The Task-4 JSX wraps content in <TabFrame> directly, so the prior
 * .bd-set-root grid wrapper is no longer rendered. Removed entirely
 * per codex review P2 #8.
 */

/* Stack: dual-mount container for root + section screens */
.bd-set-stack {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.bd-set-stack.transitioning {
  pointer-events: none; /* block input during 180ms animation window */
}

/* Screens: position absolutely so root + section stack on the same plane */
.bd-set-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  transition: transform 180ms ease-out, opacity 180ms ease-out;
  will-change: transform, opacity;
  background: var(--bd-bg-card, #fff);
  /* Allow inner snav / pane-body to scroll independently. */
  min-height: 0;
}
.bd-set-stack.no-motion .bd-set-screen {
  transition: none;
}

/* Root screen: visible at root state, slid off-left when drilled */
.bd-set-screen--root.on  {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
.bd-set-screen--root.off {
  transform: translateX(-12%);
  opacity: 0.35;
  pointer-events: none;
}

/* Section screen: animates in from right; departing on pop */
.bd-set-screen--section {
  transform: translateX(100%);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
}
.bd-set-screen--section.entered   { transform: translateX(0);    opacity: 1; }
.bd-set-screen--section.departing { transform: translateX(100%); opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .bd-set-screen { transition: none; }
}
```

- [ ] **Step 2: Drop `border-right` from `.bd-set-snav` (line 19)**

Locate `.bd-set-snav` block (currently line 18-24). Replace it with:

```css
/* ── Snav (root-screen content) ── */
.bd-set-snav {
  background: var(--bd-bg-subtle);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
```

(`border-right` is gone; flex-fill replaces grid sizing.)

- [ ] **Step 3: Delete `.bd-set-snav-h` block (lines 25-30)**

The "Settings" header now lives in `.bd-set-panel-h` (rendered by SettingsTab JSX), not inside the snav. Delete the `.bd-set-snav-h { ... }` rule entirely.

- [ ] **Step 4: Delete `.bd-set-pane` + `.bd-set-pane-body` (lines 148-161)**

Replace lines 148-161 with:

```css
/* ── Section pane body (inside .bd-set-screen--section) ── */
.bd-set-pane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
}
```

(Drop `.bd-set-pane` wrapper. Section uses `.bd-set-screen--section` flexbox directly; body class still styles the scroll region.)

- [ ] **Step 5: Delete `.bd-set-guard-*` rules (lines 460-494)**

Delete the entire block from `/* ── Guard modal (refreshed skin) ── */` through the closing `}` of `.bd-set-guard-actions`. ConfirmDialog handles its own modal chrome via vibcoder Modal.

- [ ] **Step 6: Verify no orphan references**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -rE "bd-set-pane[^-]|bd-set-pane$|bd-set-guard|bd-set-snav-h\b" \
  packages/editor/src/ 2>/dev/null
```

Expected: only `.bd-set-pane-body` references remain (in the CSS file itself + SettingsTab section render). Zero hits on `bd-set-pane` (without `-body`), `bd-set-guard-*`, or `bd-set-snav-h`. If any orphan refs appear, fix in this commit.

- [ ] **Step 7: Run dev server smoke check (manual)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npm run dev
```

Open `http://localhost:5050`. Click Settings tab in sidebar. Verify:
- Root view shows snav with 4 group headers (SITE / DISTRIBUTION / PLUMBING / WORKSPACE).
- Click "General" → section slides in from right (180ms).
- Click breadcrumb "Back to Settings" → section slides back out.
- Press Escape from section view → returns to root.
- Make an edit → press Escape → ConfirmDialog opens. Press Escape again → dialog closes (does NOT also pop section). Click "Discard" → section pops + dirty cleared.

If any visual regression, fix in this commit before proceeding.

- [ ] **Step 8: Run typecheck + lint**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit && \
  pnpm run gate:ds-ssot 2>/dev/null || echo "gate not available — skip"
```

Expected: zero errors. DS SSOT gate (if wired) stays green.

- [ ] **Step 9: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/tabs/settings/settings.css && \
  git commit -m "$(cat <<'EOF'
refactor(settings-v2): css drain peer-layout + add drill-in stack animation

Drop .bd-set-root grid (140px 1fr), .bd-set-pane wrapper, .bd-set-snav-h,
and .bd-set-guard-* (ConfirmDialog covers). Add .bd-set-stack + .bd-set-screen
+ .bd-set-screen--root + .bd-set-screen--section + reduced-motion guard per
docs/designs/settings-v2.md §6. Snav becomes full-bleed root-screen content;
section drills over with 180ms slide.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: shared.tsx — delete `SettingsNavGuard`

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/shared.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx` (drop import)

After Task 4, `SettingsNavGuard` has zero callers. Delete to keep the SSOT contract — leaving dead exports violates `feedback_inventory_before_deletion_wrappers.md` learning + CLAUDE.md "no dead code" rule.

> **Codex P1 #5 fix:** the original Task-6 instructions called for editing a named `export { ... }` line in `index.ts`. The actual barrel is wildcard exports (`export * from "./shared"`) — no manual edit needed. Deleting the component from `shared.tsx` is enough; the wildcard re-export drains automatically.

- [ ] **Step 1: Verify barrel is wildcard + zero JSX callers (post-Task-4)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  cat packages/editor/src/editor/sidebar/tabs/settings/index.ts && \
  echo "---" && \
  grep -rn "SettingsNavGuard" packages/editor/src/
```

Expected:
- `index.ts` is wildcard re-exports only: `export * from "./constants"; export * from "./types"; export * from "./shared"; export * from "./icons"; export * from "./screens";`
- `grep` output: definition lines in `shared.tsx` (around 21 / 236 / 239 / 245) + import line + JSX render line in `SettingsTab.tsx`. **If JSX render still present after Task 4, STOP — return to Task 4 step 1 and verify the render swap landed.**

- [ ] **Step 2: Delete `SettingsNavGuard` from `shared.tsx`**

Open `packages/editor/src/editor/sidebar/tabs/settings/shared.tsx`. Delete:
- Line 21 JSDoc reference (`Refreshed skin: <SettingsNavGuard>` line — keep surrounding JSDoc lines).
- Lines 235-276 (the entire `// SettingsNavGuard — refreshed skin` separator + `interface SettingsNavGuardProps` + `export const SettingsNavGuard ...` component + closing).

Confirm `shared.tsx` ends cleanly without orphan separator comments. The wildcard `export *` from `index.ts` will drop the symbol automatically — no edit to `index.ts`.

- [ ] **Step 3: Drop `SettingsNavGuard` from `SettingsTab.tsx` import**

Open `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`. Locate the `import { ... SettingsNavGuard, ... } from "./index";` block (currently line 17-38). Remove the `SettingsNavGuard,` line.

- [ ] **Step 4: Verify zero references remain**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  grep -rn "SettingsNavGuard" packages/editor/src/
```

Expected: empty output.

- [ ] **Step 5: Run typecheck**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/tabs/settings/shared.tsx \
          packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx && \
  git commit -m "$(cat <<'EOF'
chore(settings-v2): delete SettingsNavGuard — replaced by ConfirmDialog

Zero callers post-Task-4. Removes -42 LOC of dead code (component +
interface). ConfirmDialog (Radix-backed) covers the same contract +
adds focus trap + Escape preventDefault. Barrel is wildcard re-export
so deletion auto-propagates (codex P1 #5).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: SettingsTab.test.tsx — rewrite for stack layout

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx`

The 14 existing tests assert peer-layout (snav + pane side-by-side). v2 stacks them. Rewrite preserves the production-path mock for `useSettingsScreen` (avoids infinite render loop) + adds reduced-motion mock; assertions track new render contract.

> **Codex P1 #4 fix:** the prior plan promised dirty-Escape / pending-nav / dialog discard+cancel / aria-hidden coverage but the proposed tests didn't actually drive dirty state, never opened the dialog, and the "pending-nav" test asserted only that no dialog existed at clean entry. New rewrite drives dirty via real `fireEvent.change` on form inputs + `waitFor` to await effect propagation, opens the dialog via pressing Escape post-edit, and asserts on dialog button text + aria-hidden flips on root.

Target: 13-15 tests. Coverage areas:
1. Root view: 10 in-tab section rows + 3 workspace deep-links + WORKSPACE group header + heading "Settings".
2. Push: clicking snav row mounts section, header flips to section title, root has `aria-hidden=true` (codex P0 #2 + P2 #7).
3. Pop: back button → section unmounts after transitionend; header reverts; focus restored to opening row (codex P0 #2).
4. Escape (section, clean): pops to root.
5. Escape (section, **dirty**): opens ConfirmDialog; section STAYS visible (codex P0 #1: drive dirty via real input edit + `waitFor`).
6. Escape (root): no-op (no dialog).
7. Dialog **Discard** (back-attempt path): pops to root + clears dirty.
8. Dialog **Cancel**: closes dialog; stays in section; dirty preserved.
9. Pending-nav guard: while dirty, click different snav row → dialog opens; **Discard** → swaps section content via `navigateBetweenSections` (codex P0 #3 — section stays mounted, header title flips, no animation lock).
10. Workspace deep-link: rendered as `<a target="_blank" rel="noopener">`.
11. Reduced-motion path: stack has `.no-motion`, no `.transitioning` class flips.
12. Branding section: jump button → `navigateBetweenSections` swaps to General/SEO without unmount.
13. Section→section nav via `navigateBetweenSections` does NOT set `transitioning` (codex P0 #3 deadlock guard).
14. Cleanup: `aria-hidden` and `inert` flip together on root during section view (codex P0 #2).

- [ ] **Step 1: Replace existing test file**

Open `packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx`. Replace the entire file with:

```tsx
/**
 * Settings Tab Tests — v2 drill-in drawer.
 *
 * Covers (codex P1 #4 — REAL coverage, not stubs):
 *   Root view: 10-section snav + 3 workspace deep-links + WORKSPACE group header.
 *   Push/pop animation: section mount-on-click, unmount-on-pop-transitionend,
 *     focus restore on pop.
 *   Escape contract: SettingsTab owns Escape; clean section pops; DIRTY section
 *     opens ConfirmDialog (drive dirty via real form input).
 *   Dialog Discard (back-attempt) → pops to root + clears dirty.
 *   Dialog Cancel → closes dialog, dirty preserved, section stays.
 *   Pending-nav guard: dirty + click another row → dialog opens; Discard →
 *     navigateBetweenSections swaps content (no animation lock).
 *   Reduced-motion path: stack has .no-motion, no .transitioning flip.
 *   Branding signpost: jump button → navigateBetweenSections (no unmount).
 *   aria-hidden + inert flip together on root during section view.
 *
 * Note: useSettingsScreen is mocked — production hook re-creates selectors
 * on every render, causing an infinite jsdom re-render loop. Mock preserves
 * external contract: { value, isDirty, markDirty, markClean, setValue }.
 * Mock's setValue ALSO flips isDirty true so a real input.onChange triggers
 * the post-render onDirtyChange propagation path that codex P0 #1 hardened.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import * as React from "react";

vi.mock("../hooks/useSettingsScreen", () => ({
  useSettingsScreen: vi.fn(
    (
      composer: { getProjectSettings?: () => unknown } | null | undefined,
      selector: (s: unknown) => unknown,
      defaultValue: unknown,
    ) => {
      const raw = composer?.getProjectSettings?.() ?? {};
      const initialValue = (() => {
        try {
          return selector(raw) ?? defaultValue;
        } catch {
          return defaultValue;
        }
      })();
      const [value, setValue] = React.useState(initialValue);
      const [isDirty, setIsDirty] = React.useState(false);
      return {
        value,
        isDirty,
        setValue: (v: unknown) => {
          setValue(v);
          setIsDirty(true);
        },
        markDirty: () => setIsDirty(true),
        markClean: () => setIsDirty(false),
      };
    },
  ),
}));

const reducedMotionRef: { value: boolean } = { value: false };
vi.mock("@/shared/hooks/useReducedMotion", () => ({
  useReducedMotion: () => reducedMotionRef.value,
}));

import { SettingsTab } from "../SettingsTab";

afterEach(() => {
  cleanup();
  reducedMotionRef.value = false;
});

const makeComposer = () => ({
  getProjectSettings: () => ({ seo: { siteName: "Test Site" } }),
  setProjectSettings: vi.fn(),
  saveProject: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  off: vi.fn(),
});

const dispatchTransform = (el: HTMLElement) => {
  // jsdom@28 supports new TransitionEvent. Verified via env construct check.
  act(() => {
    el.dispatchEvent(
      new TransitionEvent("transitionend", { bubbles: true, propertyName: "transform" }),
    );
  });
};

// Drive dirty via a real form input edit + await the post-render
// onDirtyChange propagation chain (screen useEffect -> parent setState).
async function makeSectionDirty(siteNameInput: HTMLInputElement) {
  fireEvent.change(siteNameInput, { target: { value: "Edited Site" } });
  // Two render cycles: 1) screen sets local state + isDirty=true,
  //                    2) effect fires onDirtyChange -> parent setScreenIsDirty.
  await waitFor(() => {
    // Savebar shows "1 unsaved" once parent registers dirty.
    expect(document.querySelector(".bd-set-savebar.on")).not.toBeNull();
  });
}

// ─── Group 1 — Root view ─────────────────────────────────────────────────────

describe("SettingsTab v2 — root view", () => {
  it("renders 10 in-tab sections + WORKSPACE group with 3 deep-links", () => {
    render(<SettingsTab composer={makeComposer() as never} userPlan="enterprise" />);
    [
      /general/i, /branding/i, /seo/i,
      /analytics/i, /localization/i,
      /custom code/i, /redirects/i, /headers/i, /forms/i, /integrations/i,
    ].forEach((re) => {
      expect(screen.getByRole("button", { name: re })).toBeTruthy();
    });
    const links = screen.getAllByRole("link");
    const labels = links.map((a) => a.textContent ?? "");
    expect(labels.some((l) => /Domains/.test(l))).toBe(true);
    expect(labels.some((l) => /Members/.test(l))).toBe(true);
    expect(labels.some((l) => /Billing/.test(l))).toBe(true);
    links.forEach((a) => {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    });
  });

  it("panel header title is 'Settings' at root + section is NOT mounted", () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    expect(document.querySelector(".bd-set-panel-h-ttl h2")?.textContent).toBe("Settings");
    expect(container.querySelector(".bd-set-screen--section")).toBeNull();
  });
});

// ─── Group 2 — Push / pop / focus ─────────────────────────────────────────────

describe("SettingsTab v2 — push/pop + focus", () => {
  it("click snav row → section mounts + root has aria-hidden=true + inert", () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    const section = container.querySelector(".bd-set-screen--section");
    expect(section).not.toBeNull();
    const root = container.querySelector(".bd-set-screen--root");
    // Codex P0 #2 + P2 #7: root stays mounted; gets aria-hidden + inert.
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.hasAttribute("inert")).toBe(true);
  });

  it("back button pops + unmounts section + restores focus to opening row", () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    const generalRow = screen.getByRole("button", { name: /general/i });
    fireEvent.click(generalRow);
    const section = container.querySelector(".bd-set-screen--section") as HTMLElement;
    expect(section).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /back to settings/i }));
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    dispatchTransform(section);
    expect(container.querySelector(".bd-set-screen--section")).toBeNull();
    // Codex P0 #2: focus restored to General row via setTimeout(0).
    return waitFor(() => {
      expect(document.activeElement).toBe(generalRow);
    });
  });
});

// ─── Group 3 — Escape contract (clean + dirty) ───────────────────────────────

describe("SettingsTab v2 — Escape contract", () => {
  it("Escape from section (clean) pops to root", () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    const section = container.querySelector(".bd-set-screen--section");
    if (section) dispatchTransform(section as HTMLElement);
    expect(container.querySelector(".bd-set-screen--section")).toBeNull();
  });

  it("Escape from root is a no-op (no dialog)", () => {
    render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape from DIRTY section opens ConfirmDialog + section stays visible", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    // Drive dirty via real input edit.
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // Press Escape on document body (NOT inside an input — Escape inside
    // input is handled by the input's blur/clear).
    fireEvent.keyDown(document.body, { key: "Escape" });
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
    // Codex P0 #1: section MUST still be visible behind the dialog.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
  });
});

// ─── Group 4 — ConfirmDialog Discard / Cancel paths ──────────────────────────

describe("SettingsTab v2 — ConfirmDialog Discard / Cancel", () => {
  it("Discard (back-attempt path): pops to root + clears dirty", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // Click DrillInHeader's back button while dirty → dialog opens.
    fireEvent.click(screen.getByRole("button", { name: /back to settings/i }));
    const dialog = await screen.findByRole("dialog");
    // Click "Discard" in the dialog.
    fireEvent.click(within(dialog).getByRole("button", { name: /discard/i }));
    // Section animates out — fire transitionend.
    const section = container.querySelector(".bd-set-screen--section") as HTMLElement | null;
    if (section) dispatchTransform(section);
    await waitFor(() => {
      expect(container.querySelector(".bd-set-screen--section")).toBeNull();
    });
  });

  it("Cancel: dialog closes + section stays + dirty preserved", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    fireEvent.click(screen.getByRole("button", { name: /back to settings/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /keep editing/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    // Section still in DOM, savebar still on.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    expect(container.querySelector(".bd-set-savebar.on")).not.toBeNull();
  });
});

// ─── Group 5 — Pending-nav guard (codex P0 #3) ───────────────────────────────

describe("SettingsTab v2 — pending-nav guard", () => {
  it("dirty + click different row → dialog opens; Discard swaps section in-place", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // Click "SEO" while dirty.
    fireEvent.click(screen.getByRole("button", { name: /seo/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /discard/i }));
    // Codex P0 #3: navigateBetweenSections swaps content WITHOUT unmounting
    // the section. Header title flips to SEO. Stack should NOT be
    // .transitioning (no animation lock for in-section swap).
    await waitFor(() => {
      expect(document.querySelector(".bd-set-panel-h-ttl h2")?.textContent).toBe("SEO");
    });
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    expect(container.querySelector(".bd-set-stack.transitioning")).toBeNull();
  });
});

// ─── Group 6 — Reduced motion + Branding ─────────────────────────────────────

describe("SettingsTab v2 — reduced motion", () => {
  it("stack has .no-motion + skips .transitioning class", () => {
    reducedMotionRef.value = true;
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    const stack = container.querySelector(".bd-set-stack");
    expect(stack?.classList.contains("no-motion")).toBe(true);
    expect(stack?.classList.contains("transitioning")).toBe(false);
  });
});

describe("SettingsTab v2 — branding signpost (jump-to via navigateBetweenSections)", () => {
  it("Branding 'Open →' jump button swaps section without unmount + no animation lock", () => {
    const { container } = render(
      <SettingsTab composer={makeComposer() as never} userPlan="enterprise" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /branding/i }));
    expect(screen.getByText(/Where Branding lives/)).toBeTruthy();
    // First "Open →" button maps to the General row (Favicon location).
    const jumpButtons = screen.getAllByRole("button", { name: /jump to/i });
    expect(jumpButtons.length).toBeGreaterThan(0);
    fireEvent.click(jumpButtons[0]);
    // Codex P0 #3: section→section nav, no animation lock, no unmount.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    expect(container.querySelector(".bd-set-stack.transitioning")).toBeNull();
    // Header reflects new section (General per BRANDING_FIELD_MAP first jump).
    expect(document.querySelector(".bd-set-panel-h-ttl h2")?.textContent).toBe("General");
  });
});
```

- [ ] **Step 2: Run tests to verify pass**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx
```

Expected: all tests passing. If any fail, examine failure: is it a real regression (fix component) or assertion drift (adjust test). Do NOT loosen assertions to silence failures.

- [ ] **Step 3: Run full settings test suite + DrillInHeader test + ConfirmDialog test together**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && \
  npx vitest run \
    src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx \
    src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx \
    src/shared/extensions/__tests__/ConfirmDialog.test.tsx
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  git add packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx && \
  git commit -m "$(cat <<'EOF'
test(settings-v2): rewrite assertions for drill-in stack layout

Asserts root view (10 sections + 3 deep-links + WORKSPACE group), push/pop
mount lifecycle (mount on click, unmount on transitionend), Escape contract
(section→root pop, root no-op), reduced-motion path (no .transitioning),
Branding signpost. Mock useReducedMotion alongside existing
useSettingsScreen mock.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Browser smoke + ship

**Files:**
- None modified. Manual QA + final repo-wide validation.

Per design §D13 — "direct ship to main + browser smoke gate."

- [ ] **Step 1: Run editor dev server**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npm run dev
```

Open `http://localhost:5050`.

- [ ] **Step 2: Verify root view (golden path)**

In the editor, click the Settings sidebar tab. Verify:
- Header reads "Settings" (no subtitle).
- Snav lists 10 sections grouped under SITE / DISTRIBUTION / PLUMBING.
- WORKSPACE group below shows 3 deep-links (Domains / Members / Billing) styled as external (dashed border + ↗ icon).
- No section content visible (section screen unmounted).

- [ ] **Step 3: Verify push animation**

Click "General" in snav. Verify:
- Section slides in from right (~180ms).
- Root snav fades + slides 12% off-left during animation.
- Header flips to "General" with subtitle "Project metadata".
- DrillInHeader renders `Back to Settings` button + breadcrumb `Site / General`.
- Focus lands on breadcrumb-current span (use Tab key to verify next focus is something inside the section, not back button).

- [ ] **Step 4: Verify pop animation (back button)**

Click `Back to Settings`. Verify:
- Section slides out to right (~180ms).
- Root snav fades back in + slides to 0.
- Section unmounts after animation.
- Header reverts to "Settings".

- [ ] **Step 5: Verify Escape contract — clean section**

Click "SEO". Press Escape. Verify: pops to root (same as back button).

- [ ] **Step 6: Verify Escape contract — dirty section**

Click "General". Edit any field (e.g., site title). Press Escape. Verify:
- ConfirmDialog opens with "Discard changes?" / "Keep editing" / "Discard" buttons.
- Section is STILL visible behind dialog (not popped).

Press Escape AGAIN. Verify:
- Dialog closes.
- Section is STILL visible (NOT popped — Escape did not propagate to SettingsTab handler).

- [ ] **Step 7: Verify pending-nav guard**

Click "General". Edit any field. Click "SEO" in snav. Verify:
- ConfirmDialog opens.
- Click "Discard" — section transitions to SEO (push animation).
- Dirty count cleared.

- [ ] **Step 8: Verify pending-nav guard — Cancel path**

Click "Analytics". Edit any field. Click "Forms" in snav. Verify:
- ConfirmDialog opens.
- Click "Keep editing" — dialog closes; STILL on Analytics; dirty count preserved.

- [ ] **Step 9: Verify reduced-motion (macOS)**

System Preferences → Accessibility → Display → Reduce motion ON. Reload editor. Click "General". Verify:
- Transition is INSTANT (no slide).
- Click another section immediately — no input lock.
- Toggle reduced-motion OFF; reload; animations restored.

- [ ] **Step 10: Verify workspace deep-link**

Click "Domains" in WORKSPACE group. Verify: opens `http://localhost:3000/dashboard/sites/<projectId>/domains` in NEW tab. Click "Members" → opens `http://localhost:3000/dashboard/team` in new tab. Click "Billing" → opens `http://localhost:3000/dashboard/billing` in new tab.

- [ ] **Step 11: Run full editor test suite**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run
```

Expected: all pre-existing tests green + new DrillInHeader / ConfirmDialog / SettingsTab tests green. No regressions.

- [ ] **Step 12: Run editor typecheck + DS gates**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
cd /Users/shahg/Desktop/pencil/buildrik && pnpm run gate:ds-ssot 2>/dev/null || true
cd /Users/shahg/Desktop/pencil/buildrik && pnpm run gate:buildrick 2>/dev/null || true
```

Expected: typecheck zero errors. DS SSOT gate: no new ERROR-locks tripped (componentDuplicates / keyframeDuplicates / tokenAliasSSOT). buildrick baseline: per-panel growth lock not increased (settings panel may DECREASE due to bd-set-guard-* drain).

- [ ] **Step 13: Push to main (solo workflow)**

Per memory `feedback_solo_workflow.md` — direct to main, no PR.

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && \
  GIT_EXEC_PATH="/Applications/GitHub Desktop.app/Contents/Resources/app/git/libexec/git-core" \
  git push origin main
```

(Per memory `reference_git_binary_path.md` — `/usr/bin/git` is a stub on this machine; use GH Desktop's bundled git for HTTPS push.)

If push fails on auth, surface error and ask user before retrying.

---

## Self-Review

After writing the full plan, audit against the spec + apply codex pass-1 findings.

**1. Spec coverage check (`docs/designs/settings-v2.md` §3 + §6 + §7 + D1-D20):**

| Spec section | Where covered |
|---|---|
| §3 state machine (`isRoot`, `sectionMounted`, `transitioning`, render contract) | Task 3 (state) + Task 4 (render) |
| §3 unsaved-changes guard (ConfirmDialog swap) | Task 2 (cast) + Task 4 (JSX) + Task 6 (delete old) |
| §3 root stays mounted (codex P2 #7 reconciled) | Task 4 (root not conditionally rendered) + Task 5 (`.bd-set-screen--root.off` styling) |
| §5 Layout (root + section views, custom panel-h preserved) | Task 4 (header retains custom block) + Task 5 (CSS shape) |
| §6 dual-mount mechanism + race policy + reduced-motion | Task 3 (`navigate` / `navigateToRoot` / `handleStackTransitionEnd`) + Task 5 (CSS) |
| §7 DrillInHeader extensions (focusTarget + enableDocumentEscape + back-compat) | Task 1 (props + tests) |
| §7 ConfirmDialog onEscapeKeyDown cast | Task 2 |
| §7 SettingsTab.tsx revisions | Tasks 3 + 4 |
| §7 settings.css drain | Task 5 |
| §7 shared.tsx delete SettingsNavGuard | Task 6 (wildcard barrel handles auto-drop) |
| §7 SettingsTab.test.tsx rewrite | Task 7 |
| D3 focus contract on push/pop (codex P0 #2) | Task 1 (focusTarget) + Task 3 (lastFocusedRowRef + blur-before-flip) + Task 4 (renderRow captures ref + inert attr) |
| D4 Escape contract | Task 1 (`enableDocumentEscape=false`) + Task 2 (`onEscapeKeyDown`) + Task 3 (parent listener reads `screenIsDirtyRef`) |
| D5 TabFrame outer + reuse internals | Task 4 (TabFrame wrapper + custom panel-h) |
| D6 Savebar at SettingsTab level | Task 4 (savebar inside section screen, sticky bottom) |
| D7 silent-failure guards (codex P0 #1 + P1 #6) | Task 3 (`screenIsDirtyRef.current` reads + `navigateBetweenSections` for in-section nav) + Task 4 (ConfirmDialog onConfirm branched by isRoot+pendingNav) |
| D9 + D20 BLOCK during 180ms + reduced-motion safety | Task 3 (`prefersReducedMotion` branch) + Task 5 (`@media`) |
| D11 test rewrite in-place | Task 7 (rewrite same file path with REAL dirty-state driving) |
| D13 ship gate (browser smoke) | Task 8 |

No gaps detected.

**2. Codex review trail:**

**Pass 1 findings (resolved in plan revision pass-1):**

| Codex ID | Finding | Resolution |
|---|---|---|
| P0 #1 | Dirty-state propagation race | Task 3 step 1 `screenIsDirtyRef` + sync effect; navigate / Escape read ref. Pass-2 hardening: navigateToRoot also reads ref + routes through guard. |
| P0 #2 | `aria-hidden` flips with no focus handoff | Task 3 step 1 `lastFocusedRowRef`; navigate / navigateToRoot blur active element pre-flip; transitionend restores focus; Task 4 adds `inert` paired with `aria-hidden`. |
| P0 #3 | Section→section nav undefined | Task 3 `navigateBetweenSections` helper; Task 4 wires Branding `onJumpTo`; ConfirmDialog `onConfirm` quadrant branching. |
| P1 #4 | Test rewrite was fake coverage | Task 7 drives dirty via real `fireEvent.change` + `waitFor` for effect propagation; covers Cancel + Discard + pending-nav navigateBetweenSections. |
| P1 #5 | Task 6 barrel mechanics wrong | Wildcard verified; named-export edit step removed. |
| P1 #6 | ConfirmDialog `onConfirm` lacks invariant | Branched by `(isRoot, next)`; pass-2 added `console.warn` for unreachable quadrants. |
| P2 #7 | aria-hidden contract contradiction | Root stays mounted with `aria-hidden=true` + `inert`; section unmounts on pop; tests aligned. |
| P2 #8 | `.bd-set-root` rewrite pointless | Rule deleted instead. |

**Pass 2 findings (resolved in plan revision pass-2):**

| Codex ID | Finding | Resolution |
|---|---|---|
| Pass-2 P0 #1 (still partial) | DrillInHeader `isDirty` prop chain still reads stale state on back-button | navigateToRoot now reads `screenIsDirtyRef.current` first; routes to ConfirmDialog if dirty regardless of DrillInHeader's prop view. |
| Pass-2 P1 (new) | Section→section nav: DrillInHeader stays mounted, focus does not refire | Task 1 effect deps include `title`; new test case verifies refocus on title change. |
| Pass-2 P1 (new) | React 19 `inert` cast over-engineered | Cast removed; `inert={!isRoot}` direct boolean. |
| Pass-2 P1 #6 (still weak) | Unreachable ConfirmDialog branches silently fall through | `console.warn` added on unreachable invariant for telemetry during executor runs. |

**Pass 3 findings (resolved or accepted as known limitation in plan revision pass-3):**

| Codex ID | Finding | Resolution |
|---|---|---|
| Pass-3 P0 (deep) | Dirty-state race: BOTH screen's `onDirtyChange` effect AND parent's ref-mirror effect are post-render. A synchronous edit+click within the same microtask could see stale false. | **Accepted as known limitation.** Documented inline at the `screenIsDirtyRef` declaration. Unreachable for human input (browser event-loop separates keystroke from click). Architectural fix (synchronous publish via ref-prop on screens) deferred to separate arc — touches 4 screens + hook contract, out of v2 scope. |
| Pass-3 P1 (trivial) | `console.warn` fires AFTER state mutations, losing diagnostic context | Warn moved to top of `onConfirm`, before any setter. State snapshot includes `screenIsDirty: screenIsDirtyRef.current` + `guardOpen: true` for full pre-mutation context. |

**3. Placeholder scan:** zero "TBD" / "TODO" / "implement later" / "fill in details" / "similar to Task N" in this plan file. All code blocks have full implementation. All test cases have real assertions.

**4. Type consistency:**
- `focusTarget?: "back" | "breadcrumb-current"` — same in Task 1 props + Task 4 usage.
- `enableDocumentEscape?: boolean` — same.
- `navigate(id: InTabNavId)` — same shape across Task 3 + Task 4 callers.
- `navigateBetweenSections(id: InTabNavId)` — function declaration in Task 3, called by `navigate` / Branding `onJumpTo` (Task 4) / ConfirmDialog `onConfirm` (Task 4).
- `navigateToRoot(): void` — same.
- `handleStackTransitionEnd(e: React.TransitionEvent<HTMLDivElement>)` — same.
- `ConfirmDialog` props match across Task 2 + Task 4.
- `screenIsDirtyRef: MutableRefObject<boolean>` — declared in Task 3 step 1, read by navigate (step 2) + Escape handler (step 3).
- `lastFocusedRowRef: MutableRefObject<HTMLButtonElement | null>` — declared Task 3 step 1, written in Task 4 renderRow, read in Task 3 navigateToRoot transitionend.

No drift.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-10-settings-v2-drill-in-drawer.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task with two-stage review between tasks. Best for changes that span 5+ files with codex-revised contracts.

**2. Inline Execution** — execute tasks T1-T8 in this session via `superpowers:executing-plans`, batched with checkpoint reviews after T2 / T4 / T6.

Codex review of plan recommended before execution begins (user requested at handoff). Run `/codex` skill in consult mode against this plan; expect P0/P1 findings on: (a) `aria-hidden` correctness while `transitioning` (focus may be inside `aria-hidden=true` subtree mid-animation — codex will flag), (b) `dispatchTransform` test helper using `TransitionEvent` constructor — jsdom polyfill maturity, (c) memory `feedback_setter_closure_stale_state.md` risk in the `navigate` useCallback (closure captures `screenIsDirty`).

Which approach — subagent-driven or inline?
