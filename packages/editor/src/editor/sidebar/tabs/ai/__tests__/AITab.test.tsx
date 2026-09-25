import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

// Capture the onData handler the hook registers so tests can drive the stream.
const lastSubscribe: {
  input?: { scope?: { kind?: string; elements?: unknown[] }; intent?: string };
  onData?: (chunk: unknown) => void;
  onError?: (err: { message?: string; data?: { code?: string } | null }) => void;
} = {};
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: {
      streamPrompt: {
        subscribe: vi.fn((input: unknown, cbs: { onData?: (c: unknown) => void; onError?: (e: { message?: string; data?: { code?: string } | null }) => void }) => {
          lastSubscribe.input = input as typeof lastSubscribe.input;
          lastSubscribe.onData = cbs.onData;
          lastSubscribe.onError = cbs.onError;
          return { unsubscribe: vi.fn() };
        }),
      },
    },
  }),
}));

import { AITab } from "../AITab";
import { ToastProvider } from "@/editor/chrome-ui";

// AITab now uses useToast (via the AI action gate), so it must render inside a
// ToastProvider. The `wrapper` option also applies to rerender automatically.
const renderWithToast = (ui: Parameters<typeof render>[0]) =>
  render(ui, { wrapper: ToastProvider });

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
    emit: () => {},
  } as never;
}

describe("AITab skeleton", () => {
  it("renders the empty thread message when no messages exist", () => {
    renderWithToast(<AITab composer={null} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    /* Board 170:2's idle state: three prompts worth trying, the promise that
       governs every run, and the way into a longer job. The old copy invited
       "quick actions" this panel does not have. */
    expect(screen.getByRole("button", { name: "Make the hero warmer" })).toBeInTheDocument();
    expect(
      screen.getByText(/Review the plan before running it/),
    ).toBeInTheDocument();
    // Board 4418:104313 CREATE replaced DRAFT.
    expect(screen.getByTestId("ai-create-block").textContent).toContain("Generate a block in Add");
  });

  it("renders a composer textarea", () => {
    renderWithToast(<AITab composer={null} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Ask AI/i)).toBeInTheDocument();
  });
});

