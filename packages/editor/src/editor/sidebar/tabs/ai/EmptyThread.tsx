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
  <div className="bd-ai-idle">
    <div className="bd-ai-idle__band">TRY</div>
    {TRY_PROMPTS.map((p) => (
      <Button
        key={p}
        color="light"
        size="xs"
        className="bd-ai-idle__try"
        onClick={() => onTry?.(p)}
        disabled={!onTry}
      >
        {p}
      </Button>
    ))}

    <p className="bd-ai-idle__note">
      AI proposes a diff and never writes directly. Apply lands as one undo step.
    </p>

    <div className="bd-ai-idle__band">DRAFT</div>
    <Button
      color="light"
      className="bd-ai-idle__draft"
      onClick={() => onDraft?.()}
      disabled={!onDraft}
    >
      <span>✦ Draft a new section from a brief</span>
      <span aria-hidden="true">›</span>
    </Button>
  </div>
);
