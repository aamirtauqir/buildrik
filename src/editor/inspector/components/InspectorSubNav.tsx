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
        flexWrap: "wrap" as const,
        gap: 2,
        padding: "6px 12px",
        borderBottom: "1px solid var(--aqb-border-subtle)",
        background: "var(--aqb-surface-2)",
      }}
    >
      {activeSections.map((section, i) => (
        <React.Fragment key={section.id}>
          <button
            type="button"
            onClick={() => scrollToSection(section.id)}
            title={`Jump to ${section.label} section`}
            aria-label={`Jump to ${section.label} section`}
            style={{
              background: "transparent",
              border: "none",
              padding: "2px 4px",
              fontSize: 12,
              color: "var(--aqb-text-tertiary)",
              cursor: "pointer",
              borderRadius: 3,
            }}
          >
            {section.label}
          </button>
          {i < activeSections.length - 1 && (
            <span
              aria-hidden="true"
              style={{ color: "var(--aqb-border)", fontSize: 12, lineHeight: "20px" }}
            >
              •
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
