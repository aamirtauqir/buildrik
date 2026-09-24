/**
 * ElementAnimationRow — G2-157, option A (owner-approved 2026-09-24): the
 * element's CSS animation (AnimationConfig, rendered as an inline
 * `animation:` style and exported as CSS keyframes) is one row of the
 * Interactions list, labelled by ITS OWN trigger ("On page load · Fade In ›").
 * Opening it edits the same config the old Animation section did; Remove
 * clears it. Nothing about the data or the export changes.
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
  onChange: (animation: AnimationConfig | null) => void;
  onPreview?: () => void;
  /** Open on mount — a just-created animation lands in its editor. */
  defaultOpen?: boolean;
}

export function ElementAnimationRow({ animation, onChange, onPreview, defaultOpen = false }: ElementAnimationRowProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const toggle = () => setOpen((v) => !v);
  return (
    <div data-testid="element-animation-row">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className={ROW}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span className="tw:flex-1 tw:min-w-0 tw:truncate">{TRIGGER_LABEL[animation.trigger] ?? animation.trigger}</span>
        <span className="tw:text-[var(--bk-ink-muted)] tw:truncate">{presetLabel(animation.type)}</span>
        <span
          aria-hidden="true"
          className="tw:text-[var(--bk-ink-muted)] tw:inline-block tw:transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ›
        </span>
      </div>
      {open ? (
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
      ) : null}
    </div>
  );
}
