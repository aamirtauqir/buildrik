import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Element Properties Section - Per-element specific attributes
 * href, src, alt, placeholder, etc.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../../shared/types/media";
import { Section, type SectionTier } from "../../shared/controls";
import { escapeHTML } from "../../../../shared/utils/html/encoding";
import { getPropertiesForType } from "./config";
import { DataAttributeEditor } from "./DataAttributeEditor";
import {
  runTxn,
  handleColumnsCountChange,
  handleColumnsGapChange,
  handleContentChange,
  handleTextareaDefaultChange,
  handleVideoSrcChange,
  handleVideoPosterChange,
  handleGenericAttributeChange,
  handleIconSelectAction,
  getCurrentIconConfig,
} from "./handlers";
import { PropertyField } from "./PropertyField";

const styles = {
  dataAttributesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: `1px solid ${"var(--bk-border)"}`,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 12,
    color: "var(--bk-ink-muted)",
    fontWeight: 500,
    marginBottom: 12,
  } as React.CSSProperties,
  iconPickerButton: {
    width: "100%",
    padding: "12px 16px",
    background: "var(--bk-accent-tint)",
    border: "1px solid var(--bk-alpha-accent-30)",
    borderRadius: 8,
    color: "var(--bk-accent)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  } as React.CSSProperties,
  iconHint: {
    fontSize: 12,
    color: "var(--bk-ink-muted)",
    marginTop: 6,
    textAlign: "center" as const,
  } as React.CSSProperties,
  iconPickerContainer: {
    marginBottom: 16,
  } as React.CSSProperties,
};

// ============================================================================
// TYPES
// ============================================================================

export interface ElementPropertiesSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer?: Composer | null;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled. */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
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
}

// ============================================================================
// ICON PICKER BUTTON
// ============================================================================

interface IconPickerButtonProps {
  iconName?: string;
  onOpenIconPicker: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  getCurrentIconConfig: () => IconConfig | undefined;
  handleIconSelect: (icon: IconConfig) => void;
}

