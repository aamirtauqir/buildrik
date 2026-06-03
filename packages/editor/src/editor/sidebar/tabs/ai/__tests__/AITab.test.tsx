import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

// Capture the onData handler the hook registers so tests can drive the stream.
const lastSubscribe: { onData?: (chunk: unknown) => void } = {};
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: {
      streamPrompt: {
        subscribe: vi.fn((_input: unknown, cbs: { onData?: (c: unknown) => void }) => {
          lastSubscribe.onData = cbs.onData;
          return { unsubscribe: vi.fn() };
        }),
      },
    },
  }),
}));

import { AITab } from "../AITab";

/** Minimal composer mock with a single element already selected. */
function makeElementScopedComposer() {
  const el = {
    getId: () => "el-1",
    getType: () => "button",
    getAttribute: () => undefined,
  };
  return {
    selection: { getAllSelected: () => [el] },
    elements: {},
    on: () => {},
    off: () => {},
  } as never;
}

describe("AITab skeleton", () => {
  it("renders the empty thread message when no messages exist", () => {
    render(<AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Try a quick action or type a prompt to start/i)).toBeInTheDocument();
  });

  it("renders a composer textarea", () => {
    render(<AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Ask Claude/i)).toBeInTheDocument();
  });
});

describe("AITab — scope + composer wiring", () => {
  it("submitting a prompt locks the scope chip", () => {
    const { rerender, container } = render(
      <AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    rerender(<AITab composer={null} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(container.querySelector(".bd-ai-scope-lock")).toBeInTheDocument();
  });

  it("attaches the edit when edit + done arrive in one flush (streaming already false)", () => {
    // Regression: the sync effect read streamingMsgIdRef.current INSIDE the
    // setMessages updater, which runs after the synchronous `ref = null` on the
    // final (streaming=false) flush — dropping the chunk that carries the edit.
    // The edit + done arrive together, so the diff/Apply UI never rendered and
    // the canvas never changed. Binding the id locally fixes it.
    const composer = makeElementScopedComposer();
    const { container } = render(
      <AITab composer={composer} isPinned={false} onPinToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "duplicate this" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    // Element scope → style-command. Deliver edit then done in one act() flush,
    // mirroring the server yielding both before the SSE closes.
    act(() => {
      lastSubscribe.onData?.({
        type: "edit",
        edit: {
          target: "el-1",
          summary: "1 change",
          rows: [{ field: "duplicate", from: "", to: "this element" }],
          applyOps: { preview: {}, commit: { commands: [{ commandId: "duplicate-element", args: { elementId: "el-1" } }] } },
        },
      });
      lastSubscribe.onData?.({ type: "done" });
    });

    expect(screen.getByLabelText("Apply changes")).toBeInTheDocument();
  });
});
