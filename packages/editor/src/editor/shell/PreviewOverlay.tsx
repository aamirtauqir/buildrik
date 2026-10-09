/**
 * PreviewOverlay — in-shell preview (Figma shell state 7, board 65:211).
 *
 * The topbar stays; everything below it is replaced by a clean, sandboxed
 * render of the sanitized page HTML; "‹ Back to canvas" (or Esc) exits.
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
 * The board also draws a "Share preview" button here (B1 / G1-022). It opens
 * `PreviewShareModal` — the same dialog the site menu's "Share preview link"
 * row opens, so both doors land on one flow.
 *
 * DEF-shell-share-dialog-hidden-under-preview: this region used to stack at
 * `Z_LAYERS.floatingPanel` (3000) — the CANVAS z-scale (engine layers,
 * badges, drop feedback). `OverlayMount`'s scrim/frame ride the separate
 * chrome `--bk-z-*` scale (`--bk-z-overlay` 50 / `--bk-z-modal` 60), same as
 * `FullPageRouter`'s full-screen views. 3000 buried the modal under this
 * overlay's own iframe. This is chrome, not canvas — it now uses
 * `--bk-z-overlay`, the same tier `FullPageRouter` uses for its full-screen
 * views, so a `Modal` opened on top (z-modal, 60) still wins.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { DeviceType } from "@/shared/types";
import { Button, BreakpointSwitcher, Select, type Breakpoint } from "@/editor/chrome-ui";
import { isModalOpen } from "@/editor/chrome-ui";
import { DeviceFramePreview } from "../canvas/DeviceFramePreview";
import { PreviewShareModal } from "./PreviewShareModal";

interface PreviewOverlayProps {
  /** Sanitized page HTML. null → overlay hidden. */
  html: string | null;
  onDone: () => void;
  /** The site whose share link the Share button mints; no site, no button. */
  siteId?: string | null;
  /** Named in the share dialog (board 4418:165739). */
  siteName?: string | null;
  pageName?: string | null;
  /** The site's pages: the preview's page menu, and where its internal links
   *  go (L5-051 — it showed one page, and a link blanked the frame). */
  pages?: ReadonlyArray<{ id: string; name: string; slug?: string; isHome?: boolean }>;
  currentPageId?: string | null;
  /** Show another page in the preview. */
  onShowPage?: (pageId: string) => void;
}

/** The page an in-site href points at: "/contact", "contact.html", "./contact/",
 *  "/" (home). Null for anything else — another site, mailto:, a fragment. */
