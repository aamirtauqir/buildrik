/**
 * Aquibra UI Components — surviving Buildrik primitives.
 *
 * Post-cleanup (2026-05-02): 12 dead files + ds/ subfolder + broken index.tsx
 * deleted; only files with verified consumers remain. Audit findings:
 *   - Badge — 5 consumers (semantic palette; distinct from vibcoder Badge
 *     chrome-state palette per Phase 4 keep-legacy decision)
 *   - ErrorState — 1 consumer (sidebar PanelErrorState)
 *   - HelpTooltip — 2 consumers (inspector layout controls)
 *   - Icons — 6 consumers (editor/inspector/, panels/, rail/, shell/)
 *   - panel/PanelShell — 7 consumers (every sidebar tab)
 *
 * @license BSD-3-Clause
 */

export { HelpTooltip, type HelpTooltipProps } from "./HelpTooltip";
export { Badge, type BadgeProps } from "./Badge";
export {
  ErrorState,
  ErrorBoundary,
  FieldError,
  type ErrorStateProps,
  type ErrorBoundaryProps,
  type FieldErrorProps,
  type ErrorSeverity,
} from "./ErrorState";
