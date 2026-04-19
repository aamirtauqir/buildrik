/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * FeatureCard - 72px clickable card for home screens (Build, Settings)
 * Card-based navigation pattern for drill-in screens
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface FeatureCardProps {
  /** Card title (e.g., "Elements", "Templates") */
  title: string;
  /** Card subtitle/description */
  subtitle: string;
  /** Icon to display (24px) */
  icon: React.ReactNode;
  /** Callback when card is clicked */
  onClick: () => void;
  /** Optional badge - number for counts, string for labels like "Pro" */
  badge?: number | string;
  /** Whether the card is currently selected/active */
  isActive?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
}

export const FeatureCard = React.memo<FeatureCardProps>(
  ({ title, subtitle, icon, onClick, badge, isActive = false, disabled = false }) => {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...cardStyles,
          ...(isActive ? cardActiveStyles : {}),
          ...(disabled ? cardDisabledStyles : {}),
        }}
        aria-current={isActive ? "page" : undefined}
        aria-label={`${title}${subtitle ? ` — ${subtitle}` : ""}${badge ? ` (${badge})` : ""}`}
      >
        {/* Icon container */}
        <div style={iconContainerStyles}>{icon}</div>

        {/* Text content */}
        <div style={textContainerStyles}>
          <span style={titleStyles}>{title}</span>
          <span style={subtitleStyles}>{subtitle}</span>
        </div>

        {/* Right side: badge or chevron */}
        <div style={rightSectionStyles}>
          {badge !== undefined && (
            <span
              style={{
                ...badgeStyles,
                ...(badge === "Coming Soon"
                  ? comingSoonBadgeStyles
                  : typeof badge === "string"
                    ? planBadgeStyles
                    : {}),
              }}
            >
              {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : badge}
            </span>
          )}
          <ChevronRightIcon />
        </div>
      </button>
    );
  }
);

// ============================================
// FeatureCardGrid - Grid container for cards
// ============================================

export interface FeatureCardGridProps {
  children: React.ReactNode;
  /** Number of columns (auto-calculated based on panel width, default 1) */
  columns?: 1 | 2;
  /** Optional section label rendered above the grid */
  label?: string;
}

export const FeatureCardGrid: React.FC<FeatureCardGridProps> = ({ children, columns = 1, label }) => {
  return (
    <div>
      {label && (
        <div
          style={{
            padding: "12px 12px 4px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--buildrick-text-muted, #6B7280)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns === 2 ? "repeat(2, 1fr)" : "1fr",
          gap: 8,
          padding: label ? "0 12px 12px" : 12,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================
// Icons
// ============================================

const ChevronRightIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "var(--buildrick-text-muted)" }}
  >
    <path d="M6 4l4 4-4 4" />
  </svg>
);

// ============================================
// Styles
// ============================================

const cardStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  height: 72,
  padding: "12px 16px",
  background: "var(--buildrick-bg-hover)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 12,
  cursor: "pointer",
  transition: "background 0.15s ease, border-color 0.15s ease, transform 0.1s ease",
  textAlign: "left",
};

const cardActiveStyles: React.CSSProperties = {
  background: "var(--buildrick-accent-subtle)",
  borderColor: "var(--buildrick-accent)",
};

const cardDisabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const iconContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  background: "var(--buildrick-bg-active)",
  borderRadius: 10,
  color: "var(--buildrick-text-primary)",
  flexShrink: 0,
};

const textContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
};

const titleStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: "18px",
  color: "var(--buildrick-text-primary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 400,
  lineHeight: "16px",
  color: "var(--buildrick-text-secondary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const rightSectionStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const badgeStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 20,
  height: 20,
  padding: "0 6px",
  background: "var(--buildrick-surface-4)",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--buildrick-text-secondary)",
};

const planBadgeStyles: React.CSSProperties = {
  background: "var(--buildrick-accent-subtle, rgba(124, 125, 255, 0.15))",
  color: "var(--buildrick-accent)",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const comingSoonBadgeStyles: React.CSSProperties = {
  background: "#FEF3C7",
  color: "#92400E",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

export default FeatureCard;
