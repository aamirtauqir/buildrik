/**
 * BreakpointDropdown - Device breakpoint selector dropdown
 * Consolidates Desktop/Tablet/Mobile buttons into single dropdown
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import desktopIcon from "../../assets/icons/navbar/desktop.svg";
import mobileIcon from "../../assets/icons/navbar/mobile.svg";
import tabletIcon from "../../assets/icons/navbar/tablet.svg";
import { Tooltip } from "../../shared/ui/Tooltip";

export type DeviceType = "desktop" | "tablet" | "mobile";

interface BreakpointDropdownProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

const BREAKPOINTS = [
  { id: "desktop" as const, label: "Desktop", width: "1440px", icon: desktopIcon },
  { id: "tablet" as const, label: "Tablet", width: "768px", icon: tabletIcon },
  { id: "mobile" as const, label: "Mobile", width: "375px", icon: mobileIcon },
];

export const BreakpointDropdown: React.FC<BreakpointDropdownProps> = ({
  device,
  onDeviceChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const currentBreakpoint = BREAKPOINTS.find((b) => b.id === device) || BREAKPOINTS[0];

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div style={{ position: "relative" }}>
      <Tooltip content="Device Preview">
        {/* BUG-008 FIX: Added overflow handling for label */}
        <button
          ref={buttonRef}
          className="pill"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          style={{ maxWidth: 120 }}
        >
          <span className="ico" aria-hidden="true">
            <img src={currentBreakpoint.icon} alt="" className="navbar-icon" />
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 60,
            }}
          >
            {currentBreakpoint.label}
          </span>
          <span style={{ marginLeft: 4, opacity: 0.6, flexShrink: 0 }}>▾</span>
        </button>
      </Tooltip>

      {isOpen && buttonRef.current && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Select device breakpoint"
          style={{
            position: "fixed",
            top: buttonRef.current.getBoundingClientRect().bottom + 8,
            left: buttonRef.current.getBoundingClientRect().left,
            minWidth: 200,
            background: "var(--bar, #1a1a1a)",
            border: "1px solid var(--barStroke, #333)",
            borderRadius: 12,
            padding: "8px 0",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            zIndex: 10000,
          }}
        >
          {BREAKPOINTS.map((bp) => (
            <button
              key={bp.id}
              role="option"
              aria-selected={bp.id === device}
              onClick={() => {
                onDeviceChange(bp.id);
                setIsOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 16px",
                background: bp.id === device ? "rgba(75, 141, 255, 0.15)" : "transparent",
                border: "none",
                color: "var(--txt, #fff)",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (bp.id !== device) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  bp.id === device ? "rgba(75, 141, 255, 0.15)" : "transparent";
              }}
            >
              <img src={bp.icon} alt="" style={{ width: 18, height: 18, opacity: 0.9 }} />
              <span style={{ flex: 1, fontWeight: bp.id === device ? 500 : 400 }}>{bp.label}</span>
              <span style={{ opacity: 0.5, fontSize: 12 }}>{bp.width}</span>
              {bp.id === device && <span style={{ color: "#4b8dff", marginLeft: 4 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BreakpointDropdown;