describe("AITab — scope + composer wiring", () => {
  it("submitting a prompt locks the scope chip", () => {
    const { rerender, container } = renderWithToast(
      <AITab composer={null} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "Hello" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    rerender(<AITab composer={null} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />);
    expect(container.querySelector('[data-testid="ai-scope"] [aria-label*="locked"], [data-testid="ai-scope"][aria-label*="locked"]')).toBeInTheDocument();
  });

  /* Decision #23 (E-8): plan / run is the only conversation model. An
     element-scoped prompt is a one-step run on that element, and its edit
     lands in the run's step gate — there is no chat bubble, no proposed-change
     card, no ↻ Regenerate. */
  it("an element-scoped prompt becomes a one-step run whose edit waits at the step gate", async () => {
    const composer = makeElementScopedComposer();
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "duplicate this" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    expect(lastSubscribe.input?.intent).toBe("style-command");
    expect(lastSubscribe.input?.scope).toEqual({ kind: "element", id: "el-1" });

    await act(async () => {
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

    expect(screen.getByTestId("ai-run-band")).toHaveTextContent(/Paused at step 1/i);
    expect(screen.getByRole("button", { name: "Apply step" })).toBeInTheDocument();
    expect(screen.queryByText(/Regenerate/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Apply changes")).not.toBeInTheDocument();
  });

  it("page scope goes to the planner with the element list", () => {
    // No selection → page scope. Composer exposes the page elements.
    const handlers: Record<string, (() => void)[]> = {};
    const composer = {
      selection: { getAllSelected: () => [] },
      elements: {
        getAllElements: () => [
          { getId: () => "h1", getType: () => "heading", getContent: () => "Title" },
          { getId: () => "b1", getType: () => "button", getContent: () => "Click" },
        ],
      },
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: () => {},
    } as never;
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "make the page modern" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    expect(lastSubscribe.input?.scope?.kind).toBe("page");
    expect(lastSubscribe.input?.scope?.elements).toHaveLength(2);
    expect(lastSubscribe.input?.intent).toBe("plan");
  });

  it("page scope ships the token registry + media assets for set-token/set-image recall (D3)", () => {
    const handlers: Record<string, (() => void)[]> = {};
    const composer = {
      selection: { getAllSelected: () => [] },
      elements: {
        getAllElements: () => [
          { getId: () => "h1", getType: () => "heading", getContent: () => "Title" },
        ],
      },
      getProjectSettings: () => ({
        designTokens: [{ id: "tok1", name: "Brand", value: "#2D6DFF", type: "color" }],
      }),
      media: {
        getAssets: () => [
          { id: "a1", src: "https://cdn/x.png", name: "x.png", originalName: "x.png", size: 1 },
        ],
      },
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: () => {},
    } as never;
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "use the brand color" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    const scope = lastSubscribe.input?.scope as { tokens?: unknown[]; assets?: unknown[] };
    expect(scope.tokens).toHaveLength(1);
    expect(scope.assets).toHaveLength(1);
  });

  it("surfaces a stream error where the user can see it", async () => {
    // Regression: onError set hook state but AITab never rendered it, so a
    // quota-exhausted (TOO_MANY_REQUESTS) or provider failure showed as a blank
    // assistant box. The error must be visible to the user.
    //
    // It moved out of the assistant bubble and into a state block on
    // 2026-08-18: a provider failure had been printing its raw code where the
    // reply goes ("UNAUTHORIZED"), after an unbounded SSE reconnect loop left
    // the panel on "Thinking…". The server's sentence is still printed inside
    // that block, which is what this test protects.
    const composer = makeElementScopedComposer();
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "duplicate this" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    await act(async () => {
      lastSubscribe.onError?.({ message: "Daily limit reached (10). Resets at 2026-06-04T00:00:00.000Z." });
    });

    // Board 4418:106919 (2026-09-24): the block is the board's sentence, not
    // the server's raw line — but it is visible, which is the regression.
    expect(screen.getByTestId("ai-state-failed")).toBeInTheDocument();
    expect(screen.getByText(/didn.t respond/)).toBeInTheDocument();
  });

  /* Board 171:136 — a workspace with no API key gets its own state, with the
     way to fix it. Before, the server's PRECONDITION_FAILED message printed as
     grey text under a composer that still looked ready to run. */
  it("says AI is not configured, and offers workspace settings, instead of one more error line", async () => {
    const composer = makeElementScopedComposer();
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "make the hero warmer" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    await act(async () => {
      lastSubscribe.onError?.({
        message: "AI provider not configured",
        data: { code: "PRECONDITION_FAILED" },
      });
    });

    /* Board 4418:106796 copy. */
    expect(screen.getByText("AI isn’t available on this workspace.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View workspace owner ↗" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue by hand in the inspector" })).toBeInTheDocument();
    expect(screen.getByTestId("ai-state-prompt")).toHaveTextContent("Your prompt: make the hero warmer");
    // Board 4418:106796: no composer, and the prompt echo leads the notice.
    expect(container.querySelector("textarea")).toBeNull();
    const block = screen.getByTestId("ai-state-not-configured");
    expect(block.firstElementChild).toBe(screen.getByTestId("ai-state-prompt"));
  });

  it("keeps an ordinary failure as a message, not as the not-configured state", async () => {
    const composer = makeElementScopedComposer();
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "make the hero warmer" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    await act(async () => {
      lastSubscribe.onError?.({ message: "Stream failed", data: { code: "INTERNAL_SERVER_ERROR" } });
    });

    expect(screen.queryByText(/isn.t available on this workspace/)).not.toBeInTheDocument();
    // Board 4418:106919: the headline in error red at 12px, the muted 11px
    // body, no raw server line ("Stream failed" is a debug string), and the
    // typed prompt is still in the composer.
    const title = screen.getByText(/didn.t respond/);
    expect(title.className).toContain("tw:text-[var(--bk-error-text)]");
    expect(title.className).toContain("tw:text-[12px]");
    expect(screen.getByText(/Your prompt is still here/).className).toContain("tw:text-[11px]");
    expect(screen.queryByText("Stream failed")).toBeNull();
    expect(container.querySelector("textarea")!.value).toBe("make the hero warmer");
  });

  it("puts a ✕ on the back row that closes the panel (board 4418:106919)", () => {
    const onClose = vi.fn();
    renderWithToast(
      <AITab composer={makeElementScopedComposer()} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={onClose} onBack={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close AI" }));
    expect(onClose).toHaveBeenCalled();
  });

  /* Board 171:105 — running out of credit is its own state too, and the one
     line that matters is that nothing changed. */
  it("says the run stopped on credit and that nothing changed, with a way to fix it", async () => {
    const composer = makeElementScopedComposer();
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "make the hero warmer" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    await act(async () => {
      lastSubscribe.onError?.({
        message: "Daily limit reached (10). Resets at 2026-08-16T00:00:00.000Z.",
        data: { code: "TOO_MANY_REQUESTS" },
      });
    });

    expect(screen.getByText("AI is out of credit.")).toBeInTheDocument();
    // The server's own numbers, not a re-worded guess at them.
    expect(screen.getByText(/Nothing was changed\. Daily limit reached \(10\)/)).toBeInTheDocument();
    // Board 4418:106671: the title in error red; the reset time read, not ISO.
    expect(screen.getByText("AI is out of credit.").className).toContain("tw:text-[var(--bk-error)]");
    expect(screen.getByText(/Resets at midnight UTC\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workspace billing ↗" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue by hand in the inspector" })).toBeInTheDocument();
  });
});

describe("AITab — multi-selection scope (board 6881:69981)", () => {
  it("a multi-selection plans a run over the selected elements", () => {
    lastSubscribe.input = undefined;
    const a = { getId: () => "a", getType: () => "heading", getAttribute: () => undefined };
    const b = { getId: () => "b", getType: () => "text", getAttribute: () => undefined };
    const byId: Record<string, unknown> = { a, b };
    const composer = {
      selection: { getAllSelected: () => [a, b] },
      elements: { getElement: (id: string) => byId[id], getAllPages: () => [] },
      on: () => {},
      off: () => {},
      emit: () => {},
    } as never;
    const { container } = renderWithToast(
      <AITab composer={composer} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId("ai-scope-note")).toHaveTextContent("This run targets the 2 selected elements only.");
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "make them blue" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    const input = lastSubscribe.input as { intent?: string; scope?: unknown } | undefined;
    expect(input?.intent).toBe("plan");
    const scope = input?.scope as { kind: string; elements: Array<{ id: string }> };
    expect(scope.kind).toBe("page");
    expect(scope.elements.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
