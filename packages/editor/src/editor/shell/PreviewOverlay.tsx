/**
 * PreviewOverlay — in-shell preview (Figma shell state 7, board 65:211).
 *
 * The topbar stays; everything below it is replaced by a clean, sandboxed
 * render of the sanitized page HTML with a single "Done" pill to exit.
 * Replaces the old pop-up-window preview (which could be blocked and lost
 * the shell context). Same sanitize path as before — the iframe is fully
 * sandboxed and the HTML has been through sanitizeHTMLForPreview.
 *
 * Board 807:8663 (`S3.8 · preview-responsive · mobile-device-frame`) adds the
 * responsive half: a device row under the topbar and, on a narrow device, the
 * page inside a bezel. The overlay owns that switch rather than inheriting the
 * canvas's — the overlay covers the canvas, so the editor's device control is
 * unreachable while it is up, and a preview whose width cannot be changed is
 * the reason the responsive check gets done in a second browser instead.
 * The bezel is `DeviceFramePreview`, the frame the canvas already uses; a
 * second device-frame renderer would be two answers to one question.
 *
 * The board also draws a "Share preview" button here. Plan row G1-022:
 * the button opens `PreviewShareModal`, an in-editor dialog with a read-only
 * Link row + Copy → toast + Open ↗ (new tab). The site menu's
 * "Share preview link" entry stays as a separate hand-off to the
 * dashboard's share modal — one in-editor affordance while the preview is
 * on screen, not a duplicate.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Share2 } from "lucide-react";
import { Z_LAYERS } from "@/shared/constants/canvas";
import type { DeviceType } from "@/shared/types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Button, BreakpointSwitcher, type Breakpoint } from "@/editor/chrome-ui";
import { DeviceFramePreview } from "../canvas/DeviceFramePreview";
import { PreviewShareModal } from "./PreviewShareModal";

interface PreviewOverlayProps {
  /** Sanitized page HTML. null → overlay hidden. */
  html: string | null;
  onDone: () => void;
  /** Site id sourced from the dashboard hand-off. Required when overlay is
   *  shown so the Share button has a URL to share. */
  siteId?: string | null;
}

const REGION_CLASS =
  "tw:fixed tw:left-0 tw:right-0 tw:bottom-0 tw:top-[var(--bk-size-topbar)] " +
  "tw:flex tw:flex-col tw:bg-[var(--bk-bg-app)]";

/** Board 807:8707 — a 40-tall gray-50 strip with a hairline under it. The
 *  device switcher sits centred; the Share button is pinned to the right
 *  edge so it never crowds the breakpoint pills. */
const DEVICE_BAR_CLASS =
  "tw:shrink-0 tw:h-10 tw:flex tw:items-center tw:justify-between tw:gap-2 " +
  "tw:bg-[var(--bk-gray-50)] tw:border-b tw:border-[var(--bk-border)]";

const DEVICE_BAR_INNER_CLASS =
  "tw:flex-1 tw:flex tw:items-center tw:justify-center";

/* Board 65:211 presents the site as a PAGE on the app ground, not edge-to-edge
   chrome-less browser fill: the preview is of a page, and a page has edges.
   `overflow-auto` + `items-start` because a phone bezel is taller than the
   band it sits in — without them the bottom of the device is unreachable. */
const STAGE_CLASS =
  "tw:flex-1 tw:min-h-0 tw:flex tw:justify-center tw:items-start tw:overflow-auto tw:px-6 tw:pt-6 tw:pb-10";

/** Desktop: the page itself carries the edges. */
const PAGE_FRAME_CLASS =
  "tw:w-full tw:max-w-[1100px] tw:h-full tw:border-0 tw:rounded-lg " +
  "tw:[box-shadow:var(--bk-shadow-overlay)] tw:bg-[var(--bk-bg-elevated)]";

/** Inside a bezel the frame draws them, so the page fills the screen flat. */
const SCREEN_FRAME_CLASS = "tw:w-full tw:h-full tw:border-0 tw:bg-[var(--bk-bg-elevated)]";

/* Board 65:211's Done is a dark pill, wider and taller than the accent-blue
   chip that shipped — it is the only control on screen, so it reads as the way
   out rather than as one more blue button. */
const DONE_CLASS =
  "tw:absolute tw:bottom-5 tw:left-1/2 tw:-translate-x-1/2 tw:h-9 tw:min-w-[110px] " +
  "tw:rounded-full tw:bg-[var(--bk-ink)] tw:border-[var(--bk-ink)] tw:text-white " +
  "tw:[box-shadow:var(--bk-shadow-overlay)]";

const SHARE_BTN_CLASS =
  "tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:h-7 tw:px-2.5 " +
  "tw:rounded-sm tw:bg-white tw:border tw:border-[var(--bk-gray-400)] " +
  "tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)]";

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({ html, onDone, siteId }) => {
  const [device, setDevice] = React.useState<Breakpoint>("desktop");
  const [shareOpen, setShareOpen] = React.useState(false);

  React.useEffect(() => {
    if (html == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onDone();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [html, onDone]);

  if (html == null) return null;

  /* `wide` and `desktop` have no bezel — DeviceFramePreview passes children
     straight through for them, which is also what `active` says here. */
  const framed = device === "tablet" || device === "mobile";

  const shareUrl = siteId ? `${DASHBOARD_URL}/share/${siteId}` : "";

  return (
    <div
      role="region"
      aria-label="Site preview"
      data-testid="preview-overlay"
      className={REGION_CLASS}
      style={{ zIndex: Z_LAYERS.floatingPanel }}
    >
      <div className={DEVICE_BAR_CLASS}>
        <div className={DEVICE_BAR_INNER_CLASS}>
          <BreakpointSwitcher labelled value={device} onChange={setDevice} />
        </div>
        {siteId && (
          <Button
            size="xs"
            color="light"
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share preview"
            data-testid="preview-share-button"
            className={SHARE_BTN_CLASS}
          >
            <Share2 size={14} aria-hidden="true" />
            <span className="tw:ml-1.5">Share</span>
          </Button>
        )}
      </div>
      <div className={STAGE_CLASS}>
        <DeviceFramePreview device={device as DeviceType} active={framed}>
          <iframe
            title="Site preview"
            sandbox=""
            srcDoc={html}
            className={framed ? SCREEN_FRAME_CLASS : PAGE_FRAME_CLASS}
          />
        </DeviceFramePreview>
      </div>
      <Button onClick={onDone} className={DONE_CLASS}>
        Done
      </Button>
      {siteId && (
        <PreviewShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
};

export default PreviewOverlay;
