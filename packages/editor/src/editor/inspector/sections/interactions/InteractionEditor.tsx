/**
 * Interaction Editor — one interaction's screen (2L9 boards 161:15179 I15,
 * 165:17822 I20, 165:18272 I21), in the board's compact label | control rows:
 *
 *   [ Play ]            More…           → "Interaction actions" card beside
 *   Trigger   [On scroll into view ▾]      the column: Duplicate · Disable ·
 *   Effect    [Fade in ▾]                  Delete · Close menu
 *   Animate   [This element ▾]
 *   Duration  [0.6] s
 *   Delay     [0]   s
 *   Easing    [Ease out ▾]
 *   Repeat    [Once ▾]
 *   When      (•) Only the first time      (scroll triggers)
 *             ( ) Every time it enters
 *   Plays on all breakpoints
 *
 * Each row writes the model the runtime reads: Animate → `animation.target`
 * (self / parent), Repeat → `animation.loop` (1, 2, 3, -1 = forever).
 * When: the published runtime replays a scroll animation every time the
 * element enters, so "Every time it enters" is what ships and "Only the
 * first time" is offered disabled until the runtime can stop after one
 * (`authority: code:scroll-replays-every-entry`, REQUESTS B-13).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { AnimationPreset } from "@/engine/interactions/types";
import { type Interaction, type InteractionTrigger, ANIMATION_PRESETS, EASING_OPTIONS, TRIGGER_GROUPS, easingValue } from "./types";
import { Button, Menu, MenuItem, Popover, Radio, TextInput } from "@/editor/chrome-ui";
import { ControlRow, SelectRow } from "@/editor/inspector/shared/controls";
import { NoteRow } from "../behaviourRows";

export interface InteractionEditorProps {
  interaction: Interaction;
  onUpdate: (id: string, updates: Partial<Interaction>) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  /** Interaction actions › Duplicate (I20). */
  onDuplicate?: (id: string) => void;
  onPreview?: (interaction: Interaction) => void;
  onStopPreview?: () => void;
  /** The element's name, for the missing-target fallback line (I19). */
  elementName?: string;
}

/** Every trigger, in the picker's order, for the Trigger row. */
const TRIGGER_OPTIONS = Object.values(TRIGGER_GROUPS).flat().map(({ value, label }) => ({ value, label }));

/** "Fade In" → "Fade in" (the board's sentence case). */
const EFFECT_OPTIONS = ANIMATION_PRESETS.map((p) => ({ value: p.value, label: p.label.charAt(0) + p.label.slice(1).toLowerCase() }));

const ANIMATE_OPTIONS = [
  { value: "self", label: "This element" },
  { value: "parent", label: "Its parent" },
];

const REPEAT_OPTIONS = [
  { value: "1", label: "Once" },
  { value: "2", label: "Twice" },
  { value: "3", label: "3 times" },
  { value: "-1", label: "Forever" },
];

const SCROLL_TRIGGERS = new Set(["scroll-into-view", "scroll-out"]);

const HALF = "tw:h-7 tw:flex-1 tw:text-[12px] tw:font-normal tw:focus:ring-0";

/**
 * Seconds in the field, milliseconds stored (P-11c). While focused the field
 * holds a draft: a keystroke writes only a finite value already in range, so
 * "0.5" can pass through "0" without being clamped to Duration's 0.1. Blur
 * settles the draft — an out-of-range number is clamped and written, an empty
 * or non-numeric one restores the stored value. NaN and negatives never reach
 * the interaction.
 */
const TimingInput: React.FC<{
  label: string;
  storedMs: number;
  min: number;
  max: number;
  onCommit: (ms: number) => void;
}> = ({ label, storedMs, min, max, onCommit }) => {
  const [draft, setDraft] = React.useState<string | null>(null);

  const handleChange = (raw: string) => {
    setDraft(raw);
    const seconds = parseFloat(raw);
    if (Number.isFinite(seconds) && seconds >= min && seconds <= max) onCommit(Math.round(seconds * 1000));
  };

  const handleBlur = () => {
    if (draft === null) return;
    setDraft(null);
    const seconds = parseFloat(draft);
    if (!Number.isFinite(seconds)) return;
    const ms = Math.round(Math.min(max, Math.max(min, seconds)) * 1000);
    if (ms !== storedMs) onCommit(ms);
  };

  return (
    <ControlRow label={label}>
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1">
        <TextInput
          type="number"
          sizing="sm"
          aria-label={`${label} in seconds`}
          value={draft ?? storedMs / 1000}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={0.1}
          className="tw:min-w-0 tw:flex-1"
        />
        {/* The board's unit box. Seconds are the one unit timing takes, so it
            is a readout, not a choice. */}
        <span
          aria-hidden="true"
          className="tw:flex tw:h-7 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-[4px] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:text-[12px] tw:text-[var(--bk-ink)]"
        >
          s
        </span>
      </div>
    </ControlRow>
  );
};

/** Whether a saved selector matches something on the canvas page. */
function selectorMatches(selector: string): boolean {
  const scope = document.querySelector("[data-buildrick-canvas]") ?? document;
  try {
    return Boolean(scope.querySelector(selector));
  } catch {
    return false;
  }
}

