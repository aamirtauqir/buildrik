/**
 * FirstUseTip — board 7054:78348 ("💡 Tip 1/4 · Drag ⠿ to place an element
 * exactly · Got it"), beside the Add panel's lower edge. Replaces the
 * persistent tips strip (G2-113: one first-use surface, no strip).
 *
 * WHEN it shows is the tip queue's call (L1-029, owner 2026-10-10): only while
 * the user is idle with Add open, at most one automatic tip per session, each
 * tip once per site (stored with the L1-015 state). It used to open 800 ms
 * after EVERY Add open, as a `role="dialog"` — "Tip 3 of 4" popped during
 * keyboard work and Escape stopped deselecting. It is a note now and never
 * takes focus. "Got it", Esc and a click outside close it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { EditorTipId } from "@buildrik/shared/schemas/onboarding";
import { Button, Portal } from "@/editor/chrome-ui";
import { useAutoTip } from "@/editor/onboarding/tipQueue";
import { TIPS } from "../catalog/tips";

/** One queue id per tip in `TIPS`, in order. */
export const BUILD_TIP_IDS: readonly EditorTipId[] = ["build-tip-1", "build-tip-2", "build-tip-3", "build-tip-4"];

export function FirstUseTip({ anchorRef }: { anchorRef: React.RefObject<HTMLElement | null> }) {
  const tip = useAutoTip(BUILD_TIP_IDS, true);
  const tipIdx = tip.tipId ? BUILD_TIP_IDS.indexOf(tip.tipId) : -1;
  const [pos, setPos] = React.useState<{ left: number; bottom: number } | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const close = tip.close;

  React.useEffect(() => {
    if (tipIdx < 0) {
      setPos(null);
      return;
    }
    const r = anchorRef.current?.getBoundingClientRect();
    if (r) setPos({ left: r.right + 12, bottom: window.innerHeight - r.bottom + 56 });
  }, [tipIdx, anchorRef]);

  React.useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: PointerEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [pos, close]);

  if (!pos || tipIdx < 0 || tipIdx >= TIPS.length) return null;
  return (
    <Portal>
      <div
        ref={cardRef}
        role="note"
        aria-label={`Tip ${tipIdx + 1} of ${TIPS.length}`}
        data-testid="insert-first-use-tip"
        className="tw:fixed tw:z-40 tw:flex tw:w-[300px] tw:flex-col tw:gap-2 tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-gray-200)] tw:bg-white tw:p-4 tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)]"
        style={{ left: pos.left, bottom: pos.bottom }}
      >
        <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-[length:var(--bk-text-12)] tw:font-semibold tw:text-[var(--bk-ink)]">
          <span aria-hidden="true">💡</span>
          {`Tip ${tipIdx + 1}/${TIPS.length}`}
        </span>
        <span className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-soft)]" data-testid="insert-first-use-tip-body">
          {TIPS[tipIdx]}
        </span>
        <Button type="button" variant="primary" size="xs" className="tw:self-end" onClick={close} data-testid="insert-first-use-tip-ok">
          Got it
        </Button>
      </div>
    </Portal>
  );
}
