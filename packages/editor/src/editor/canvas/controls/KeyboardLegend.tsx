/**
 * KeyboardLegend — what rail Help opens (board 4418:126882, "Keyboard
 * legend"): a 280-wide card 16px from the right edge, 64 down (x1144, y64
 * at 1440), one line per region key, an "Also:" note, and "All shortcuts ›" —
 * the door to the full KeyboardCheatSheet. It sits over the inspector without dimming anything;
 * ✕, Escape and a click outside close it.
 *
 * Mounted once by StudioModals; toggled by UI_TOGGLE_KEYBOARD_LEGEND.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { Button, Portal } from "@/editor/chrome-ui";

/** The board's rows, in its order — key, then what it does. */
const ROWS: ReadonlyArray<[string, string]> = [
  ["Tab", "moves within the focused region, never between"],
  ["F6 / ⇧F6", "cycles between regions, 1 → 7 → back"],
  ["Esc", "steps out one level: drill-in → panel root → close → deselect"],
  ["⌘K", "focuses the shell search — scope follows the open panel; jump-to when nothing is open"],
  ["A L P M D B", "rail panels — Add, Layers, Pages, Assets, CMS, Brand"],
  ["R", "Review panel, only while a review is live"],
  ["C", "Comments · C · Esc leaves"],
  ["⌘S · save", "save now — autosave runs every second after you stop typing"],
  ["⌘P / ⌘J", "preview · jump to a page (⌘K also finds pages)"],
  ["⌘Z / ⌘⇧Z", "undo / redo, canvas-scoped"],
];

export function KeyboardLegend({ composer }: { composer: Composer | null }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!composer) return;
    const toggle = () => setOpen((v) => !v);
    composer.on(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND, toggle);
    return () => {
      composer.off(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND, toggle);
    };
  }, [composer]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      {/* "dismiss · click outside" — a catcher, not a dim. */}
      <div
        data-testid="kbd-legend-dismiss"
        className="tw:fixed tw:inset-0 tw:bg-transparent tw:[z-index:calc(var(--bk-z-modal)-1)]"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-label="Keyboard"
        data-testid="kbd-legend"
        className="tw:fixed tw:top-16 tw:right-4 tw:flex tw:w-70 tw:flex-col tw:gap-2 tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-4 tw:[box-shadow:var(--bk-shadow-overlay)] tw:[z-index:var(--bk-z-modal)]"
      >
        <div className="tw:flex tw:w-full tw:items-center tw:gap-2 tw:text-[13px] tw:font-medium">
          <span className="tw:flex-1 tw:leading-5 tw:text-[var(--bk-ink)]">Keyboard</span>
          <Button
            color="light"
            aria-label="Close keyboard legend"
            onClick={() => setOpen(false)}
            className="tw:h-auto tw:min-h-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink-soft)]"
          >
            ✕
          </Button>
        </div>
        {ROWS.map(([key, what]) => (
          <div key={key} className="tw:flex tw:w-full tw:items-start tw:gap-2.5">
            <span
              data-testid="kbd-legend-key"
              className="tw:flex tw:h-5 tw:flex-none tw:items-center tw:rounded tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-gray-50)] tw:px-1.5 tw:text-[11px] tw:font-medium tw:leading-4 tw:whitespace-nowrap tw:text-[var(--bk-ink-soft)]"
            >
              {key}
            </span>
            <span className="tw:min-w-0 tw:flex-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">{what}</span>
          </div>
        ))}
        <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Also: ⌃, opens Settings · ⌃H opens History · ⇧A adds a section · ⌘Y redoes. Conditional regions drop
          out when their feature is off.
        </p>
      </div>
      {/* The board sets the door at the frame's foot, right (x1342, y864 at 1440×900). */}
      <Button
        variant="link"
        onClick={() => {
          setOpen(false);
          composer?.emit(EVENTS.UI_TOGGLE_CHEAT_SHEET, {});
        }}
        className="tw:fixed tw:bottom-[23px] tw:right-9 tw:h-auto tw:min-h-0 tw:p-0 tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:[z-index:var(--bk-z-modal)]"
      >
        All shortcuts ›
      </Button>
    </Portal>
  );
}
