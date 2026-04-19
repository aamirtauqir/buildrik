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
          borderRadius: "50%",
          background: "var(--buildrick-warning)",
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
        fontSize: 10,
        fontWeight: 500,
        color: "var(--buildrick-warning, #92400E)",
        background: "var(--buildrick-warning-bg, #FEF3C7)",
        border: "1px solid #FDE68A",
        padding: "1px 6px",
        borderRadius: 3,
        fontFamily: "var(--font-mono, JetBrains Mono, monospace)",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "var(--buildrick-warning)",
          boxShadow: "0 0 4px var(--buildrick-warning)",
        }}
      />
      Mixed
    </span>
  );
};
