/**
 * Apply may not claim success over an unchanged canvas.
 *
 * `applyAiEdit` has always returned `{ applied, proposals }` — the number of
 * commands that actually reached the composer — and `onAccept` threw it away
 * and set `state: "applied"` unconditionally, inside a swallowed catch at that.
 *
 * The model regularly answers with a batch this editor cannot map. The server
 * labels exactly that case "No applicable change" and still ships
 * `commands: []` (server/trpc/routers/ai.ts:354), so the panel showed
 * "1 change proposed", then "✓ Applied", over a page nothing had touched.
 * Observed live on 2026-08-18 against a real OpenAI-backed run.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

const applyAiEdit = vi.fn();
/** Set to make the apply throw the way a bad element id does in the engine. */
let applyThrows = false;
vi.mock("../applySetStyle", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../applySetStyle");
  return {
    ...actual,
    applyAiEdit: (...a: unknown[]) => {
      if (applyThrows) throw new Error("bad element id");
      return applyAiEdit(...a);
    },
  };
});

const lastSubscribe: { onData?: (c: unknown) => void } = {};
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: {
      streamPrompt: {
        subscribe: (_i: unknown, obs: Record<string, (a: unknown) => void>) => {
          lastSubscribe.onData = obs.onData;
          return { unsubscribe: vi.fn() };
        },
      },
    },
  }),
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { AITab } from "../AITab";

function makeComposer() {
  const el = { getId: () => "el-1", getType: () => "heading" };
  return {
    elements: { getElement: () => el, getAllPages: () => [], getActivePage: () => ({ id: "p1", root: { id: "r" } }) },
    selection: { getAllSelected: () => [el], select: vi.fn() },
    styles: {},
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  } as never;
}

/** Drive one prompt to the point where the edit card is on screen. */
async function proposeEdit(container: HTMLElement) {
  const ta = container.querySelector("textarea")!;
  fireEvent.change(ta, { target: { value: "make the hero warmer" } });
  fireEvent.keyDown(ta, { key: "Enter" });
  act(() => {
    lastSubscribe.onData?.({
      type: "edit",
      edit: {
        target: "page",
        summary: "No applicable change",
        rows: [],
        applyOps: { preview: {}, commit: { commands: [] } },
      },
    });
    lastSubscribe.onData?.({ type: "done" });
  });
  return screen.findByRole("button", { name: "Apply changes" });
}

beforeEach(() => {
  applyAiEdit.mockReset();
  applyThrows = false;
});
afterEach(cleanup);

const mount = () =>
  render(
    <AITab composer={makeComposer()} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
  );

describe("AITab — Apply reports what actually happened", () => {
  it("does not say Applied when nothing reached the canvas", async () => {
    applyAiEdit.mockResolvedValue({ applied: 0, proposals: [] });
    const { container } = mount();
    const apply = await proposeEdit(container);

    /* Inside act + a flushed microtask: the handler is async, and clicking
       without letting its promise settle leaves a rejection Node reports as
       unhandled even though the component catches it. */
    await act(async () => {
      fireEvent.click(apply);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText(/Nothing to apply/)).toBeInTheDocument());
    expect(screen.queryByText("✓ Applied")).not.toBeInTheDocument();
  });

  it("says Applied when a command did land", async () => {
    applyAiEdit.mockResolvedValue({ applied: 1, proposals: [] });
    const { container } = mount();
    const apply = await proposeEdit(container);

    /* Inside act + a flushed microtask: the handler is async, and clicking
       without letting its promise settle leaves a rejection Node reports as
       unhandled even though the component catches it. */
    await act(async () => {
      fireEvent.click(apply);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText("✓ Applied")).toBeInTheDocument());
  });

  it("counts a proposed privileged action as something having happened", async () => {
    applyAiEdit.mockResolvedValue({ applied: 0, proposals: [{ actionId: "publish" }] });
    const { container } = mount();
    const apply = await proposeEdit(container);

    /* Inside act + a flushed microtask: the handler is async, and clicking
       without letting its promise settle leaves a rejection Node reports as
       unhandled even though the component catches it. */
    await act(async () => {
      fireEvent.click(apply);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText("✓ Applied")).toBeInTheDocument());
  });

  it("does not claim success when the apply threw", async () => {
    applyThrows = true;
    const { container } = mount();
    const apply = await proposeEdit(container);

    /* Inside act + a flushed microtask: the handler is async, and clicking
       without letting its promise settle leaves a rejection Node reports as
       unhandled even though the component catches it. */
    await act(async () => {
      fireEvent.click(apply);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText(/Nothing to apply/)).toBeInTheDocument());
  });
});
