/**
 * Inspector Sub-Nav
 * Clickable section jump links below the tab strip (H-02 fix).
 * Extracted from ProInspector.tsx for 500-line compliance.
 * @license BSD-3-Clause
 */

import * as React from "react";

const LAYOUT_SECTIONS = [
  { label: "Display", id: "inspector-section-display" },
  { label: "Size", id: "inspector-section-size" },
  { label: "Spacing", id: "inspector-section-spacing" },
  { label: "Flexbox", id: "inspector-section-flexbox" },
  { label: "Grid", id: "inspector-section-grid" },
  { label: "Visibility", id: "inspector-section-visibility" },
] as const;

const APPEARANCE_SECTIONS = [
  { label: "Typography", id: "inspector-section-typography" },
  { label: "Background", id: "inspector-section-background" },
  { label: "Border", id: "inspector-section-border" },
] as const;

const EFFECTS_SECTIONS = [
  { label: "Effects", id: "inspector-section-effects" },
  { label: "Animation", id: "inspector-section-animation" },
  { label: "Interactions", id: "inspector-section-interactions" },
] as const;

const SETTINGS_SECTIONS = [
  { label: "Properties", id: "inspector-section-element-properties" },
  { label: "Link", id: "inspector-section-link" },
  { label: "Classes", id: "inspector-section-css-classes" },
] as const;

export interface InspectorSubNavProps {
  activeTab: "layout" | "appearance" | "effects" | "settings";
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export const InspectorSubNav: React.FC<InspectorSubNavProps> = ({ activeTab, contentRef }) => {
  const sectionMap = {
    layout: LAYOUT_SECTIONS,
    appearance: APPEARANCE_SECTIONS,
    effects: EFFECTS_SECTIONS,
    settings: SETTINGS_SECTIONS,
  } as const;
  const activeSections = sectionMap[activeTab];

  const scrollToSection = (sectionId: string) => {
    const el = contentRef.current?.querySelector(`#${sectionId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label={`${activeTab} sections`}
      style={{
        display: "flex",
        overflowX: "auto" as const,
        gap: 4,
        padding: "6px 12px",
        borderBottom: "1px solid var(--aqb-border-subtle)",
        background: "var(--aqb-surface-2)",
        scrollbarWidth: "none" as const,
      }}
    >
      {activeSections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollToSection(section.id)}
          title={`Jump to ${section.label} section`}
          aria-label={`Jump to ${section.label} section`}
          style={{
            background: "var(--aqb-surface-3)",
            border: "none",
            padding: "3px 10px",
            fontSize: 11,
            color: "var(--aqb-text-tertiary)",
            cursor: "pointer",
            borderRadius: 12,
            flexShrink: 0,
            whiteSpace: "nowrap" as const,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--aqb-primary-light)";
            (e.currentTarget as HTMLElement).style.color = "var(--aqb-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--aqb-surface-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--aqb-text-tertiary)";
          }}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
};
