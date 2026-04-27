/**
 * Phase 4 contract tests — verify PanelHeader adapter shim correctly bridges
 * legacy props onto the vibcoder SurfaceHead primitive.
 *
 * Strategy: bridge.
 *   title → vibcoder title (rendered in bd-surface-head__title).
 *   icon → vibcoder tag slot (rendered in bd-surface-head__tag).
 *   onPin/onHelp/onClose → buttons inside vibcoder SurfaceHead actions cluster.
 *   children → rendered inside actions cluster, BEFORE the action buttons.
 *   className → composed onto bd-surface-head root.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelHeader } from "../PanelHeader";

describe("PanelHeader adapter shim (bridge to vibcoder SurfaceHead)", () => {
  it("renders the vibcoder bd-surface-head root as <header>", () => {
    const { container } = render(<PanelHeader title="Build" />);
    const root = container.querySelector(".bd-surface-head");
    expect(root).not.toBeNull();
    expect(root?.tagName).toBe("HEADER");
  });

  it("renders title in bd-surface-head__title", () => {
    const { container } = render(<PanelHeader title="Pages" />);
    const titleEl = container.querySelector(".bd-surface-head__title");
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("Pages");
  });

  it("renders icon in bd-surface-head__tag slot", () => {
    const { container } = render(
      <PanelHeader
        title="Pages"
        icon={<svg data-testid="leading-icon" />}
      />,
    );
    const tagSlot = container.querySelector(".bd-surface-head__tag");
    expect(tagSlot).not.toBeNull();
    expect(tagSlot?.querySelector('[data-testid="leading-icon"]')).not.toBeNull();
  });

  it("does NOT render bd-surface-head__tag when no icon prop", () => {
    const { container } = render(<PanelHeader title="Pages" />);
    expect(container.querySelector(".bd-surface-head__tag")).toBeNull();
  });

  it("renders the actions cluster when onClose is set", () => {
    const { container } = render(
      <PanelHeader title="Pages" onClose={() => undefined} />,
    );
    expect(container.querySelector(".bd-surface-head__actions")).not.toBeNull();
  });

  it("does NOT render actions cluster when no callbacks/children", () => {
    const { container } = render(<PanelHeader title="Pages" />);
    expect(container.querySelector(".bd-surface-head__actions")).toBeNull();
  });

  it("onClose button fires onClose handler", () => {
    const onClose = vi.fn();
    render(<PanelHeader title="Pages" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("onPinToggle button fires handler + reflects isPinned via aria-pressed", () => {
    const onPinToggle = vi.fn();
    render(
      <PanelHeader title="Pages" isPinned onPinToggle={onPinToggle} />,
    );
    const pinBtn = screen.getByLabelText("Unpin panel");
    expect(pinBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(pinBtn);
    expect(onPinToggle).toHaveBeenCalledOnce();
  });

  it("onPinToggle aria-label = 'Pin panel' when not pinned", () => {
    render(
      <PanelHeader title="Pages" onPinToggle={() => undefined} />,
    );
    const pinBtn = screen.getByLabelText("Pin panel");
    expect(pinBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("onHelpClick button fires handler", () => {
    const onHelpClick = vi.fn();
    render(<PanelHeader title="Pages" onHelpClick={onHelpClick} />);
    fireEvent.click(screen.getByLabelText("Help"));
    expect(onHelpClick).toHaveBeenCalledOnce();
  });

  it("renders children inside actions cluster (e.g., draft chip)", () => {
    const { container } = render(
      <PanelHeader title="Pages" onClose={() => undefined}>
        <span data-testid="chip">Draft</span>
      </PanelHeader>,
    );
    const actions = container.querySelector(".bd-surface-head__actions");
    expect(actions?.querySelector('[data-testid="chip"]')).not.toBeNull();
  });

  it("forwards className onto bd-surface-head root", () => {
    const { container } = render(
      <PanelHeader title="Pages" className="extra-class" />,
    );
    const root = container.querySelector(".bd-surface-head") as HTMLElement;
    expect(root.className).toContain("extra-class");
  });

  it("renders all three action buttons when all callbacks are set", () => {
    render(
      <PanelHeader
        title="Pages"
        onPinToggle={() => undefined}
        onHelpClick={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Pin panel")).not.toBeNull();
    expect(screen.getByLabelText("Help")).not.toBeNull();
    expect(screen.getByLabelText("Close panel")).not.toBeNull();
  });
});
