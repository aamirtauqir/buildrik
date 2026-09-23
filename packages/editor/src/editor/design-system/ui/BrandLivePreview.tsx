/**
 * BrandLivePreview — the "Live preview · <page>" card every Brand workspace
 * board carries at the right (7315:80955 and its nine siblings): the active
 * page, rendered at a zoom, painted with the DRAFT brand rather than the saved
 * one, so a colour edit is visible the moment it is staged.
 *
 * The document is the same one Quick preview shows (`composer.exportHTML`,
 * through the same sanitizer), in a frame that runs no script. The staged
 * tokens reach it as ONE `:root{…}` block appended to its head — later than
 * the saved `siteTokensCSS`, so it wins the cascade — and that block is
 * rewritten in place on every edit instead of reloading the frame, which is
 * what keeps a keystroke in a hex field from flashing the page white.
 *
 * Dark preview (`mode`) swaps in each token's `darkValue` where it has one;
 * the Colour mode page's Light / Dark switch drives it (7316:80949 draws the
 * switch INSIDE this card, so it comes in as `controls`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { EVENTS, DOCUMENT_CHANGED_EVENTS } from "@/shared/constants/events";
import { siteTokensCSS } from "@/engine/export/ExportHelpers";
import { sanitizeHTMLForPreview } from "@/editor/export/ExportUtils";
import { Select, type CustomFlowbiteTheme } from "@/editor/chrome-ui";
import type { DesignToken } from "../types";

/* Bare, 13px muted, room for the caret on the right; `appearance-none`
   drops the native arrow the way `bg-none` drops flowbite's image. */
const BARE_ZOOM_SELECT: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray: "tw:border-0 tw:bg-transparent tw:bg-none tw:shadow-none tw:appearance-none tw:text-[var(--bk-ink-muted)] tw:focus:outline-none tw:focus:ring-0 tw:focus:border-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]",
      },
      sizes: {
        /* flowbite's `sm` is `p-2 sm:text-xs`; the breakpoint half is a
           different twMerge group, so it needs its own override or the field
           lands at 12px on every desktop viewport. */
        sm: "tw:py-0 tw:pl-0 tw:pr-3 tw:text-[length:var(--bk-text-13)] tw:sm:text-[length:var(--bk-text-13)] tw:leading-5 tw:[font-family:var(--bk-font-ui)]",
      },
    },
  },
};

export interface BrandLivePreviewProps {
  composer: Composer | null;
  /** Every staged token, all kinds — the preview shows the draft, not the saved brand. */
  tokens: readonly DesignToken[];
  mode: "light" | "dark";
  /** A control drawn over the top edge of the page frame — the Colour mode
   *  page's Light / Dark switch (7316:80949). */
  controls?: React.ReactNode;
}

/* 7315:80955: the page frame is 346 × 265 inside the 468 card, centred. */
const FRAME_W = 346;
const FRAME_H = 265;
const ZOOMS = [
  { value: "0.25", label: "25%" },
  { value: "0.5", label: "50%" },
  { value: "1", label: "100%" },
] as const;

/** Every `--buildrick-design-*` the draft carries, resolved for the mode. */
export function stagedTokensCSS(tokens: readonly DesignToken[], mode: "light" | "dark"): string {
  return siteTokensCSS(
    tokens.map((t) => ({
      cssVar: t.cssVar,
      value: mode === "dark" ? (t.darkValue ?? t.value) : t.value,
    })),
  );
}

function buildDocument(composer: Composer): string {
  const raw = composer.exportHTML?.().combined;
  return raw ? sanitizeHTMLForPreview(raw) : "";
}

