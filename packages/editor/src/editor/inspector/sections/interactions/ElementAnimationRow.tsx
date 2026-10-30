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
import { NoteRow, PickRow } from "../behaviourRows";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";

const TRIGGER_LABEL: Record<AnimationTrigger, string> = {
  load: "On page load",
  scroll: "On scroll into view",
  hover: "On hover",
  click: "On click",
};

const animationTriggerLabel = (a: AnimationConfig) => TRIGGER_LABEL[a.trigger] ?? a.trigger;

/** "fadeInUp" → "Fade In Up" — the preset names the editor lists. */
function presetLabel(type: string): string {
  const spaced = type.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export interface ElementAnimationRowProps {
  animation: AnimationConfig;
  /** Opens the animation's edit screen (the section drills in). */
  onOpen: () => void;
}

export function ElementAnimationRow({ animation, onOpen }: ElementAnimationRowProps) {
  return (
    <PickRow
      testId="element-animation-row"
      label={animationTriggerLabel(animation)}
      value={presetLabel(animation.type)}
      onOpen={onOpen}
    />
  );
}

/** What a preset moves: fades the opacity, slides / zooms / bounces / flips /
 *  rotates the transform (both for a few). */
export function animatedProperties(name: string): Set<string> {
  const n = name.toLowerCase();
  const out = new Set<string>();
  if (/fade|blur|flash|pulse/.test(n)) out.add("opacity");
  if (/slide|zoom|scale|bounce|flip|rotate|shake|swing|wobble|pulse|move|rise|drop|up$|down$|left$|right$/.test(n)) out.add("transform");
  return out;
}

export interface AnimationConflict {
  /** The interaction it shares a property with. */
  id: string;
  label: string;
  property: string;
}

export interface ElementAnimationEditorProps {
  animation: AnimationConfig;
  onChange: (animation: AnimationConfig | null) => void;
  onPreview?: () => void;
  /** 2L9 A10: interactions animating a property this animation also does. */
  conflicts?: readonly AnimationConflict[];
  onInspect?: (interactionId: string) => void;
}

/** The animation's edit screen body — the old inline expansion. */
export function ElementAnimationEditor({ animation, onChange, onPreview, conflicts = [], onInspect }: ElementAnimationEditorProps) {
  const first = conflicts[0];
  const triggerName = animationTriggerLabel(animation).replace(/^On /, "").replace(/^./, (c) => c.toUpperCase());
  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:pb-2">
      {/* 2L9 A10 247:26063: the CSS output plays an element animation when
          the element renders — a saved non-load trigger is not applied. */}
      <AnimationEditor
        animation={animation}
        onChange={onChange}
        trigger={animation.trigger === "load" ? triggerName : `${triggerName} · saved legacy`}
        triggerNote={
          animation.trigger !== "load" ? (
            <NoteRow testId="element-animation-legacy">Plays when rendered. This saved {triggerName} trigger is not applied by current CSS output.</NoteRow>
          ) : null
        }
      />
      {first ? (
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="element-animation-conflict">
          <div className="tw:pt-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Property conflict</div>
          <NoteRow>
            {presetLabel(animation.type)} and {first.label} both animate {first.property}. Neither is removed automatically.
          </NoteRow>
          {onInspect ? (
            <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => onInspect(first.id)} data-testid="element-animation-inspect-conflict">
              Inspect {first.label}
            </Button>
          ) : null}
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => onChange(null)} data-testid="element-animation-disable">
            Disable CSS animation
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          color="alternative"
          size="xs"
          className="tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[var(--bk-error)] tw:hover:bg-transparent tw:hover:underline"
          onClick={() => onChange(null)}
        >
          Remove animation
        </Button>
      )}
      {onPreview ? (
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onPreview} data-testid="element-animation-preview">
          Preview applied configuration
        </Button>
      ) : null}
    </div>
  );
}
