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
import { Button } from "@/editor/shared/vibcoder/Button";
import { Z_LAYERS } from "@/shared/constants/canvas";

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
      <iframe
        title="Site preview"
        sandbox=""
        srcDoc={html}
        style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={onDone}
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "var(--bk-radius-full)",
          boxShadow: "var(--bk-shadow-overlay)",
        }}
      >
        Done
      </Button>
    </div>
  );
};

export default PreviewOverlay;
