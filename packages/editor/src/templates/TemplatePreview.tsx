/**
 * Template Preview Modal
 * Full-page preview with template info
 * @license BSD-3-Clause
 */

import DOMPurify from "dompurify";
import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalClose,
  ModalTitle,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { Button } from "@/editor/shared/vibcoder/Button";
import { SemanticBadge } from "@/shared/ui/SemanticBadge";
import type { Template } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface TemplatePreviewProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (template: Template) => void;
}

// ============================================================================
// PREVIEW FRAME
// ============================================================================

const PreviewFrame: React.FC<{ html: string }> = ({ html }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            </style>
          </head>
          <body>${DOMPurify.sanitize(html)}</body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="Template Preview"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: /* @lint-hex-policy: template preview/thumbnail color — not editor chrome */ "#fff",
      }}
    />
  );
};

// ============================================================================
// DEVICE SELECTOR
// ============================================================================

type DeviceType = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<DeviceType, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

const DeviceSelector: React.FC<{
  device: DeviceType;
  onChange: (device: DeviceType) => void;
}> = ({ device, onChange }) => {
  const devices: { type: DeviceType; icon: string; label: string }[] = [
    { type: "desktop", icon: "🖥️", label: "Desktop" },
    { type: "tablet", icon: "📱", label: "Tablet" },
    { type: "mobile", icon: "📲", label: "Mobile" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--buildrick-bg-dark)",
        borderRadius: 8,
        padding: 4,
      }}
    >
      {devices.map((d) => (
        <button
          key={d.type}
          onClick={() => onChange(d.type)}
          title={d.label}
          style={{
            padding: "8px 12px",
            background: device === d.type ? "var(--buildrick-accent)" : "transparent",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            opacity: device === d.type ? 1 : 0.6,
          }}
        >
          {d.icon}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  isOpen,
  onClose,
  onUse,
}) => {
  const [device, setDevice] = React.useState<DeviceType>("desktop");

  if (!template) return null;

  const previewWidth = deviceWidths[device];

  return (
    <OverlayMount>
      <Modal open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="xl" style={{ maxWidth: "90vw" }}>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
      <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--buildrick-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{template.thumbnail || "📄"}</span>
            <div>
              <ModalTitle style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{template.name}</ModalTitle>
              <div style={{ fontSize: 12, color: "var(--buildrick-text-muted)" }}>
                {template.description}
              </div>
            </div>
            <SemanticBadge variant="default">{template.category}</SemanticBadge>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DeviceSelector device={device} onChange={setDevice} />
            <Button onClick={() => onUse(template)}>Use Template</Button>
          </div>
        </div>

        {/* Preview Area */}
        <div
          style={{
            flex: 1,
            background: /* @lint-hex-policy: template preview/thumbnail color — not editor chrome */ "#1a1a2e",
            display: "flex",
            justifyContent: "center",
            padding: 24,
            overflow: "auto",
          }}
        >
          <div
            style={{
              width: previewWidth,
              height: "100%",
              background: /* @lint-hex-policy: template preview/thumbnail color — not editor chrome */ "#fff",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              transition: "width 0.3s ease",
            }}
          >
            <PreviewFrame html={template.html} />
          </div>
        </div>

        {/* Template Info Panel */}
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--buildrick-border)",
            display: "flex",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--buildrick-text-muted)", marginBottom: 4 }}>
              Category
            </div>
            <div style={{ fontWeight: 500 }}>{template.category}</div>
          </div>
          {template.tags && template.tags.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--buildrick-text-muted)", marginBottom: 4 }}>
                Tags
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {template.tags.map((tag) => (
                  <SemanticBadge key={tag} variant="default" size="sm">
                    {tag}
                  </SemanticBadge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};

export default TemplatePreview;
