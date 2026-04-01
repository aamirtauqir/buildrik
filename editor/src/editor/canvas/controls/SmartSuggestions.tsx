/**
 * Smart Suggestions Component
 * Context-aware action suggestions below selected element
 *
 * Shows relevant next actions based on:
 * - Element type (container, text, image, button)
 * - Element state (empty, has content, has children)
 * - Common workflows
 *
 * @module components/Canvas/controls/SmartSuggestions
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer, Element } from "../../../engine";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import { EVENTS } from "../../../shared/constants/events";
import { CANVAS_COLORS, SIZES } from "../shared";

// =============================================================================
// TYPES
// =============================================================================

export interface Suggestion {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export interface SmartSuggestionsProps {
  composer: Composer;
  element: Element;
  /** Position rect of the selected element */
  elementRect: DOMRect;
  /** Callback when a suggestion is used */
  onSuggestionUsed?: (suggestionId: string) => void;
  /** Whether to show the bar (can be dismissed) */
  visible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
}

// =============================================================================
// SUGGESTION GENERATORS
// =============================================================================

function getContainerSuggestions(
  composer: Composer,
  element: Element,
  hasChildren: boolean
): Suggestion[] {
  const elementId = element.getId();

  if (!hasChildren) {
    // Empty container suggestions
    return [
      {
        id: "add-heading",
        label: "Add heading",
        icon: "H",
        action: () =>
          composer.emit(EVENTS.ELEMENT_QUICK_ADD, { parentId: elementId, type: "heading" }),
      },
      {
        id: "add-text",
        label: "Add text",
        icon: "T",
        action: () =>
          composer.emit(EVENTS.ELEMENT_QUICK_ADD, { parentId: elementId, type: "text" }),
      },
      {
        id: "add-image",
        label: "Add image",
        icon: "🖼",
        action: () =>
          composer.emit(EVENTS.ELEMENT_QUICK_ADD, { parentId: elementId, type: "image" }),
      },
      {
        id: "add-button",
        label: "Add button",
        icon: "◻",
        action: () =>
          composer.emit(EVENTS.ELEMENT_QUICK_ADD, { parentId: elementId, type: "button" }),
      },
    ];
  }

  // Container with children
  return [
    {
      id: "add-child",
      label: "Add element",
      icon: "+",
      action: () => composer.emit(EVENTS.ELEMENT_QUICK_ADD, { parentId: elementId }),
    },
    {
      id: "layout",
      label: "Layout",
      icon: "⬚",
      action: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "layout", elementId }),
    },
    {
      id: "style",
      label: "Style",
      icon: "🎨",
      action: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "style", elementId }),
    },
  ];
}

function getTextSuggestions(composer: Composer, element: Element): Suggestion[] {
  const elementId = element.getId();

  return [
    {
      id: "edit-text",
      label: "Edit",
      icon: "✏",
      action: () => composer.emit(EVENTS.ELEMENT_EDIT_INLINE, { elementId }),
    },
    {
      id: "add-link",
      label: "Add link",
      icon: "🔗",
      action: () => composer.emit(EVENTS.ELEMENT_ADD_LINK, { elementId }),
    },
    {
      id: "typography",
      label: "Typography",
      icon: "Aa",
      action: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "typography", elementId }),
    },
  ];
}

function getImageSuggestions(composer: Composer, element: Element): Suggestion[] {
  const elementId = element.getId();

  return [
    {
      id: "change-image",
      label: "Change",
      icon: "🖼",
      action: () => composer.emit(EVENTS.ELEMENT_CHANGE_IMAGE, { elementId }),
    },
    {
      id: "add-alt",
      label: "Alt text",
      icon: "📝",
      action: () => composer.emit(EVENTS.ELEMENT_EDIT_ALT, { elementId }),
    },
    {
      id: "resize",
      label: "Resize",
      icon: "↔",
      action: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "size", elementId }),
    },
  ];
}

