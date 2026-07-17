/**
 * WelcomeModal tests — render + callback contract.
 *
 * PIN: orphan component — no live consumers as of 2026-07-16 (task audit);
 * tested for contract anyway. Only export is the onboarding index barrel
 * (src/editor/onboarding/index.ts), which itself has no external importers;
 * OnboardingMount (the only onboarding surface AquibraStudio mounts) renders
 * OnboardingChecklist + AchievementPrompt only.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeModal } from "../WelcomeModal";

describe("WelcomeModal", () => {
  it("renders as a modal dialog with title and subtitle", () => {
    render(<WelcomeModal onSelectTemplate={vi.fn()} onStartBlank={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "welcome-title");
    expect(screen.getByText("Welcome to Buildrick")).toBeInTheDocument();
    expect(
      screen.getByText("Start with a template — or build from scratch.")
    ).toBeInTheDocument();
  });

  it("renders the three featured template cards", () => {
    render(<WelcomeModal onSelectTemplate={vi.fn()} onStartBlank={vi.fn()} />);

    expect(screen.getByText("SaaS Landing")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getAllByText("Free")).toHaveLength(3);
  });

  it("clicking a template card fires onSelectTemplate with the template id", () => {
    const onSelectTemplate = vi.fn();
    render(<WelcomeModal onSelectTemplate={onSelectTemplate} onStartBlank={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /SaaS Landing/ }));
    expect(onSelectTemplate).toHaveBeenCalledWith("saas-landing");

    fireEvent.click(screen.getByRole("button", { name: /Portfolio/ }));
    expect(onSelectTemplate).toHaveBeenCalledWith("portfolio");

    fireEvent.click(screen.getByRole("button", { name: /Blog/ }));
    expect(onSelectTemplate).toHaveBeenCalledWith("blog");
    expect(onSelectTemplate).toHaveBeenCalledTimes(3);
  });

  it("clicking 'Start with blank canvas' fires onStartBlank", () => {
    const onStartBlank = vi.fn();
    render(<WelcomeModal onSelectTemplate={vi.fn()} onStartBlank={onStartBlank} />);

    fireEvent.click(screen.getByRole("button", { name: "Start with blank canvas →" }));
    expect(onStartBlank).toHaveBeenCalledTimes(1);
  });
});