const IconPickerButton: React.FC<IconPickerButtonProps> = ({
  iconName,
  onOpenIconPicker,
  getCurrentIconConfig,
  handleIconSelect,
}) => (
  <div style={styles.iconPickerContainer}>
    <Button
      onClick={() => onOpenIconPicker(getCurrentIconConfig(), handleIconSelect)}
      style={styles.iconPickerButton}
      title="Open icon picker"
    >
      <span style={{ fontSize: 16 }}>&#x1F3A8;</span>
      Change Icon
    </Button>
    <div style={styles.iconHint}>Current: {iconName || "star"}</div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ElementPropertiesSection: React.FC<ElementPropertiesSectionProps> = ({
  selectedElement,
  composer,
  isOpen,
  onToggle,
  tier = "secondary",
  onOpenMediaLibrary,
  onOpenIconPicker,
}) => {
  const [attrs, setAttrs] = React.useState<Record<string, string>>({});

  // Get properties for this element type
  const properties = React.useMemo(
    () => getPropertiesForType(selectedElement?.type),
    [selectedElement?.type]
  );

  // Load attributes when element changes
  React.useEffect(() => {
    if (!selectedElement?.id) {
      setAttrs({});
      return;
    }

    const loaded: Record<string, string> = {};

    if (!composer) {
      setAttrs({});
      return;
    }

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) {
      setAttrs({});
      return;
    }

    properties.forEach((prop) => {
      if (prop.id === "content") {
        loaded[prop.id] = el.getContent?.() || "";
        return;
      }
      // Heading level reads from the element's tag, not an attribute.
      if (prop.id === "level" && selectedElement.type === "heading") {
        loaded[prop.id] = el.getTagName?.() || "h2";
        return;
      }
      // Select options read from the inner <option> elements (one per line).
      if (prop.id === "options" && selectedElement.type === "select") {
        const content = el.getContent?.() || "";
        loaded[prop.id] = [...content.matchAll(/<option[^>]*>([\s\S]*?)<\/option>/gi)]
          .map((m) => m[1].trim())
          .join("\n");
        return;
      }
      // Textarea default value uses inner content when attribute is absent
      if (selectedElement.type === "textarea" && prop.id === "value") {
        loaded[prop.id] = el.getAttribute?.("value") || el.getContent?.() || "";
        return;
      }
      loaded[prop.id] = el.getAttribute?.(prop.id) || "";
    });
    setAttrs(loaded);
  }, [selectedElement, composer, properties]);

  // Handle attribute change
  const handleChange = (id: string, value: string) => {
    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    // Special handling for columns count. Must return — without it, control
    // fell through to the generic attribute handler below and ran a SECOND
    // transaction writing data-columns as a raw attr (double mutation + two
    // undo entries per change).
    if (id === "data-columns" && selectedElement.type === "columns") {
      runTxn(composer, "columns-count-change", () => {
        handleColumnsCountChange(el, composer, value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Special handling for gap
    if (id === "data-gap" && selectedElement.type === "columns") {
      runTxn(composer, "columns-gap-change", () => {
        handleColumnsGapChange(el, value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    if (id === "content") {
      runTxn(composer, "content-change", () => {
        handleContentChange(el, value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Heading level — maps to the element's tag (h1–h6).
    if (id === "level" && selectedElement.type === "heading") {
      runTxn(composer, "heading-level-change", () => {
        el.setTagName(value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Select options — one per line, rebuilt into <option> elements.
    if (id === "options" && selectedElement.type === "select") {
      runTxn(composer, "select-options-change", () => {
        const html = value
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => `<option>${escapeHTML(line)}</option>`)
          .join("");
        el.setContent?.(html);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Textarea default value
    if (selectedElement.type === "textarea" && id === "value") {
      runTxn(composer, "textarea-default-change", () => {
        handleTextareaDefaultChange(el, value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Video src
    if (selectedElement.type === "video" && id === "src") {
      runTxn(composer, "video-src-change", () => {
        handleVideoSrcChange(el, value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Video poster
    if (selectedElement.type === "video" && id === "poster") {
      runTxn(composer, "video-poster-change", () => {
        handleVideoPosterChange(el, value);
      });
      setAttrs((prev) => ({ ...prev, [id]: value }));
      return;
    }

    // Generic attribute change
    runTxn(composer, "element-prop-change", () => {
      handleGenericAttributeChange(el, id, value);
    });
    setAttrs((prev) => ({ ...prev, [id]: value }));
  };

  // Handle icon selection from picker
  const handleIconSelect = (icon: IconConfig) => {
    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTxn(composer, "icon-change", () => {
      handleIconSelectAction(el, icon, setAttrs);
    });
  };

  // Get current icon config helper
  const getIconConfig = () => getCurrentIconConfig(selectedElement, composer);

  if (properties.length === 0) {
    return null;
  }

  return (
    <Section
      title="Element Properties"
      icon="Settings"
      defaultOpen
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-element-properties"
    >
      {/* Icon Picker Button for icon elements */}
      {selectedElement.type === "icon" && onOpenIconPicker && (
        <IconPickerButton
          iconName={attrs["data-icon-name"]}
          onOpenIconPicker={onOpenIconPicker}
          getCurrentIconConfig={getIconConfig}
          handleIconSelect={handleIconSelect}
        />
      )}

      {properties.map((prop) => (
        <PropertyField
          key={prop.id}
          prop={prop}
          value={attrs[prop.id] || ""}
          onChange={handleChange}
          selectedElement={selectedElement}
          onOpenMediaLibrary={onOpenMediaLibrary}
        />
      ))}

      {/* Data Attributes */}
      <div style={styles.dataAttributesSection}>
        <div style={styles.sectionTitle}>Custom Data Attributes</div>
        <DataAttributeEditor elementId={selectedElement.id} composer={composer} />
      </div>
    </Section>
  );
};

export default ElementPropertiesSection;
