/**
 * ai/ — AI-powered features and UI components
 * Integration: L1 — UI components wired; AI engine services at L1 (no prod key)
 *
 * Public API: AI chat, copilot, layout suggestions, color palette, accessibility checker.
 * Note: AIPageGenerator, AIContentPanel, AICodeEditor are L0 stubs (not yet implemented).
 *
 * @license BSD-3-Clause
 */

export { AIAssistant, type AIAssistantProps, type AIGenerationResult } from "./AIAssistant";

export { LayoutSuggestions, type LayoutSuggestionsProps } from "./LayoutSuggestions";

export { ColorPalette, type ColorPaletteProps } from "./ColorPalette";

export { AccessibilityChecker, type AccessibilityCheckerProps } from "./AccessibilityChecker";

export { AICopilot, type AICopilotProps } from "./AICopilot";

export { AIAssistantBar } from "./AIAssistantBar";
export type { AIAssistantBarProps } from "./AIAssistantBar";

// L0 stubs not yet implemented:
// AIPageGenerator, AIContentPanel, AICodeEditor
