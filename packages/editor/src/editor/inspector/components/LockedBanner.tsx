/**
 * LockedBanner — board 4418:114966 ("🔒 Locked · Unlock"), G2-006 / G2-167.
 *
 * A locked element showed ordinary controls, and the canvas toast sent the
 * user to Layers to undo the lock. The inspector now says so and unlocks in
 * place, in one undo step (same transaction name as the context menu row).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Lock } from "lucide-react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { runTransaction } from "@/shared/utils/helpers";
import { Button } from "@/editor/chrome-ui";

export function LockedBanner({ composer, elementId }: { composer: Composer | null | undefined; elementId: string }) {
  const read = React.useCallback(
    () => Boolean(composer?.elements.getElement(elementId)?.isLocked?.()),
    [composer, elementId],
  );
  const [locked, setLocked] = React.useState(read);

  React.useEffect(() => {
    setLocked(read());
    if (!composer) return;
    const sync = () => setLocked(read());
    composer.on(EVENTS.ELEMENT_UPDATED, sync);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, sync);
    };
  }, [composer, read]);

  if (!locked || !composer) return null;

  return (
    <div
      role="status"
      data-testid="inspector-locked-banner"
      className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:border-b tw:border-[var(--bk-gray-100)] tw:bg-[var(--bk-bg-subtle)] tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]"
    >
      <Lock size={12} aria-hidden="true" />
      <span className="tw:flex-1">Locked</span>
      <Button
        color="light"
        size="xs"
        data-testid="inspector-unlock"
        className="tw:h-6 tw:px-2 tw:text-[12px]"
        onClick={() =>
          runTransaction(composer, "unlock-element", () => {
            composer.elements.getElement(elementId)?.setLocked(false);
          })
        }
      >
        Unlock
      </Button>
    </div>
  );
}
