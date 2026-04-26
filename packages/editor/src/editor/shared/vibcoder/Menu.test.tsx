import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Menu, MenuGroup, MenuLabel, MenuItem } from "./Menu";

describe("vibcoder Menu wrapper — base + sibling exports", () => {
  it("Menu renders <div role='menu'> with bd-menu class + children", () => {
    const { container } = render(
      <Menu>
        <MenuItem>Action</MenuItem>
      </Menu>,
    );
    const root = container.querySelector("div.bd-menu");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("menu");
  });

  it("MenuGroup renders <div role='group'> with bd-menu__group class", () => {
    const { container } = render(<MenuGroup>group content</MenuGroup>);
    const el = container.querySelector("div.bd-menu__group");
    expect(el).toBeTruthy();
    expect(el!.getAttribute("role")).toBe("group");
    expect(el!.textContent).toBe("group content");
  });

  it("MenuLabel renders <div> with bd-menu__label class", () => {
    const { container } = render(<MenuLabel>Section</MenuLabel>);
    const el = container.querySelector("div.bd-menu__label");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("Section");
  });

  it("forwards ref on Menu / MenuGroup / MenuLabel roots", () => {
    const menuRef = createRef<HTMLDivElement>();
    const groupRef = createRef<HTMLDivElement>();
    const labelRef = createRef<HTMLDivElement>();
    render(
      <Menu ref={menuRef}>
        <MenuLabel ref={labelRef}>Section</MenuLabel>
        <MenuGroup ref={groupRef}>
          <MenuItem>Item</MenuItem>
        </MenuGroup>
      </Menu>,
    );
    expect(menuRef.current).toBeInstanceOf(HTMLDivElement);
    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(labelRef.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("vibcoder MenuItem — base + state + slot composition", () => {
  it("renders <button role='menuitem'> with bd-menu__item base class + text slot", () => {
    const { container } = render(<MenuItem>Open</MenuItem>);
    const btn = container.querySelector("button.bd-menu__item");
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute("role")).toBe("menuitem");
    expect(btn!.getAttribute("type")).toBe("button");
    const text = btn!.querySelector(".bd-menu__text");
    expect(text!.textContent).toBe("Open");
  });

  it("OMITS .is-on + aria-checked when selected undefined (default)", () => {
    const { container } = render(<MenuItem>Open</MenuItem>);
    const btn = container.querySelector(".bd-menu__item")!;
    expect(btn.className).not.toContain("is-on");
    expect(btn.getAttribute("aria-checked")).toBeNull();
  });

  it("emits .is-on + aria-checked='true' when selected=true", () => {
    const { container } = render(<MenuItem selected>Open</MenuItem>);
    const btn = container.querySelector(".bd-menu__item")!;
    expect(btn.className).toContain("is-on");
    expect(btn.getAttribute("aria-checked")).toBe("true");
  });

  it("OMITS --danger modifier when danger undefined", () => {
    const { container } = render(<MenuItem>Open</MenuItem>);
    expect(container.querySelector(".bd-menu__item")!.className).not.toContain(
      "bd-menu__item--danger",
    );
  });

  it("emits .bd-menu__item--danger when danger=true", () => {
    const { container } = render(<MenuItem danger>Delete</MenuItem>);
    expect(container.querySelector(".bd-menu__item")!.className).toContain(
      "bd-menu__item--danger",
    );
  });

  it("renders icon slot when icon provided", () => {
    const { container } = render(
      <MenuItem icon={<span data-testid="ic" />}>Open</MenuItem>,
    );
    const iconSlot = container.querySelector(".bd-menu__icon");
    expect(iconSlot).toBeTruthy();
    expect(iconSlot!.getAttribute("aria-hidden")).toBe("true");
    expect(iconSlot!.querySelector("[data-testid='ic']")).toBeTruthy();
  });

  it("OMITS icon slot when icon undefined", () => {
    const { container } = render(<MenuItem>Open</MenuItem>);
    expect(container.querySelector(".bd-menu__icon")).toBeNull();
  });

  it("renders kbd slot when kbd provided", () => {
    const { container } = render(<MenuItem kbd="⌘O">Open</MenuItem>);
    const kbdSlot = container.querySelector(".bd-menu__kbd");
    expect(kbdSlot).toBeTruthy();
    expect(kbdSlot!.textContent).toBe("⌘O");
  });

  it("renders chevron slot when chevron provided", () => {
    const { container } = render(
      <MenuItem chevron={<span data-testid="ch" />}>Submenu</MenuItem>,
    );
    const chev = container.querySelector(".bd-menu__chevron");
    expect(chev).toBeTruthy();
    expect(chev!.getAttribute("aria-hidden")).toBe("true");
    expect(chev!.querySelector("[data-testid='ch']")).toBeTruthy();
  });

  it("forwards disabled prop + emits aria-disabled when disabled=true", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MenuItem disabled onClick={onClick}>
        Locked
      </MenuItem>,
    );
    const btn = container.querySelector(".bd-menu__item") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("fires caller onClick when not disabled", () => {
    const onClick = vi.fn();
    const { container } = render(<MenuItem onClick={onClick}>Open</MenuItem>);
    fireEvent.click(container.querySelector(".bd-menu__item")!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges caller className", () => {
    const { container } = render(<MenuItem className="extra">Open</MenuItem>);
    expect(container.querySelector(".bd-menu__item")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to <button>", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<MenuItem ref={ref}>Open</MenuItem>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("composes a full menu: label + groups + items with mixed slots", () => {
    const { container } = render(
      <Menu>
        <MenuLabel>File</MenuLabel>
        <MenuGroup>
          <MenuItem icon={<span />} kbd="⌘N">
            New
          </MenuItem>
          <MenuItem selected icon={<span />} kbd="⌘O">
            Open recent
          </MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuItem danger>Delete project</MenuItem>
        </MenuGroup>
      </Menu>,
    );
    const root = container.querySelector(".bd-menu")!;
    expect(root.querySelectorAll(".bd-menu__group").length).toBe(2);
    expect(root.querySelectorAll(".bd-menu__item").length).toBe(3);
    expect(root.querySelector(".is-on")!.textContent).toContain("Open recent");
    expect(root.querySelector(".bd-menu__item--danger")!.textContent).toContain(
      "Delete project",
    );
  });
});
