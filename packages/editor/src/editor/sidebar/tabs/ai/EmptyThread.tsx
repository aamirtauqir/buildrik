/**
 * EmptyThread — board 170:2 (AI · idle).
 *
 * What the panel says before anyone has asked it anything: three prompts worth
 * trying, the promise that governs everything it does (a diff, never a direct
 * write, and one undo step), and the way into a longer job.
 *
 * It replaced one sentence — "Try a quick action or type a prompt to start." —
 * which named quick actions the panel does not have.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

/** The section band every board in this family uses. */
const BAND =
  "tw:px-4 tw:pt-3 tw:pb-1 tw:text-[11px] tw:font-medium tw:tracking-wide tw:text-[var(--bk-ink-muted)]";

/** Board 170:2's three. Sample copy, kept because it is also good copy: each
 *  names a real, scoped edit rather than a capability. */
const TRY_PROMPTS = [
  "Make the hero warmer",
  "Write alt text for every image",
  "Shorten the menu descriptions",
] as const;

export interface EmptyThreadProps {
  /** Runs one of the suggestions as a prompt. */
  onTry?: (prompt: string) => void;
  /** Enters the longer-job flow (the agent plan the run boards draw). */
  onDraft?: () => void;
}

export const EmptyThread: React.FC<EmptyThreadProps> = ({ onTry, onDraft }) => (
  <div className="tw:flex tw:flex-col tw:pb-2">
    <div className={BAND}>TRY</div>
    {TRY_PROMPTS.map((p) => (
      <Button
        key={p}
        color="light"
        size="xs"
        className="tw:justify-start tw:border-transparent tw:bg-transparent tw:px-4 tw:py-1 tw:text-[13px] tw:text-[var(--bk-accent)]"
        onClick={() => onTry?.(p)}
        disabled={!onTry}
      >
        {p}
      </Button>
    ))}

    <p className="tw:mx-4 tw:mt-3 tw:mb-0 tw:text-[12px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
      AI proposes a diff and never writes directly. Apply lands as one undo step.
    </p>

    <div className={BAND}>DRAFT</div>
    <Button
      color="light"
      className="tw:mx-4 tw:flex tw:justify-between tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-3 tw:py-2 tw:text-[13px] tw:text-[var(--bk-ink)]"
      onClick={() => onDraft?.()}
      disabled={!onDraft}
    >
      <span>✦ Draft a new section from a brief</span>
      <span aria-hidden="true">›</span>
    </Button>
  </div>
);
