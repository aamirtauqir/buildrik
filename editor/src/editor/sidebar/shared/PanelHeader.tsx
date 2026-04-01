/**
 * PanelHeader — re-export from canonical location in shared/ui.
 * The canonical implementation lives at src/shared/ui/PanelHeader.tsx.
 * This file exists so that existing relative imports within editor/sidebar/ keep working.
 * @license BSD-3-Clause
 */

export {
  PanelHeader,
  HeaderActions,
  type PanelHeaderProps,
  type HeaderActionsProps,
} from "@shared/ui/PanelHeader";

export { default } from "@shared/ui/PanelHeader";
