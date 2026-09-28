/**
 * Interaction Item Component
 * One interaction as a flat row; opening it drills into its edit screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ANIMATION_PRESETS, type Interaction, getTriggerInfo } from "./types";
import { PickRow } from "../behaviourRows";

// ============================================================================
// TYPES
// ============================================================================

export interface InteractionItemProps {
  interaction: Interaction;
  /** Opens the interaction's edit screen (the section drills in). */
  onOpen: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/* Board 2: "On click  [Scroll to menu ▾]" — the trigger as the label, the
   animation it plays as the value; opening it drills into its edit screen. */
export const InteractionItem: React.FC<InteractionItemProps> = ({ interaction, onOpen }) => {
  const triggerInfo = getTriggerInfo(interaction.trigger);
  const presetLabel =
    ANIMATION_PRESETS.find((p) => p.value === interaction.animation.preset)?.label ?? interaction.animation.preset;

  return <PickRow label={triggerInfo.label} value={presetLabel} onOpen={onOpen} muted={!interaction.enabled} />;
};

export default InteractionItem;
