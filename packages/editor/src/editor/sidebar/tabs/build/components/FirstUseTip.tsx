/**
 * FirstUseTip — board 7054:78348 ("💡 Tip 1/4 · Drag ⠿ to place an element
 * exactly · Got it"), opened a moment after the Add panel opens (4418:99611's
 * AFTER reaction) beside the panel's lower edge. Replaces the persistent tips
 * strip (G2-113: one first-use surface, no strip). "Got it", Esc and a click
 * outside all close it; each tip is shown once, per browser.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Portal } from "@/editor/chrome-ui";
import { safeGet, safeSet } from "../../../../../shared/utils/safeStorage";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";
import { TIPS } from "../catalog/tips";

/** 4418:99611 → 7054:78348 is an AFTER (timer) reaction. */
export const FIRST_USE_TIP_DELAY_MS = 800;

const readSeen = () => Number.parseInt(safeGet(STORAGE_KEYS.BUILD_TIPS_SEEN) ?? "0", 10) || 0;

export function FirstUseTip({ anchorRef }: { anchorRef: React.RefObject<HTMLElement | null> }) {
  const [tipIdx] = React.useState(readSeen);
  const [pos, setPos] = React.useState<{ left: number; bottom: number } | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => {
    safeSet(STORAGE_KEYS.BUILD_TIPS_SEEN, String(tipIdx + 1));
    setPos(null);
  }, [tipIdx]);

  React.useEffect(() => {
    if (tipIdx >= TIPS.length) return;
    const t = setTimeout(() => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setPos({ left: r.right + 12, bottom: window.innerHeight - r.bottom + 56 });
    }, FIRST_USE_TIP_DELAY_MS);
    return () => clearTimeout(t);
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

  if (!pos || tipIdx >= TIPS.length) return null;
  return (
    <Portal>
      <div
        ref={cardRef}
        role="dialog"
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
