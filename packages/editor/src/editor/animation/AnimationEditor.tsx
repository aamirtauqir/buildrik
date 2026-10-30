/**
 * Aquibra Animation Editor — the element's CSS animation (2L9 A10 247:26063)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AnimationConfig, AnimationDirection, AnimationFillMode } from "@/shared/types/animations";
import { DEFAULT_ANIMATION } from "@/shared/types/animations";
import { Select } from "@/editor/chrome-ui";
import { SelectRow } from "@/editor/inspector/shared/controls";
import { CommitRow } from "@/editor/inspector/sections/behaviourRows";
// Re-export for backwards compatibility
export type { AnimationConfig } from "@/shared/types/animations";

export interface AnimationEditorProps {
  animation?: AnimationConfig;
  onChange: (animation: AnimationConfig) => void;
  /** The saved trigger, read-only ("Hover · saved legacy"); absent: no row. */
  trigger?: string;
  /** What that trigger means for the CSS output, under its row. */
  triggerNote?: React.ReactNode;
}

const animations = {
  entrance: [
    { value: "fadeIn", label: "Fade In" },
    { value: "fadeInUp", label: "Fade In Up" },
    { value: "fadeInDown", label: "Fade In Down" },
    { value: "fadeInLeft", label: "Fade In Left" },
    { value: "fadeInRight", label: "Fade In Right" },
    { value: "zoomIn", label: "Zoom In" },
    { value: "bounceIn", label: "Bounce In" },
    { value: "slideInUp", label: "Slide In Up" },
    { value: "slideInDown", label: "Slide In Down" },
    { value: "flipInX", label: "Flip In X" },
    { value: "flipInY", label: "Flip In Y" },
    { value: "rotateIn", label: "Rotate In" },
  ],
  attention: [
    { value: "pulse", label: "Pulse" },
    { value: "bounce", label: "Bounce" },
    { value: "shake", label: "Shake" },
    { value: "swing", label: "Swing" },
    { value: "wobble", label: "Wobble" },
    { value: "flash", label: "Flash" },
    { value: "heartBeat", label: "Heart Beat" },
    { value: "rubberBand", label: "Rubber Band" },
  ],
  exit: [
    { value: "fadeOut", label: "Fade Out" },
    { value: "fadeOutUp", label: "Fade Out Up" },
    { value: "fadeOutDown", label: "Fade Out Down" },
    { value: "zoomOut", label: "Zoom Out" },
    { value: "slideOutUp", label: "Slide Out Up" },
  ],
};

const easings = [
  { value: "linear", label: "Linear" },
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In Out" },
  { value: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", label: "Bounce" },
  { value: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", label: "Elastic" },
];

const defaultAnimation: AnimationConfig = DEFAULT_ANIMATION;

const GROUPS = [
  ["Entrance", animations.entrance],
  ["Attention", animations.attention],
  ["Exit", animations.exit],
] as const;

const DIRECTIONS = [
  { value: "normal", label: "Normal" },
  { value: "reverse", label: "Reverse" },
  { value: "alternate", label: "Alternate" },
  { value: "alternate-reverse", label: "Alternate reverse" },
];

const FILLS = [
  { value: "none", label: "None" },
  { value: "forwards", label: "Forwards" },
  { value: "backwards", label: "Backwards" },
  { value: "both", label: "Both" },
];

const REPEATS = [
  ...[1, 2, 3, 4, 5, 10].map((n) => ({ value: String(n), label: n === 1 ? "Once" : `${n} times` })),
  { value: "-1", label: "Infinite" },
];

/** "1.2 s" from 1200 ms; a typed "1.2", "1.2s" or "1200ms" back to ms. */
const seconds = (ms: number) => `${Math.round(ms) / 1000} s`;
const toMs = (text: string): number | null => {
  const t = text.trim().toLowerCase();
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return t.endsWith("ms") ? Math.round(n) : Math.round(n * 1000);
};

/**
 * 2L9 A10 (247:26063): the CSS animation edit screen — Preset and Trigger
 * under "CSS animation", then "Playback options": Duration, Delay,
 * Direction, Fill, Repeat (and Easing, which the CSS writes too).
 * `trigger` is the saved trigger's read-only line and `triggerNote` what it
 * means for the CSS output (the caller knows how to name it).
 */
export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  animation = defaultAnimation,
  onChange,
  trigger,
  triggerNote,
}) => {
  const updateAnimation = (updates: Partial<AnimationConfig>) => {
    onChange({ ...animation, ...updates });
  };
  const legacy = animation.trigger !== "load";

  return (
    <div className="tw:flex tw:flex-col" data-testid="animation-editor">
      <div className="tw:flex tw:h-8 tw:items-center tw:justify-between">
        <span className="tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">CSS animation</span>
        {legacy ? <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Legacy trigger</span> : null}
      </div>
      <div className="bdi-row-ctrl" data-testid="anim-preset">
        <label className="bdi-lb" htmlFor="anim-preset-select">
          Preset
        </label>
        <div className="bdi-row-content">
          <Select id="anim-preset-select" sizing="sm" className="tw:w-full" value={animation.type} onChange={(e) => updateAnimation({ type: e.target.value })}>
            {GROUPS.map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>
      {trigger ? (
        <div className="bdi-row-ctrl" data-testid="anim-trigger">
          <span className="bdi-lb">Trigger</span>
          <div className="bdi-row-content">
            <span className="tw:flex tw:h-6 tw:w-full tw:items-center tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink)]">
              {trigger}
            </span>
          </div>
        </div>
      ) : null}
      {triggerNote}
      <div className="tw:mt-4 tw:flex tw:h-8 tw:items-center tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]" data-testid="anim-timing-label">
        Playback options
      </div>
      <CommitRow
        label="Duration"
        value={seconds(animation.duration)}
        onCommit={(v) => {
          const ms = toMs(v);
          if (ms !== null && ms > 0) updateAnimation({ duration: ms });
        }}
        testId="anim-duration"
      />
      <CommitRow
        label="Delay"
        value={seconds(animation.delay)}
        onCommit={(v) => {
          const ms = toMs(v);
          if (ms !== null) updateAnimation({ delay: ms });
        }}
        testId="anim-delay"
      />
      <SelectRow label="Direction" value={animation.direction} placeholder={null} options={DIRECTIONS} onChange={(v) => updateAnimation({ direction: v as AnimationDirection })} />
      <SelectRow label="Fill" value={animation.fillMode ?? "forwards"} placeholder={null} options={FILLS} onChange={(v) => updateAnimation({ fillMode: v as AnimationFillMode })} />
      <SelectRow
        label="Repeat"
        value={String(animation.iterations)}
        placeholder={null}
        options={REPEATS.some((r) => r.value === String(animation.iterations)) ? REPEATS : [...REPEATS, { value: String(animation.iterations), label: `${animation.iterations} times` }]}
        onChange={(v) => updateAnimation({ iterations: Number(v) })}
      />
      <SelectRow label="Easing" value={animation.easing} placeholder={null} options={easings} onChange={(v) => updateAnimation({ easing: v })} />
    </div>
  );
};

export default AnimationEditor;
