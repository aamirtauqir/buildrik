/**
 * Aquibra Image Editor Modal
 * Full-featured image editor using filerobot-image-editor.
 * Supports crop, resize, rotate, flip, filters, adjustments, annotations.
 * Non-destructive: saves create new versions via _v1234 scheme.
 *
 * @module editor/media/ImageEditorModal
 * @license BSD-3-Clause
 */

import * as React from "react";
import FilerobotImageEditor, { TABS, TOOLS } from "react-filerobot-image-editor";

// ============================================
// Types
// ============================================

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (editedSrc: string) => void;
}

// ============================================
// Theme — matches DESIGN.md tokens
// ============================================

const EDITOR_THEME = {
  palette: {
    "bg-primary-active": "#1D4ED8",
    "bg-primary": "#F8FAFC",
    "bg-secondary": "#FFFFFF",
    "accent-primary": "#1D4ED8",
    "accent-primary-active": "#1E40AF",
    "icons-primary": "#334155",
    "icons-secondary": "#64748B",
    "borders-primary": "#E2E8F0",
    "borders-secondary": "#CBD5E1",
    "borders-strong": "#94A3B8",
    "light-shadow": "rgba(15, 23, 42, 0.08)",
    "warning": "#F59E0B",
    "error": "#DC2626",
    "success": "#10B981",
    "txt-primary": "#0F172A",
    "txt-secondary": "#334155",
    "txt-placeholder": "#94A3B8",
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

// ============================================
// Component
// ============================================

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "min(1200px, 95vw)",
          height: "min(800px, 90vh)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
        }}
      >
        <FilerobotImageEditor
          source={imageSrc}
          onSave={(editedImageObject: any) => {
            // editedImageObject.imageBase64 contains the edited image as data URL
            const dataUrl = editedImageObject.imageBase64;
            if (dataUrl) {
              onSave(dataUrl);
            }
          }}
          onClose={onClose}
          annotationsCommon={{
            fill: "#1D4ED8",
          }}
          Crop={{
            presetsItems: [
              { titleKey: "Free", ratio: undefined as any },
              { titleKey: "1:1", ratio: 1 },
              { titleKey: "4:3", ratio: 4 / 3 },
              { titleKey: "16:9", ratio: 16 / 9 },
              { titleKey: "3:2", ratio: 3 / 2 },
            ],
            autoResize: true,
          }}
          Rotate={{
            angle: 90,
            componentType: "slider",
          }}
          tabsIds={[
            TABS.ADJUST,
            TABS.FINETUNE,
            TABS.FILTERS,
            TABS.RESIZE,
            TABS.ANNOTATE,
          ]}
          defaultTabId={TABS.ADJUST}
          defaultToolId={TOOLS.CROP}
          savingPixelRatio={2}
          previewPixelRatio={window.devicePixelRatio || 1}
          theme={EDITOR_THEME}
        />
      </div>
    </div>
  );
};

export default ImageEditorModal;
