/**
 * Board 35 (Inspector v4 · AI column, 7995:210503) — the AI column opened from
 * the Inspector's ✦ on one element, before anything has been asked:
 *
 *   ‹ Inspector
 *   Scope: <element>
 *   [ What would you like to change? ]      (144-tall prompt box)
 *   [ Make it more concise ] [ Try a warmer tone ] [ Suggest a headline ]
 *   Returning keeps your Inspector tab, scroll and state.
 *
 * No "AI" title row, no ✕, no Plan changes button, no run note. Once a run
 * starts the panel is the run's (boards 4418:*), and the prompt the user typed
 * is the same field — it is not remounted.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const lastSubscribe: {
  input?: { prompt?: string; scope?: unknown };
  onError?: (err: { message?: string; data?: { code?: string } | null }) => void;
} = {};
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: {
      streamPrompt: {
        subscribe: vi.fn((input: unknown, cbs: { onError?: (e: { message?: string }) => void }) => {
          lastSubscribe.input = input as typeof lastSubscribe.input;
          lastSubscribe.onError = cbs.onError;
          return { unsubscribe: vi.fn() };
        }),
      },
    },
  }),
}));

import { AITab } from "../AITab";
import { ToastProvider } from "@/editor/chrome-ui";

function headingComposer() {
  const el = { getId: () => "h-1", getType: () => "heading", getAttribute: () => undefined };
  return {
    selection: { getAllSelected: () => [el] },
    elements: {},
    on: () => {},
    off: () => {},
    emit: () => {},
  } as never;
}

const renderColumn = (onBack = vi.fn(), onClose = vi.fn()) =>
  render(
    <AITab composer={headingComposer()} isExpanded={false} onExpandToggle={vi.fn()} onClose={onClose} onBack={onBack} />,
    { wrapper: ToastProvider },
  );

describe("AI column — board 35", () => {
  it("draws the board's five parts, in order, and nothing else of the old header", () => {
    renderColumn();
    const panel = screen.getByTestId("ai-panel");
    const text = panel.textContent ?? "";
    const order = [
      "‹ Inspector",
      "Scope: Heading",
      "Make it more concise",
      "Try a warmer tone",
      "Suggest a headline",
      "Returning keeps your Inspector tab, scroll and state.",
    ].map((s) => text.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(screen.getByPlaceholderText("What would you like to change?")).toBeTruthy();
    expect(screen.getByTestId("ai-scope-text").textContent).toBe("Scope: Heading");

    expect(screen.queryByTestId("ai-header")).toBeNull();
    expect(screen.queryByRole("button", { name: "Close AI" })).toBeNull();
    expect(screen.queryByTestId("ai-plan-changes")).toBeNull();
    expect(screen.queryByTestId("ai-scope-note")).toBeNull();
  });

  it("‹ Inspector goes back", () => {
    const onBack = vi.fn();
    renderColumn(onBack);
    fireEvent.click(screen.getByRole("button", { name: "Back to Inspector" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("a suggestion runs as the prompt on the element", () => {
    renderColumn();
    fireEvent.click(screen.getByRole("button", { name: "Try a warmer tone" }));
    expect(lastSubscribe.input?.prompt).toBe("Try a warmer tone");
    expect(lastSubscribe.input?.scope).toMatchObject({ kind: "element", id: "h-1" });
  });

  it("Enter in the prompt runs it; the typed prompt survives into the run's states", async () => {
    renderColumn();
    const field = screen.getByPlaceholderText("What would you like to change?") as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: "shorter please" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(lastSubscribe.input?.prompt).toBe("shorter please");
    await act(async () => {
      lastSubscribe.onError?.({ message: "Stream failed", data: { code: "INTERNAL_SERVER_ERROR" } });
    });
    /* Board 4418:106919 takes over — with its ✕ — and the field kept the text. */
    expect(screen.getByTestId("ai-state-failed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close AI" })).toBeTruthy();
    expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe("shorter please");
    expect(document.querySelector("textarea")).toBe(field);
  });
});

/* L5-012: a suggestion never goes through the field, and the failure swaps
   the column composer for the band one — so "Your prompt is still here" sat
   over an empty field. The field now holds the prompt that was sent. */
describe("AI column — failed suggestion", () => {
  it("puts the sent suggestion in the field under 'Your prompt is still here'", async () => {
    renderColumn();
    fireEvent.click(screen.getByRole("button", { name: "Make it more concise" }));
    await act(async () => {
      lastSubscribe.onError?.({ message: "Stream failed", data: { code: "INTERNAL_SERVER_ERROR" } });
    });
    expect(screen.getByText(/Your prompt is still here/)).toBeTruthy();
    expect((screen.getByTestId("ai-prompt-input") as HTMLTextAreaElement).value).toBe("Make it more concise");
  });
});
