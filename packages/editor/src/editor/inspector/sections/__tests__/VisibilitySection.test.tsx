/**
 * VisibilitySection — per-breakpoint show/hide toggles + hidden-count preview.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VisibilitySection } from "../VisibilitySection";

function renderVisibility(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <VisibilitySection styles={styles} onChange={onChange} isOpen={true} />
  );
  return { onChange, ...utils };
}

describe("VisibilitySection — rendering", () => {
  it("renders one toggle per breakpoint, all visible by default", () => {
    renderVisibility();
    for (const bp of ["Desktop", "Tablet", "Mobile"]) {
      const toggle = screen.getByRole("button", { name: `Visible on ${bp}` });
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("reflects a hidden breakpoint from --hide-* styles", () => {
    renderVisibility({ "--hide-mobile": "true" });
    expect(screen.getByRole("button", { name: "Hidden on Mobile" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "Visible on Desktop" })).toBeInTheDocument();
  });

  it("shows a 'hidden on N' preview when any breakpoint is hidden", () => {
    renderVisibility({ "--hide-mobile": "true", "--hide-tablet": "true" });
    expect(screen.getByText("hidden on 2")).toBeInTheDocument();
  });

  it("shows no preview when nothing is hidden", () => {
    renderVisibility();
    expect(screen.queryByText(/hidden on/)).not.toBeInTheDocument();
  });
});

describe("VisibilitySection — writes", () => {
  it("hiding a visible breakpoint writes --hide-<bp>='true'", () => {
    const { onChange } = renderVisibility();
    fireEvent.click(screen.getByRole("button", { name: "Visible on Desktop" }));
    expect(onChange).toHaveBeenCalledWith("--hide-desktop", "true");
  });

  it("showing a hidden breakpoint clears --hide-<bp>", () => {
    const { onChange } = renderVisibility({ "--hide-mobile": "true" });
    fireEvent.click(screen.getByRole("button", { name: "Hidden on Mobile" }));
    expect(onChange).toHaveBeenCalledWith("--hide-mobile", "");
  });
});
