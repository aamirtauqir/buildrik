import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Media Quick Actions Component
 * Floating toolbar for image elements on canvas
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Edit2, Image, Type, Check, Palette } from "lucide-react";
import type { Composer } from "../../../engine";

interface MediaQuickActionsProps {
  composer: Composer;
  elementId: string;
  onEdit: (item: any) => void;
}

// @lint-hex-policy: user-data icon-tint palette (color picker swatches, not chrome theme)
const ICON_COLORS = [
  "var(--bd-bg-card)", "#000000", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"
];

export const MediaQuickActions: React.FC<MediaQuickActionsProps> = ({
  composer,
  elementId,
  onEdit,
}) => {
  const [showAltPopover, setShowAltPopover] = React.useState(false);
  const [showColorPopover, setShowColorPopover] = React.useState(false);
  const [altValue, setAltValue] = React.useState("");
  
  const element = composer.elements.getElement(elementId);
  const type = element?.getType();
  const isImage = type === "image";
  const isIcon = type === "icon";

  React.useEffect(() => {
    if (element) {
      setAltValue(element.getAttribute("alt") || "");
    }
  }, [elementId, element]);

  if (!isImage && !isIcon) return null;

  const handleReplace = () => {
    composer.emit("ui:media-selection-request", {
      elementId,
      label: isIcon ? "Icon" : "Image",
    });
  };

  const handleEdit = () => {
    const src = element?.getAttribute("src");
    if (src) {
      onEdit({
        key: elementId,
        src,
        name: "image",
      });
    }
  };

  const handleSaveAlt = () => {
    if (element) {
      element.setAttribute("alt", altValue);
      setShowAltPopover(false);
    }
  };

  const handleSetColor = (color: string) => {
    if (element) {
      element.setStyle("color", color);
      setShowColorPopover(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: "var(--buildrick-bg-card)",
          border: "1px solid var(--buildrick-border-light)",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          padding: "4px",
          gap: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          pointerEvents: "auto",
        }}
      >
        <Button onClick={handleReplace} title="Replace Media" style={actionBtnStyle}>
          <Image size={14} />
          <span style={{ fontSize: "11px", fontWeight: 600 }}>Replace</span>
        </Button>

        {isImage && (
          <>
            <div style={{ width: 1, height: 16, background: "var(--buildrick-border-light)" }} />
            <Button onClick={handleEdit} title="Edit Image" style={actionBtnStyle}>
              <Edit2 size={14} />
              <span style={{ fontSize: "11px", fontWeight: 600 }}>Edit</span>
            </Button>
          </>
        )}

        {isIcon && (
          <>
            <div style={{ width: 1, height: 16, background: "var(--buildrick-border-light)" }} />
            <Button 
              onClick={() => setShowColorPopover(!showColorPopover)} 
              title="Change Color" 
              style={{
                ...actionBtnStyle,
                background: showColorPopover ? "var(--buildrick-bg-subtle)" : "transparent"
              }}
            >
              <Palette size={14} />
              <span style={{ fontSize: "11px", fontWeight: 600 }}>Color</span>
            </Button>
          </>
        )}

        {isImage && (
          <>
            <div style={{ width: 1, height: 16, background: "var(--buildrick-border-light)" }} />
            <Button 
              onClick={() => setShowAltPopover(!showAltPopover)} 
              title="Alt Text" 
              style={{
                ...actionBtnStyle,
                background: showAltPopover ? "var(--buildrick-bg-subtle)" : "transparent"
              }}
            >
              <Type size={14} />
              <span style={{ fontSize: "11px", fontWeight: 600 }}>Alt</span>
            </Button>
          </>
        )}
      </div>
      {/* Alt Popover */}
      {showAltPopover && (
        <div style={popoverStyle}>
          <div style={popoverTitleStyle}>Alt Text (SEO)</div>
          <div style={{ display: "flex", gap: "4px" }}>
            <Input
              autoFocus
              type="text"
              value={altValue}
              onChange={(e) => setAltValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveAlt()}
              placeholder="Describe this image..."
              style={inputStyle}
            />
            <Button onClick={handleSaveAlt} style={saveBtnStyle}><Check size={14} /></Button>
          </div>
        </div>
      )}
      {/* Color Popover */}
      {showColorPopover && (
        <div style={popoverStyle}>
          <div style={popoverTitleStyle}>Icon Color</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {ICON_COLORS.map(c => (
              <Button
                key={c}
                onClick={() => handleSetColor(c)}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  background: c,
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%) translateY(8px)",
  background: "var(--buildrick-bg-card)",
  border: "1px solid var(--buildrick-border-light)",
  borderRadius: "6px",
  padding: "10px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  zIndex: 100,
  pointerEvents: "auto"
};

const popoverTitleStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--buildrick-text-disabled)",
  textTransform: "uppercase"
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--buildrick-bg-subtle)",
  border: "1px solid var(--buildrick-border-light)",
  borderRadius: "4px",
  padding: "4px 8px",
  color: "var(--buildrick-text-primary)",
  fontSize: "12px",
  outline: "none"
};

const saveBtnStyle: React.CSSProperties = {
  background: "var(--buildrick-accent)",
  border: "none",
  borderRadius: "4px",
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  cursor: "pointer"
};

const actionBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--buildrick-text-primary)",
  padding: "4px 8px",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  transition: "background 0.2s",
};