export const InteractionEditor: React.FC<InteractionEditorProps> = ({
  interaction,
  onUpdate,
  onRemove,
  onToggleEnabled,
  onDuplicate,
  onPreview,
  onStopPreview,
  elementName = "this element",
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  /* 2L9 I17: a preview stays on the canvas (it ends filled) until Stop —
     or until this screen goes. */
  const [playing, setPlaying] = React.useState(false);
  const stop = React.useCallback(() => {
    setPlaying(false);
    onStopPreview?.();
  }, [onStopPreview]);
  React.useEffect(() => () => onStopPreview?.(), [onStopPreview]);
  const act = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };
  const anim = interaction.animation;
  /* 2L9 I19: a saved selector target. The published runtime animates what
     it matches and falls back to the element itself when it matches
     nothing (interactionRuntime.ts `target`), so a selector with no match
     on the page reads as a missing target. */
  const customTarget = anim.target && anim.target !== "self" && anim.target !== "parent" ? anim.target : null;
  const targetFound = customTarget ? selectorMatches(customTarget) : true;
  const setAnimation = (patch: Partial<Interaction["animation"]>) => onUpdate(interaction.id, { animation: { ...anim, ...patch } });

  return (
    <div className="tw:flex tw:flex-col tw:pt-1" data-testid="interaction-editor">
      <div className="tw:flex tw:gap-2 tw:pb-1">
        <Button
          onClick={() => {
            if (playing) return stop();
            onPreview?.(interaction);
            setPlaying(Boolean(onPreview));
          }}
          color="light"
          size="xs"
          className="tw:h-7 tw:w-24 tw:shrink-0 tw:text-[12px] tw:font-normal tw:focus:ring-0"
          data-testid="interaction-play"
        >
          {playing ? "Stop" : "Play"}
        </Button>
        <Popover
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          placement="bottom-end"
          beside=".layout-shell__inspector"
          /* 2L9 165:17822: the menu tops out level with the tab strip. */
          besideTop="[data-testid=inspector-tab-strip]"
          label="Interaction actions"
          className="tw:w-[240px] tw:p-1"
          trigger={
            <Button
              color="light"
              size="xs"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={HALF + " tw:border-0 tw:bg-transparent tw:hover:bg-[var(--bk-bg-subtle)]"}
            >
              More…
            </Button>
          }
        >
          <div className="tw:px-2 tw:pb-1 tw:pt-1.5 tw:text-[12px] tw:font-semibold tw:text-[var(--bk-ink)]">Interaction actions</div>
          <Menu label="Interaction actions" className="tw:min-w-0">
            {onDuplicate ? <MenuItem onClick={act(() => onDuplicate(interaction.id))}>Duplicate</MenuItem> : null}
            <MenuItem onClick={act(() => onToggleEnabled(interaction.id))}>{interaction.enabled ? "Disable" : "Enable"}</MenuItem>
            <MenuItem onClick={act(() => onRemove(interaction.id))}>Delete</MenuItem>
            <MenuItem className="tw:[&>span]:text-center" onClick={() => setMenuOpen(false)}>
              Close menu
            </MenuItem>
          </Menu>
        </Popover>
      </div>
      {interaction.enabled ? null : <NoteRow testId="interaction-disabled">Off · this interaction does not play.</NoteRow>}
      <SelectRow
        label="Trigger"
        placeholder={null}
        value={interaction.trigger}
        onChange={(value) => onUpdate(interaction.id, { trigger: value as InteractionTrigger })}
        options={TRIGGER_OPTIONS}
      />
      <SelectRow
        label="Effect"
        placeholder={null}
        value={anim.preset}
        onChange={(value) => setAnimation({ preset: value as AnimationPreset })}
        options={EFFECT_OPTIONS}
      />
      <SelectRow
        label="Animate"
        placeholder={null}
        value={customTarget ? customTarget : anim.target === "parent" ? "parent" : "self"}
        onChange={(value) => setAnimation({ target: value })}
        options={customTarget ? [...ANIMATE_OPTIONS, { value: customTarget, label: targetFound ? customTarget : "Missing target" }] : ANIMATE_OPTIONS}
      />
      <TimingInput label="Duration" storedMs={anim.duration} min={0.1} max={10} onCommit={(ms) => setAnimation({ duration: ms })} />
      <TimingInput label="Delay" storedMs={anim.delay} min={0} max={5} onCommit={(ms) => setAnimation({ delay: ms })} />
      <SelectRow
        label="Easing"
        placeholder={null}
        value={easingValue(anim.easing)}
        onChange={(value) => setAnimation({ easing: value })}
        options={EASING_OPTIONS}
      />
      <SelectRow
        label="Repeat"
        placeholder={null}
        value={String(anim.loop ?? 1)}
        onChange={(value) => setAnimation({ loop: Number(value) })}
        options={REPEAT_OPTIONS}
      />
      {SCROLL_TRIGGERS.has(interaction.trigger) ? (
        <div role="radiogroup" aria-label="When" className="tw:flex tw:flex-col tw:gap-1 tw:pt-1" data-testid="interaction-when">
          <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">When</span>
          <label className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:rounded-[4px] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
            <Radio name={`when-${interaction.id}`} disabled checked={false} onChange={() => undefined} />
            Only the first time
          </label>
          <label className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:rounded-[4px] tw:bg-[var(--bk-accent-tint)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink)]">
            <Radio name={`when-${interaction.id}`} checked readOnly />
            Every time it enters
          </label>
        </div>
      ) : null}
      <NoteRow testId="interaction-all-breakpoints">Plays on all breakpoints</NoteRow>
      {playing ? (
        <NoteRow testId="interaction-previewing">Previewing on the canvas. Stopping restores the authored appearance.</NoteRow>
      ) : null}
      {targetFound ? null : (
        <p className="tw:m-0 tw:py-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]" role="status" data-testid="interaction-missing-target">
          The saved target no longer exists. Output falls back to {elementName} until you choose a target.
        </p>
      )}
    </div>
  );
};

export default InteractionEditor;
