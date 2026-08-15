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
import { render, screen, cleanup } from "@testing-library/react";
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
      autoApply={false}
      onAutoApplyChange={vi.fn()}
      onApprove={vi.fn()}
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
      steps: [step("Rewrite the headline", "applied"), step("Warm the tint", "skipped")],
      currentIndex: 1,
    });
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    // A status that is not simply "waiting" is written out as a word.
    expect(screen.getByText("skipped")).toBeInTheDocument();
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

  /* Board 171:67 ends with "Apply lands as ONE undo step — ⌘Z takes back all
     three." Each approved step applies in its own transaction, so a run of
     three is three undo entries: the board's sentence would be a lie here. */
  it("tells the truth about undo at the end of a multi-step run", () => {
    renderPlan({
      phase: "done",
      currentIndex: 2,
      steps: [
        step("Rewrite the headline", "applied"),
        step("Warm the tint", "applied"),
        step("Swap the hero photo", "skipped"),
      ],
    });
    expect(screen.getByText("Done · 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("2 changes applied, 1 skipped.")).toBeInTheDocument();
    expect(screen.getByText(/Each step is its own undo step/)).toBeInTheDocument();
    expect(screen.queryByText(/ONE undo step/)).not.toBeInTheDocument();
  });

  it("a single applied step says the simple thing instead", () => {
    renderPlan({
      phase: "done",
      currentIndex: 0,
      steps: [step("Rewrite the headline", "applied")],
    });
    expect(screen.getByText("1 change applied.")).toBeInTheDocument();
    expect(screen.getByText("⌘Z takes it back.")).toBeInTheDocument();
  });
});
