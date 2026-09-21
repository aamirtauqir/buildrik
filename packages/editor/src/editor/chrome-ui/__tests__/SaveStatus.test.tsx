/**
 * SaveStatus — contract tests against the Figma component (697:461).
 *
 * Moved from `editor/ui/__tests__/topbar.test.tsx` (Task 6, flowbite
 * big-bang) when SaveStatus ported to chrome-ui. `.bk-save`/`.bk-save__ago`
 * class-selector queries rewritten to structural DOM queries — the
 * component's own root/stamp shape (single root element, stamp as its last
 * child when present) is the stable contract now that the classnames
 * carrying it are gone (Task 6 "assert the applied utility, not a deleted
 * implementation class" rule).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaveStatus } from "../SaveStatus";

describe("SaveStatus", () => {
  it.each([
    ["saving", "Saving…"],
    ["unsaved", "Unsaved changes"],
    ["conflict", "Conflict — reload"],
    /* Not "saved locally" — for a dashboard-backed site nothing is written to
       the device and nothing replays on reconnect. Read live while offline,
       this pill promised a local copy while the announcement beside it said
       "changes not saved". */
    ["offline", "Offline — not saved"],
  ] as const)("renders the %s truth", (state, copy) => {
    render(<SaveStatus state={state} />);
    expect(screen.getByText(copy)).toBeTruthy();
  });

  // eng D5 (regression): SaveStatus is presentation-only — the topbar's single
  // announcement region speaks; a second live region here double-announces.
  it("carries NO live semantics of its own", () => {
    const { container, rerender } = render(<SaveStatus state="saved" savedAt={Date.now()} />);
    rerender(<SaveStatus state="conflict" />);
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByText("Conflict — reload")).toBeTruthy();
  });

  it("formats the saved timestamp", () => {
    const { container } = render(<SaveStatus state="saved" savedAt={Date.now() - 120_000} />);
    expect(container.textContent).toBe("Saved · 2m ago");
  });

  // T8 compact tier 2: the timestamp is the bar's first concession, so it has to
  // be droppable on its own — hence its own element, with "Saved" left behind.
  it("keeps the timestamp in its own element so the compact tier can drop it", () => {
    const { container } = render(<SaveStatus state="saved" savedAt={Date.now() - 120_000} />);
    const root = container.firstElementChild!;
    const stamp = root.lastElementChild!;
    expect(stamp.textContent).toBe(" · 2m ago");
    stamp.remove();
    expect(root.textContent).toBe("Saved");
  });

  it("no timestamp yet → 'Saved' alone, with nothing to drop", () => {
    const { container } = render(<SaveStatus state="saved" />);
    const root = container.firstElementChild!;
    expect(root.textContent).toBe("Saved");
    // Only the dot indicator — no separate stamp element.
    expect(root.children).toHaveLength(1);
  });

  // B2 — Save pill → History: the pill is one control with three doors.
  // Without any click handler every state renders as a span — a button that
  // does nothing teaches distrust.
  it("renders as a span (not a button) when no click handler is wired", () => {
    const { container } = render(<SaveStatus state="saved" />);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.querySelector("button")).toBeNull();
  });

  // `saved` with onOpenSaveMenu → button, click opens history, NOT retry.
  it("`saved` with onOpenSaveMenu → button that opens history", () => {
    const onOpenSaveMenu = vi.fn();
    const onRetry = vi.fn();
    render(
      <SaveStatus
        state="saved"
        onOpenSaveMenu={onOpenSaveMenu}
        onRetry={onRetry}
      />
    );
    const btn = screen.getByRole("button", { name: /open save history/i });
    fireEvent.click(btn);
    expect(onOpenSaveMenu).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  // `saving` with onOpenSaveMenu → button, click opens history.
  it("`saving` with onOpenSaveMenu → button that opens history", () => {
    const onOpenSaveMenu = vi.fn();
    render(<SaveStatus state="saving" onOpenSaveMenu={onOpenSaveMenu} />);
    fireEvent.click(screen.getByRole("button", { name: /open save history/i }));
    expect(onOpenSaveMenu).toHaveBeenCalledTimes(1);
  });

  // `unsaved` with both handlers → retry wins (more useful than history).
  it("`unsaved` with both onRetry and onOpenSaveMenu → retry wins", () => {
    const onOpenSaveMenu = vi.fn();
    const onRetry = vi.fn();
    render(
      <SaveStatus
        state="unsaved"
        onRetry={onRetry}
        onOpenSaveMenu={onOpenSaveMenu}
      />
    );
    const btn = screen.getByRole("button", { name: /save now/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onOpenSaveMenu).not.toHaveBeenCalled();
  });

  // `unsaved` with onRetry only → retry path.
  it("`unsaved` with onRetry only → retry button", () => {
    const onRetry = vi.fn();
    render(<SaveStatus state="unsaved" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /save now/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // `unsaved` with onOpenSaveMenu only (no retry wired) → pill stays a span.
  // Without a retry handler there is nothing to do; a button that does
  // nothing teaches distrust. Callers wire both handlers in practice, so
  // the "history only" path is intentionally unreachable here.
  it("`unsaved` with onOpenSaveMenu only → span, no button", () => {
    const onOpenSaveMenu = vi.fn();
    const { container } = render(
      <SaveStatus state="unsaved" onOpenSaveMenu={onOpenSaveMenu} />
    );
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.querySelector("button")).toBeNull();
  });

  // `error` with onRetry → retry button, NEVER history.
  it("`error` with onRetry → retry button (history never wires)", () => {
    const onRetry = vi.fn();
    const onOpenSaveMenu = vi.fn();
    render(
      <SaveStatus
        state="error"
        onRetry={onRetry}
        onOpenSaveMenu={onOpenSaveMenu}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /retry save now/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onOpenSaveMenu).not.toHaveBeenCalled();
  });

  // `conflict` — pill stays non-interactive. The conflict dialog is opened
  // by a separate handler at the container level, not by clicking the pill.
  it("`conflict` renders as a span even when handlers are wired", () => {
    const onRetry = vi.fn();
    const onOpenSaveMenu = vi.fn();
    const { container } = render(
      <SaveStatus
        state="conflict"
        onRetry={onRetry}
        onOpenSaveMenu={onOpenSaveMenu}
      />
    );
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.querySelector("button")).toBeNull();
  });

  // `offline` — pill is a span with a tooltip. No click handler ever wins.
  it("`offline` renders as a span with offline tooltip, no button", () => {
    const onRetry = vi.fn();
    const onOpenSaveMenu = vi.fn();
    const { container } = render(
      <SaveStatus
        state="offline"
        onRetry={onRetry}
        onOpenSaveMenu={onOpenSaveMenu}
      />
    );
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.querySelector("button")).toBeNull();
    expect(
      container.querySelector('[title*="offline" i]')
    ).toBeTruthy();
  });

  // aria-label differentiation: visual copy is "Saved" for both doors, the
  // accessible name distinguishes save-now from open-history.
  it("distinguishes save-now from open-history via aria-label", () => {
    const { rerender } = render(
      <SaveStatus state="unsaved" onRetry={vi.fn()} />
    );
    expect(
      screen.getByRole("button", { name: /save now/i }).getAttribute("aria-label")
    ).toMatch(/save now/i);

    rerender(<SaveStatus state="saved" onOpenSaveMenu={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /open save history/i }).getAttribute("aria-label")
    ).toMatch(/open save history/i);
  });
});
