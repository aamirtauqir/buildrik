/**
 * Field primitives + Popover/Menu — contract tests.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FormField, Popover, Menu, MenuItem, MenuGroup, MenuLabel } from "../index";
import { Button, Label, HelperText } from "flowbite-react";
import { BK_LABEL_CLASS, BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS } from "../labelTheme";

describe("FormField", () => {
  it("wires label, hint and control together", () => {
    render(
      <FormField label="Domain" hint="No protocol, no trailing slash">
        {(p) => <input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Domain");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("No protocol, no trailing slash")).toBeTruthy();
  });

  it("an error replaces the hint, is announced, and marks the control invalid", () => {
    render(
      <FormField label="Slug" hint="Lowercase" error="That slug is taken">
        {(p) => <input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Slug");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("That slug is taken");
    expect(screen.queryByText("Lowercase")).toBeNull();
  });

  it("marks required fields", () => {
    const { container } = render(<FormField label="Name" required>{(p) => <input {...p} />}</FormField>);
    expect(container.querySelector('label [aria-hidden="true"]')?.textContent).toBe("*");
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

describe("Label / HelperText overrides (labelTheme.ts)", () => {
  // Positive assertions on the resolved className — flowbite's own Label/
  // HelperText no longer need a contract test here (that's testing the
  // library, not our code); this only verifies OUR override strings survive
  // flowbite's twMerge and land on the real element.
  it("BK_LABEL_CLASS lands on the real <label>", () => {
    render(<Label htmlFor="x" className={BK_LABEL_CLASS}>Title</Label>);
    const label = screen.getByText("Title");
    expect(label.className).toMatch(/tw:text-gray-600/);
    expect(label.className).not.toMatch(/\btext-gray-900\b/);
  });

  it("BK_HELPER_CLASS neutralizes flowbite's default top margin", () => {
    render(<HelperText className={BK_HELPER_CLASS}>hint</HelperText>);
    const helper = screen.getByText("hint");
    expect(helper.className).toMatch(/tw:mt-0/);
    expect(helper.className).not.toMatch(/\bmt-2\b/);
  });

  it("BK_HELPER_ERROR_CLASS evicts flowbite's default red for the exact --bk-error-text match", () => {
    render(
      <HelperText color="failure" className={BK_HELPER_ERROR_CLASS}>
        bad
      </HelperText>,
    );
    const helper = screen.getByText("bad");
    expect(helper.className).toMatch(/tw:text-\[var\(--bk-error-text\)\]/);
    expect(helper.className).not.toMatch(/\btext-red-600\b/);
  });
});
