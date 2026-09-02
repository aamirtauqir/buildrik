/**
 * PreviewOverlay — in-shell preview (Figma shell state 7, board 65:211).
 *
 * The topbar stays; everything below it is replaced by a clean, sandboxed
 * render of the sanitized page HTML with a single "Done" pill to exit.
 * Replaces the old pop-up-window preview (which could be blocked and lost
 * the shell context). Same sanitize path as before — the iframe is fully
 * sandboxed and the HTML has been through sanitizeHTMLForPreview.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Z_LAYERS } from "@/shared/constants/canvas";
import { Button } from "@/editor/chrome-ui";

interface PreviewOverlayProps {
  /** Sanitized page HTML. null → overlay hidden. */
  html: string | null;
  onDone: () => void;
}

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({ html, onDone }) => {
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

  return (
    <div
      role="region"
      aria-label="Site preview"
      data-testid="preview-overlay"
      style={{
        position: "fixed",
        top: "var(--bk-size-topbar, 56px)",
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--bk-bg-app, var(--bk-bg-panel))",
        zIndex: Z_LAYERS.floatingPanel,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Board 65:211 presents the site as a PAGE on the app ground, not
          edge-to-edge chrome-less browser fill: the preview is of a page, and
          a page has edges. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          padding: "var(--bk-space-24) var(--bk-space-24) var(--bk-space-40)",
        }}
      >
        <iframe
          title="Site preview"
          sandbox=""
          srcDoc={html}
          style={{
            width: "100%",
            maxWidth: 1100,
            height: "100%",
            border: "none",
            borderRadius: "var(--bk-radius-lg)",
            boxShadow: "var(--bk-shadow-overlay)",
            background: "var(--bk-bg-elevated)",
          }}
        />
      </div>
      {/* Board 65:211's Done is a dark pill, wider and taller than the
          accent-blue chip that shipped — it is the only control on screen, so
          it reads as the way out rather than as one more blue button. */}
      <Button
        onClick={onDone}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          minWidth: 110,
          borderRadius: "var(--bk-radius-full)",
          background: "var(--bk-ink)",
          borderColor: "var(--bk-ink)",
          boxShadow: "var(--bk-shadow-overlay)",
        }}
      >
        Done
      </Button>
    </div>
  );
};

export default PreviewOverlay;
