/**
 * Slider › PLAYBACK + CONTROLS — board 4428:142450. `SlidesSection.tsx` edits
 * the slider's own children (the slides); these rows edit the slider
 * element's own attributes — `data-autoplay` / `data-interval` /
 * `data-arrows` / `data-dots` — which are the single source of truth the
 * carousel runtime reads, both in the canvas (`useSliderRuntime.ts`, a live
 * DOM effect) and on the published page (`lib/publish-sliders.ts`, the same
 * behaviour inlined as a `<script>`). Client-only: no server row, unlike
 * Form's AFTER SUBMIT.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { TextInput, ToggleSwitch } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls";

export interface SliderPlaybackSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const ROW = "tw:flex tw:items-center tw:gap-2 tw:min-h-8";
const LABEL = "tw:w-[88px] tw:flex-none tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]";

function runTxn(composer: Composer, label: string, fn: () => void) {
  composer.beginTransaction?.(label);
  try {
    fn();
  } finally {
    composer.endTransaction?.();
  }
}

const boolAttr = (el: { getAttribute: (n: string) => string | undefined }, name: string, fallback: boolean) => {
  const v = el.getAttribute(name);
  return v === undefined ? fallback : v === "true";
};

export const SliderPlaybackSection: React.FC<SliderPlaybackSectionProps> = ({
  elementId,
  composer,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.ELEMENT_UPDATED, refresh);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, refresh);
    };
  }, [composer]);

  const slider = composer?.elements.getElement(elementId);
  if (!composer || !slider) return null;

  const autoplay = boolAttr(slider, "data-autoplay", false);
  const interval = Number(slider.getAttribute("data-interval")) || 5;
  const arrows = boolAttr(slider, "data-arrows", true);
  const dots = boolAttr(slider, "data-dots", true);

  const set = (name: string, value: string) =>
    runTxn(composer, "slider-settings", () => slider.setAttribute(name, value));

  return (
    <Section title="Playback" icon="Play" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-slider-playback">
      <div className={ROW}>
        <span className={LABEL}>Autoplay</span>
        <ToggleSwitch checked={autoplay} label="" onChange={(v) => set("data-autoplay", String(v))} />
      </div>
      {autoplay && (
        <div className={ROW}>
          <span className={LABEL}>Interval</span>
          <TextInput
            sizing="sm"
            type="number"
            min={1}
            max={60}
            className="tw:w-20"
            aria-label="Autoplay interval, seconds"
            value={String(interval)}
            onChange={(e) => {
              const n = Math.min(60, Math.max(1, Number(e.target.value) || 5));
              set("data-interval", String(n));
            }}
          />
          <span className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">sec</span>
        </div>
      )}
      <div className={ROW}>
        <span className={LABEL}>Arrows</span>
        <ToggleSwitch checked={arrows} label="" onChange={(v) => set("data-arrows", String(v))} />
      </div>
      <div className={ROW}>
        <span className={LABEL}>Dots</span>
        <ToggleSwitch checked={dots} label="" onChange={(v) => set("data-dots", String(v))} />
      </div>
    </Section>
  );
};
