/**
 * The DRAFT row has to open the agent surface.
 *
 * `EmptyThread`'s "Draft a new section from a brief" is the only way into
 * agent mode — there is no mode toggle by design (AITab.tsx:47). It calls
 * `setMode("agent")`, and an effect one screen above it read:
 *
 *   if (mode === "agent" && agent.phase === "idle") setMode("chat")
 *
 * A run that has not started yet is `phase: "idle"`, so entering agent mode
 * immediately left it again and the click did nothing visible. Everything
 * behind that row — the plan list, the per-step approval gate, the failed
 * step, the stopped run, the done summary — was unreachable.
 *
 * The effect was meant to hand the panel back when a run ENDS, but the only
 * thing that returns the runner to "idle" is `reset()`, which nothing calls.
 * So it never once did the job it was written for.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: { streamPrompt: { subscribe: () => ({ unsubscribe: vi.fn() }) } },
  }),
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { AITab } from "../AITab";
import { AgentPlan } from "../AgentPlan";

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

afterEach(cleanup);

const mount = () =>
  render(
    <AITab composer={makeComposer()} isExpanded={false} onExpandToggle={vi.fn()} onHelpClick={vi.fn()} onClose={vi.fn()} />,
  );

describe("AITab — the way into the agent surface", () => {
  it("opens the agent surface when DRAFT is clicked", () => {
    mount();
    fireEvent.click(screen.getByText(/Draft a new section from a brief/));

    // AgentPlan's idle frame — the brief-entry state the DRAFT row leads to.
    expect(screen.getByText(/Describe what to build/)).toBeInTheDocument();
  });

  it("leaves the chat empty state behind", () => {
    mount();
    fireEvent.click(screen.getByText(/Draft a new section from a brief/));

    expect(screen.queryByText(/Draft a new section from a brief/)).not.toBeInTheDocument();
  });
});

/* The way back out. `reset()` is the only thing that returns the runner to
   idle, and nothing called it — so a finished run left the plan's last frame
   on screen with no way to ask anything else, which is the dead end the
   bounce effect was written to prevent and could not. */
describe("AgentPlan — an ended run hands the panel back", () => {
  it("offers a way out of a finished run", () => {
    const onDismiss = vi.fn();
    render(
      <AgentPlan
        phase="done"
        steps={[{ plan: { title: "Add a hero", instruction: "", scope: { kind: "page" as const } }, status: "applied" as const }]}
        currentIndex={-1}
        error={null}
        autoApply={false}
        onAutoApplyChange={vi.fn()}
        onApprove={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByText("Ask something else"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("offers it after a stopped run too", () => {
    const onDismiss = vi.fn();
    render(
      <AgentPlan
        phase="done"
        steps={[{ plan: { title: "Add a hero", instruction: "", scope: { kind: "page" as const } }, status: "applied" as const }]}
        currentIndex={-1}
        error={null}
        autoApply={false}
        onAutoApplyChange={vi.fn()}
        onApprove={vi.fn()}
        onSkip={vi.fn()}
        onStop={vi.fn()}
        stoppedByUser
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByText("Ask something else"));
    expect(onDismiss).toHaveBeenCalled();
  });
});
