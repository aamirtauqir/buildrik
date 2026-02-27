/**
 * Interaction Item Component
 * Collapsible item displaying a single interaction with expand/collapse editor
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { InteractionEditor } from "./InteractionEditor";
import { type Interaction, getTriggerInfo } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface InteractionItemProps {
  interaction: Interaction;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (id: string, updates: Partial<Interaction>) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onPreview?: (interaction: Interaction) => void;
  onOpenTimeline?: (interaction: Interaction) => void;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: (enabled: boolean): React.CSSProperties => ({
    background: INSPECTOR_TOKENS.surfaceSubtle,
    borderRadius: 8,
    overflow: "hidden",
    opacity: enabled ? 1 : 0.5,
  }),
  header: (isEditing: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    cursor: "pointer",
    background: isEditing ? INSPECTOR_TOKENS.surfaceInput : "transparent",
  }),
  icon: {
    fontSize: 14,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: INSPECTOR_TOKENS.textPrimary,
  },
  type: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textMuted,
  },
  arrow: (isEditing: boolean): React.CSSProperties => ({
    transform: isEditing ? "rotate(90deg)" : "none",
    color: INSPECTOR_TOKENS.textMuted,
    fontSize: 10,
  }),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const InteractionItem: React.FC<InteractionItemProps> = ({
  interaction,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
  onToggleEnabled,
  onPreview,
  onOpenTimeline,
}) => {
  const triggerInfo = getTriggerInfo(interaction.trigger);

  return (
    <div style={styles.container(interaction.enabled)}>
      {/* Header */}
      <div onClick={onToggleEdit} style={styles.header(isEditing)}>
        <span style={styles.icon}>{triggerInfo.icon}</span>
        <span style={styles.label}>{triggerInfo.label}</span>
        <span style={styles.type}>{interaction.animation.type}</span>
        <span style={styles.arrow(isEditing)}>&#9654;</span>
      </div>

      {/* Expanded Editor */}
      {isEditing && (
        <InteractionEditor
          interaction={interaction}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onToggleEnabled={onToggleEnabled}
          onPreview={onPreview}
          onOpenTimeline={onOpenTimeline}
        />
      )}
    </div>
  );
};

export default InteractionItem;
