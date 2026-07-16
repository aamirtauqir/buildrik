// @vitest-environment jsdom
/**
 * MilestoneSuggestionBanner.test.tsx — the inline auto-milestone banner's
 * edit FSM (start → save/cancel via Enter/Escape/blur), trigger→label map,
 * loading gating, and the reset-on-new-suggestion effect.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { MilestoneSuggestion } from "@/shared/hooks/useAutoMilestone";
import { MilestoneSuggestionBanner } from "../MilestoneSuggestionBanner";

function makeSuggestion(over: Partial<MilestoneSuggestion> = {}): MilestoneSuggestion {
  return {
    suggestedName: "Homepage hero polish",
    trigger: "mass_change",
    reasoning: "12 elements changed",
    ...over,
  } as MilestoneSuggestion;
}

function renderBanner(over: Partial<Parameters<typeof MilestoneSuggestionBanner>[0]> = {}) {
  const onAccept = vi.fn();
  const onDismiss = vi.fn();
  const onEdit = vi.fn();
  const utils = render(
    <MilestoneSuggestionBanner
      suggestion={makeSuggestion()}
      isLoading={false}
      onAccept={onAccept}
      onDismiss={onDismiss}
      onEdit={onEdit}
      {...over}
    />,
  );
  return { onAccept, onDismiss, onEdit, ...utils };
}

beforeEach(() => cleanup());

describe("MilestoneSuggestionBanner — display", () => {
  it("shows the suggested name + reasoning in read mode", () => {
    renderBanner();
    expect(screen.getByText("Homepage hero polish")).toBeInTheDocument();
    expect(screen.getByText("12 elements changed")).toBeInTheDocument();
  });

  it.each([
    ["page_added", "New page added"],
    ["element_deleted", "Element deleted"],
    ["mass_change", "Significant changes"],
    ["checkpoint_threshold", "Editing session progress"],
  ] as const)("maps the %s trigger to its label", (trigger, label) => {
    renderBanner({ suggestion: makeSuggestion({ trigger }) });
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("MilestoneSuggestionBanner — accept + loading", () => {
  it("accepts with null (use the suggested name as-is)", () => {
    const { onAccept } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onAccept).toHaveBeenCalledWith(null);
  });

  it("disables Save and shows a spinner glyph while loading", () => {
    renderBanner({ isLoading: true });
    const save = screen.getByRole("button", { name: "..." });
    expect(save).toBeDisabled();
  });

  it("dismisses via the Dismiss button", () => {
    const { onDismiss } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("MilestoneSuggestionBanner — edit FSM", () => {
  it("enters edit mode with the suggested name prefilled", () => {
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Homepage hero polish");
  });

  it("commits an edited name on Enter", () => {
    const { onEdit } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "  New milestone  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    // Trimmed before commit.
    expect(onEdit).toHaveBeenCalledWith("New milestone");
    // Exits edit mode.
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("commits via the Save button in edit mode", () => {
    const { onEdit } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onEdit).toHaveBeenCalledWith("Renamed");
  });

  it("does not commit an empty/whitespace name", () => {
    const { onEdit } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("cancels on Escape, restoring the original name and read mode", () => {
    const { onEdit } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "throwaway" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Homepage hero polish")).toBeInTheDocument();
  });

  it("resets edit state when a new suggestion arrives", () => {
    const { rerender } = renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    rerender(
      <MilestoneSuggestionBanner
        suggestion={makeSuggestion({ suggestedName: "Fresh idea" })}
        isLoading={false}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    // Back to read mode showing the new name.
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Fresh idea")).toBeInTheDocument();
  });
});
