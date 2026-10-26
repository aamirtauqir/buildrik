/**
 * Add interaction — presets first (2L9 boards 161:14772 I14, 271:129231
 * G17):
 *
 *   ‹ Back to Interactions
 *   Add interaction
 *   Fade in on scroll · Slide up on scroll · Fade in on page load ·
 *   Grow on hover · Glow on hover · Pulse on hover · Press while held
 *   Choose a trigger ›              → every trigger, grouped (the old panel)
 *   Plays when rendered (CSS) ›     → the element's CSS entrance animation
 *
 * A preset is one trigger + one animation preset of the existing model —
 * nothing a trigger-first add could not make, just named.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/editor/chrome-ui";
import type { AnimationPreset } from "@/engine/interactions/types";
import { type InteractionTrigger, TRIGGER_GROUPS } from "./types";

export interface AddInteractionPanelProps {
  onAdd: (trigger: InteractionTrigger, preset?: AnimationPreset) => void;
  onClose: () => void;
  /** The element's CSS animation (G2-157 folded its section into this list).
   *  Present only while the element has none — one animation per element. */
  onAddAnimation?: () => void;
}

/** I14's presets, in its order: trigger + animation preset. */
const PRESETS: readonly { label: string; trigger: InteractionTrigger; preset: AnimationPreset }[] = [
  { label: "Fade in on scroll", trigger: "scroll-into-view", preset: "fadeIn" },
  { label: "Slide up on scroll", trigger: "scroll-into-view", preset: "slideUp" },
  { label: "Fade in on page load", trigger: "page-load", preset: "fadeIn" },
  { label: "Grow on hover", trigger: "hover", preset: "scaleUp" },
  { label: "Glow on hover", trigger: "hover", preset: "glow" },
  { label: "Pulse on hover", trigger: "hover", preset: "pulse" },
  { label: "Press while held", trigger: "active", preset: "scaleDown" },
];

const GROUP_LABELS: Record<string, string> = {
  element: "Element",
  page: "Page",
  scroll: "Scroll",
  mouse: "Mouse",
};

const ROW =
  "tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded-[4px] tw:border-0 tw:bg-transparent tw:px-1.5 " +
  "tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0";

const BACK =
  "tw:self-center tw:h-7 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-transparent tw:hover:underline";

/* 2L9 I14: "Choose a trigger ›" is a full-width bordered button, "Plays
   when rendered (CSS) ›" a centred text one. */
const BORDERED = "tw:mt-1 tw:h-8 tw:w-full tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0";
const TEXT_CENTRED =
  "tw:h-8 tw:w-full tw:border-0 tw:bg-transparent tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0";

function Row({ children, onClick, icon: Icon, testId }: { children: React.ReactNode; onClick: () => void; icon?: LucideIcon; testId?: string }) {
  return (
    <Button type="button" color="light" size="xs" className={ROW} onClick={onClick} data-testid={testId}>
      {Icon ? <Icon size={14} aria-hidden="true" className="tw:shrink-0" /> : null}
      <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-left">{children}</span>
    </Button>
  );
}

export const AddInteractionPanel: React.FC<AddInteractionPanelProps> = ({ onAdd, onClose, onAddAnimation }) => {
  const [triggers, setTriggers] = React.useState(false);
  return (
    <div className="tw:flex tw:flex-col" data-testid="add-interaction">
      <Button type="button" color="light" size="xs" className={BACK} onClick={triggers ? () => setTriggers(false) : onClose} data-testid="add-interaction-back">
        {triggers ? "‹ Add interaction" : "‹ Back to Interactions"}
      </Button>
      <div className="tw:py-1 tw:text-[12px] tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="add-interaction-title">{triggers ? "Choose a trigger" : "Add interaction"}</div>
      {triggers ? (
        Object.entries(TRIGGER_GROUPS).map(([group, list]) => (
          <div key={group} role="group" aria-label={GROUP_LABELS[group] ?? group} className="tw:flex tw:flex-col tw:pb-1">
            <div className="tw:px-2 tw:pt-1 tw:text-[11px] tw:font-medium tw:text-[var(--bk-ink-muted)]">{GROUP_LABELS[group] ?? group}</div>
            {list.map((t) => (
              <Row key={t.value} icon={t.icon} onClick={() => onAdd(t.value as InteractionTrigger)}>
                {t.label}
              </Row>
            ))}
          </div>
        ))
      ) : (
        <>
          {PRESETS.map((p) => (
            <Row key={p.label} onClick={() => onAdd(p.trigger, p.preset)} testId="add-interaction-preset">
              {p.label}
            </Row>
          ))}
          <Button type="button" color="light" size="xs" className={BORDERED} onClick={() => setTriggers(true)} data-testid="add-interaction-choose-trigger">
            Choose a trigger ›
          </Button>
          {onAddAnimation ? (
            <Button type="button" color="light" size="xs" className={TEXT_CENTRED} onClick={onAddAnimation} data-testid="add-interaction-css">
              Plays when rendered (CSS) ›
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AddInteractionPanel;