export const BrandLivePreview: React.FC<BrandLivePreviewProps> = ({
  composer,
  tokens,
  mode,
  controls,
}) => {
  const [zoom, setZoom] = React.useState<(typeof ZOOMS)[number]["value"]>("0.5");
  const [pageName, setPageName] = React.useState<string>("");
  const [doc, setDoc] = React.useState<string>("");
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const stagedCSS = React.useMemo(() => stagedTokensCSS(tokens, mode), [tokens, mode]);

  /* The document follows the canvas: rebuilt on load and on every document
     mutation (a page switch is a `project:changed` too), debounced so a burst
     of canvas edits costs one export. */
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    let timer: number | null = null;
    const rebuild = () => {
      setPageName(composer.elements?.getActivePage?.()?.name ?? "");
      setDoc(buildDocument(composer));
    };
    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(rebuild, 300);
    };
    rebuild();
    const names = [...DOCUMENT_CHANGED_EVENTS, EVENTS.PROJECT_LOADED] as const;
    names.forEach((n) => composer.on(n, schedule));
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      names.forEach((n) => composer.off(n, schedule));
    };
  }, [composer]);

  /* The staged block, written straight into the frame's head. `allow-same-origin`
     is what makes `contentDocument` readable; scripts stay off, so the
     interaction runtime never runs in here. */
  const writeStaged = React.useCallback(() => {
    const frameDoc = frameRef.current?.contentDocument;
    if (!frameDoc?.head) return;
    let el = frameDoc.head.querySelector<HTMLStyleElement>("style[data-bk-staged]");
    if (!el) {
      el = frameDoc.createElement("style");
      el.setAttribute("data-bk-staged", "");
      frameDoc.head.appendChild(el);
    }
    el.textContent = stagedCSS;
  }, [stagedCSS]);
  React.useEffect(() => {
    writeStaged();
  }, [writeStaged]);

  const scale = Number(zoom);

  return (
    <section
      aria-label="Live preview"
      data-testid="brand-live-preview"
      data-preview-mode={mode}
      className="tw:flex tw:shrink-0 tw:flex-col tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]"
    >
      {/* 7315:80955: caption centred at 24 under the card's top edge, the
          frame 6 under the caption's line. */}
      <header className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:pb-1.5 tw:pt-3.5">
        <span
          className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]"
          data-testid="brand-live-preview-caption"
        >
          Live preview{pageName ? ` · ${pageName}` : ""}
        </span>
        {/* 7315:80955 draws the zoom as bare text with a caret ("50% ▾"), not
            a boxed field: the bare theme strips flowbite's border, fill and
            arrow image, and the caret is drawn beside it. */}
        <span className="tw:relative tw:inline-flex tw:items-center">
          <Select
            sizing="sm"
            aria-label="Preview zoom"
            value={zoom}
            onChange={(e) => {
              const next = ZOOMS.find((z) => z.value === e.target.value);
              if (next) setZoom(next.value);
            }}
            data-testid="brand-live-preview-zoom"
            theme={BARE_ZOOM_SELECT}
          >
            {ZOOMS.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </Select>
          <span
            aria-hidden="true"
            className="tw:pointer-events-none tw:absolute tw:right-0 tw:text-[9px] tw:leading-none tw:text-[var(--bk-ink-muted)]"
          >
            ▾
          </span>
        </span>
      </header>
      <div className="tw:flex tw:justify-center tw:px-4 tw:pb-2">
        <div
          className="tw:relative tw:overflow-hidden tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-gray-50)]"
          style={{ width: FRAME_W, height: FRAME_H }}
          data-testid="brand-live-preview-frame"
        >
          {controls && (
            <div className="tw:absolute tw:left-1/2 tw:top-0.5 tw:z-10 tw:-translate-x-1/2" data-testid="brand-live-preview-controls">
              {controls}
            </div>
          )}
          {doc && (
            <iframe
              ref={frameRef}
              title="Live preview"
              sandbox="allow-same-origin"
              srcDoc={doc}
              onLoad={writeStaged}
              tabIndex={-1}
              aria-hidden="true"
              className="tw:absolute tw:left-0 tw:top-0 tw:border-0 tw:bg-white"
              style={{
                width: FRAME_W / scale,
                height: FRAME_H / scale,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
};
