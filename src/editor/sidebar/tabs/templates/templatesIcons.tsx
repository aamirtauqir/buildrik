/**
 * Templates Icons - SVG icon components for TemplatesTab
 * Extracted from TemplatesTab.tsx for maintainability
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SectionType } from "../../../../templates/SectionTemplates";
import type { TopLevelGroup } from "./templatesData";

// ============================================================================
// WIREFRAME ICONS - Mini representations of each section type
// ============================================================================

export const WireframeIcon: React.FC<{ type: SectionType; size?: number }> = ({
  type,
  size = 40,
}) => {
  const color = "var(--aqb-accent-purple, #8B5CF6)";
  const muted = "var(--aqb-text-muted, #64748b)";

  switch (type) {
    case "hero":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill="var(--aqb-surface-1, #1a1a24)" />
          <rect x="10" y="10" width="20" height="4" rx="1" fill={color} opacity="0.8" />
          <rect x="12" y="16" width="16" height="2" rx="1" fill={muted} opacity="0.5" />
          <rect x="14" y="20" width="5" height="3" rx="1" fill={color} />
          <rect x="21" y="20" width="5" height="3" rx="1" fill={muted} opacity="0.4" />
        </svg>
      );
    case "navigation":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="14" width="32" height="12" rx="2" fill="var(--aqb-surface-1, #1a1a24)" />
          <rect x="7" y="18" width="6" height="4" rx="1" fill={color} />
          <circle cx="20" cy="20" r="1" fill={muted} />
          <circle cx="24" cy="20" r="1" fill={muted} />
          <circle cx="28" cy="20" r="1" fill={muted} />
          <rect x="31" y="18" width="4" height="4" rx="1" fill={color} opacity="0.6" />
        </svg>
      );
    case "features":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill="var(--aqb-surface-1, #1a1a24)" />
          <rect x="6" y="10" width="8" height="8" rx="2" fill={color} opacity="0.3" />
          <rect x="16" y="10" width="8" height="8" rx="2" fill={color} opacity="0.3" />
          <rect x="26" y="10" width="8" height="8" rx="2" fill={color} opacity="0.3" />
          <rect x="7" y="20" width="6" height="1" rx="0.5" fill={muted} />
          <rect x="17" y="20" width="6" height="1" rx="0.5" fill={muted} />
          <rect x="27" y="20" width="6" height="1" rx="0.5" fill={muted} />
          <rect x="6" y="23" width="8" height="6" rx="1" fill={muted} opacity="0.2" />
          <rect x="16" y="23" width="8" height="6" rx="1" fill={muted} opacity="0.2" />
          <rect x="26" y="23" width="8" height="6" rx="1" fill={muted} opacity="0.2" />
        </svg>
      );
    case "pricing":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill="var(--aqb-surface-1, #1a1a24)" />
          <rect x="6" y="8" width="8" height="24" rx="2" fill={muted} opacity="0.2" />
          <rect x="16" y="6" width="8" height="28" rx="2" fill={color} opacity="0.4" />
          <rect x="26" y="8" width="8" height="24" rx="2" fill={muted} opacity="0.2" />
          <text x="10" y="16" fontSize="6" fill={muted} textAnchor="middle">
            $
          </text>
          <text x="20" y="16" fontSize="6" fill="var(--aqb-text-primary, #fff)" textAnchor="middle">
            $
          </text>
          <text x="30" y="16" fontSize="6" fill={muted} textAnchor="middle">
            $
          </text>
        </svg>
      );
    case "testimonials":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill="var(--aqb-surface-1, #1a1a24)" />
          <rect x="6" y="10" width="14" height="20" rx="2" fill={muted} opacity="0.15" />
          <rect x="22" y="10" width="14" height="20" rx="2" fill={muted} opacity="0.15" />
          <text x="9" y="16" fontSize="8" fill={color} opacity="0.8">
            "
          </text>
          <text x="25" y="16" fontSize="8" fill={color} opacity="0.8">
            "
          </text>
          <circle cx="10" cy="26" r="2" fill={color} opacity="0.5" />
          <circle cx="26" cy="26" r="2" fill={color} opacity="0.5" />
        </svg>
      );
    case "cta":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill={color} opacity="0.3" />
          <rect
            x="10"
            y="14"
            width="20"
            height="3"
            rx="1"
            fill="var(--aqb-text-primary, #fff)"
            opacity="0.8"
          />
          <rect
            x="14"
            y="19"
            width="12"
            height="2"
            rx="1"
            fill="var(--aqb-text-primary, #fff)"
            opacity="0.4"
          />
          <rect x="13" y="24" width="14" height="5" rx="2" fill="var(--aqb-text-primary, #fff)" />
        </svg>
      );
    case "footer":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill="var(--aqb-surface-1, #0f0f17)" />
          <rect x="6" y="8" width="8" height="3" rx="1" fill={color} opacity="0.6" />
          <rect x="6" y="13" width="6" height="1" rx="0.5" fill={muted} opacity="0.3" />
          <rect x="6" y="15" width="6" height="1" rx="0.5" fill={muted} opacity="0.3" />
          <rect x="18" y="8" width="4" height="2" rx="0.5" fill={muted} opacity="0.4" />
          <rect x="18" y="11" width="3" height="1" rx="0.5" fill={muted} opacity="0.2" />
          <rect x="18" y="13" width="3" height="1" rx="0.5" fill={muted} opacity="0.2" />
          <rect x="28" y="8" width="4" height="2" rx="0.5" fill={muted} opacity="0.4" />
          <rect x="28" y="11" width="3" height="1" rx="0.5" fill={muted} opacity="0.2" />
          <rect x="28" y="13" width="3" height="1" rx="0.5" fill={muted} opacity="0.2" />
          <line x1="6" y1="30" x2="34" y2="30" stroke={muted} strokeWidth="0.5" opacity="0.3" />
          <rect x="16" y="32" width="8" height="1" rx="0.5" fill={muted} opacity="0.2" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" fill="var(--aqb-surface-1, #1a1a24)" />
          <rect x="10" y="10" width="20" height="20" rx="2" fill={muted} opacity="0.2" />
        </svg>
      );
  }
};

// ============================================================================
// PREVIEW ICONS
// ============================================================================

export const TemplatePreviewPlaceholder: React.FC<{ type: SectionType }> = ({ type }) => {
  const getPreviewStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      height: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      color: "var(--aqb-text-muted, #666)",
    };

    switch (type) {
      case "hero":
        return {
          ...base,
          background: "var(--aqb-gradient-primary, linear-gradient(135deg, #667eea, #764ba2))",
        };
      case "navigation":
        return {
          ...base,
          background: "var(--aqb-surface-2, #fff)",
          borderBottom: "1px solid var(--aqb-border, #eee)",
        };
      case "features":
        return { ...base, background: "var(--aqb-surface-2, #f8fafc)" };
      case "pricing":
        return { ...base, background: "var(--aqb-surface-2, #f8fafc)" };
      case "testimonials":
        return { ...base, background: "var(--aqb-surface-2, #fff)" };
      case "cta":
        return {
          ...base,
          background: "var(--aqb-gradient-primary, linear-gradient(135deg, #667eea, #764ba2))",
        };
      case "footer":
        return { ...base, background: "var(--aqb-surface-1, #1a1a2e)" };
      default:
        return { ...base, background: "var(--aqb-surface-3, #f0f0f0)" };
    }
  };

  return (
    <div style={getPreviewStyle()}>
      <PreviewIcon type={type} />
    </div>
  );
};

export const PreviewIcon: React.FC<{ type: SectionType }> = ({ type }) => {
  const iconColor = ["hero", "cta", "footer"].includes(type)
    ? "var(--aqb-text-primary, #fff)"
    : "var(--aqb-primary, #667eea)";

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.6 }}>
      <rect x="8" y="8" width="32" height="32" rx="4" stroke={iconColor} strokeWidth="2" />
      <line x1="8" y1="16" x2="40" y2="16" stroke={iconColor} strokeWidth="2" />
      <rect x="12" y="20" width="8" height="6" rx="1" fill={iconColor} opacity="0.3" />
      <rect x="22" y="20" width="14" height="2" rx="1" fill={iconColor} opacity="0.5" />
      <rect x="22" y="24" width="10" height="2" rx="1" fill={iconColor} opacity="0.3" />
    </svg>
  );
};

// ============================================================================
// GROUP ICONS (Lucide-style: 18px, strokeWidth 2)
// ============================================================================

export const PagesIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="aqb-icon-base"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

export const SectionsIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="aqb-icon-base"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

export const BookmarkIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="aqb-icon-base"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const TemplateChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 200ms ease",
      opacity: 0.6,
      flexShrink: 0,
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const GroupIcon: React.FC<{ type: TopLevelGroup }> = ({ type }) => {
  switch (type) {
    case "sections":
      return <SectionsIcon />;
    case "pages":
      return <PagesIcon />;
    case "mySaves":
      return <BookmarkIcon />;
    default:
      return <SectionsIcon />;
  }
};

export const TemplateCheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="13 4 6 11 3 8" />
  </svg>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Highlight matching text with purple tint for search results */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="aqb-highlight-match">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
