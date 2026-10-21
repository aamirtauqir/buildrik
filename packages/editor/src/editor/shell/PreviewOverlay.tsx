/**
 * PreviewOverlay — in-shell preview (Figma shell state 7, board 65:211).
 *
 * The topbar stays; everything below it is replaced by a sandboxed render of
 * the sanitized page HTML; "‹ Back to canvas" (or Esc) exits. Replaces the
 * old pop-up-window preview (which could be blocked and lost the shell
 * context). The HTML has been through sanitizeHTMLForPreview.
 *
 * BD-34 (2026-10-20): the frame RUNS scripts, so interactions behave as
 * published — `sandbox="allow-scripts"` and never `allow-same-origin`, so the
 * page gets an opaque origin: no editor cookies, storage or DOM. The only
 * scripts in it are the editor's own: the interaction runtime (when the page
 * uses interactions) and a bridge that posts Escape and link clicks up, since
 * the shell can no longer reach into the frame.
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
import { buildInteractionRuntimeScript, INTERACTION_ATTR } from "@/engine/export/interactionRuntime";
import { injectPageRuntimes } from "@/engine/export/publishPostProcess";
import { DeviceFramePreview } from "../canvas/DeviceFramePreview";
import { PreviewShareModal } from "./PreviewShareModal";
import { PreviewNotices } from "./PreviewNotices";

interface PreviewOverlayProps {
  /** Sanitized page HTML of a finished build. null with no `status` → hidden. */
  html: string | null;
  /** Unpublished records the page's collection lists leave out (REA #18). */
  hiddenDrafts?: number;
  /** Design decision 9: the build is running, or it failed. A preview that
   *  failed used to show nothing at all — the promise rejected silently. */
  status?: "building" | "error";
  /** The failure's short cause. */
  error?: string;
  /** Failed builds in a row: the second says "Still failing". */
  attempts?: number;
  onRetry?: () => void;
  onDone: () => void;
  /** The site whose share link the Share button mints; no site, no button. */
  siteId?: string | null;
  /** Named in the share dialog (board 4418:165739). */
  siteName?: string | null;
  /** The site's pages: the preview's page menu, and where its internal links
   *  go (L5-051 — it showed one page, and a link blanked the frame). */
  pages?: ReadonlyArray<{ id: string; name: string; slug?: string; isHome?: boolean }>;
  currentPageId?: string | null;
  /** Show another page in the preview. */
  onShowPage?: (pageId: string) => void;
}

/** The page an in-site href points at: "/contact", "contact.html", "./contact/",
 *  "/" (home). Null for anything else — another site, mailto:, a fragment. */
