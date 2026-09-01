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
import { Button } from "@/editor/chrome-ui";

export interface SelectionLabelProps {
  composer: Composer;
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelectParent: () => void;
  /* REQUIRED, not optional. The ancestor dropdown always renders its rows and
     every row calls this — an optional handler let the only consumer omit it,
     and the dropdown closed on click while selecting nothing. Required means
     the compiler catches the next omission instead of a user finding it. */
  onAncestorClick: (ancestorId: string) => void;
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

      const el = canvas.querySelector(`[data-buildrick-id="${elementId}"]`) as HTMLElement;
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
    const el = canvasRef.current.querySelector(`[data-buildrick-id="${elementId}"]`);
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
          <Button
            onClick={onSelectParent}
            style={parentBtnStyles}
            /* px-0: 24 wide against flowbite's 40 of horizontal padding, which
               clamps the content box to zero and hides the svg below. */
            className="tw:px-0"
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
          </Button>
        )}

        {/* Element name (clickable for dropdown) */}
        <Button onClick={() => setShowDropdown(!showDropdown)} style={nameBtnStyles}>
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
        </Button>
      </div>
      {/* Ancestor dropdown */}
      {showDropdown && ancestors.length > 0 && (
        <div ref={dropdownRef} style={dropdownStyles}>
          {ancestors.map((ancestor, i) => (
            <Button
              key={ancestor.id}
              onClick={() => {
                onAncestorClick(ancestor.id);
                setShowDropdown(false);
              }}
              style={{
                ...dropdownItemStyles,
                paddingLeft: 8 + i * 12,
              }}
            >
              <span style={{ opacity: 0.5, marginRight: 6, fontSize: 12 }}>
                {getTypeIcon(ancestor.type)}
              </span>
              {ancestor.name}
            </Button>
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
            <span style={{ opacity: 0.7, marginRight: 6, fontSize: 12 }}>
              {getTypeIcon(elementType)}
            </span>
            {elementName}
            <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.6 }}>current</span>
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
