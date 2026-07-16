/**
 * PanelHeader / HeaderActions tests — title/subtitle rendering, conditional
 * action buttons, pin aria-pressed state, and click dispatch.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PanelHeader, HeaderActions } from "../PanelHeader";

afterEach(cleanup);

describe("PanelHeader", () => {
  it("renders title and subtitle through SurfaceHead", () => {
    render(<PanelHeader title="Layers" subtitle="42 blocks · 6 categories" />);
    expect(screen.getByText("Layers")).toBeInTheDocument();
    expect(screen.getByText("42 blocks · 6 categories")).toBeInTheDocument();
  });

  it("renders no action buttons when no callbacks are provided", () => {
    render(<PanelHeader title="Pages" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders only the buttons whose callbacks exist", () => {
    render(<PanelHeader title="Build" onClose={() => {}} />);
    expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
    expect(screen.queryByLabelText("Help")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pin panel")).not.toBeInTheDocument();
  });

  it("dispatches pin/help/close clicks to their callbacks", () => {
    const onPinToggle = vi.fn();
    const onHelpClick = vi.fn();
    const onClose = vi.fn();
    render(
      <PanelHeader
        title="Build"
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText("Pin panel"));
    fireEvent.click(screen.getByLabelText("Help"));
    fireEvent.click(screen.getByLabelText("Close panel"));

    expect(onPinToggle).toHaveBeenCalledTimes(1);
    expect(onHelpClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("reflects the pinned state in aria-pressed and label", () => {
    const { rerender } = render(
      <PanelHeader title="Build" isPinned={false} onPinToggle={() => {}} />
    );
    expect(screen.getByLabelText("Pin panel")).toHaveAttribute("aria-pressed", "false");

    rerender(<PanelHeader title="Build" isPinned onPinToggle={() => {}} />);
    const unpin = screen.getByLabelText("Unpin panel");
    expect(unpin).toHaveAttribute("aria-pressed", "true");
  });

  it("renders extra children (e.g. a draft chip) before the action cluster", () => {
    render(
      <PanelHeader title="Pages" onClose={() => {}}>
        <span data-testid="draft-chip">Draft</span>
      </PanelHeader>
    );
    expect(screen.getByTestId("draft-chip")).toBeInTheDocument();
    expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
  });
});

describe("HeaderActions (standalone)", () => {
  it("renders as an independent cluster with style override", () => {
    const onClose = vi.fn();
    const { container } = render(
      <HeaderActions onClose={onClose} style={{ marginTop: 8 }} />
    );

    const cluster = container.firstElementChild as HTMLElement;
    expect(cluster.style.marginTop).toBe("8px");

    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing clickable when empty", () => {
    render(<HeaderActions />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
