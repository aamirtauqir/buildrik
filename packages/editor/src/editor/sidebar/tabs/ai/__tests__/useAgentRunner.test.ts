import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const runPromptOnce = vi.fn();
vi.mock("../hooks/runPromptOnce", () => ({
  runPromptOnce: (...a: unknown[]) => runPromptOnce(...a),
}));
const applyAiEdit = vi.fn();
vi.mock("../applySetStyle", () => ({ applyAiEdit: (...a: unknown[]) => applyAiEdit(...a) }));

import { useAgentRunner } from "../hooks/useAgentRunner";

const composer = {
  elements: {
    getAllElements: () => [
      { getId: () => "a", getType: () => "heading", getContent: () => "Hi" },
    ],
  },
  // set-token recall (W4): gatherTokens reads the design-token registry.
  getProjectSettings: () => ({ designTokens: [] }),
  // set-image recall (W5): gatherMediaAssets reads the media library.
  media: { getAssets: () => [] },
  // agent-run takeover (P4): the runner broadcasts ai:agent-run to the inspector.
  emit: vi.fn(),
} as never;

const PLAN = [
  { title: "Style heading", scope: { kind: "element", id: "a" }, instruction: "make it bold" },
  { title: "Add section", scope: { kind: "page" }, instruction: "add a pricing section" },
];
const editWithRows = (n: number) => ({
  target: "x",
  summary: `${n} change`,
  rows: Array.from({ length: n }, () => ({ field: "color", from: "", to: "red" })),
  applyOps: { preview: {}, commit: { commands: [] } },
});

beforeEach(() => {
  runPromptOnce.mockReset();
  applyAiEdit.mockReset();
  // applyAiEdit returns { applied, proposals } — the runner destructures proposals.
  applyAiEdit.mockResolvedValue({ applied: 1, proposals: [] });
});

describe("useAgentRunner", () => {
  it("plans, then walks each step approve→applied to done", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: PLAN, edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));

    await act(async () => { result.current.start("build a pricing page"); });
    await waitFor(() => expect(result.current.steps).toHaveLength(2));
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));

    act(() => { result.current.approve(); });
    await waitFor(() => expect(result.current.steps[1].status).toBe("awaiting"));
    expect(result.current.steps[0].status).toBe("applied");

    act(() => { result.current.approve(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps[1].status).toBe("applied");
    expect(applyAiEdit).toHaveBeenCalledTimes(2);
  });

  it("surfaces an error and ends when the plan is empty", async () => {
    runPromptOnce.mockResolvedValue({ plan: [], edit: null, text: "" });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("xyz"); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.error).toMatch(/couldn't break that into steps/i);
    expect(result.current.steps).toHaveLength(0);
  });

  it("skip advances without applying", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: [PLAN[0]], edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    act(() => { result.current.skip(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps[0].status).toBe("skipped");
    expect(applyAiEdit).not.toHaveBeenCalled();
  });

  it("marks a step 'nochange' when it yields no edit rows and continues", async () => {
    let call = 0;
    runPromptOnce.mockImplementation(async (args: { intent: string }) => {
      if (args.intent === "plan") return { plan: [PLAN[0], PLAN[1]], edit: null, text: "" };
      call++;
      return call === 1
        ? { plan: null, edit: editWithRows(0), text: "" } // step 0: no rows
        : { plan: null, edit: editWithRows(1), text: "" }; // step 1: has rows
    });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    await waitFor(() => expect(result.current.steps[1].status).toBe("awaiting"));
    expect(result.current.steps[0].status).toBe("nochange");
  });

  it("auto-apply mode applies every step without approve() + runs to done", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: PLAN, edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    act(() => { result.current.setAutoApply(true); });
    await act(async () => { result.current.start("build"); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps.every((s) => s.status === "applied")).toBe(true);
    expect(applyAiEdit).toHaveBeenCalledTimes(2);
  });

  it("stop ends the run mid-flight", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: PLAN, edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    act(() => { result.current.stop(); });
    expect(result.current.phase).toBe("done");
  });

  /* Board 171:2 — "Nothing after step N ran."
     It DID run. The catch marked the step failed and then called
     `advance(i + 1)`, so the agent carried on editing the page after a step
     had already failed, while the band above it read "STOPPED AT STEP N"
     (computed from `steps` alone). Nothing ever set `error`, and AgentPlan's
     error card — with its Retry and Undo-all — is gated on exactly that, so
     the user was told the run stopped, shown no failure, and given no way
     back. Walked live 2026-09-01: band said stopped at step 1 with step 2
     still showing a running dot. */
  it("a failed step stops the run instead of quietly continuing", async () => {
    let call = 0;
    runPromptOnce.mockImplementation(async (args: { intent: string }) => {
      if (args.intent === "plan") return { plan: PLAN, edit: null, text: "" };
      call += 1;
      if (call === 1) throw new Error("model refused");
      return { plan: null, edit: editWithRows(1), text: "" };
    });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });

    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps[0].status).toBe("failed");
    // The second step must never have been attempted.
    expect(call).toBe(1);
    expect(result.current.steps[1].status).not.toBe("applied");
    // And the failure has to be sayable, or the error card cannot render.
    expect(result.current.error).toBeTruthy();
  });
});
