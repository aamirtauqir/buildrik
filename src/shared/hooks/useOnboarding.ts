/**
 * useOnboarding - Hook for tracking onboarding progress
 * Persists progress in localStorage, tracks 9 getting-started steps
 *
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface OnboardingState {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  progress: number;
  completeStep: (stepId: string) => void;
  resetProgress: () => void;
  dismiss: () => void;
  dismissed: boolean;
  isComplete: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ONBOARDING_STORAGE_KEY = "aquibra-onboarding-progress";
const DISMISSED_STORAGE_KEY = "aquibra-onboarding-dismissed";

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "add-element",
    label: "Add an element",
    description: "Drag an element from the Build panel to your canvas",
    completed: false,
  },
  {
    id: "edit-text",
    label: "Edit text",
    description: "Double-click any text element to edit its content",
    completed: false,
  },
  {
    id: "change-style",
    label: "Change a style",
    description: "Select an element and modify its styles in the inspector",
    completed: false,
  },
  {
    id: "preview",
    label: "Preview your site",
    description: "Click Preview to see your site across devices",
    completed: false,
  },
  {
    id: "publish",
    label: "Publish your site",
    description: "Click the Publish button at the top right to make your site live",
    completed: false,
  },
];

// ============================================================================
// HOOK
// ============================================================================

export function useOnboarding(): OnboardingState {
  // Load initial state from localStorage
  const [steps, setSteps] = useState<OnboardingStep[]>(() => {
    if (typeof window === "undefined") return DEFAULT_STEPS;
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingStep[];
        // Merge with defaults to handle new steps added in updates
        return DEFAULT_STEPS.map((defaultStep) => {
          const savedStep = parsed.find((s) => s.id === defaultStep.id);
          return savedStep ?? defaultStep;
        });
      }
      return DEFAULT_STEPS;
    } catch {
      return DEFAULT_STEPS;
    }
  });

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
  });

  // Persist steps to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(steps));
  }, [steps]);

  // Complete a step
  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step))
    );
  }, []);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setSteps(DEFAULT_STEPS);
    setDismissed(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      localStorage.removeItem(DISMISSED_STORAGE_KEY);
    }
  }, []);

  // Dismiss onboarding (hide permanently)
  const dismiss = useCallback(() => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    }
  }, []);

  // Computed values
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = completedCount === totalCount;

  return {
    steps,
    completedCount,
    totalCount,
    progress,
    completeStep,
    resetProgress,
    dismiss,
    dismissed,
    isComplete,
  };
}

export default useOnboarding;
