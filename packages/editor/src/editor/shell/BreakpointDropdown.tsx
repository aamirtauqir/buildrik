/**
 * BreakpointDropdown - Viewport width selector
 * Shows current viewport width, preset sizes, and custom input.
 * Used alongside DeviceSwitcherPill in the topbar.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export type DeviceType = "desktop" | "tablet" | "mobile" | "wide";

interface BreakpointDropdownProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

const PRESETS: Array<{ id: DeviceType; label: string; width: number }> = [
  { id: "mobile", label: "Mobile", width: 375 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "desktop", label: "Desktop", width: 1280 },
  { id: "wide", label: "Wide", width: 1920 },
];

const DEVICE_WIDTH: Record<DeviceType, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
  wide: 1920,
};

export const BreakpointDropdown: React.FC<BreakpointDropdownProps> = ({
  device,
  onDeviceChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentWidth = DEVICE_WIDTH[device] ?? DEVICE_WIDTH.desktop;

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

  const applyCustomWidth = () => {
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed >= 320 && parsed <= 3840) {
      // Find nearest preset
      const nearest = PRESETS.reduce((prev, curr) =>
        Math.abs(curr.width - parsed) < Math.abs(prev.width - parsed) ? curr : prev
      );
      onDeviceChange(nearest.id);
      setIsOpen(false);
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyCustomWidth();
    if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Viewport: ${currentWidth}px`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 30,
          padding: "0 10px",
          background: "var(--buildrick-bg-card)",
          border: "1px solid #D1D9E6",
          borderRadius: 8,
          color: "var(--buildrick-text-secondary)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "border-color 0.12s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#94A3B8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#D1D9E6";
        }}
      >
        <span style={{ color: "var(--buildrick-text-secondary)", fontSize: 12, fontWeight: 500 }}>
          {currentWidth}px
        </span>
        <span
          style={{
            color: "var(--buildrick-text-tertiary)",
            fontSize: 10,
            lineHeight: 1,
            marginLeft: 2,
          }}
        >
          ▾
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && buttonRef.current && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Select viewport width"
          style={{
            position: "fixed",
            top: buttonRef.current.getBoundingClientRect().bottom + 6,
            left: buttonRef.current.getBoundingClientRect().left,
            width: 200,
            background: "var(--buildrick-bg-card)",
            border: "1px solid #D1D9E6",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            overflow: "hidden",
            zIndex: 10000,
          }}
        >
          {/* Preset items */}
          <div style={{ padding: "4px 0" }}>
            {PRESETS.map((preset) => {
              const isActive = preset.id === device;
              return (
                <button
                  key={preset.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onDeviceChange(preset.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    height: 32,
                    padding: "0 12px",
                    background: isActive ? "#EFF6FF" : "transparent",
                    border: "none",
                    color: isActive ? "#2563EB" : "#475569",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#F1F5F9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive ? "#EFF6FF" : "transparent";
                  }}
                >
                  <span style={{ flex: 1 }}>{preset.label}</span>
                  <span style={{ fontSize: 12, color: "var(--buildrick-text-tertiary)" }}>
                    {preset.width}px
                  </span>
                  {isActive && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "var(--buildrick-accent-hover)",
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#E2E8F0", margin: "0" }} />

          {/* Custom size input */}
          <div style={{ padding: "8px 12px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--buildrick-text-tertiary)",
                marginBottom: 6,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Custom
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                ref={inputRef}
                type="number"
                min={320}
                max={3840}
                placeholder={String(currentWidth)}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                onBlur={applyCustomWidth}
                style={{
                  flex: 1,
                  height: 28,
                  padding: "0 8px",
                  background: "var(--buildrick-bg-panel)",
                  border: "1px solid #D1D9E6",
                  borderRadius: 6,
                  color: "var(--buildrick-text-secondary)",
                  fontSize: 12,
                  outline: "none",
                  MozAppearance: "textfield" as React.CSSProperties["MozAppearance"],
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2563EB";
                }}
                aria-label="Custom viewport width in pixels"
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--buildrick-text-muted)",
                  flexShrink: 0,
                }}
              >
                px
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakpointDropdown;
