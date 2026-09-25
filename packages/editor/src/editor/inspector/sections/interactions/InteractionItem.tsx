/**
 * Interaction Item Component
 * One interaction as a flat row; opening it drills into its edit screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ANIMATION_PRESETS, type Interaction, getTriggerInfo } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface InteractionItemProps {
  interaction: Interaction;
  /** Opens the interaction's edit screen (the section drills in). */
  onOpen: () => void;
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

export const InteractionItem: React.FC<InteractionItemProps> = ({ interaction, onOpen }) => {
  const triggerInfo = getTriggerInfo(interaction.trigger);
  const presetLabel =
    ANIMATION_PRESETS.find((p) => p.value === interaction.animation.preset)?.label ?? interaction.animation.preset;

  return (
    <div style={{ opacity: interaction.enabled ? 1 : 0.5 }}>
      <div
        role="button"
        tabIndex={0}
        className={ROW}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <span className="tw:flex-1 tw:min-w-0 tw:truncate">{triggerInfo.label}</span>
        <span className="tw:text-[var(--bk-ink-muted)] tw:truncate">{presetLabel}</span>
        <span aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">
          ›
        </span>
      </div>
    </div>
  );
};

export default InteractionItem;
