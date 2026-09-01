/**
 * OnboardingChecklist tests — minimized pill, full panel, completed vs
 * pending step states, click handlers, dismiss-confirmation flow,
 * progress display.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DEFAULT_ONBOARDING_STEPS } from "@/shared/constants/onboardingSteps";
import { OnboardingChecklist, type OnboardingChecklistProps } from "../OnboardingChecklist";

function makeProps(overrides: Partial<OnboardingChecklistProps> = {}): OnboardingChecklistProps {
  return {
    steps: DEFAULT_ONBOARDING_STEPS,
    completedCount: 0,
    totalCount: DEFAULT_ONBOARDING_STEPS.length,
    activeStepId: null,
    onSetActiveStepId: vi.fn(),
    onAction: vi.fn(),
    onDismiss: vi.fn(),
    onMinimize: vi.fn(),
    isMinimized: false,
    onRestore: vi.fn(),
    ...overrides,
  };
}

/** Steps with the first `n` marked completed. */
function stepsWithCompleted(n: number) {
  return DEFAULT_ONBOARDING_STEPS.map((s, i) => ({ ...s, completed: i < n }));
}

beforeEach(() => {
  localStorage.clear();
});

// ─── Minimized pill ───────────────────────────────────────────────────

describe("minimized pill", () => {
  it("shows progress count and expands on click", () => {
    const props = makeProps({ isMinimized: true, completedCount: 3 });
    render(<OnboardingChecklist {...props} />);

    const pill = screen.getByRole("button", {
      name: "Get started — 3 of 7 complete. Click to expand.",
    });
    expect(pill).toHaveTextContent("3 / 7 done");

    fireEvent.click(pill);
    expect(props.onRestore).toHaveBeenCalledTimes(1);
  });

  it("restores on Enter and Space keydown, ignores other keys", () => {
    // Covers the Enter/Space onRestore keyboard handler on the pill.
    const props = makeProps({ isMinimized: true });
    render(<OnboardingChecklist {...props} />);
    const pill = screen.getByRole("button");

    fireEvent.keyDown(pill, { key: "Enter" });
    expect(props.onRestore).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(pill, { key: " " });
    expect(props.onRestore).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(pill, { key: "Escape" });
    fireEvent.keyDown(pill, { key: "a" });
    expect(props.onRestore).toHaveBeenCalledTimes(2);
  });

  it("shows 'All done!' when every step is complete", () => {
    render(
      <OnboardingChecklist
        {...makeProps({ isMinimized: true, completedCount: 7, steps: stepsWithCompleted(7) })}
      />
    );
    expect(screen.getByRole("button")).toHaveTextContent("All done!");
  });
});

// ─── Full panel: header + progress ────────────────────────────────────

