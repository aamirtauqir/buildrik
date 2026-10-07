import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const runPromptOnce = vi.fn();
vi.mock("../hooks/runPromptOnce", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../hooks/runPromptOnce")>()),
  runPromptOnce: (...a: unknown[]) => runPromptOnce(...a),
}));
const applyAiEdit = vi.fn();
vi.mock("../applySetStyle", () => ({ applyAiEdit: (...a: unknown[]) => applyAiEdit(...a) }));
const trackAgentRun = vi.fn();
vi.mock("@/services/ai/adoptionTracker", () => ({
  trackAgentRun: (...a: unknown[]) => trackAgentRun(...a),
}));

import { useAgentRunner } from "../hooks/useAgentRunner";
import { AiRunError } from "../hooks/runPromptOnce";

const composer = {
  elements: {
    getAllElements: () => [
      { getId: () => "a", getType: () => "heading", getContent: () => "Hi" },
    ],
    // Element steps snapshot their element (gatherElementContext).
    getElement: () => undefined,
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
  trackAgentRun.mockReset();
  // applyAiEdit returns { applied, proposals, undo } — undo is the handle bound
  // to the history entry the edit recorded (null when it recorded nothing).
  applyAiEdit.mockResolvedValue({ applied: 1, proposals: [], undo: () => true });
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
    act(() => { result.current.runPlan(); });
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
    act(() => { result.current.runPlan(); });
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
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.steps[1].status).toBe("awaiting"));
    expect(result.current.steps[0].status).toBe("nochange");
  });

  it("stop ends the run mid-flight", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: PLAN, edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    act(() => { result.current.runPlan(); });
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
  /* Stop pressed DURING the apply await, in auto-apply mode. A review reported
     this as a live race — that the run carries on to the next step after the
     user stopped it. It does not: `advance` re-checks `cancelledRef` and
     returns. This test exists because the claim was plausible enough to be
     worth pinning, so the behaviour cannot regress into being true. */
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
    act(() => { result.current.runPlan(); });

    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps[0].status).toBe("failed");
    // The second step must never have been attempted.
    expect(call).toBe(1);
    expect(result.current.steps[1].status).not.toBe("applied");
    // And the failure has to be sayable, or the error card cannot render.
    expect(result.current.error).toBeTruthy();

    /* Telemetry must see the failure. `stepsRef.current` is assigned during
       render, so marking the step failed with `setStep` and calling reportRun
       synchronously after reported stepsFailed: 0 for the run that just
       failed. Nothing asserted this, which is why review caught it and the
       suite did not. */
    expect(trackAgentRun).toHaveBeenCalledTimes(1);
    expect(trackAgentRun.mock.calls[0][0]).toMatchObject({ stepsFailed: 1 });
  });

  /* Decision #23: an element-scoped prompt is a one-step plan on that element
     — no server planner call (it only plans pages), and it runs at once. */
  it("runs an element-scoped prompt as a one-step plan without calling the planner", async () => {
    runPromptOnce.mockResolvedValue({ plan: null, edit: editWithRows(1), text: "" });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("make it bold", { id: "a" }); });
    await waitFor(() => expect(result.current.steps[0]?.status).toBe("awaiting"));
    expect(result.current.steps).toHaveLength(1);
    expect(runPromptOnce).toHaveBeenCalledTimes(1);
    expect(runPromptOnce.mock.calls[0][0]).toMatchObject({
      intent: "style-command",
      scope: { kind: "element", id: "a" },
      prompt: "make it bold",
    });
  });

  it("carries the failure kind so the panel can draw not-configured / quota", async () => {
    runPromptOnce.mockRejectedValue(new AiRunError("AI provider not configured", "not-configured"));
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.errorKind).toBe("not-configured");
    act(() => { result.current.reset(); });
    expect(result.current.errorKind).toBeNull();
  });

  /* G2-132 — board 4418:104698: a page plan waits for review; a step can be
     edited before Run, and nothing runs until then. */
  it("a page plan waits in review, takes step edits, and runs on runPlan", async () => {
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    runPromptOnce.mockResolvedValueOnce({ text: "", edit: null, plan: PLAN.map((p) => ({ ...p, scope: { kind: "page" } })) });
    await act(async () => { result.current.start("build"); });
    expect(result.current.phase).toBe("review");
    expect(runPromptOnce).toHaveBeenCalledTimes(1);
    act(() => { result.current.editStep(1, "a warmer tint"); });
    expect(result.current.steps[1].plan.instruction).toBe("a warmer tint");
    expect(result.current.steps[1].plan.title).toBe("a warmer tint");
    runPromptOnce.mockResolvedValue({ text: "", edit: null, plan: null });
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(runPromptOnce.mock.calls[2][0].prompt).toBe("a warmer tint");
  });

  it("stop marks what had not run as skipped", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan" ? { plan: PLAN.map((p) => ({ ...p, scope: { kind: "page" } })), edit: null, text: "" } : { plan: null, edit: editWithRows(1), text: "" },
    );
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("build"); });
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    act(() => { result.current.stop(); });
    expect(result.current.steps.map((s) => s.status)).toEqual(["skipped", "skipped"]);
  });
  /* An "applied" step is one that recorded a history entry. A proposal-only
     step (or one whose commands were all no-ops) recorded nothing, and
     counting it made Undo all take back one of the user's own edits. */
  it("a step that recorded no history entry is 'nochange', not 'applied'", async () => {
    runPromptOnce.mockResolvedValue({ plan: null, edit: editWithRows(1), text: "" });
    applyAiEdit.mockResolvedValue({ applied: 0, proposals: [{ actionId: "site.publish" }], undo: null });
    const onProposal = vi.fn();
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini", onProposal));
    await act(async () => { result.current.start("publish it", { id: "a" }); });
    await waitFor(() => expect(result.current.steps[0]?.status).toBe("awaiting"));
    await act(async () => { result.current.approve(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps[0].status).toBe("nochange");
    expect(onProposal).toHaveBeenCalledWith("site.publish");
  });

  /* applyAiEdit rolls a failing batch back, then throws. The run must stop
     there (the same rule as a step that fails to generate), not advance to
     the next step planned against a state the failed one never produced. */
  it("a step that fails to apply stops the run and says why", async () => {
    let generated = 0;
    runPromptOnce.mockImplementation(async (args: { intent: string }) => {
      if (args.intent === "plan") return { plan: PLAN, edit: null, text: "" };
      generated += 1;
      return { plan: null, edit: editWithRows(1), text: "" };
    });
    applyAiEdit.mockRejectedValueOnce(new Error("This element is locked"));
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    await act(async () => { result.current.approve(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.steps[0].status).toBe("failed");
    expect(result.current.error).toMatch(/locked/);
    expect(generated).toBe(1);
  });

  /* Undo all reverts exactly the run's own entries, newest first, through the
     handles applyAiEdit returned — and stops at the first one that refuses
     (a newer user edit sits on top), never undoing the user's work. */
  it("undoAll undoes only the AI's entries, newest first, and stops at a refusal", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: PLAN, edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const order: string[] = [];
    const undo1 = vi.fn(() => { order.push("1"); return true; });
    const undo2 = vi.fn(() => { order.push("2"); return true; });
    applyAiEdit
      .mockResolvedValueOnce({ applied: 1, proposals: [], undo: undo1 })
      .mockResolvedValueOnce({ applied: 1, proposals: [], undo: undo2 });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    await act(async () => { result.current.approve(); });
    await waitFor(() => expect(result.current.steps[1].status).toBe("awaiting"));
    await act(async () => { result.current.approve(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));

    let undone = 0;
    act(() => { undone = result.current.undoAll(); });
    expect(undone).toBe(2);
    expect(order).toEqual(["2", "1"]);
    // Nothing left to take back.
    act(() => { undone = result.current.undoAll(); });
    expect(undone).toBe(0);
  });

  it("undoAll stops when an entry refuses (the user edited after the run)", async () => {
    runPromptOnce.mockImplementation(async (args: { intent: string }) =>
      args.intent === "plan"
        ? { plan: PLAN, edit: null, text: "" }
        : { plan: null, edit: editWithRows(1), text: "" },
    );
    const undo1 = vi.fn(() => true);
    const undo2 = vi.fn(() => false); // superseded by a newer user edit
    applyAiEdit
      .mockResolvedValueOnce({ applied: 1, proposals: [], undo: undo1 })
      .mockResolvedValueOnce({ applied: 1, proposals: [], undo: undo2 });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    await act(async () => { result.current.start("x"); });
    act(() => { result.current.runPlan(); });
    await waitFor(() => expect(result.current.steps[0].status).toBe("awaiting"));
    await act(async () => { result.current.approve(); });
    await waitFor(() => expect(result.current.steps[1].status).toBe("awaiting"));
    await act(async () => { result.current.approve(); });
    await waitFor(() => expect(result.current.phase).toBe("done"));

    let undone = -1;
    act(() => { undone = result.current.undoAll(); });
    expect(undone).toBe(0);
    expect(undo2).toHaveBeenCalledTimes(1);
    expect(undo1).not.toHaveBeenCalled();
  });

  /* Stop has to reach the server: the request in flight is aborted, so the
     subscription is torn down rather than left generating. */
  it("stop aborts the request in flight", async () => {
    let signal: AbortSignal | undefined;
    runPromptOnce.mockImplementation((args: { signal?: AbortSignal }) => {
      signal = args.signal;
      return new Promise(() => {});
    });
    const { result } = renderHook(() => useAgentRunner(composer, "gpt-4o-mini"));
    act(() => { result.current.start("x"); });
    await waitFor(() => expect(signal).toBeDefined());
    expect(signal!.aborted).toBe(false);
    act(() => { result.current.stop(); });
    expect(signal!.aborted).toBe(true);
  });
  /* P1-6: an element prompt used to send the id alone, so "make it more
     concise" asked the model to rewrite copy it had never been shown. The
     step now carries a capped snapshot of the element, plus the token
     registry and media library page steps already send. */
  it("sends an element snapshot, tokens and assets with an element-scoped step", async () => {
    const child = { getId: () => "c1", getType: () => "text", getContent: () => "<b>child</b> copy", getChildren: () => [] };
    const el = {
      getId: () => "a",
      getType: () => "heading",
      getTagName: () => "h1",
      getContent: () => "Welcome   to <em>Bella</em>",
      getStyles: () => ({ "font-size": "48px", color: "#111111" }),
      getAttributes: () => ({ title: "Hero", "data-buildrik-id": "a", class: "x" }),
      getChildren: () => [child],
    };
    const withEl = {
      elements: { getAllElements: () => [el], getElement: (id: string) => (id === "a" ? el : null) },
      getProjectSettings: () => ({ designTokens: [] }),
      media: { getAssets: () => [{ id: "m1", src: "https://cdn.x.com/a.jpg", name: "a.jpg", originalName: "a.jpg" }] },
      emit: vi.fn(),
    } as never;
    runPromptOnce.mockResolvedValue({ plan: null, edit: editWithRows(1), text: "" });
    const { result } = renderHook(() => useAgentRunner(withEl, "gpt-4o-mini"));
    await act(async () => { result.current.start("make it more concise", { id: "a" }); });
    await waitFor(() => expect(runPromptOnce).toHaveBeenCalledTimes(1));
    const scope = runPromptOnce.mock.calls[0][0].scope;
    expect(scope).toMatchObject({
      kind: "element",
      id: "a",
      context: {
        type: "heading",
        tag: "h1",
        text: "Welcome to Bella",
        styles: { "font-size": "48px", color: "#111111" },
        attributes: { title: "Hero" },
        children: [{ id: "c1", type: "text", text: "child copy" }],
      },
      tokens: [],
      assets: [{ url: "https://cdn.x.com/a.jpg" }],
    });
  });
});
