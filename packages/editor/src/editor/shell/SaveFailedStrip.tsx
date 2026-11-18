/**
 * SaveFailedStrip — board C05 `10:2199`: a failed save drawn as a strip over
 * the top of the canvas column, 12 in from its edges (and 12 under the canvas
 * bar): ⚠, the line in red, a white Retry beside it.
 *
 * It draws the stored `placement: "canvas"` condition (`saveFailedBanner`),
 * not a state of its own, so "one error surface" holds (owner 2026-10-26):
 * the failure shares the CONNECTION id with "Can't reach" / "Reconnecting…",
 * and whichever was said last is the one surface — the slot's bar or this
 * strip, never both. The bottom bar's "Couldn't save — Retry" says it too; no
 * toast does. A signed-out session holds the slot (B7-G04) and says it alone.
 *
 * Lane F drew this geometry (bfdd05cf2); lead3 moved the failure into the
 * slot on an internal instruction; the board wins (lead4, wave 3).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Portal } from "@/editor/chrome-ui";
import { BANNER_ACTION_SECONDARY } from "./GlobalBannerSlot";
import { BANNER_ID, useGlobalBanners } from "./globalBanners";
import { useCanvasColumnRect } from "./useCanvasColumnRect";

/** C05: 12 in from the canvas column's edges, 12 under the canvas bar. */
const EDGE = 12;
/** Narrower than this the line wraps a word at a time — no column at all. */
const MIN_WIDTH = 480;
/** No usable column (a full-page view covers it): clear the 256 nav every
 *  full-page screen draws at x:0, EDGE in from the rest of the window. */
const FULL_PAGE_POSITION = { left: 256 + EDGE, top: 56 + EDGE, right: EDGE };

export const SaveFailedStrip: React.FC = () => {
  const col = useCanvasColumnRect(MIN_WIDTH + 2 * EDGE);
  const banners = useGlobalBanners();
  const banner = banners.find((b) => b.placement === "canvas");
  if (!banner || banners.some((b) => b.id === BANNER_ID.sessionExpired)) return null;
  /* The canvas bar sits at the top of the column (7:18654); the strip goes
     under it. Read at render: the bar moves only when the column does. */
  const bar = col ? document.querySelector("[data-bk-toast-anchor] [data-testid='canvas-bar']") : null;
  const top = (bar?.getBoundingClientRect().bottom ?? col?.top ?? 0) + EDGE;

  return (
    <Portal>
      <div
        /* Under the dialogs' scrim (z-50): a modal over the canvas dims it. */
        className={
          "tw:fixed tw:z-40 tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:px-3 tw:py-1.5 " +
          (banner.tone === "error"
            ? "tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]"
            : "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]") +
          " tw:[font-family:var(--bk-font-ui)]"
        }
        style={col ? { left: col.left + EDGE, top, width: col.width - 2 * EDGE } : FULL_PAGE_POSITION}
        role="alert"
        data-testid="save-failed-banner"
      >
        <AlertTriangle size={14} aria-hidden="true" className="tw:shrink-0" />
        <span className="tw:min-w-0 tw:text-[13px] tw:leading-5" data-testid="save-failed-message">
          {banner.message}
        </span>
        {banner.actions?.map((action) => (
          <Button
            key={action.label}
            color="light"
            size="xs"
            className={BANNER_ACTION_SECONDARY}
            onClick={action.onClick}
            data-testid={action.testId}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Portal>
  );
};