function getButtonSuggestions(composer: Composer, element: Element): Suggestion[] {
  const elementId = element.getId();

  return [
    {
      id: "edit-text",
      label: "Edit text",
      icon: "✏",
      action: () => composer.emit(EVENTS.ELEMENT_EDIT_INLINE, { elementId }),
    },
    {
      id: "add-link",
      label: "Link",
      icon: "🔗",
      action: () => composer.emit(EVENTS.ELEMENT_ADD_LINK, { elementId }),
    },
    {
      id: "style",
      label: "Style",
      icon: "🎨",
      action: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "style", elementId }),
    },
  ];
}

function getDefaultSuggestions(composer: Composer, element: Element): Suggestion[] {
  const elementId = element.getId();

  return [
    {
      id: "duplicate",
      label: "Duplicate",
      icon: "⧉",
      action: () => composer.elements.duplicateElement(elementId),
    },
    {
      id: "style",
      label: "Style",
      icon: "🎨",
      action: () => composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "style", elementId }),
    },
    {
      id: "delete",
      label: "Delete",
      icon: "🗑",
      action: () => {
        composer.elements.removeElement(elementId);
        composer.selection.select(null as never);
      },
    },
  ];
}

// =============================================================================
// COMPONENT
// =============================================================================

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  composer,
  element,
  elementRect,
  onSuggestionUsed,
  visible = true,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  // Reset dismissed state when element changes
  React.useEffect(() => {
    setDismissed(false);
  }, [element.getId()]);

  // Generate suggestions based on element type
  const suggestions = React.useMemo(() => {
    const type = String(element.getType?.() || "unknown");
    const children = element.getChildren?.() || [];
    const hasChildren = children.length > 0;

    // Container types
    if (["container", "section", "columns", "grid", "flex"].includes(type)) {
      return getContainerSuggestions(composer, element, hasChildren);
    }
    // Text types
    if (["text", "paragraph", "heading"].includes(type)) {
      return getTextSuggestions(composer, element);
    }
    // Image type
    if (type === "image") {
      return getImageSuggestions(composer, element);
    }
    // Button/link types
    if (["button", "link"].includes(type)) {
      return getButtonSuggestions(composer, element);
    }
    // Default for other types
    return getDefaultSuggestions(composer, element);
  }, [composer, element]);

  const handleSuggestionClick = React.useCallback(
    (suggestion: Suggestion) => {
      suggestion.action();
      onSuggestionUsed?.(suggestion.id);
    },
    [onSuggestionUsed]
  );

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible || dismissed || suggestions.length === 0) {
    return null;
  }

  // Position below the element, centered
  const barWidth = Math.min(suggestions.length * 90 + 40, 400);
  const left = elementRect.left + (elementRect.width - barWidth) / 2;
  const top = elementRect.bottom + 8;

  return (
    <div
      className="aqb-smart-suggestions"
      style={{
        position: "absolute",
        left: Math.max(8, left),
        top,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 8px",
        background: CANVAS_COLORS.bgPanel,
        border: `1px solid ${CANVAS_COLORS.border}`,
        borderRadius: SIZES.borderRadius.lg,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        zIndex: Z_LAYERS.contextMenu,
        pointerEvents: "auto",
        animation: "aqb-fade-in 0.15s ease-out",
      }}
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => handleSuggestionClick(suggestion)}
          title={suggestion.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "transparent",
            border: "none",
            borderRadius: SIZES.borderRadius.sm,
            color: CANVAS_COLORS.textPrimary,
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = CANVAS_COLORS.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: 14 }}>{suggestion.icon}</span>
          <span>{suggestion.label}</span>
        </button>
      ))}

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        title="Dismiss suggestions"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          marginLeft: 4,
          background: "transparent",
          border: "none",
          borderRadius: "50%",
          color: CANVAS_COLORS.textMuted,
          fontSize: 12,
          cursor: "pointer",
          transition: "background 0.1s, color 0.1s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = CANVAS_COLORS.bgHover;
          e.currentTarget.style.color = CANVAS_COLORS.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = CANVAS_COLORS.textMuted;
        }}
      >
        ×
      </button>
    </div>
  );
};

export default SmartSuggestions;
