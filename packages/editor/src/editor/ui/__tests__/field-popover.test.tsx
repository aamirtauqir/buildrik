/**
 * Field primitives + Popover/Menu — contract tests.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FormField, Input, Tag, Popover, Menu, Button, Cluster, HelperText } from "../index";

describe("FormField", () => {
  it("wires label, hint and control together", () => {
    render(
      <FormField label="Domain" hint="No protocol, no trailing slash">
        {(p) => <Input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Domain");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("No protocol, no trailing slash")).toBeTruthy();
  });

  it("an error replaces the hint, is announced, and marks the control invalid", () => {
    render(
      <FormField label="Slug" hint="Lowercase" error="That slug is taken">
        {(p) => <Input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Slug");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("That slug is taken");
    expect(screen.queryByText("Lowercase")).toBeNull();
  });

  it("marks required fields", () => {
    const { container } = render(<FormField label="Name" required>{(p) => <Input {...p} />}</FormField>);
    expect(container.querySelector(".bk-label__required")).toBeTruthy();
  });
});

describe("Tag", () => {
  it("names what its remove button removes", () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Pricing</Tag>);
    fireEvent.click(screen.getByRole("button", { name: "Remove Pricing" }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("Popover", () => {
  function Harness({ onClose }: { onClose: () => void }) {
    return (
      <Popover open onClose={onClose} trigger={<Button>Open</Button>} label="Options">
        <p>panel</p>
      </Popover>
    );
  }

  it("is a labelled dialog next to its trigger", () => {
    render(<Harness onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Options" })).toBeTruthy();
  });

  it("closes on Escape and on a click outside", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("a click inside does not close it", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.pointerDown(screen.getByText("panel"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Menu", () => {
  const items = [
    { id: "rename", label: "Rename", kbd: "F2" },
    { id: "dup", label: "Duplicate", disabled: true },
    { id: "del", label: "Delete", destructive: true },
  ];

  it("is one tab stop with arrow-key movement", () => {
    render(<Menu items={items} onSelect={() => {}} />);
    const buttons = screen.getAllByRole("menuitem");
    expect(buttons.filter((b) => b.getAttribute("tabindex") === "0")).toHaveLength(1);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
  });

  it("skips disabled items and never fires them", () => {
    const onSelect = vi.fn();
    render(<Menu items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("End jumps to the last item", () => {
    render(<Menu items={items} onSelect={() => {}} />);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
  });
});

describe("Cluster / HelperText", () => {
  it("render their modifiers", () => {
    const { container } = render(
      <Cluster justify="between">
        <HelperText error>bad</HelperText>
      </Cluster>,
    );
    expect(container.querySelector(".bk-cluster--between")).toBeTruthy();
    expect(container.querySelector(".bk-helper--error")).toBeTruthy();
  });
});
