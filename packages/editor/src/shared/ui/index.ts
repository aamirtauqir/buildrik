/**
 * Aquibra UI Components — surviving Buildrik primitives.
 *
 * Post-cleanup (2026-05-02): 12 dead files + ds/ subfolder + broken index.tsx
 * deleted; only files with verified consumers remain. Audit findings:
 *   - SemanticBadge — 5 consumers (semantic palette; renamed from Badge in
 *     Phase 4 DS SSOT to disambiguate from vibcoder chrome-state Badge)
 *   - ErrorState — 1 consumer (sidebar PanelErrorState)
 *   - HelpTooltip — 2 consumers (inspector layout controls)
 *   - Icons — 6 consumers (editor/inspector/, panels/, rail/, shell/)
 *   - panel/PanelShell — 7 consumers (every sidebar tab)
 *
 * @license BSD-3-Clause
 */

export { HelpTooltip, type HelpTooltipProps } from "./HelpTooltip";
export { SemanticBadge, type SemanticBadgeProps } from "./SemanticBadge";
export {
  ErrorState,
  ErrorBoundary,
  FieldError,
  type ErrorStateProps,
  type ErrorBoundaryProps,
  type FieldErrorProps,
  type ErrorSeverity,
} from "./ErrorState";
