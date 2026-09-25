/**
 * ElementAnimationRow — G2-157, option A (owner-approved 2026-09-24): the
 * element's CSS animation (AnimationConfig, rendered as an inline
 * `animation:` style and exported as CSS keyframes) is one row of the
 * Interactions list, labelled by ITS OWN trigger ("On page load · Fade In ›").
 * Opening it drills into its edit screen (the same config the old Animation
 * section edited); Remove clears it. Nothing about the data or the export
 * changes.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { AnimationConfig, AnimationTrigger } from "@/shared/types/animations";
import { AnimationEditor } from "@/editor/animation/AnimationEditor";
import { Button } from "@/editor/chrome-ui";

const TRIGGER_LABEL: Record<AnimationTrigger, string> = {
  load: "On page load",
  scroll: "On scroll into view",
  hover: "On hover",
  click: "On click",
};

export const animationTriggerLabel = (a: AnimationConfig) => TRIGGER_LABEL[a.trigger] ?? a.trigger;

/** "fadeInUp" → "Fade In Up" — the preset names the editor lists. */
function presetLabel(type: string): string {
  const spaced = type.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const ROW =
  "tw:flex tw:items-center tw:gap-2 tw:h-8 tw:cursor-pointer tw:select-none " +
  "tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink)] tw:rounded-[var(--bk-radius-sm)] " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export interface ElementAnimationRowProps {
  animation: AnimationConfig;
  /** Opens the animation's edit screen (the section drills in). */
  onOpen: () => void;
}

export function ElementAnimationRow({ animation, onOpen }: ElementAnimationRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="element-animation-row"
      className={ROW}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="tw:flex-1 tw:min-w-0 tw:truncate">{animationTriggerLabel(animation)}</span>
      <span className="tw:text-[var(--bk-ink-muted)] tw:truncate">{presetLabel(animation.type)}</span>
      <span aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">›</span>
    </div>
  );
}

export interface ElementAnimationEditorProps {
  animation: AnimationConfig;
  onChange: (animation: AnimationConfig | null) => void;
  onPreview?: () => void;
}

/** The animation's edit screen body — the old inline expansion. */
export function ElementAnimationEditor({ animation, onChange, onPreview }: ElementAnimationEditorProps) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:pb-2">
      <AnimationEditor animation={animation} onChange={onChange} onPreview={onPreview} />
      <Button
        type="button"
        color="alternative"
        size="xs"
        className="tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[var(--bk-error)] tw:hover:bg-transparent tw:hover:underline"
        onClick={() => onChange(null)}
      >
        Remove animation
      </Button>
    </div>
  );
}
