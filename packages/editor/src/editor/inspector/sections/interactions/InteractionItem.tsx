/**
 * Interaction Item Component
 * One interaction as a flat row; opening it drills into its edit screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ANIMATION_PRESETS, type Interaction, getTriggerInfo } from "./types";
import { Button } from "@/editor/chrome-ui";

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

/* 2L9 165:19449 / 165:18272: one interaction is one centred row —
   "On scroll into view · Fade in ›" — that drills into its edit screen. A
   disabled one keeps its row, muted, as "Off · Fade in on scroll into view". */
export const InteractionItem: React.FC<InteractionItemProps> = ({ interaction, onOpen }) => {
  const triggerInfo = getTriggerInfo(interaction.trigger);
  const presetLabel =
    ANIMATION_PRESETS.find((p) => p.value === interaction.animation.preset)?.label ?? interaction.animation.preset;
  const on = interaction.enabled;
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onOpen}
      data-testid="interaction-row"
      className={
        "tw:h-10 tw:w-full tw:justify-center tw:gap-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0" +
        (on ? "" : " tw:text-[var(--bk-ink-soft)]")
      }
    >
      {on ? (
        <>
          <span>{triggerInfo.label}</span>
          <span>&nbsp;· {presetLabel}</span>
          <span aria-hidden="true">&nbsp;›</span>
        </>
      ) : (
        <>
          <span>Off · {presetLabel}&nbsp;</span>
          <span>{triggerInfo.label.toLowerCase()}</span>
        </>
      )}
    </Button>
  );
};

export default InteractionItem;
