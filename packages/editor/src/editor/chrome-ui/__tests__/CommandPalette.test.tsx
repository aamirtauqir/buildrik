/**
 * CommandPalette — keyboard contract.
 *
 * Moved from `editor/ui/__tests__/organisms.test.tsx` (Task 6, flowbite
 * big-bang) when CommandPalette ported to chrome-ui — same describe block,
 * new home.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "../index";

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
