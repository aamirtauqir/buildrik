/**
 * Template Preview Modal
 * Full-page preview with template info
 * @license BSD-3-Clause
 */

import DOMPurify from "dompurify";
import * as React from "react";
import { Modal, Button, Badge } from "../shared/ui";
import type { Template } from "./TemplateLibrary";

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
        background: "#fff",
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
        background: "var(--aqb-bg-dark)",
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
            background: device === d.type ? "var(--aqb-primary)" : "transparent",
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
    <Modal isOpen={isOpen} onClose={onClose} title="" size="full">
      <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--aqb-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{template.thumbnail || "📄"}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{template.name}</div>
              <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
                {template.description}
              </div>
            </div>
            <Badge variant="default">{template.category}</Badge>
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
            background: "#1a1a2e",
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
              background: "#fff",
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
            borderTop: "1px solid var(--aqb-border)",
            display: "flex",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--aqb-text-muted)", marginBottom: 4 }}>
              Category
            </div>
            <div style={{ fontWeight: 500 }}>{template.category}</div>
          </div>
          {template.tags && template.tags.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--aqb-text-muted)", marginBottom: 4 }}>
                Tags
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TemplatePreview;
