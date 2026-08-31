import * as React from "react";

/**
 * Small "Mixed" badge shown next to field labels when multi-select has
 * differing values for that property. Uses --buildrick-warning (amber) from the
 * global token system to match the design spec.
 */
export const MixedValueBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "var(--bk-radius-full)",
          background: "var(--bk-warning)",
          marginRight: 4,
        }}
        title="Mixed — values differ across selected elements"
        aria-label="Mixed value"
      />
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: "var(--bk-warning)",
        background: "var(--bk-warning-tint)",
        border: "1px solid var(--bk-warning-text)",
        padding: "1px 6px",
        borderRadius: 3,
        fontFamily: "var(--bk-font-mono)",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "var(--bk-radius-full)",
          background: "var(--bk-warning)",
          boxShadow: "0 0 4px var(--bk-warning)",
        }}
      />
      Mixed
    </span>
  );
};
