/**
 * MultiSelectBadge - Shows count of selected elements
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MultiSelectBadgeContainer, MultiSelectClearButton, PrimaryIndicator } from "../styled";

// ============================================================================
// TYPES
// ============================================================================

interface MultiSelectBadgeProps {
  selectedIds: string[];
  primaryId?: string | null;
  onClear: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MultiSelectBadge: React.FC<MultiSelectBadgeProps> = ({
  selectedIds,
  primaryId,
  onClear,
}) => {
  const [hovered, setHovered] = React.useState(false);

  if (selectedIds.length <= 1) return null;

  const othersCount = selectedIds.length - 1;
  const displayText = primaryId
    ? `Primary + ${othersCount} other${othersCount > 1 ? "s" : ""}`
    : `${selectedIds.length} elements selected`;

  return (
    <MultiSelectBadgeContainer className="aqb-multiselect-badge">
      <PrimaryIndicator title="Primary selection">★</PrimaryIndicator>
      <span>{displayText}</span>
      <MultiSelectClearButton
        onClick={onClear}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        isHovered={hovered}
        aria-label="Clear selection"
        title="Clear selection (Esc)"
      >
        ×
      </MultiSelectClearButton>
    </MultiSelectBadgeContainer>
  );
};

export default MultiSelectBadge;
