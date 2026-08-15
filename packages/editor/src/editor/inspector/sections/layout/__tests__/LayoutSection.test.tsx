/**
 * LayoutSection (index) — collapsed preview string + advanced disclosure of the
 * Overflow / Visibility groups behind the MoreSettingsToggle.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LayoutSection } from "../index";

type Props = React.ComponentProps<typeof LayoutSection>;

function renderLayout(props: Partial<Props> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <LayoutSection styles={{}} onChange={onChange} isOpen={true} {...props} />
  );
  return { onChange, ...utils };
}

describe("LayoutSection — collapsed preview", () => {
  it("combines display and a non-static position", () => {
    renderLayout({ isOpen: false, styles: { display: "flex", position: "absolute" } });
    expect(screen.getByText("flex · absolute")).toBeInTheDocument();
  });

  it("omits a static position from the preview", () => {
    renderLayout({ isOpen: false, styles: { display: "block", position: "static" } });
    expect(screen.getByText("block")).toBeInTheDocument();
    expect(screen.queryByText(/static/)).not.toBeInTheDocument();
  });
});

describe("LayoutSection — advanced disclosure", () => {
  it("hides Overflow / Visibility groups until advancedExpanded", () => {
    renderLayout({ onAdvancedToggle: vi.fn() });
    expect(screen.queryByText("Overflow")).not.toBeInTheDocument();
    expect(screen.queryByText("Visibility & Float")).not.toBeInTheDocument();
  });

  it("reveals the Overflow + Visibility & Float groups when expanded", () => {
    renderLayout({ advancedExpanded: true, onAdvancedToggle: vi.fn() });
    expect(screen.getByText("Overflow")).toBeInTheDocument();
    expect(screen.getByText("Visibility & Float")).toBeInTheDocument();
  });

  it("renders the toggle only when onAdvancedToggle is supplied and fires it", () => {
    const onAdvancedToggle = vi.fn();
    renderLayout({ onAdvancedToggle });
    const toggle = screen.getByRole("button", { name: "Overflow & Visibility" });
    fireEvent.click(toggle);
    expect(onAdvancedToggle).toHaveBeenCalled();
  });

  it("omits the toggle entirely when onAdvancedToggle is absent", () => {
    renderLayout();
    expect(
      screen.queryByRole("button", { name: "Overflow & Visibility" })
    ).not.toBeInTheDocument();
  });
});
