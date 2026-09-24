/**
 * EmptyThread — board 170:2 (AI · idle).
 *
 * What the panel says before anyone has asked it anything: three prompts worth
 * trying, the promise that governs everything it does (a diff, never a direct
 * write, and one undo step), and the way into a longer job. The DRAFT row below
 * is the only entrance to agent mode (AITab.tsx:338), and that path applies one
 * transaction per approved step (useAgentRunner.ts:280) — so the promise above it
 * is scoped per-Apply, not per-run.
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
  /** Board 4418:104313 CREATE — opens Add › Generate a block (G2-117). */
  onCreate?: () => void;
}

export const EmptyThread: React.FC<EmptyThreadProps> = ({ onTry, onCreate }) => (
  <div className="tw:flex tw:flex-col tw:pb-2">
    {/* Board 170:10 "Suggestions" is ONE block: the TRY label and the three
        prompts under it, which is why they share an anchor. */}
    <div className="tw:flex tw:flex-col" data-testid="ai-try">
      <div className={BAND}>TRY</div>
      {TRY_PROMPTS.map((p) => (
        <Button
          key={p}
          color="light"
          size="xs"
          className="tw:justify-start tw:border-transparent tw:bg-transparent tw:px-4 tw:py-1 tw:text-[12px] tw:text-[var(--bk-accent)]"
          onClick={() => onTry?.(p)}
          disabled={!onTry}
        >
          {p}
        </Button>
      ))}
    </div>

    {/* Board 4418:104313: the note says how a run goes now — plan first,
        each step applied as it runs, undoable. */}
    <p
      className="tw:mx-4 tw:mt-3 tw:mb-0 tw:text-[12px] tw:leading-5 tw:text-[var(--bk-ink-muted)]"
      data-testid="ai-note"
    >
      Review the plan before running it. Completed steps apply immediately. You can undo applied edits.
    </p>

    {/* Board 4418:104313 CREATE: a new block is made in Add (G2-117). It
        replaced 921:4478's DRAFT row — a brief is now just a prompt, which
        plans first anyway. */}
    <div className="tw:flex tw:flex-col tw:pt-6" data-testid="ai-create">
      <div className={BAND}>CREATE</div>
      <Button
        color="light"
        className="tw:mx-4 tw:flex tw:h-10 tw:items-center tw:justify-start tw:gap-2 tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-3 tw:text-[13px] tw:text-[var(--bk-ink)]"
        data-testid="ai-create-block"
        onClick={() => onCreate?.()}
        disabled={!onCreate}
      >
        <span>✦&nbsp;&nbsp;Generate a block in Add</span>
        <span aria-hidden="true">›</span>
      </Button>
    </div>
  </div>
);
