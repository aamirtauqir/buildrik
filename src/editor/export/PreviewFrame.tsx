/**
 * Preview Frame Component
 * Renders HTML in an iframe with responsive preview
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PreviewDevice } from "../../shared/types/export";
import { PREVIEW_DEVICES } from "../../shared/types/export";

// ============================================================================
// TYPES
// ============================================================================

export interface PreviewFrameProps {
  html: string;
  device?: PreviewDevice;
  maxHeight?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  html,
  device = "desktop",
  maxHeight = 500,
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const deviceDimensions = PREVIEW_DEVICES[device];

  // Update iframe content when HTML changes
  React.useEffect(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // BUG-006 FIX: Transform relative URLs to absolute for preview
    const baseUrl = window.location.origin;
    const transformedHtml = html
      // Fix relative src attributes (but not http/https/data: URLs)
      .replace(/src="(?!http|https|data:)([^"]+)"/g, `src="${baseUrl}/$1"`)
      // Fix relative href attributes for stylesheets (but not http/https/data: URLs)
      .replace(/href="(?!http|https|data:|#)([^"]+\.css)"/g, `href="${baseUrl}/$1"`);

    doc.open();
    doc.write(transformedHtml);
    doc.close();
  }, [html]);

  // Calculate scale to fit container
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32; // padding
      const targetWidth = deviceDimensions.width;

      if (targetWidth > containerWidth) {
        setScale(containerWidth / targetWidth);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [deviceDimensions.width]);

  const scaledHeight = Math.min(deviceDimensions.height * scale, maxHeight);

  return (
    <div
      ref={containerRef}
      style={{
        background: "#1a1a2e",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "auto",
        maxHeight: maxHeight + 32,
      }}
    >
      {/* Device Frame */}
      <div
        style={{
          position: "relative",
          transformOrigin: "top center",
          transform: `scale(${scale})`,
        }}
      >
        {/* Device Header (for mobile/tablet) */}
        {device !== "desktop" && (
          <div
            style={{
              width: deviceDimensions.width,
              height: 24,
              background: "#333",
              borderRadius: "12px 12px 0 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 4,
                background: "#555",
                borderRadius: 2,
              }}
            />
          </div>
        )}

        {/* iframe */}
        <iframe
          ref={iframeRef}
          title="Export Preview"
          style={{
            width: deviceDimensions.width,
            height: scaledHeight / scale,
            border: device === "desktop" ? "none" : "4px solid #333",
            borderTop: device === "desktop" ? "none" : "none",
            borderRadius: device === "desktop" ? 8 : "0 0 12px 12px",
            background: "#fff",
            display: "block",
          }}
          sandbox="allow-same-origin"
        />

        {/* Device Footer (for mobile) */}
        {device === "mobile" && (
          <div
            style={{
              width: deviceDimensions.width,
              height: 20,
              background: "#333",
              borderRadius: "0 0 12px 12px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#555",
                borderRadius: 2,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewFrame;
