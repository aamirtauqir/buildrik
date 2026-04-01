/**
 * Layout Visual Previews
 * Display and Position preview components
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// DISPLAY PREVIEW - Visual representation of display modes
// ============================================================================

export const DisplayPreview: React.FC<{ type: string }> = ({ type }) => {
  const box = { background: "#0073E6", borderRadius: 1 };
  const gray = { background: "#52525b", borderRadius: 1 };

  switch (type) {
    case "block":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: 28,
          }}
        >
          <div style={{ ...box, height: 5 }} />
          <div style={{ ...box, height: 5 }} />
        </div>
      );
    case "flex":
      return (
        <div style={{ display: "flex", gap: 2, width: 28 }}>
          <div style={{ ...box, flex: 1, height: 10 }} />
          <div style={{ ...box, flex: 1, height: 10 }} />
          <div style={{ ...box, flex: 1, height: 10 }} />
        </div>
      );
    case "grid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            width: 28,
          }}
        >
          <div style={{ ...box, height: 5 }} />
          <div style={{ ...box, height: 5 }} />
          <div style={{ ...box, height: 5 }} />
          <div style={{ ...box, height: 5 }} />
        </div>
      );
    case "inline-block":
      return (
        <div style={{ display: "flex", gap: 2, alignItems: "center", width: 28 }}>
          <div style={{ ...box, width: 10, height: 8 }} />
          <div style={{ ...box, width: 14, height: 8 }} />
        </div>
      );
    case "inline":
      return (
        <div style={{ display: "flex", gap: 1, alignItems: "center", width: 28 }}>
          <div style={{ ...gray, width: 6, height: 4 }} />
          <div style={{ ...box, width: 10, height: 6 }} />
          <div style={{ ...gray, width: 6, height: 4 }} />
        </div>
      );
    case "none":
      return (
        <div
          style={{
            width: 16,
            height: 10,
            border: "1px dashed #52525b",
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
      );
    default:
      return null;
  }
};

// ============================================================================
// POSITION PREVIEW - Visual representation of position modes
// ============================================================================

export const PositionPreview: React.FC<{ type: string }> = ({ type }) => {
  const containerStyle: React.CSSProperties = {
    width: 24,
    height: 16,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 2,
    position: "relative",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  const boxStyle: React.CSSProperties = {
    width: 8,
    height: 6,
    background: "#0073E6",
    borderRadius: 1,
    position: "absolute",
  };

  switch (type) {
    case "static":
      return (
        <div style={containerStyle}>
          <div style={{ ...boxStyle, position: "relative", margin: "5px auto" }} />
        </div>
      );
    case "relative":
      return (
        <div style={containerStyle}>
          <div style={{ ...boxStyle, top: 2, left: 2 }} />
          <div
            style={{
              width: 8,
              height: 6,
              border: "1px dashed #52525b",
              borderRadius: 1,
              position: "absolute",
              top: 5,
              left: 8,
              opacity: 0.5,
            }}
          />
        </div>
      );
    case "absolute":
      return (
        <div style={containerStyle}>
          <div style={{ ...boxStyle, top: 2, right: 2 }} />
        </div>
      );
    case "fixed":
      return (
        <div style={containerStyle}>
          <div style={{ ...boxStyle, bottom: 2, right: 2, background: "#22c55e" }} />
        </div>
      );
    case "sticky":
      return (
        <div style={containerStyle}>
          <div
            style={{
              ...boxStyle,
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#f59e0b",
            }}
          />
        </div>
      );
    default:
      return null;
  }
};