function pageForHref(
  href: string,
  pages: ReadonlyArray<{ id: string; slug?: string; isHome?: boolean }>,
): string | null {
  const raw = href.trim();
  if (!raw || raw.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0].replace(/^\.?\//, "").replace(/\/+$/, "").replace(/\.html$/i, "");
  if (path === "" || path === "index") return pages.find((p) => p.isHome)?.id ?? pages[0]?.id ?? null;
  return pages.find((p) => p.slug === path)?.id ?? null;
}

/** Tag on the frame bridge's messages. */
const BRIDGE_SOURCE = "bk-preview";

/* Runs inside the opaque-origin frame. Escape and link clicks never reach the
   shell's listeners there, so the bridge posts them up; a click a site script
   already handled (defaultPrevented) is left alone. */
const BRIDGE_SCRIPT =
  "<script>(function(){" +
  `function post(m){m.source=${JSON.stringify(BRIDGE_SOURCE)};parent.postMessage(m,"*");}` +
  'document.addEventListener("keydown",function(e){if(e.key==="Escape")post({type:"escape"});},true);' +
  'document.addEventListener("click",function(e){if(e.defaultPrevented)return;var t=e.target,a=t&&t.closest?t.closest("a[href]"):null;' +
  'if(!a)return;var h=a.getAttribute("href")||"";if(h.charAt(0)==="#")return;e.preventDefault();post({type:"link",href:h});});' +
  "})();</script>";

/* An image with no file chosen drew the browser's broken-image glyph and its
   alt text; the canvas draws a placeholder box there, and so does the preview
   (`content` replaces the glyph, as Canvas.css does).
   PreviewNotices says the published site will not (REA #18). */
const EMPTY_IMAGE_STYLE =
  '<style>img:not([src]),img[src=""]{display:inline-block;min-width:120px;min-height:80px;' +
  "content:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E\");background:rgba(128,128,128,.12);" +
  "outline:1px dashed rgba(128,128,128,.5);outline-offset:-1px}</style>";

/** The frame's document: the sanitized page plus the editor's own scripts,
 *  before `</body>` when there is one — the widget runtimes the published page
 *  gets (`injectPageRuntimes`, the publish post-process step), the interaction
 *  runtime and the bridge — and the empty-image placeholder before `</head>`. */
function previewDocument(sanitized: string): string {
  const head = sanitized.indexOf("</head>");
  const styled = head < 0 ? sanitized + EMPTY_IMAGE_STYLE : sanitized.slice(0, head) + EMPTY_IMAGE_STYLE + sanitized.slice(head);
  const html = injectPageRuntimes(styled);
  const scripts = (html.includes(INTERACTION_ATTR) ? buildInteractionRuntimeScript() : "") + BRIDGE_SCRIPT;
  const end = html.lastIndexOf("</body>");
  return end < 0 ? html + scripts : html.slice(0, end) + scripts + html.slice(end);
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
  hiddenDrafts = 0,
  status,
  error,
  attempts = 0,
  onRetry,
  onDone,
  siteId,
  siteName,
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

  const open = html != null || status != null;
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const srcDoc = React.useMemo(() => (html == null ? "" : previewDocument(html)), [html]);

  /* The frame bridge's messages — only from this frame (site scripts run in
     it, so the content is untrusted: it can close the preview, show a page
     of this site, or open an http(s) link in a new tab, nothing else).
     Decision 9: Escape closes even with focus inside the frame. Links: a
     page of this site opens in the preview, another site in a new tab,
     anything else stays put — it used to navigate the srcdoc frame to
     nothing (L5-051). */
  React.useEffect(() => {
    if (!open) return;
    const onMessage = (e: MessageEvent) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const data: unknown = e.data;
      if (typeof data !== "object" || data === null || (data as { source?: unknown }).source !== BRIDGE_SOURCE) return;
      const { type, href } = data as { type?: unknown; href?: unknown };
      if (type === "escape") {
        if (!isModalOpen()) onDone();
      } else if (type === "link" && typeof href === "string") {
        const pageId = pageForHref(href, pagesRef.current);
        if (pageId) showPageRef.current?.(pageId);
        else if (/^https?:\/\//i.test(href)) window.open(href, "_blank", "noopener,noreferrer");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, onDone]);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const backRef = React.useRef<HTMLButtonElement>(null);
  /* Focus lands on what the overlay is saying: the state heading while it
     builds or failed, the way back once the page is up. */
  React.useEffect(() => {
    if (!open) return;
    (status ? headingRef.current : backRef.current)?.focus({ preventScroll: true });
  }, [open, status]);

  React.useEffect(() => {
    if (!open) return;
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
  }, [open, onDone]);

  if (!open) return null;

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
        <Button ref={backRef} color="light" size="xs" onClick={onDone} className={BACK_CLASS} data-testid="preview-back">
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
      {!status && html != null && <PreviewNotices html={html} hiddenDrafts={hiddenDrafts} />}
      <div className={STAGE_CLASS}>
        {status ? (
          /* Never the last page's output: a stale frame read as the current
             build (decision 9). */
          <div className="tw:m-auto tw:flex tw:max-w-[420px] tw:flex-col tw:items-start tw:gap-2 tw:p-6" data-testid={`preview-${status}`}>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:text-[var(--bk-ink)] tw:outline-none"
            >
              {status === "building" ? "Building preview…" : attempts > 1 ? "Still failing" : "Preview couldn’t be built"}
            </h2>
            {status === "error" && (
              <>
                {error && <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">{error}</p>}
                <div className="tw:mt-2 tw:flex tw:gap-2">
                  <Button size="xs" data-testid="preview-retry" onClick={onRetry}>
                    Try again
                  </Button>
                  {attempts > 1 && error && (
                    <Button
                      size="xs"
                      color="light"
                      data-testid="preview-copy-error"
                      onClick={() => void navigator.clipboard?.writeText(error)}
                    >
                      Copy error details
                    </Button>
                  )}
                  <Button size="xs" color="light" data-testid="preview-back-to-editor" onClick={onDone}>
                    Back to editor
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
        <DeviceFramePreview device={device as DeviceType} active={framed}>
          <iframe
            ref={frameRef}
            title="Site preview"
            /* BD-34: scripts run, in an opaque origin — never add
               allow-same-origin (it would hand site scripts the editor). */
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className={framed ? SCREEN_FRAME_CLASS : PAGE_FRAME_CLASS}
          />
        </DeviceFramePreview>
        )}
      </div>
      {siteId && shareOpen && (
        <PreviewShareModal open={shareOpen} onOpenChange={setShareOpen} siteId={siteId} siteName={siteName} />
      )}
    </div>
  );
};

export default PreviewOverlay;