export function pageForHref(
  href: string,
  pages: ReadonlyArray<{ id: string; slug?: string; isHome?: boolean }>,
): string | null {
  const raw = href.trim();
  if (!raw || raw.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0].replace(/^\.?\//, "").replace(/\/+$/, "").replace(/\.html$/i, "");
  if (path === "" || path === "index") return pages.find((p) => p.isHome)?.id ?? pages[0]?.id ?? null;
  return pages.find((p) => p.slug === path)?.id ?? null;
}

/* Board 4418:165611 (C5 G1-086): the preview is full-screen with its own
   bar — ‹ Back to canvas · the device widths · Share preview — replacing
   the old Done pill over the page. */
const REGION_CLASS =
  "tw:fixed tw:inset-0 tw:z-[var(--bk-z-overlay)] " +
  "tw:flex tw:flex-col tw:bg-[var(--bk-bg-app)]";

/** Board 4418:165611 — the preview's own 56-tall bar: back on the left, the
 *  device switcher centred, Share preview on the right. */
const DEVICE_BAR_CLASS =
  "tw:relative tw:shrink-0 tw:h-14 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 " +
  "tw:bg-[var(--bk-bg-card)] tw:border-b tw:border-[var(--bk-border)]";

const DEVICE_BAR_INNER_CLASS =
  "tw:absolute tw:left-1/2 tw:-translate-x-1/2 tw:flex tw:items-center";

/* The widths each device renders at, printed beside its name. Desktop is the
   page frame's max width; tablet/mobile are DeviceFramePreview's screens. */
const DEVICE_WIDTHS = { desktop: "1320px", tablet: "768px", mobile: "375px" } as const;

const BACK_CLASS =
  "tw:h-8 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[13px] tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)]";

/* Board 65:211 presents the site as a PAGE on the app ground, not edge-to-edge
   chrome-less browser fill: the preview is of a page, and a page has edges.
   `overflow-auto` + `items-start` because a phone bezel is taller than the
   band it sits in — without them the bottom of the device is unreachable. */
const STAGE_CLASS =
  "tw:flex-1 tw:min-h-0 tw:flex tw:justify-center tw:items-start tw:overflow-auto tw:px-6 tw:pt-6 tw:pb-10";

/** Desktop: the page itself carries the edges. */
const PAGE_FRAME_CLASS =
  "tw:w-full tw:max-w-[1320px] tw:h-full tw:border-0 tw:rounded-lg " +
  "tw:[box-shadow:var(--bk-shadow-overlay)] tw:bg-[var(--bk-bg-elevated)]";

/** Inside a bezel the frame draws them, so the page fills the screen flat. */
const SCREEN_FRAME_CLASS = "tw:w-full tw:h-full tw:border-0 tw:bg-[var(--bk-bg-elevated)]";

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
  html,
  onDone,
  siteId,
  siteName,
  pageName,
  pages = [],
  currentPageId,
  onShowPage,
}) => {
  const [device, setDevice] = React.useState<Breakpoint>("desktop");
  const [shareOpen, setShareOpen] = React.useState(false);
  const pagesRef = React.useRef(pages);
  pagesRef.current = pages;
  const showPageRef = React.useRef(onShowPage);
  showPageRef.current = onShowPage;

  /* Links in the frame. Nothing in it runs (no allow-scripts), so the shell
     answers its clicks: a page of this site opens in the preview, another
     site opens in a new tab, anything else stays put — it used to navigate
     the srcdoc frame to nothing (L5-051). */
  const onFrameLoad = React.useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument;
    if (!doc) return;
    doc.addEventListener("click", (ev) => {
      const link = (ev.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;
      ev.preventDefault();
      const pageId = pageForHref(href, pagesRef.current);
      if (pageId) showPageRef.current?.(pageId);
      else if (/^https?:\/\//i.test(href)) window.open(href, "_blank", "noopener,noreferrer");
    });
  }, []);

  React.useEffect(() => {
    if (html == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /* The Share modal's own trap answers Escape (focus.ts `isModalOpen`
         F9 rule) — this handler is on `window` capture, which fires before
         the trap's `document` capture listener, so without this check
         Escape closed the modal AND the preview underneath it in one
         keystroke (DEF-shell-share-dialog-hidden-under-preview). */
      if (isModalOpen()) return;
      e.stopPropagation();
      onDone();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [html, onDone]);

  if (html == null) return null;

  /* `wide` and `desktop` have no bezel — DeviceFramePreview passes children
     straight through for them, which is also what `active` says here. */
  const framed = device === "tablet" || device === "mobile";

  return (
    <div
      role="region"
      aria-label="Site preview"
      data-testid="preview-overlay"
      className={REGION_CLASS}
    >
      <div className={DEVICE_BAR_CLASS}>
        <Button color="light" size="xs" onClick={onDone} className={BACK_CLASS} data-testid="preview-back">
          ‹ Back to canvas
        </Button>
        <div className={DEVICE_BAR_INNER_CLASS}>
          <BreakpointSwitcher labelled sublabels={DEVICE_WIDTHS} value={device} onChange={setDevice} />
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          {pages.length > 1 && onShowPage && (
            <Select
              sizing="sm"
              aria-label="Preview page"
              data-testid="preview-page"
              value={currentPageId ?? ""}
              onChange={(e) => onShowPage(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          {siteId && (
            <Button size="sm" type="button" onClick={() => setShareOpen(true)} data-testid="preview-share-button">
              Share preview
            </Button>
          )}
        </div>
      </div>
      <div className={STAGE_CLASS}>
        <DeviceFramePreview device={device as DeviceType} active={framed}>
          <iframe
            title="Site preview"
            /* No allow-scripts: nothing in the frame runs. allow-same-origin
               only lets onFrameLoad answer its link clicks. */
            sandbox="allow-same-origin"
            srcDoc={html}
            onLoad={onFrameLoad}
            className={framed ? SCREEN_FRAME_CLASS : PAGE_FRAME_CLASS}
          />
        </DeviceFramePreview>
      </div>
      {siteId && shareOpen && (
        <PreviewShareModal open={shareOpen} onOpenChange={setShareOpen} siteId={siteId} siteName={siteName} pageName={pageName} />
      )}
    </div>
  );
};

export default PreviewOverlay;
