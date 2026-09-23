/**
 * ApplyProgressOverlay — Templates board 642:2832 (Templates · applying).
 *
 * A light card over the scrim: what is being applied, the one instruction that
 * matters while it runs, a determinate bar, and the steps with their state.
 *
 * It is DRIVEN, not self-driving. It used to tick its four steps off on 300ms
 * timers and then run the entire apply in one go at the end — so "Importing
 * template HTML ✓" appeared before anything had been imported, and the bar
 * reached 100% while the work had not started. The caller now advances it as
 * each stage actually completes.
 *
 * The card is board 642:3095's `modal/440`: a title block (18/12 over 20),
 * a body (4/16 over 20, 12px rhythm) and a bordered footer (14 over 20) with
 * a 28-tall secondary button. It used to be one 20/24/16 box with the three
 * regions run together, which is why the Cancel sat hard against the last
 * step row.
 *
 * The step rows carry their state in WORDS ("— done", "— applying…",
 * "— queued") on the board's two-tone scale: ink-soft while a step is done or
 * running, ink-muted while it is still queued. The previous treatment used a
 * glyph plus a per-state colour (green / accent / disabled), which said the
 * same thing three times and said it in colour alone.
 *
 * The board lists SIX steps — the four phases plus "Testimonials" and
 * "Footer". Those two are not adopted: the board queues them AFTER "Saving
 * applied state", i.e. after the work it would be reporting has finished, so
 * its own ordering contradicts the phases beside them; and `templatesData`
 * exposes a section COUNT (`getSectionCount`), never section names, so the
 * labels could only be invented. Rendering stays the board's, the step list
 * stays the code's — the arc's standing split.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./ApplyProgressOverlay.css";
import { Button, Portal } from "@/editor/chrome-ui";

export type ApplyStepState = "done" | "active" | "queued";

export interface ApplyStep {
  id: string;
  label: string;
  state: ApplyStepState;
}

export interface ApplyProgressOverlayProps {
  templateName: string;
  steps: ApplyStep[];
  /** Offered only while the work can still be called off — see TemplatesTab. */
  onCancel?: () => void;
}

/** Board 642:3102-3107 — the state is the suffix, not an icon. */
const STEP_WORD: Record<ApplyStepState, string> = {
  done: "done",
  active: "applying…",
  queued: "queued",
};

export const ApplyProgressOverlay: React.FC<ApplyProgressOverlayProps> = ({
  templateName,
  steps,
  onCancel,
}) => {
  const done = steps.filter((s) => s.state === "done").length;
  const pct = steps.length === 0 ? 0 : Math.round((done / steps.length) * 100);

  return (
    <Portal>
      <div className="tmpl-progress" role="status" aria-label="Applying template" aria-live="polite">
        <div className="tmpl-progress__inner" data-testid="tpl-applying-card">
          <div className="tmpl-progress__head" data-testid="tpl-applying-head">
            <h3 className="tmpl-progress__title" data-testid="tpl-applying-title">
              Applying {templateName}…
            </h3>
            <p className="tmpl-progress__sub" data-testid="tpl-applying-sub">
              Do not close the editor
            </p>
          </div>
          <div className="tmpl-progress__body" data-testid="tpl-applying-body">
            <span
              className="tmpl-progress__track"
              data-testid="tpl-applying-track"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={steps.length}
            >
              <span
                className="tmpl-progress__fill"
                data-testid="tpl-applying-fill"
                style={{ width: `${pct}%` }}
              />
            </span>
            {steps.map((s) => (
              <p
                key={s.id}
                className="tmpl-progress__step"
                data-step-state={s.state}
                data-testid={`tpl-applying-step-${s.id}`}
              >
                {s.label} — {STEP_WORD[s.state]}
              </p>
            ))}
          </div>
          {onCancel && (
            <div className="tmpl-progress__foot" data-testid="tpl-applying-foot">
              <Button
                color="light"
                size="xs"
                className="tmpl-progress__cancel"
                data-testid="tpl-applying-cancel"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};

export default ApplyProgressOverlay;
