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

export function StatusLine({ composer, elementId, locked, conflict }: StatusLineProps) {
  const line = conflict.pending
    ? { text: "This site changed elsewhere — resolve to keep editing", action: "Resolve", run: conflict.resolve, id: "inspector-resolve" }
    : locked
      ? {
          text: "Locked — unlock to edit",
          action: "Unlock",
          run: () => composer?.commands.run("unlock-element", { elementId }),
          id: "inspector-unlock",
        }
      : null;
  if (!line) return null;
  return (
    <div
      role="status"
      data-testid="inspector-status-line"
      className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
    >
      <span className="tw:min-w-0">{line.text}</span>
      <Button color="light" size="xs" data-testid={line.id} className={ACTION} onClick={() => void line.run()}>
        {line.action}
      </Button>
    </div>
  );
}
