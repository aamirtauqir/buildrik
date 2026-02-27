/**
 * TRANSITION REDIRECT — components/AI is being migrated to ai/
 * Canonical location: src/ai/
 * Remove this file in Phase 5 (barrel cleanup).
 * @license BSD-3-Clause
 */

export { AIAssistant, type AIAssistantProps, type AIGenerationResult } from "../../ai/AIAssistant";

export { LayoutSuggestions, type LayoutSuggestionsProps } from "../../ai/LayoutSuggestions";

export { ColorPalette, type ColorPaletteProps } from "../../ai/ColorPalette";

export {
  AccessibilityChecker,
  type AccessibilityCheckerProps,
} from "../../ai/AccessibilityChecker";

export { AICopilot, type AICopilotProps } from "../../ai/AICopilot";
export { AIAssistantBar, type AIAssistantBarProps } from "../../ai/AIAssistantBar";
