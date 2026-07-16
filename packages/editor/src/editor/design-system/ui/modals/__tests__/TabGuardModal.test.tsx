/**
 * TabGuardModal — the unsaved-changes guard shown when leaving a dirty
 * section. Standalone unit (DesignSystemTab wires it into the section switch).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TabGuardModal } from "../TabGuardModal";

function mount(over: Partial<React.ComponentProps<typeof TabGuardModal>> = {}) {
  const props = {
    changedTabs: ["Tokens"],
    onDiscard: vi.fn(),
    onKeep: vi.fn(),
    onSaveAndSwitch: vi.fn(),
    ...over,
  };
  const utils = render(<TabGuardModal {...props} />);
  return { ...utils, props };
}

// The body copy is split across text nodes by an inline <strong>, so assert
// on the normalized concatenated textContent rather than a single text node.
const normalized = (el: HTMLElement) => el.textContent?.replace(/\s+/g, " ").trim() ?? "";

describe("TabGuardModal — copy", () => {
  it("names the single changed tab and uses singular grammar", () => {
    const { container } = mount({ changedTabs: ["Tokens"] });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(normalized(container)).toContain("Tokens tab has unsaved changes");
    expect(screen.getByText("Discard Tokens")).toBeInTheDocument();
  });

  it("joins multiple tabs with 'and' and uses plural grammar", () => {
    const { container } = mount({ changedTabs: ["Tokens", "Styles"] });
    expect(normalized(container)).toContain("Tokens and Styles tabs have unsaved changes");
    expect(screen.getByText("Discard Tokens and Styles")).toBeInTheDocument();
  });
});

describe("TabGuardModal — actions", () => {
  it("Stay calls onKeep only", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Stay"));
    expect(props.onKeep).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
    expect(props.onSaveAndSwitch).not.toHaveBeenCalled();
  });

  it("Save and switch calls onSaveAndSwitch only", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Save and switch"));
    expect(props.onSaveAndSwitch).toHaveBeenCalledTimes(1);
    expect(props.onKeep).not.toHaveBeenCalled();
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it("Discard calls onDiscard only", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Discard Tokens"));
    expect(props.onDiscard).toHaveBeenCalledTimes(1);
    expect(props.onKeep).not.toHaveBeenCalled();
    expect(props.onSaveAndSwitch).not.toHaveBeenCalled();
  });
});

describe("TabGuardModal — focus", () => {
  it("focuses the Stay button on mount (safe default = don't lose work)", () => {
    mount();
    expect(screen.getByText("Stay").closest("button")).toHaveFocus();
  });
});
