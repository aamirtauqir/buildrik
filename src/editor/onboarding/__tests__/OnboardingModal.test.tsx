/**
 * OnboardingModal tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingModal, isOnboardingComplete, markOnboardingComplete } from "../OnboardingModal";

describe("OnboardingModal", () => {
  const onComplete = vi.fn();
  const onSkip = vi.fn();

  beforeEach(() => {
    onComplete.mockClear();
    onSkip.mockClear();
    localStorage.clear();
  });

  it("renders first step by default", () => {
    render(<OnboardingModal onComplete={onComplete} onSkip={onSkip} />);
    expect(screen.getByText("Pick a template")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("navigates through all 3 steps then calls onComplete", () => {
    render(<OnboardingModal onComplete={onComplete} onSkip={onSkip} />);
    expect(screen.getByText("Pick a template")).toBeTruthy();

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Customize your design")).toBeTruthy();

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Preview & Publish")).toBeTruthy();

    fireEvent.click(screen.getByText("Get Started"));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("clicking Skip calls onSkip", () => {
    render(<OnboardingModal onComplete={onComplete} onSkip={onSkip} />);
    fireEvent.click(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("Escape key calls onSkip", () => {
    render(<OnboardingModal onComplete={onComplete} onSkip={onSkip} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("has proper aria attributes", () => {
    render(<OnboardingModal onComplete={onComplete} onSkip={onSkip} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("onboarding-title");
  });
});

describe("isOnboardingComplete / markOnboardingComplete", () => {
  beforeEach(() => localStorage.clear());

  it("returns false when localStorage empty", () => {
    expect(isOnboardingComplete()).toBe(false);
  });

  it("returns true after markOnboardingComplete", () => {
    markOnboardingComplete();
    expect(isOnboardingComplete()).toBe(true);
  });
});
