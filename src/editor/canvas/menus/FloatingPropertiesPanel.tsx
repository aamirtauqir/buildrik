/**
 * Floating Properties Panel
 * Quick styling panel that appears near selected element
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";
import { STORAGE_KEYS } from "../../../shared/constants/config";
import {
  useClickOutside,
  CanvasButton,
  CANVAS_COLORS,
  INPUT_STYLE,
  LABEL_STYLE,
  Z_INDEX,
  SIZES,
} from "../shared";

interface FloatingPropertiesPanelProps {
  composer: Composer | null;
  elementId: string | null;
  elementType: string;
  position: { x: number; y: number };
  onClose: () => void;
}

// Normalize element type to consistent format
const normalizeElementType = (type: string, tagName?: string): string => {
  const t = type?.toLowerCase() || "";
  const tag = tagName?.toLowerCase() || "";

  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) || t === "heading") return "heading";
  if (["p", "paragraph"].includes(t) || tag === "p") return "paragraph";
  if (["button", "btn"].includes(t) || tag === "button") return "button";
  if (["img", "image"].includes(t) || tag === "img") return "image";
  if (["a", "link"].includes(t) || tag === "a") return "link";
  if (["section", "container", "div", "wrapper"].includes(t)) return "container";
  if (["text", "span"].includes(t) || tag === "span") return "text";

  return t || "default";
};

// Quick style configurations per element type
const ELEMENT_QUICK_STYLES: Record<
  string,
  Array<{
    property: string;
    label: string;
    type: "color" | "select" | "number" | "text";
    options?: string[];
  }>
> = {
  heading: [
    {
      property: "fontSize",
      label: "Size",
      type: "select",
      options: ["16px", "20px", "24px", "32px", "48px", "64px"],
    },
    { property: "color", label: "Color", type: "color" },
    {
      property: "fontWeight",
      label: "Weight",
      type: "select",
      options: ["400", "500", "600", "700", "800"],
    },
    { property: "textAlign", label: "Align", type: "select", options: ["left", "center", "right"] },
  ],
  paragraph: [
    {
      property: "fontSize",
      label: "Size",
      type: "select",
      options: ["12px", "14px", "16px", "18px", "20px"],
    },
    { property: "color", label: "Color", type: "color" },
    {
      property: "lineHeight",
      label: "Line H",
      type: "select",
      options: ["1", "1.2", "1.5", "1.8", "2"],
    },
    {
      property: "textAlign",
      label: "Align",
      type: "select",
      options: ["left", "center", "right", "justify"],
    },
  ],
  text: [
    {
      property: "fontSize",
      label: "Size",
      type: "select",
      options: ["12px", "14px", "16px", "18px", "20px"],
    },
    { property: "color", label: "Color", type: "color" },
    {
      property: "fontWeight",
      label: "Weight",
      type: "select",
      options: ["400", "500", "600", "700"],
    },
  ],
  button: [
    { property: "backgroundColor", label: "BG", type: "color" },
    { property: "color", label: "Text", type: "color" },
    {
      property: "borderRadius",
      label: "Radius",
      type: "select",
      options: ["0px", "4px", "8px", "12px", "20px", "50px"],
    },
    {
      property: "padding",
      label: "Padding",
      type: "select",
      options: ["8px 16px", "10px 20px", "12px 24px", "16px 32px"],
    },
  ],
  image: [
    {
      property: "width",
      label: "Width",
      type: "select",
      options: ["auto", "100%", "50%", "200px", "300px", "400px"],
    },
    {
      property: "borderRadius",
      label: "Radius",
      type: "select",
      options: ["0px", "4px", "8px", "16px", "50%"],
    },
    {
      property: "objectFit",
      label: "Fit",
      type: "select",
      options: ["cover", "contain", "fill", "none"],
    },
  ],
  container: [
    { property: "backgroundColor", label: "BG", type: "color" },
    {
      property: "padding",
      label: "Padding",
      type: "select",
      options: ["0px", "8px", "16px", "24px", "32px", "48px"],
    },
    {
      property: "borderRadius",
      label: "Radius",
      type: "select",
      options: ["0px", "4px", "8px", "16px", "24px"],
    },
    {
      property: "gap",
      label: "Gap",
      type: "select",
      options: ["0px", "8px", "12px", "16px", "24px", "32px"],
    },
  ],
  section: [
    { property: "backgroundColor", label: "BG", type: "color" },
    {
      property: "padding",
      label: "Padding",
      type: "select",
      options: ["16px", "24px", "32px", "48px", "64px", "80px"],
    },
    {
      property: "minHeight",
      label: "Min H",
      type: "select",
      options: ["auto", "200px", "300px", "400px", "100vh"],
    },
  ],
  link: [
    { property: "color", label: "Color", type: "color" },
    {
      property: "fontSize",
      label: "Size",
      type: "select",
      options: ["12px", "14px", "16px", "18px"],
    },
    {
      property: "textDecoration",
      label: "Underline",
      type: "select",
      options: ["none", "underline"],
    },
  ],
  default: [
    { property: "backgroundColor", label: "BG", type: "color" },
    { property: "color", label: "Color", type: "color" },
    {
      property: "padding",
      label: "Padding",
      type: "select",
      options: ["0px", "8px", "16px", "24px"],
    },
    {
      property: "borderRadius",
      label: "Radius",
      type: "select",
      options: ["0px", "4px", "8px", "16px"],
    },
  ],
};

export const FloatingPropertiesPanel: React.FC<FloatingPropertiesPanelProps> = ({
  composer,
  elementId,
  elementType,
  position,
  onClose,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [styles, setStyles] = React.useState<Record<string, string>>({});
  const [normalizedType, setNormalizedType] = React.useState("default");

  // Use shared hook for click outside
  useClickOutside(panelRef, onClose);

  const quickStyles = ELEMENT_QUICK_STYLES[normalizedType] || ELEMENT_QUICK_STYLES.default;

  // Load element styles
  React.useEffect(() => {
    if (!composer || !elementId) return;

    const el = composer.elements.getElement(elementId);
    if (!el) return;

    const tagName = el.getTagName?.() || "";
    const normalized = normalizeElementType(elementType, tagName);
    setNormalizedType(normalized);

    const stylesConfig = ELEMENT_QUICK_STYLES[normalized] || ELEMENT_QUICK_STYLES.default;
    const currentStyles: Record<string, string> = {};
    stylesConfig.forEach((style) => {
      const value = el.getStyle?.(style.property) || "";
      currentStyles[style.property] = value;
    });
    setStyles(currentStyles);
  }, [composer, elementId, elementType]);

  // Handle style changes
  const handleStyleChange = (property: string, value: string) => {
    if (!composer || !elementId) return;

    const el = composer.elements.getElement(elementId);
    if (!el) return;

    composer.beginTransaction("floating-style-change");
    try {
      if (value) {
        el.setStyle?.(property, value);
      } else {
        el.removeStyle?.(property);
      }
    } finally {
      composer.endTransaction();
    }

    setStyles((prev) => ({ ...prev, [property]: value }));
  };

  const handleDuplicate = () => {
    if (!composer || !elementId) return;
    composer.elements.duplicateElement(elementId);
    onClose();
  };

  const handleDelete = () => {
    if (!composer || !elementId) return;
    composer.elements.removeElement(elementId);
    onClose();
  };

  const handleMoveUp = () => {
    if (!composer || !elementId) return;
    const el = composer.elements.getElement(elementId);
    const parent = el?.getParent();
    if (!parent) return;
    const children = parent.getChildren() || [];
    const idx = children.findIndex((c: Element) => c.getId() === elementId);
    if (idx > 0) {
      composer.beginTransaction("move-up");
      composer.elements.moveElement(elementId, parent.getId(), idx - 1);
      composer.endTransaction();
    }
  };

  const handleMoveDown = () => {
    if (!composer || !elementId) return;
    const el = composer.elements.getElement(elementId);
    const parent = el?.getParent();
    if (!parent) return;
    const children = parent.getChildren() || [];
    const idx = children.findIndex((c: Element) => c.getId() === elementId);
    if (idx < children.length - 1) {
      composer.beginTransaction("move-down");
      composer.elements.moveElement(elementId, parent.getId(), idx + 1);
      composer.endTransaction();
    }
  };

  const handleCopyStyle = () => {
    if (!elementId || !composer) return;
    const el = composer.elements.getElement(elementId);
    const styles = el?.getStyles ? el.getStyles() : {};
    localStorage.setItem(STORAGE_KEYS.COPIED_STYLE, JSON.stringify(styles));
  };

  const handlePasteStyle = () => {
    if (!elementId || !composer) return;
    const el = composer.elements.getElement(elementId);
    if (!el) return;
    const raw = localStorage.getItem(STORAGE_KEYS.COPIED_STYLE);
    if (raw) {
      try {
        const styles = JSON.parse(raw);
        composer.beginTransaction("paste-style");
        Object.entries(styles).forEach(([prop, val]) => {
          el.setStyle?.(prop, val as string);
        });
        composer.endTransaction();
      } catch {
        // Paste style failed silently
      }
    }
  };

  // Calculate adjusted position to keep panel in viewport
  const adjustedPosition = React.useMemo(() => {
    const panelWidth = 280;
    const panelHeight = 200;

    let x = position.x + 10;
    let y = position.y - 10;

    if (x + panelWidth > window.innerWidth) {
      x = position.x - panelWidth - 10;
    }
    if (y + panelHeight > window.innerHeight) {
      y = window.innerHeight - panelHeight - 20;
    }
    if (y < 10) y = 10;
    if (x < 10) x = 10;

    return { x, y };
  }, [position]);

  if (!elementId) return null;

  return (
    <div
      ref={panelRef}
      className="floating-properties-panel"
      style={{
        position: "fixed",
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        background: CANVAS_COLORS.bgPanel,
        borderRadius: SIZES.borderRadius.xl + 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
        minWidth: 260,
        maxWidth: 300,
        zIndex: Z_INDEX.floatingPanel,
        animation: "aqb-float-in 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${CANVAS_COLORS.borderInput}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: CANVAS_COLORS.textPrimary,
            textTransform: "capitalize",
          }}
        >
          {normalizedType} Properties
        </span>
        <CanvasButton onClick={onClose} icon="✕" variant="ghost" size="sm" />
      </div>

      {/* Style Controls */}
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {quickStyles.map((style) => (
          <div key={style.property} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ ...LABEL_STYLE, width: 50, flexShrink: 0 }}>{style.label}</label>
            {style.type === "color" ? (
              <input
                type="color"
                value={styles[style.property] || "#000000"}
                onChange={(e) => handleStyleChange(style.property, e.target.value)}
                style={{
                  width: 32,
                  height: 24,
                  border: `1px solid ${CANVAS_COLORS.borderInput}`,
                  borderRadius: SIZES.borderRadius.sm,
                  cursor: "pointer",
                  background: "transparent",
                }}
              />
            ) : style.type === "select" ? (
              <select
                value={styles[style.property] || ""}
                onChange={(e) => handleStyleChange(style.property, e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1, cursor: "pointer" }}
              >
                <option value="">Default</option>
                {style.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={style.type === "number" ? "number" : "text"}
                value={styles[style.property] || ""}
                onChange={(e) => handleStyleChange(style.property, e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions Bar */}
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(255,255,255,0.03)",
          borderTop: `1px solid ${CANVAS_COLORS.borderInput}`,
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <button
          onClick={handleMoveUp}
          title="Move Up"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            opacity: 0.7,
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          ⬆️
        </button>
        <button
          onClick={handleMoveDown}
          title="Move Down"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            opacity: 0.7,
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          ⬇️
        </button>
        <div style={{ width: 1, height: 20, background: CANVAS_COLORS.borderInput }} />
        <button
          onClick={handleCopyStyle}
          title="Copy Style"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            opacity: 0.7,
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          📋
        </button>
        <button
          onClick={handlePasteStyle}
          title="Paste Style"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            opacity: 0.7,
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          📥
        </button>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: `1px solid ${CANVAS_COLORS.borderInput}`,
          display: "flex",
          gap: 8,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <CanvasButton
          onClick={handleDuplicate}
          icon="✨"
          label="Duplicate"
          variant="primary"
          style={{ flex: 1 }}
        />
        <CanvasButton onClick={handleDelete} icon="🗑️" variant="danger" />
      </div>
    </div>
  );
};

export default FloatingPropertiesPanel;
