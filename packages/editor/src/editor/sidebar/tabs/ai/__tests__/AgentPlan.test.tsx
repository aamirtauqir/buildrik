/**
 * AgentPlan — boards 170:41 · 170:70 · 170:97 · 171:67.
 *
 * These states need a live model to reach in the editor, so they are pinned
 * here rather than walked: the band that names where the run is, the numbered
 * steps, the pause that says what it is about to do, and the end that tells
 * the truth about undo.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentPlan } from "../AgentPlan";
import type { RunStep } from "../hooks/useAgentRunner";

const step = (title: string, status: RunStep["status"], instruction = "Do the thing."): RunStep => ({
  plan: { title, instruction, scope: { kind: "page" } },
  status,
});

function renderPlan(over: Partial<React.ComponentProps<typeof AgentPlan>> = {}) {
  return render(
    <AgentPlan
      phase="running"
      steps={[step("Rewrite the headline", "applied"), step("Warm the background tint", "running"), step("Swap the hero photo", "pending")]}
      currentIndex={1}
      error={null}
      onApprove={vi.fn()}
      onEditStep={vi.fn()}
      onRunPlan={vi.fn()}
      onSkip={vi.fn()}
      onStop={vi.fn()}
      {...over}
    />,
  );
}

afterEach(cleanup);

describe("agent run", () => {
  it("names where the run is, in the board's words", () => {
    renderPlan();
    expect(screen.getByText("Running · 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop run" })).toBeInTheDocument();
  });

  it("numbers every step and never leans on colour alone", () => {
    renderPlan({
      phase: "done",
      stoppedByUser: true,
      steps: [step("Rewrite the headline", "applied"), step("Warm the tint", "skipped")],
      currentIndex: -1,
    });
    expect(screen.getByTestId("ai-run-index-1").textContent).toBe("1");
    expect(screen.getByTestId("ai-run-index-2").textContent).toBe("2");
    // A finished run writes each row's state out as a word (board 4418:105261).
    expect(screen.getByTestId("ai-run-step-2").textContent).toContain("Skipped");
  });

  /* Board 170:97 — the run stops and says what it is about to do, with both
     ways forward. */
  it("pauses on a step with the step's own instruction, Skip and Approve", () => {
    renderPlan({
      steps: [
        step("Rewrite the headline", "applied"),
        step("Swap the hero photo", "awaiting", "Replaces the hero image."),
      ],
      currentIndex: 1,
    });
    expect(screen.getByText("Paused at step 2")).toBeInTheDocument();
    expect(screen.getByText(/Replaces the hero image\. Approve it, or skip it/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply step" })).toBeInTheDocument();
    expect(screen.getByText("The run waits rather than guessing.")).toBeInTheDocument();
  });

  /* Board 171:67 closes on a note block, i.e. a designer annotation rather
     than UI, so the sentence that has to be true is the panel's own: each
     approved step applies in its own transaction, so a run of three is three
     undo entries. A finished run offers no Undo all — that button belongs to
     the two states where the run did not finish cleanly. */
  /* Board 4418:105401 — what changed, Undo all · Done, and the note. */
  it("a finished run lists what changed, with Undo all and Done", () => {
    const onUndoAll = vi.fn();
    const onDismiss = vi.fn();
    const withRows = (t: string, field: string, to: string): RunStep => ({
      ...step(t, "applied"),
      edit: { target: "x", summary: "", rows: [{ field, from: "", to }], applyOps: { preview: {}, commit: {} } },
    });
    renderPlan({
      phase: "done",
      currentIndex: 2,
      steps: [withRows("Rewrite the headline", "Headline", "Wood-fired"), withRows("Warm the tint", "Background", "warmer tint"), step("Swap the photo", "skipped")],
      onUndoAll,
      onDismiss,
    });
    expect(screen.getByText("Done · 2 of 3")).toBeInTheDocument();
    const card = screen.getByTestId("ai-run-applied");
    expect(card.textContent).toContain("2 changes applied");
    expect(card.textContent).toContain("Headline → Wood-fired");
    expect(screen.getByText(/Each approved step was applied/)).toBeInTheDocument();
    expect(screen.getByTestId("ai-run-step-1").textContent).not.toContain("Done");
    fireEvent.click(screen.getByTestId("ai-run-undo-all"));
    fireEvent.click(screen.getByTestId("ai-run-done"));
    expect(onUndoAll).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  /* Board 4418:105118 — which step failed, what is applied, and the three
     ways on: Undo all · Keep N changes · Edit prompt. */
  it("a failed step: Step N failed, Step 1 is applied, Undo all · Keep 1 change · Edit prompt", () => {
    const onUndoAll = vi.fn();
    const onDismiss = vi.fn();
    const onEditPrompt = vi.fn();
    renderPlan({
      phase: "done",
      currentIndex: -1,
      error: "the token is locked.",
      steps: [step("Rewrite the headline", "applied"), step("Warm the background tint", "failed"), step("Increase the hero height", "pending")],
      onUndoAll,
      onDismiss,
      onEditPrompt,
    });
    expect(screen.getByText("Stopped at step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 2 failed — the token is locked.")).toBeInTheDocument();
    expect(screen.getByText("Step 1 is applied. Edit your request before starting another run.")).toBeInTheDocument();
    expect(screen.getByTestId("ai-run-step-2").textContent).toContain("Failed");
    expect(screen.getByTestId("ai-run-step-3").textContent).toContain("Pending");
    expect(screen.getByTestId("ai-run-keep").textContent).toBe("Keep 1 change");
    fireEvent.click(screen.getByTestId("ai-run-edit-prompt"));
    expect(onEditPrompt).toHaveBeenCalled();
  });

  it("a failed run that applied nothing offers no Undo all and no Keep", () => {
    renderPlan({
      phase: "done",
      currentIndex: -1,
      error: "the token is locked.",
      steps: [step("Rewrite the headline", "failed"), step("Warm the tint", "pending")],
      onUndoAll: vi.fn(),
      onDismiss: vi.fn(),
      onEditPrompt: vi.fn(),
    });
    expect(screen.getByText(/Nothing was applied\./)).toBeInTheDocument();
    expect(screen.queryByTestId("ai-run-undo-all")).toBeNull();
    expect(screen.queryByTestId("ai-run-keep")).toBeNull();
  });

  /* Board 4418:105261 — stopped by you: what ran is kept, what did not run
     is named, and Undo all · Keep N changes are links. */
  it("a run the user stopped names what applied and what did not run", () => {
    renderPlan({
      phase: "done",
      currentIndex: -1,
      stoppedByUser: true,
      steps: [step("Rewrite the headline", "applied"), step("Warm the tint", "skipped"), step("Swap the photo", "skipped")],
      onUndoAll: vi.fn(),
      onDismiss: vi.fn(),
    });
    expect(screen.getByText("Stopped by you")).toBeInTheDocument();
    expect(screen.getByText("Stopped after step 1.")).toBeInTheDocument();
    expect(screen.getByTestId("ai-run-stopped").textContent).toContain(
      "Step 1 is applied. Steps 2 and 3 did not run. Undo all restores the page as it was before this run.",
    );
    expect(screen.getByTestId("ai-run-keep").textContent).toBe("Keep 1 change");
  });
});

/* G2-132 — board 4418:104698: the plan waits for review. */
describe("agent run — plan review (board 4418:104698)", () => {
  it("lists the plan under PLANNING with Edit plan · Run N steps; editing rewrites a step", () => {
    const onEditStep = vi.fn();
    const onRunPlan = vi.fn();
    renderPlan({
      phase: "review",
      currentIndex: -1,
      steps: [step("Rewrite the headline", "pending", "Rewrite the headline"), step("Warm the tint", "pending", "Warm the tint")],
      onEditStep,
      onRunPlan,
    });
    expect(screen.getByTestId("ai-run-band").textContent).toBe("Planning");
    expect(screen.queryByTestId("ai-run-glyph-1")).toBeNull();
    expect(screen.getByTestId("ai-plan-run").textContent).toBe("Run 2 steps");
    fireEvent.click(screen.getByTestId("ai-plan-edit"));
    fireEvent.change(screen.getByTestId("ai-plan-edit-2"), { target: { value: "Warm it a lot" } });
    expect(onEditStep).toHaveBeenCalledWith(1, "Warm it a lot");
    fireEvent.click(screen.getByTestId("ai-plan-run"));
    expect(onRunPlan).toHaveBeenCalled();
  });
});

/* Decision #23: the chat bubble that carried "Thinking…" (board 170:29) is
   gone; the plan call is where every prompt now waits. */
describe("agent run — Thinking (board 4418:104577)", () => {
  const props = {
    currentIndex: 0,
    error: null,
    onApprove: vi.fn(),
    onEditStep: vi.fn(),
    onRunPlan: vi.fn(),
    onSkip: vi.fn(),
    onStop: vi.fn(),
  };

  it("while planning: the Thinking… band and a Stop button — no run band, no steps", () => {
    renderPlan({ phase: "planning", steps: [] });
    expect(screen.getByTestId("ai-thinking")).toHaveTextContent("Thinking…");
    expect(screen.getByRole("button", { name: "Stop run" })).toBeInTheDocument();
    expect(screen.queryByTestId("ai-run-band")).toBeNull();
  });

  it("a one-step (element) run still waiting on its answer is thinking, not a RUNNING list", () => {
    render(<AgentPlan phase="running" steps={[step("Make the hero warmer", "running")]} {...props} />);
    expect(screen.getByTestId("ai-thinking")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-run-step-1")).toBeNull();
  });

  it("a multi-step run shows its steps", () => {
    render(<AgentPlan phase="running" steps={[step("One", "running"), step("Two", "pending")]} {...props} />);
    expect(screen.queryByTestId("ai-thinking")).toBeNull();
    expect(screen.getByTestId("ai-run-step-1")).toBeInTheDocument();
  });
});

