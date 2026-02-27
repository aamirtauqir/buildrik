/**
 * Settings Tab - Element Properties, Attributes, Links, Custom CSS
 * Part of AQUI-036: ProInspector refactoring
 *
 * @module components/Panels/ProInspector/tabs/SettingsTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { FormSettingsSection } from "../../../shared/forms/FormSettingsSection";
import type { PseudoStateId } from "../../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { AISuggestionSection } from "../sections/AISuggestionSection";
import { AllCSSSection } from "../sections/AllCSSSection";
import { CSSClassesSection } from "../sections/CSSClassesSection";
import { ElementPropertiesSection } from "../sections/elementProperties";
import { LinkSection } from "../sections/LinkSection";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface SettingsTabProps {
  /** Composer instance for element operations */
  composer: Composer | null | undefined;
  /** Currently selected element */
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  };
  /** Current pseudo-state (hover, focus, etc.) */
  currentPseudoState: PseudoStateId;
  /** Section to auto-expand based on element type */
  autoExpandSection?: "elementProperties" | null;
  /** Opens media library for asset selection */
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  /** Opens icon picker for icon selection */
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  /** Search query for filtering sections */
  searchQuery?: string;
  /** Whether developer mode is enabled (shows All CSS section) */
  devMode?: boolean;
}

// Section search keywords for filtering
const SECTION_KEYWORDS: Record<string, string[]> = {
  elementProperties: [
    "properties",
    "element",
    "id",
    "name",
    "type",
    "tag",
    "alt",
    "src",
    "title",
    "placeholder",
  ],
  link: ["link", "href", "url", "target", "anchor", "navigation"],
  cssClasses: ["class", "css", "classes", "style", "selector"],
  formSettings: ["form", "action", "method", "submit", "input", "validation"],
};

// Element types that support specific features
const LINKABLE_ELEMENTS = ["button", "link", "text", "heading", "image", "icon", "card", "cta"];
const FORM_ELEMENTS = ["form"];

// Check if element supports a feature
const supportsLink = (type: string): boolean => LINKABLE_ELEMENTS.includes(type);
const isForm = (type: string, tagName?: string): boolean =>
  FORM_ELEMENTS.includes(type) || tagName?.toLowerCase() === "form";

// Section group header component
const SectionGroupHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "12px 12px 6px",
      fontSize: 11,
      fontWeight: 600,
      color: INSPECTOR_TOKENS.textTertiary,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      borderTop: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
      marginTop: 8,
    }}
  >
    <span>{icon}</span>
    <span>{title}</span>
  </div>
);

const matchesSearch = (sectionName: string, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const keywords = SECTION_KEYWORDS[sectionName] || [sectionName];
  return keywords.some((kw) => kw.includes(q) || q.includes(kw));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SettingsTab: React.FC<SettingsTabProps> = ({
  composer,
  selectedElement,
  autoExpandSection,
  onOpenMediaLibrary,
  onOpenIconPicker,
  searchQuery = "",
  devMode = false,
}) => {
  // Get actual element for form settings
  const element = React.useMemo(() => {
    return composer?.elements?.getElement(selectedElement.id) ?? null;
  }, [composer, selectedElement.id]);

  // Element capabilities
  const elementType = selectedElement.type;
  const elementSupportsLink = supportsLink(elementType);
  const isFormElement = isForm(elementType, selectedElement.tagName);

  // Filter sections based on search
  const q = searchQuery.toLowerCase().trim();
  const showElementProperties = matchesSearch("elementProperties", q);
  const showLink = elementSupportsLink && matchesSearch("link", q);
  const showCssClasses = matchesSearch("cssClasses", q);
  const showFormSettings = isFormElement && element && matchesSearch("formSettings", q);

  const hasResults = showElementProperties || showLink || showCssClasses || showFormSettings;

  if (q && !hasResults) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: INSPECTOR_TOKENS.textTertiary,
          fontSize: 13,
        }}
      >
        No settings match "{searchQuery}"
      </div>
    );
  }

  return (
    <>
      {/* Element Properties - always shown first */}
      {showElementProperties && (
        <ElementPropertiesSection
          selectedElement={selectedElement}
          composer={composer}
          isOpen={autoExpandSection === "elementProperties" || !!q ? true : undefined}
          onOpenMediaLibrary={onOpenMediaLibrary}
          onOpenIconPicker={onOpenIconPicker}
        />
      )}

      {/* Navigation - only for linkable elements */}
      {showLink && (
        <>
          {!q && <SectionGroupHeader title="Navigation" icon="🔗" />}
          <LinkSection selectedElement={selectedElement} composer={composer} />
        </>
      )}

      {/* Form Settings - only for form elements */}
      {showFormSettings && (
        <>
          {!q && <SectionGroupHeader title="Form" icon="📝" />}
          <FormSettingsSection element={element!} composer={composer} />
        </>
      )}

      {/* Advanced - CSS Classes (always available) */}
      {showCssClasses && (
        <>
          {!q && <SectionGroupHeader title="Advanced" icon="⚙️" />}
          <CSSClassesSection selectedElement={selectedElement} composer={composer} />
        </>
      )}

      {/* All CSS Section - Dev Mode only */}
      {devMode && (
        <>
          {!q && <SectionGroupHeader title="Developer" icon="🛠️" />}
          <AllCSSSection selectedElement={selectedElement} composer={composer} />
        </>
      )}

      {/* AI Suggestions - Consolidated in Advanced tab (IA Redesign 2026 - Task 0.10) */}
      <AISuggestionSection composer={composer ?? null} selectedElement={selectedElement} />
    </>
  );
};

export default SettingsTab;
