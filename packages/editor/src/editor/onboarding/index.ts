/**
 * Onboarding — public API
 * @license BSD-3-Clause
 */

export { OnboardingChecklist } from "./OnboardingChecklist";
export type { OnboardingChecklistProps } from "./OnboardingChecklist";

export { AchievementPrompt } from "./AchievementPrompt";
export type { AchievementPromptProps } from "./AchievementPrompt";

export { useOnboardingOrchestrator } from "./useOnboardingOrchestrator";
export type {
  OnboardingOrchestratorState,
  OnboardingPhase,
  AchievementPromptState,
} from "./useOnboardingOrchestrator";

// Step definitions (SSOT — shared with shell for event wiring)
export type { OnboardingStep } from "../../shared/constants/onboardingSteps";
export { DEFAULT_ONBOARDING_STEPS, ONBOARDING_SCHEMA_VERSION } from "../../shared/constants/onboardingSteps";
