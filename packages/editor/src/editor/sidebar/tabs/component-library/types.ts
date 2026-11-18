/**
 * Components tab shared types
 * ComponentsTabProps lives here so barrel re-exports work without circular imports.
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";

export interface ComponentsTabProps {
  composer: Composer | null;
  onComponentSelect?: (component: ComponentDefinition | null) => void;
  selectedComponentId?: string | null;
  onClose?: () => void;
}
