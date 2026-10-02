/**
 * StatusLine — why the controls below are read-only, and the one way out
 * (DD-18, Q4). Replaced LockedBanner.
 *   locked   → "Locked — unlock to edit · Unlock" (board 23; the shared
 *              `unlock-element` command, one undo step);
 *   conflict → "This site changed elsewhere — resolve to keep editing ·
 *              Resolve" (board 29; reopens the conflict dialog).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";

export interface StatusLineProps {
  composer: Composer | null | undefined;
  elementId: string;
  locked: boolean;
  conflict: { pending: boolean; resolve: () => void };
}

const ACTION =
  "tw:h-6 tw:shrink-0 tw:border-0 tw:bg-transparent tw:px-1 tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:underline tw:hover:bg-transparent";

const LINE = "tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1 tw:text-[11px] tw:leading-4";
/* Board 29 tints the save-conflict line; the locked line (board 23) is plain. */
const TONE = {
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  muted: "tw:text-[var(--bk-ink-muted)]",
} as const;

export function StatusLine({ composer, elementId, locked, conflict }: StatusLineProps) {
  const line = conflict.pending
    ? {
        text: "This site changed elsewhere — resolve to keep editing",
        action: "Resolve",
        run: conflict.resolve,
        id: "inspector-resolve",
        tone: "warning" as const,
      }
    : locked
      ? {
          text: "Locked — unlock to edit",
          action: "Unlock",
          run: () => composer?.commands.run("unlock-element", { elementId }),
          id: "inspector-unlock",
          tone: "muted" as const,
        }
      : null;
  if (!line) return null;
  return (
    <div
      role="status"
      data-testid="inspector-status-line"
      data-tone={line.tone}
      className={`${LINE} ${TONE[line.tone]}`}
    >
      <span className="tw:min-w-0">{line.text}</span>
      <Button color="light" size="xs" data-testid={line.id} className={ACTION} onClick={() => void line.run()}>
        {line.action}
      </Button>
    </div>
  );
}
