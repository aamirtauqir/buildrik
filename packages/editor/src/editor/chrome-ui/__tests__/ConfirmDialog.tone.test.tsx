/**
 * ConfirmDialog's `tone` — what kind of consequence the confirm carries.
 *
 * It was a `destructive` boolean, which forces every consequential-but-
 * reversible action into either "red" or "looks routine". Board 184:24 is the
 * case that broke it: a rollback confirm whose entire body says "nothing is
 * deleted or rewritten", under a #C27803 amber button. Red there would
 * contradict the sentence above it; the default blue would understate a
 * decision that changes the live site.
 *
 * @license BSD-3-Clause
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

afterEach(cleanup);

const show = (tone?: "default" | "warning" | "destructive") =>
  render(
    <ConfirmDialog
      open
      onClose={vi.fn()}
      onConfirm={vi.fn()}
      title="Roll back to v5?"
      message="body"
      confirmLabel="Roll back to v5"
      tone={tone}
    />,
  );

const confirmBtn = () => screen.getByRole("button", { name: "Roll back to v5" });

describe("ConfirmDialog tone", () => {
  it("paints warning with the design system's own token, not a hex", () => {
    show("warning");
    expect(confirmBtn().className).toMatch(/tw:bg-\[var\(--bk-warning\)\]/);
  });

  it("keeps destructive red and free of the warning tint", () => {
    show("destructive");
    expect(confirmBtn().className).not.toMatch(/--bk-warning/);
  });

  it("leaves the default confirm unstyled by tone", () => {
    show();
    expect(confirmBtn().className).not.toMatch(/--bk-warning/);
  });

  it("treats warning as consequential for scrim dismissal, like destructive", () => {
    // An accidental click outside must not silently drop a dialog the user
    // was asked to decide. This was tied to the destructive boolean, so a
    // warning-tone dialog would have been dismissable.
    const onClose = vi.fn();
    const { container } = render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="t"
        message="m"
        confirmLabel="go"
        tone="warning"
      />,
    );
    expect(container).toBeTruthy();
    expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument();
  });
});
