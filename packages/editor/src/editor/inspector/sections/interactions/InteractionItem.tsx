/**
 * Interaction Item Component
 * Collapsible item displaying a single interaction with expand/collapse editor
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InteractionEditor } from "./InteractionEditor";
import { ANIMATION_PRESETS, type Interaction, getTriggerInfo } from "./types";

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
}

// ============================================================================
// STYLES
// ============================================================================

/* Board 4428:142686 draws each interaction as a flat 32px row:
   trigger on the left, the animation it plays and a chevron on the right. */
const ROW =
  "tw:flex tw:items-center tw:gap-2 tw:h-8 tw:cursor-pointer tw:select-none " +
  "tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink)] tw:rounded-[var(--bk-radius-sm)] " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

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
}) => {
  const triggerInfo = getTriggerInfo(interaction.trigger);
  const presetLabel =
    ANIMATION_PRESETS.find((p) => p.value === interaction.animation.preset)?.label ?? interaction.animation.preset;

  return (
    <div style={{ opacity: interaction.enabled ? 1 : 0.5 }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isEditing}
        className={ROW}
        onClick={onToggleEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleEdit();
          }
        }}
      >
        <span className="tw:flex-1 tw:min-w-0 tw:truncate">{triggerInfo.label}</span>
        <span className="tw:text-[var(--bk-ink-muted)] tw:truncate">{presetLabel}</span>
        <span
          aria-hidden="true"
          className="tw:text-[var(--bk-ink-muted)] tw:inline-block tw:transition-transform"
          style={{ transform: isEditing ? "rotate(90deg)" : "none" }}
        >
          ›
        </span>
      </div>

      {/* Expanded Editor */}
      {isEditing && (
        <InteractionEditor
          interaction={interaction}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onToggleEnabled={onToggleEnabled}
          onPreview={onPreview}
        />
      )}
    </div>
  );
};

export default InteractionItem;
