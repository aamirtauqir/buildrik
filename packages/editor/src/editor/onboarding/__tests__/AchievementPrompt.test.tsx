/**
 * AchievementPrompt tests — render content (mid-flow vs last step),
 * visual countdown bar under fake timers, dismiss via button + overlay,
 * screen-reader live region.
 *
 * Note: the component does NOT auto-dismiss itself — the orchestrator owns
 * the 4s setTimeout. The bar here is a purely visual countdown synced to
 * ACHIEVEMENT_AUTO_DISMISS_MS (SSOT in useOnboardingOrchestrator).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DEFAULT_ONBOARDING_STEPS } from "@/shared/constants/onboardingSteps";
import { AchievementPrompt } from "../AchievementPrompt";
import { ACHIEVEMENT_AUTO_DISMISS_MS } from "../useOnboardingOrchestrator";

const completedStep = { ...DEFAULT_ONBOARDING_STEPS[0], completed: true };
const nextStep = DEFAULT_ONBOARDING_STEPS[1];

beforeEach(() => {
  // Explicit toFake including Date — the countdown computes elapsed time via
  // Date.now(), so both the interval AND the clock must advance together.
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function countdownBar(): HTMLElement {
  const dialog = screen.getByRole("dialog");
  return dialog.firstElementChild as HTMLElement;
}

describe("render content", () => {
  it("mid-flow: shows 'Step complete', completed label, and next-step preview", () => {
    render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={nextStep}
        isLastStep={false}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("Step complete")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(completedStep.label)).toBeInTheDocument();

    expect(screen.getByText("Next up")).toBeInTheDocument();
    expect(screen.getByText(nextStep.label)).toBeInTheDocument();
    expect(screen.getByText(nextStep.description)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Continue →" })).toBeInTheDocument();
  });

  it("last step: congratulates, hides next-step preview, button reads 'Done'", () => {
    render(
      <AchievementPrompt
        completedStep={{ ...DEFAULT_ONBOARDING_STEPS[6], completed: true }}
        nextStep={null}
        isLastStep={true}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(screen.getByText("You're all set!")).toBeInTheDocument();
    expect(screen.queryByText("Next up")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("announces completion in the screen-reader live region on mount", () => {
    render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={nextStep}
        isLastStep={false}
        onDismiss={vi.fn()}
      />
    );

    const live = document.getElementById("bd-achievement-live");
    expect(live).toHaveAttribute("role", "status");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live?.textContent).toBe(
      `Step complete: ${completedStep.label}. Next: ${nextStep.label}`
    );
  });

  it("announces the congratulation message when isLastStep", () => {
    render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={null}
        isLastStep={true}
        onDismiss={vi.fn()}
      />
    );
    expect(document.getElementById("bd-achievement-live")?.textContent).toBe(
      "Congratulations! You have completed all getting started steps."
    );
  });
});

describe("countdown bar (fake timers)", () => {
  it("starts at 100% and drains to 0% over ACHIEVEMENT_AUTO_DISMISS_MS", () => {
    render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={nextStep}
        isLastStep={false}
        onDismiss={vi.fn()}
      />
    );

    expect(countdownBar().style.width).toBe("100%");

    // Halfway: 2000 / 4000 elapsed → 50% remaining.
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS / 2));
    expect(countdownBar().style.width).toBe("50%");

    // Full duration → 0% (clamped by Math.max).
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS / 2));
    expect(countdownBar().style.width).toBe("0%");
  });

  it("stays at 0% after the countdown ends (interval self-clears)", () => {
    // PIN: the component never dismisses itself — after the bar hits 0% it
    // just sits there until the orchestrator's timer (or the user) dismisses.
    render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={nextStep}
        isLastStep={false}
        onDismiss={vi.fn()}
      />
    );

    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS + 2000));
    expect(countdownBar().style.width).toBe("0%");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("dismiss interactions", () => {
  it("primary button click calls onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={nextStep}
        isLastStep={false}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue →" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("clicking the dim overlay calls onDismiss", () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <AchievementPrompt
        completedStep={completedStep}
        nextStep={nextStep}
        isLastStep={false}
        onDismiss={onDismiss}
      />
    );

    const overlay = Array.from(
      container.querySelectorAll('div[aria-hidden="true"]')
    ).find((d) => (d as HTMLElement).style.cursor === "pointer") as HTMLElement;
    expect(overlay).toBeDefined();

    fireEvent.click(overlay);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
