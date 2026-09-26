/**
 * focus.ts — useFocusTrap / isModalOpen: dialog-role selectors.
 *
 * B-7 round 2: both `isTopmost()` (inside useFocusTrap's Escape handler) and
 * `isModalOpen()` query only `[role="dialog"][aria-modal="true"]`.
 * ReplaceAcrossDialog and AchievementPrompt predate OverlayMount and render
 * `role="alertdialog"` directly (the correct ARIA role for a confirm/warning
 * dialog) — invisible to both selectors. `isModalOpen()` is the F9 rule every
 * global shortcut handler checks before firing (C, ?, ⌘K, ⌘S, undo per
 * focus.ts's own doc comment); missing an open alertdialog meant those
 * shortcuts fired BEHIND it instead of standing down.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { useFocusTrap, isModalOpen } from "../focus";

function Harness({
  role,
  active,
  onEscape,
  testId,
}: {
  role: "dialog" | "alertdialog";
  active: boolean;
  onEscape: () => void;
  testId: string;
}) {
  const ref = useFocusTrap(active, onEscape);
  return (
    <div ref={ref} role={role} aria-modal="true" data-testid={testId}>
      <button>Inside</button>
    </div>
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isModalOpen", () => {
  it("true for an open role=dialog", () => {
    render(<Harness role="dialog" active onEscape={() => {}} testId="d" />);
    expect(isModalOpen()).toBe(true);
  });

  it("B-7: true for an open role=alertdialog too — global shortcuts must stand down while it's open", () => {
    render(<Harness role="alertdialog" active onEscape={() => {}} testId="d" />);
    expect(isModalOpen()).toBe(true);
  });

  it("false with nothing open", () => {
    expect(isModalOpen()).toBe(false);
  });
});

describe("useFocusTrap — Escape on an alertdialog", () => {
  it("fires when it's the only open dialog", () => {
    let escaped = 0;
    render(<Harness role="alertdialog" active onEscape={() => { escaped += 1; }} testId="d" />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(escaped).toBe(1);
  });

  /* Before the fix, isTopmost()'s `[role="dialog"]` query never matched the
     alertdialog container, so `dialogs.length === 0` was always true for it
     REGARDLESS of what else was open — Escape on the alertdialog would have
     fired even while buried under a real dialog. Stack a plain dialog on top
     and confirm the alertdialog underneath does NOT answer Escape. */
  it("does not answer Escape when a dialog is stacked on top of it", () => {
    let alertEscaped = 0;
    let dialogEscaped = 0;
    render(
      <>
        <Harness role="alertdialog" active onEscape={() => { alertEscaped += 1; }} testId="under" />
        <Harness role="dialog" active onEscape={() => { dialogEscaped += 1; }} testId="over" />
      </>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialogEscaped).toBe(1);
    expect(alertEscaped).toBe(0);
  });
});
