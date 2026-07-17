/**
 * ai/ — AI-powered features and UI components
 * Integration: L1 — UI components wired; AI engine services at L1 (no prod key)
 *
 * Public API: layout suggestions, color palette, accessibility checker.
 * The interactive AI surface is the AITab (src/editor/sidebar/tabs/ai/) — the
 * legacy AIAssistant / AIAssistantBar / AICopilot surfaces were removed 2026-07.
 * Note: AIPageGenerator, AIContentPanel, AICodeEditor are L0 stubs (not yet implemented).
 *
 * @license BSD-3-Clause
 */

export { LayoutSuggestions, type LayoutSuggestionsProps } from "./LayoutSuggestions";

export { ColorPalette, type ColorPaletteProps } from "./ColorPalette";

export { AccessibilityChecker, type AccessibilityCheckerProps } from "./AccessibilityChecker";

// L0 stubs not yet implemented:
// AIPageGenerator, AIContentPanel, AICodeEditor
