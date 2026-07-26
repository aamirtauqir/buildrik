/**
 * Organisms — keyboard and focus contract.
 *
 * These are the tests that matter for overlays. A modal that looks right and
 * traps nobody is a modal that loses keyboard users the moment it opens.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Modal, CommandPalette, Drawer, RightPanel, Rail, RailItem, Topbar, Footer, Button } from "../index";

describe("Modal", () => {
  it("is a labelled dialog", () => {
    render(<Modal open onClose={() => {}} title="Delete 3 pages" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByText("Delete 3 pages")).toBeTruthy();
  });

  it("renders nothing when closed", () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("moves focus into the dialog on open", () => {
    render(
      <Modal open onClose={() => {}} title="Confirm" footer={<Button>Delete 3 pages</Button>} />,
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete 3 pages" }));
  });

  it("Escape closes", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Confirm" footer={<Button>Go</Button>} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("returns focus to the trigger when it closes", () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Modal open={open} onClose={() => setOpen(false)} title="T" footer={<Button>Inside</Button>} />
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Inside" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
  });

  it("scrim click closes by default and can be opted out of", () => {
    const onClose = vi.fn();
    const { rerender, container } = render(<Modal open onClose={onClose} title="A" />);
    fireEvent.mouseDown(container.ownerDocument.querySelector(".bk-scrim")!);
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Modal open onClose={onClose} title="A" dismissOnScrimClick={false} />);
    fireEvent.mouseDown(container.ownerDocument.querySelector(".bk-scrim")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CommandPalette", () => {
  const commands = [
    { id: "insert", label: "Insert section", kbd: "⌘I" },
    { id: "review", label: "Send for review", kbd: "⌘⇧R" },
    { id: "locked", label: "Publish", disabled: true },
    { id: "preview", label: "Preview", kbd: "⌘P" },
  ];

  it("filters as you type", () => {
    render(<CommandPalette open onClose={() => {}} commands={commands} onRun={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "send" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("matches anywhere in the label, not just the start", () => {
    // "preview" literally contains "review" — substring matching is the intent,
    // so a user typing a mid-word fragment still finds the command.
    render(<CommandPalette open onClose={() => {}} commands={commands} onRun={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "review" } });
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("arrow keys skip disabled commands", () => {
    render(<CommandPalette open onClose={() => {}} commands={commands} onRun={() => {}} />);
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const selected = screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true");
    expect(selected?.textContent).toContain("Preview");
  });

  it("Enter runs the highlighted command", () => {
    const onRun = vi.fn();
    render(<CommandPalette open onClose={() => {}} commands={commands} onRun={onRun} />);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "insert" }));
  });

  it("never runs a disabled command", () => {
    const onRun = vi.fn();
    render(
      <CommandPalette open onClose={() => {}} commands={[{ id: "x", label: "Nope", disabled: true }]} onRun={onRun} />,
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    fireEvent.click(screen.getByRole("option"));
    expect(onRun).not.toHaveBeenCalled();
  });

  it("shows an empty state instead of a blank box", () => {
    render(<CommandPalette open onClose={() => {}} commands={commands} onRun={() => {}} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzzz" } });
    expect(screen.getByText("No matching commands")).toBeTruthy();
  });

  it("keeps focus in the input while arrowing, so typing continues", () => {
    render(<CommandPalette open onClose={() => {}} commands={commands} onRun={() => {}} />);
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
  });
});

describe("Shell frames", () => {
  it("Drawer and RightPanel are labelled landmarks", () => {
    render(
      <>
        <Drawer title="Pages">rows</Drawer>
        <RightPanel title="Inspector">fields</RightPanel>
      </>,
    );
    expect(screen.getByRole("complementary", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Inspector" })).toBeTruthy();
  });

  it("Drawer grid layout is opt-in", () => {
    const { container } = render(<Drawer title="Media" layout="grid">tiles</Drawer>);
    expect(container.querySelector(".bk-drawer__body--grid")).toBeTruthy();
  });

  it("Rail marks the open tool with aria-current", () => {
    render(
      <Rail>
        <RailItem icon="+" label="Insert" active />
        <RailItem icon="L" label="Layers" />
      </Rail>,
    );
    expect(screen.getByRole("navigation", { name: "Editor tools" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Insert" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: "Layers" }).getAttribute("aria-current")).toBeNull();
  });

  it("icon-only rail items keep an accessible name", () => {
    render(
      <Rail>
        <RailItem icon="+" label="Insert" showLabel={false} />
      </Rail>,
    );
    expect(screen.getByRole("button", { name: "Insert" })).toBeTruthy();
  });

  it("Topbar and Footer are banner and contentinfo landmarks", () => {
    render(
      <>
        <Topbar>top</Topbar>
        <Footer>bottom</Footer>
      </>,
    );
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });
});
