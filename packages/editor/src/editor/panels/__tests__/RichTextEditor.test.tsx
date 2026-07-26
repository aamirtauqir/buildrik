/**
 * RichTextEditor tests — toolbar command dispatch.
 *
 * RichTextEditor is a pure toolbar: every control funnels into the
 * `onCommand(command, value?)` prop. The canvas consumer binds that to
 * document.execCommand — jsdom has no execCommand, so a stub is installed
 * up front (defensive; the component itself never touches it).
 *
 * Coverage:
 *   - Format buttons (bold/italic/underline/strikeThrough)
 *   - List / align / indent groups
 *   - Heading + font-size selects (formatBlock / fontSize)
 *   - Active-state reflection (accent background on active button)
 *   - Link popover: apply, empty-guard, unlink
 *   - Color popovers: foreColor / hiliteColor
 *   - Clear formatting (removeFormat)
 *
 * Radix note: Tooltip.Root throws without a TooltipProvider ancestor
 * (mounted at the app shell in prod) — tests wrap the component in one.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { RichTextEditor } from "../RichTextEditor";

beforeAll(() => {
  // jsdom ships no document.execCommand. RichTextEditor's consumer wires
  // onCommand → document.execCommand; stub it so nothing explodes if any
  // code path (now or later) reaches for it.
  document.execCommand = vi.fn().mockReturnValue(true);
});

afterEach(() => {
  cleanup();
});

function renderEditor(props: Partial<React.ComponentProps<typeof RichTextEditor>> = {}) {
  const onCommand = vi.fn();
  render(
    <TooltipProvider>
      <RichTextEditor onCommand={onCommand} {...props} />
    </TooltipProvider>
  );
  return onCommand;
}

describe("RichTextEditor — format buttons", () => {
  it("dispatches bold/italic/underline/strikeThrough on click", () => {
    const onCommand = renderEditor();
    const cases: Array<[string, string]> = [
      ["B", "bold"],
      ["I", "italic"],
      ["U", "underline"],
      ["S", "strikeThrough"],
    ];
    for (const [icon, command] of cases) {
      fireEvent.click(screen.getByText(icon));
      expect(onCommand).toHaveBeenLastCalledWith(command);
    }
    expect(onCommand).toHaveBeenCalledTimes(4);
  });

  it("dispatches list commands", () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByText("•"));
    expect(onCommand).toHaveBeenLastCalledWith("insertUnorderedList");
    fireEvent.click(screen.getByText("1."));
    expect(onCommand).toHaveBeenLastCalledWith("insertOrderedList");
  });

  it("dispatches align commands (center + justify share the ⬌ glyph)", () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByText("⬅"));
    expect(onCommand).toHaveBeenLastCalledWith("justifyLeft");
    fireEvent.click(screen.getByText("➡"));
    expect(onCommand).toHaveBeenLastCalledWith("justifyRight");
    // PIN: Align Center and Justify both render "⬌" — DOM order is
    // [justifyCenter, justifyFull] per the toolbarGroups config.
    const ambiguous = screen.getAllByText("⬌");
    expect(ambiguous).toHaveLength(2);
    fireEvent.click(ambiguous[0]);
    expect(onCommand).toHaveBeenLastCalledWith("justifyCenter");
    fireEvent.click(ambiguous[1]);
    expect(onCommand).toHaveBeenLastCalledWith("justifyFull");
  });

  it("dispatches indent/outdent", () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByText("⇤"));
    expect(onCommand).toHaveBeenLastCalledWith("outdent");
    fireEvent.click(screen.getByText("⇥"));
    expect(onCommand).toHaveBeenLastCalledWith("indent");
  });

  it("dispatches removeFormat from the clear-formatting button", () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByText("✕"));
    expect(onCommand).toHaveBeenCalledWith("removeFormat");
  });
});

describe("RichTextEditor — selects", () => {
  it("heading select dispatches formatBlock with the chosen tag", () => {
    const onCommand = renderEditor();
    const [headingSelect] = screen.getAllByRole("combobox");
    fireEvent.change(headingSelect, { target: { value: "h2" } });
    expect(onCommand).toHaveBeenCalledWith("formatBlock", "h2");
  });

  it("font-size select dispatches fontSize with the execCommand size index", () => {
    const onCommand = renderEditor();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "5" } });
    expect(onCommand).toHaveBeenCalledWith("fontSize", "5");
  });
});

describe("RichTextEditor — active-state reflection", () => {
  it("active format button gets the accent background, inactive stays transparent", () => {
    renderEditor({ activeStyles: { bold: true } });
    const boldBtn = screen.getByText("B");
    const italicBtn = screen.getByText("I");
    expect(boldBtn.getAttribute("style")).toContain("var(--bk-accent)");
    expect(italicBtn.getAttribute("style")).not.toContain("var(--bk-accent)");
  });
});

describe("RichTextEditor — link popover", () => {
  it("Apply dispatches createLink with the typed URL and closes the popover", async () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByTitle("Insert Link"));
    const input = await screen.findByPlaceholderText("https://...");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Apply"));
    expect(onCommand).toHaveBeenCalledWith("createLink", "https://example.com");
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("https://...")).toBeNull();
    });
  });

  it("Apply with an empty URL is a no-op (popover stays open)", async () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByTitle("Insert Link"));
    await screen.findByPlaceholderText("https://...");
    fireEvent.click(screen.getByText("Apply"));
    expect(onCommand).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("https://...")).toBeTruthy();
  });

  it("Remove dispatches unlink", async () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByTitle("Insert Link"));
    const remove = await screen.findByText("Remove");
    fireEvent.click(remove);
    expect(onCommand).toHaveBeenCalledWith("unlink");
  });
});

describe("RichTextEditor — color popovers", () => {
  it("text color picker dispatches foreColor", async () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByLabelText("Change text color"));
    const picker = await screen.findByLabelText("Text Color");
    fireEvent.change(picker, { target: { value: "#ff0000" } });
    expect(onCommand).toHaveBeenCalledWith("foreColor", "#ff0000");
  });

  it("highlight color picker dispatches hiliteColor", async () => {
    const onCommand = renderEditor();
    fireEvent.click(screen.getByLabelText("Change background highlight color"));
    const picker = await screen.findByLabelText("Highlight Color");
    fireEvent.change(picker, { target: { value: "#00ff00" } });
    expect(onCommand).toHaveBeenCalledWith("hiliteColor", "#00ff00");
  });
});
