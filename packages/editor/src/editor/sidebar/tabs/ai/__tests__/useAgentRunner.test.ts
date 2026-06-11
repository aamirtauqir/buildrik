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
    const { result } = renderHook(() => useAgentRunner(composer, "claude-sonnet-4-6"));

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
    const { result } = renderHook(() => useAgentRunner(composer, "claude-sonnet-4-6"));
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
    const { result } = renderHook(() => useAgentRunner(composer, "claude-sonnet-4-6"));
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
    const { result } = renderHook(() => useAgentRunner(composer, "claude-sonnet-4-6"));
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
    const { result } = renderHook(() => useAgentRunner(composer, "claude-sonnet-4-6"));
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
    const { result } = renderHook(() => useAgentRunner(composer, "claude-sonnet-4-6"));
    await act(async () => { result.current.start("x"); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    act(() => { result.current.stop(); });
    expect(result.current.phase).toBe("done");
  });
});
