/**
 * Components tab shared types
 * ComponentsTabProps lives here so barrel re-exports work without circular imports.
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";
import type { ComponentDefinition } from "../../../../shared/types/components";

export interface ComponentsTabProps {
  composer: Composer | null;
  searchQuery?: string;
  compactMode?: boolean;
  onCreateNew?: () => void;
  onComponentSelect?: (component: ComponentDefinition | null) => void;
  selectedComponentId?: string | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}
