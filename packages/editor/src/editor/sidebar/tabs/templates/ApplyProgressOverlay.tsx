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

const STEP_COLOR: Record<ApplyStepState, string> = {
  done: "var(--bk-success)",
  active: "var(--bk-accent)",
  queued: "var(--bk-ink-disabled)",
};

const STEP_GLYPH: Record<ApplyStepState, string> = {
  done: "✓",
  active: "→",
  queued: "○",
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
        <div className="tmpl-progress__inner">
          <h3 className="tmpl-progress__title">Applying {templateName}…</h3>
          <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            Do not close the editor
          </p>
          <span
            className="tw:mt-3 tw:block tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-[var(--bk-bg-subtle)]"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={steps.length}
          >
            <span
              className="tw:block tw:h-full tw:rounded-full tw:bg-[var(--bk-accent)]"
              style={{ width: `${pct}%` }}
            />
          </span>
          <ol className="tw:m-0 tw:mt-3 tw:flex tw:list-none tw:flex-col tw:gap-1 tw:p-0 tw:text-left tw:text-[12px]">
            {steps.map((s) => (
              <li
                key={s.id}
                className="tw:flex tw:items-center tw:gap-2"
                data-step-state={s.state}
                /* The one genuinely varying value stays inline — VersionRow
                   precedent; three utility classes that differ only by colour
                   would say less. */
                style={{ color: STEP_COLOR[s.state], fontWeight: s.state === "active" ? 500 : 400 }}
              >
                <span className="tw:inline-flex tw:w-3.5 tw:justify-center" aria-hidden="true">
                  {STEP_GLYPH[s.state]}
                </span>
                {s.label}
              </li>
            ))}
          </ol>
          {onCancel && (
            <Button className="tmpl-progress__cancel" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Portal>
  );
};

export default ApplyProgressOverlay;
