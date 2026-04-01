/**
 * TemplatePreviewModal — Full-panel dark preview overlay
 * Triggered by "Preview →" on card hover. Shows D/T/M viewport toggle,
 * page tabs (for multi-section templates), and apply/back actions.
 *
 * Phase 3 of Templates v2 spec.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { TemplateItem } from "./templatesData";
import "./TemplatePreviewModal.css";

// ============================================================================
// TYPES
// ============================================================================

export interface TemplatePreviewModalProps {
  template: TemplateItem;
  onBack: () => void;
  onUseTemplate: (template: TemplateItem) => void;
  hasExistingContent?: boolean;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

interface ViewportConfig {
  id: ViewportMode;
  label: string;
  shortLabel: string;
  frameWidth: number;
}

// ============================================================================
// CONFIG
// ============================================================================

// Viewport SVG icons matching spec
const VIEWPORT_ICONS: Record<string, React.ReactElement> = {
  desktop: (
    <svg
      viewBox="0 0 24 24"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  ),
  tablet: (
    <svg
      viewBox="0 0 24 24"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
    </svg>
  ),
  mobile: (
    <svg
      viewBox="0 0 24 24"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />
    </svg>
  ),
};

const VIEWPORT_CONFIGS: ViewportConfig[] = [
  { id: "desktop", label: "Desktop", shortLabel: "D", frameWidth: 220 },
  { id: "tablet", label: "Tablet", shortLabel: "T", frameWidth: 140 },
  { id: "mobile", label: "Mobile", shortLabel: "M", frameWidth: 90 },
];

function getSectionCount(html: string): number {
  const matches = html.match(/<(section|nav|header|footer|main|article)/gi);
  return matches ? matches.length : 1;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onBack,
  onUseTemplate,
  hasExistingContent,
}) => {
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop");
  const [isClosing, setIsClosing] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const currentViewport = VIEWPORT_CONFIGS.find((v) => v.id === viewport) ?? VIEWPORT_CONFIGS[0];
  const sectionCount = getSectionCount(template.html);

  // Render HTML preview in iframe
  React.useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><meta name="viewport" content="width=${currentViewport.frameWidth * 5}">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: #080810; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; }
        .tmpl-scale-root { transform: scale(0.2); transform-origin: top left; width: ${currentViewport.frameWidth * 5}px; }
      </style>
    </head><body><div class="tmpl-scale-root">${template.html}</div></body></html>`);
    doc.close();
  }, [template.html, currentViewport.frameWidth]);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onBack(), 150);
  }, [onBack]);

  // Move focus to first focusable element on mount (keyboard / screen-reader entry)
  React.useEffect(() => {
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, []);

  // Close on Escape — stopPropagation prevents TemplatesTab's window handler
  // from also firing and closing the preview without the animation.
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  return createPortal(
    <div className="tmpl-preview-backdrop" onClick={handleClose}>
      <div
        ref={modalRef}
        className={`tmpl-preview ${isClosing ? "tmpl-preview--closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview: ${template.name}`}
      >
        {/* Top Bar */}
        <div className="tmpl-preview__top">
          <div className="tmpl-preview__info">
            <span className="tmpl-preview__name">{template.name}</span>
            <span className="tmpl-preview__count">
              {sectionCount} {sectionCount === 1 ? "section" : "sections"}
            </span>
          </div>
          <div className="tmpl-preview__viewports">
            {VIEWPORT_CONFIGS.map((vp) => (
              <button
                key={vp.id}
                className={`tmpl-preview__vp-btn ${viewport === vp.id ? "tmpl-preview__vp-btn--active" : ""}`}
                onClick={() => setViewport(vp.id)}
                title={vp.label}
                aria-label={vp.label}
                aria-pressed={viewport === vp.id}
              >
                {VIEWPORT_ICONS[vp.id]}
              </button>
            ))}
          </div>
          <button
            className="tmpl-preview__close"
            onClick={handleClose}
            title="Close"
            aria-label="Close preview"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Preview Canvas */}
        <div className="tmpl-preview__canvas">
          <div className="tmpl-preview__frame" style={{ width: currentViewport.frameWidth }}>
            <iframe
              ref={iframeRef}
              className="tmpl-preview__iframe"
              title={`Preview: ${template.name}`}
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="tmpl-preview__bottom">
          <button className="tmpl-preview__back" onClick={handleClose}>
            ← Back
          </button>
          <button className="tmpl-preview__use" onClick={() => onUseTemplate(template)}>
            {template.status === "premium"
              ? "🔒 Upgrade to Use"
              : hasExistingContent
                ? "Replace Canvas with This"
                : "Apply to Canvas"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TemplatePreviewModal;
