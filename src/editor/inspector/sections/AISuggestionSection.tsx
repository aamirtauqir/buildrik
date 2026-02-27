/**
 * AISuggestionSection - Contextual AI suggestions at bottom of Inspector
 * Part of IA Redesign 2026 - AI moved from standalone tab to Inspector bottom
 *
 * Features:
 * - Context-aware suggestions based on element type
 * - One-click actions to apply suggestions
 * - Dismiss button to hide suggestions
 * - Only shows when AI has high-confidence suggestions
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";

// ============================================
// Types
// ============================================

export interface AISuggestionSectionProps {
  /** The Composer engine instance */
  composer: Composer | null;
  /** Currently selected element */
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;
  /** Callback when AI suggestion should be applied */
  onApplySuggestion?: (suggestionId: string, action: string) => void;
}

interface Suggestion {
  id: string;
  message: string;
  action: string;
  actionLabel: string;
  confidence: number; // 0-1
}

// ============================================
// Component
// ============================================

export const AISuggestionSection: React.FC<AISuggestionSectionProps> = ({
  composer,
  selectedElement,
  onApplySuggestion,
}) => {
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Generate context-aware suggestions based on element type
  const suggestions = React.useMemo<Suggestion[]>(() => {
    if (!selectedElement || !composer) return [];

    const element = composer.elements.getElement(selectedElement.id);
    if (!element) return [];

    const type = selectedElement.type.toLowerCase();
    const suggestions: Suggestion[] = [];

    // Button suggestions - always suggest hover for buttons
    // (checking actual styles would require Composer's StyleEngine)
    if (type === "button" || selectedElement.tagName?.toLowerCase() === "button") {
      suggestions.push({
        id: "add-hover-state",
        message: "Add hover effect for better interactivity",
        action: "add-hover",
        actionLabel: "Add Hover",
        confidence: 0.85,
      });
    }

    // Image suggestions
    if (type === "image" || selectedElement.tagName?.toLowerCase() === "img") {
      const hasAlt = element.getAttribute?.("alt");
      if (!hasAlt) {
        suggestions.push({
          id: "add-alt-text",
          message: "Add alt text for accessibility",
          action: "add-alt",
          actionLabel: "Add Alt",
          confidence: 0.95,
        });
      }
    }

    // Container suggestions
    if (["container", "section", "div"].includes(type)) {
      const display = element.getStyle?.("display");
      if (!display || display === "block") {
        suggestions.push({
          id: "convert-to-flex",
          message: "Convert to Flexbox for easier layout",
          action: "convert-flex",
          actionLabel: "Make Flex",
          confidence: 0.75,
        });
      }
    }

    // Form input suggestions
    if (
      ["input", "textarea", "select"].includes(type) ||
      ["input", "textarea", "select"].includes(selectedElement.tagName?.toLowerCase() || "")
    ) {
      const hasLabel =
        element.getAttribute?.("aria-label") || element.getAttribute?.("aria-labelledby");
      if (!hasLabel) {
        suggestions.push({
          id: "add-aria-label",
          message: "Add label for screen readers",
          action: "add-label",
          actionLabel: "Add Label",
          confidence: 0.85,
        });
      }
    }

    // Text suggestions - suggest readability tips for text elements
    // (actual text length check would require DOM access)
    if (["text", "heading", "paragraph", "p", "h1", "h2", "h3"].includes(type)) {
      suggestions.push({
        id: "improve-readability",
        message: "Check text for readability and formatting",
        action: "suggest-break",
        actionLabel: "View Tips",
        confidence: 0.65,
      });
    }

    // Filter by confidence threshold (only show high-confidence suggestions)
    return suggestions.filter((s) => s.confidence >= 0.7);
  }, [composer, selectedElement]);

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  // Handle dismiss
  const handleDismiss = React.useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  // Handle apply action
  const handleApply = React.useCallback(
    (suggestion: Suggestion) => {
      if (onApplySuggestion) {
        onApplySuggestion(suggestion.id, suggestion.action);
      }
      // Auto-dismiss after applying
      handleDismiss(suggestion.id);
    },
    [onApplySuggestion, handleDismiss]
  );

  // Don't render if no suggestions
  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div style={containerStyles}>
      {/* Section Header */}
      <button
        style={headerStyles}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
      >
        <span style={iconStyles}>💡</span>
        <span style={titleStyles}>AI Suggestions</span>
        <span style={badgeStyles}>{visibleSuggestions.length}</span>
        <span style={chevronStyles}>{isCollapsed ? "▸" : "▾"}</span>
      </button>

      {/* Suggestions List */}
      {!isCollapsed && (
        <div style={listStyles}>
          {visibleSuggestions.map((suggestion) => (
            <div key={suggestion.id} style={suggestionStyles}>
              <p style={messageStyles}>{suggestion.message}</p>
              <div style={actionsStyles}>
                <button style={applyBtnStyles} onClick={() => handleApply(suggestion)}>
                  {suggestion.actionLabel}
                </button>
                <button
                  style={dismissBtnStyles}
                  onClick={() => handleDismiss(suggestion.id)}
                  aria-label="Dismiss suggestion"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  marginTop: "var(--aqb-space-4)",
  borderTop: "1px solid var(--aqb-border)",
};

const headerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--aqb-space-2)",
  width: "100%",
  padding: "var(--aqb-space-3)",
  background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.08) 100%)",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
};

const iconStyles: React.CSSProperties = {
  fontSize: "14px",
};

const titleStyles: React.CSSProperties = {
  flex: 1,
  fontSize: "var(--aqb-font-sm)",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const badgeStyles: React.CSSProperties = {
  padding: "2px 6px",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--aqb-accent-purple)",
  background: "rgba(139,92,246,0.15)",
  borderRadius: "var(--aqb-radius-sm)",
};

const chevronStyles: React.CSSProperties = {
  color: "var(--aqb-text-muted)",
  fontSize: "10px",
};

const listStyles: React.CSSProperties = {
  padding: "var(--aqb-space-2)",
};

const suggestionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--aqb-space-2)",
  padding: "var(--aqb-space-3)",
  background: "var(--aqb-surface-2)",
  borderRadius: "var(--aqb-radius-md)",
  borderLeft: "3px solid var(--aqb-accent-purple)",
  marginBottom: "var(--aqb-space-2)",
};

const messageStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--aqb-font-sm)",
  color: "var(--aqb-text-secondary)",
  lineHeight: 1.4,
};

const actionsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--aqb-space-2)",
};

const applyBtnStyles: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: 500,
  color: "white",
  background: "var(--aqb-accent-purple)",
  border: "none",
  borderRadius: "var(--aqb-radius-sm)",
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const dismissBtnStyles: React.CSSProperties = {
  padding: "4px 6px",
  fontSize: "10px",
  color: "var(--aqb-text-muted)",
  background: "transparent",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-sm)",
  cursor: "pointer",
};

export default AISuggestionSection;
