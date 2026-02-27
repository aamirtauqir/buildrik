/**
 * Selection Label Component
 * Shows element name with parent navigation and settings at top-left of selection
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_INDEX } from "../../../shared/constants/canvas";
import { canvasTokens } from "../../../styles/tokens";
import { getElementNameFromType, getTypeIcon } from "../utils/elementInfo";

export interface SelectionLabelProps {
  composer: Composer;
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement>;
  onSelectParent: () => void;
  onOpenSettings?: () => void;
  onAncestorClick?: (ancestorId: string) => void;
}

interface ElementPosition {
  left: number;
  top: number;
  width: number;
}

interface AncestorInfo {
  id: string;
  name: string;
  type: string;
}

/* NOTE: Local getElementName and getTypeIcon functions REMOVED
   Now using shared utilities from ../utils/elementInfo.ts
   This ensures a single source of truth for element naming across the app */

export const SelectionLabel: React.FC<SelectionLabelProps> = ({
  composer,
  elementId,
  canvasRef,
  onSelectParent,
  onOpenSettings,
  onAncestorClick,
}) => {
  const [position, setPosition] = React.useState<ElementPosition | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [ancestors, setAncestors] = React.useState<AncestorInfo[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get element info
  const element = composer.elements.getElement(elementId);
  const elementType = element?.getType?.() || "element";
  const elementTagName = element?.getTagName?.()?.toLowerCase();
  const elementName = getElementNameFromType(elementType, elementTagName);

  // Build ancestor chain
  React.useEffect(() => {
    if (!element) return;

    const chain: AncestorInfo[] = [];
    let current = element.getParent();

    while (current) {
      const type = current.getType?.() || "element";
      chain.unshift({
        id: current.getId?.() || "",
        name: getElementNameFromType(type, current.getTagName?.()?.toLowerCase()),
        type,
      });
      current = current.getParent();
    }

    setAncestors(chain);
  }, [composer, elementId, element]);

  // Track element position
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const updatePosition = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const el = canvas.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement;
      if (!el) return;

      const canvasRect = canvas.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      setPosition({
        left: elRect.left - canvasRect.left + scrollLeft,
        top: elRect.top - canvasRect.top + scrollTop,
        width: elRect.width,
      });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    const el = canvasRef.current.querySelector(`[data-aqb-id="${elementId}"]`);
    if (el) observer.observe(el);

    window.addEventListener("scroll", updatePosition, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [elementId, canvasRef]);

  // Close dropdown on click outside
  React.useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  if (!position || !element) return null;

  // Parent info
  const parent = element.getParent();
  const parentType = parent?.getType?.() || "";
  const parentName = parent
    ? getElementNameFromType(parentType, parent.getTagName?.()?.toLowerCase())
    : null;

  // Position label above element, constrained to canvas
  const labelTop = Math.max(4, position.top - 32);
  const labelLeft = Math.max(4, position.left);

  return (
    <div
      className="aqb-selection-label"
      style={{
        position: "absolute",
        left: labelLeft,
        top: labelTop,
        zIndex: Z_INDEX.floatingToolbar,
        pointerEvents: "auto",
      }}
    >
      {/* Main label bar */}
      <div style={labelBarStyles}>
        {/* Parent button */}
        {parent && (
          <button
            onClick={onSelectParent}
            style={parentBtnStyles}
            title={`Go to parent: ${parentName} (Alt+↑)`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}

        {/* Element name (clickable for dropdown) */}
        <button onClick={() => setShowDropdown(!showDropdown)} style={nameBtnStyles}>
          <span style={{ opacity: 0.7, marginRight: 4 }}>{getTypeIcon(elementType)}</span>
          {elementName}
          {ancestors.length > 0 && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginLeft: 4 }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </button>

        {/* Settings gear */}
        {onOpenSettings && (
          <button onClick={onOpenSettings} style={gearBtnStyles} title="Element settings">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>

      {/* Ancestor dropdown */}
      {showDropdown && ancestors.length > 0 && (
        <div ref={dropdownRef} style={dropdownStyles}>
          {ancestors.map((ancestor, i) => (
            <button
              key={ancestor.id}
              onClick={() => {
                onAncestorClick?.(ancestor.id);
                setShowDropdown(false);
              }}
              style={{
                ...dropdownItemStyles,
                paddingLeft: 8 + i * 12,
              }}
            >
              <span style={{ opacity: 0.5, marginRight: 6, fontSize: 10 }}>
                {getTypeIcon(ancestor.type)}
              </span>
              {ancestor.name}
            </button>
          ))}
          {/* Current element */}
          <div
            style={{
              ...dropdownItemStyles,
              paddingLeft: 8 + ancestors.length * 12,
              background: canvasTokens.colors.primary.alpha20,
              color: canvasTokens.colors.primary.light,
              cursor: "default",
            }}
          >
            <span style={{ opacity: 0.7, marginRight: 6, fontSize: 10 }}>
              {getTypeIcon(elementType)}
            </span>
            {elementName}
            <span style={{ marginLeft: "auto", fontSize: 9, opacity: 0.6 }}>current</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles - using canvasTokens for consistency
const labelBarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  background: canvasTokens.colors.surface.background,
  borderRadius: canvasTokens.radius.md,
  padding: "2px 4px",
  boxShadow: canvasTokens.shadows.panel,
};

const parentBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  background: canvasTokens.colors.primary.alpha20,
  border: "none",
  borderRadius: 4,
  color: canvasTokens.colors.primary.light,
  cursor: "pointer",
  transition: "background 0.15s",
};

const nameBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  background: "transparent",
  border: "none",
  borderRadius: canvasTokens.radius.sm,
  color: canvasTokens.colors.text.primary,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: `background ${canvasTokens.animation.duration.fast}`,
};

const gearBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  background: "transparent",
  border: "none",
  borderRadius: canvasTokens.radius.sm,
  color: canvasTokens.colors.text.muted,
  cursor: "pointer",
  transition: `background ${canvasTokens.animation.duration.fast}, color ${canvasTokens.animation.duration.fast}`,
};

const dropdownStyles: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  background: canvasTokens.colors.surface.background,
  borderRadius: canvasTokens.radius.md,
  boxShadow: canvasTokens.shadows.panel,
  overflow: "hidden",
  minWidth: 160,
};

const dropdownItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  color: canvasTokens.colors.text.primary,
  fontSize: 12,
  textAlign: "left",
  cursor: "pointer",
  transition: `background ${canvasTokens.animation.duration.fast}`,
};

export default SelectionLabel;