describe("full panel header + progress", () => {
  it("renders title, count, and all step labels", () => {
    render(<OnboardingChecklist {...makeProps({ completedCount: 2, steps: stepsWithCompleted(2) })} />);

    expect(screen.getByRole("region", { name: "Getting started checklist" })).toBeInTheDocument();
    expect(screen.getByText("Get started")).toBeInTheDocument();
    /* Boards 296:1999 / 296:2030 print the counter as "2/7" beside the
       title, not spelled out on a second line. The spoken form stays on the
       trigger's aria-label, asserted separately above. */
    expect(screen.getByText("2/7")).toBeInTheDocument();

    for (const step of DEFAULT_ONBOARDING_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("progress bar width reflects completedCount / totalCount", () => {
    const { container } = render(
      <OnboardingChecklist
        {...makeProps({ completedCount: 2, totalCount: 4, steps: stepsWithCompleted(2) })}
      />
    );
    const fill = Array.from(container.querySelectorAll("div")).find(
      (d) => d.style.width.endsWith("%")
    );
    expect(fill).toBeDefined();
    expect(fill!.style.width).toBe("50%");
  });

  it("all-done state: header copy, footer message, and footer Close → onDismiss", () => {
    const props = makeProps({ completedCount: 7, steps: stepsWithCompleted(7) });
    render(<OnboardingChecklist {...props} />);

    // Board 296:2030's all-done copy.
    expect(screen.getByText("You\u2019re all set")).toBeInTheDocument();
    expect(
      screen.getByText(/You have completed all the getting started steps/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close checklist"));
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ─── Step states + interaction ────────────────────────────────────────

describe("step items", () => {
  // This read `.style.textDecoration` while the strike-through was an inline
  // style. It is a class now, and jsdom loads no stylesheet, so the computed
  // value here would be "" whether the class applied or not. Asserting the
  // class is the honest jsdom-level check; the COMPUTED value is asserted in a
  // real browser by e2e/style-parity.spec.ts's `onboarding-steps` case, which
  // is what actually proves the strike-through renders.
  it("completed steps render struck-through; pending steps do not", () => {
    render(<OnboardingChecklist {...makeProps({ completedCount: 1, steps: stepsWithCompleted(1) })} />);

    const doneLabel = screen.getByText("Set your brand");
    const pendingLabel = screen.getByText("Add your first page");
    expect(doneLabel.className).toMatch(/tw:line-through/);
    expect(pendingLabel.className).toMatch(/tw:no-underline/);
    expect(pendingLabel.className).not.toMatch(/tw:line-through/);
  });

  it("active step row has aria-expanded=true and shows description + CTA", () => {
    const props = makeProps({ activeStepId: "set-brand" });
    render(<OnboardingChecklist {...props} />);

    const row = screen.getByRole("button", { name: "Set your brand" });
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Apply your fonts and colors/)
    ).toBeInTheDocument();

    // CTA fires onAction with the step's actionKey
    fireEvent.click(screen.getByRole("button", { name: /Open Brand panel/ }));
    expect(props.onAction).toHaveBeenCalledWith("open-brand");
  });

  it("steps without actionKey render no CTA button when expanded", () => {
    /* Every v5 default step has a CTA, so the no-CTA branch is pinned with a
       synthetic step — the component contract, not the current list. */
    const steps = [
      { id: "quiet", label: "Quiet step", description: "No door to open.", completed: false },
      ...DEFAULT_ONBOARDING_STEPS.slice(1),
    ];
    render(<OnboardingChecklist {...makeProps({ steps, activeStepId: "quiet" })} />);
    expect(screen.getByText(/No door to open/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open/ })).not.toBeInTheDocument();
  });

  it("clicking an inactive step expands it; clicking the active step collapses it", () => {
    const props = makeProps({ activeStepId: "set-brand" });
    render(<OnboardingChecklist {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Add your first page" }));
    expect(props.onSetActiveStepId).toHaveBeenCalledWith("add-page");

    fireEvent.click(screen.getByRole("button", { name: "Set your brand" }));
    expect(props.onSetActiveStepId).toHaveBeenCalledWith(null);
  });

  it("completed steps never render an expanded body even when active", () => {
    render(
      <OnboardingChecklist
        {...makeProps({
          activeStepId: "set-brand",
          completedCount: 1,
          steps: stepsWithCompleted(1),
        })}
      />
    );
    expect(screen.queryByText(/Apply your fonts and colors/)).not.toBeInTheDocument();
  });
});

// ─── Minimize + dismiss confirmation flow ─────────────────────────────

describe("minimize + dismiss controls", () => {
  it("minimize button calls onMinimize", () => {
    const props = makeProps();
    render(<OnboardingChecklist {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Minimize checklist" }));
    expect(props.onMinimize).toHaveBeenCalledTimes(1);
  });

  it("close requires inline confirmation before onDismiss fires", () => {
    const props = makeProps();
    render(<OnboardingChecklist {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Close checklist" }));
    expect(screen.getByText("Hide this?")).toBeInTheDocument();
    expect(props.onDismiss).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("'No' cancels the confirmation and restores the close button", () => {
    const props = makeProps();
    render(<OnboardingChecklist {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Close checklist" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));

    expect(screen.queryByText("Hide this?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close checklist" })).toBeInTheDocument();
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it("mousedown outside the panel auto-cancels the confirmation", () => {
    render(<OnboardingChecklist {...makeProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Close checklist" }));
    expect(screen.getByText("Hide this?")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Hide this?")).not.toBeInTheDocument();
  });

  it("mousedown inside the panel keeps the confirmation open", () => {
    render(<OnboardingChecklist {...makeProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Close checklist" }));
    fireEvent.mouseDown(screen.getByText("Get started"));
    expect(screen.getByText("Hide this?")).toBeInTheDocument();
  });
});
