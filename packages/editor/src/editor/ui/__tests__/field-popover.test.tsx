/**
 * Field primitives + Popover/Menu — contract tests.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FormField, Input, Tag, Popover, Menu, MenuItem, MenuGroup, MenuLabel, Button, Cluster, HelperText } from "../index";

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
  const menu = (
    <Menu>
      <MenuGroup>
        <MenuLabel>Page</MenuLabel>
        <MenuItem kbd="F2">Rename</MenuItem>
        <MenuItem disabled>Duplicate</MenuItem>
      </MenuGroup>
      <MenuGroup>
        <MenuItem danger>Delete</MenuItem>
      </MenuGroup>
    </Menu>
  );

  it("opening it puts the keyboard inside — one tab stop, focus on the first item", () => {
    // Without this the arrow keys land on the trigger, which is not in the menu,
    // so a keyboard user opens the menu and is then stuck outside it.
    render(menu);
    expect(screen.getAllByRole("menuitem").filter((b) => b.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Rename/ }));
  });

  it("arrow movement crosses group boundaries and skips the disabled row", () => {
    render(menu);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Rename/ }));
  });

  it("autoFocus can be turned off for an always-on-screen menu", () => {
    render(
      <Menu autoFocus={false}>
        <MenuItem>Rename</MenuItem>
      </Menu>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it("skips disabled items and never fires them", () => {
    const onClick = vi.fn();
    render(
      <Menu>
        <MenuItem disabled onClick={onClick}>Duplicate</MenuItem>
      </Menu>,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("End jumps to the last item", () => {
    render(menu);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
  });

  it("a checkable item is a menuitemcheckbox, not a menuitem", () => {
    render(
      <Menu>
        <MenuItem selected>X-ray</MenuItem>
        <MenuItem selected={false}>Dev mode</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "X-ray" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Dev mode" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);
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
