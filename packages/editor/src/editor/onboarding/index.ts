/**
 * Onboarding — public API
 * @license BSD-3-Clause
 */

export { OnboardingChecklist } from "./OnboardingChecklist";
export type { OnboardingChecklistProps } from "./OnboardingChecklist";

export { SpotlightOverlay } from "./SpotlightOverlay";
export type { SpotlightOverlayProps } from "./SpotlightOverlay";

export { AchievementPrompt } from "./AchievementPrompt";
export type { AchievementPromptProps } from "./AchievementPrompt";

export { useOnboardingOrchestrator } from "./useOnboardingOrchestrator";
export type {
  OnboardingOrchestratorState,
  OnboardingPhase,
  AchievementPromptState,
} from "./useOnboardingOrchestrator";

export { WelcomeModal } from "./WelcomeModal";
export type { WelcomeModalProps } from "./WelcomeModal";

// Step definitions (SSOT — shared with shell for event wiring)
export type { OnboardingStep } from "../../shared/constants/onboardingSteps";
export { DEFAULT_ONBOARDING_STEPS, ONBOARDING_SCHEMA_VERSION } from "../../shared/constants/onboardingSteps";
