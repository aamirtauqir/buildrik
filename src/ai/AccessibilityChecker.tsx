/**
 * Accessibility Checker
 * Check and report accessibility issues
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../engine";
import { Button, Badge } from "../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface AccessibilityCheckerProps {
  composer: Composer | null;
  onSelectElement?: (elementId: string) => void;
}

interface A11yIssue {
  id: string;
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  elementId?: string;
}

// ============================================================================
// CHECKER LOGIC
// ============================================================================

function checkAccessibility(composer: Composer | null): A11yIssue[] {
  const issues: A11yIssue[] = [];
  if (!composer) return issues;

  const page = composer.elements.getActivePage?.();
  if (!page) return issues;

  const rootElement = composer.elements.getElement(page.root.id);
  if (!rootElement) return issues;

  const headingLevels: number[] = [];

  // Traverse element tree recursively
  const traverse = (el: typeof rootElement) => {
    const id = el.getId?.() || "";
    const type = el.getType?.() || "";
    const attrs = el.getAttributes?.() || {};
    const content = el.getContent?.() || "";
    const styles = el.getStyles?.() || {};

    // Check: Missing alt text on images
    if (type === "image" && !attrs.alt) {
      issues.push({
        id: `alt-${id}`,
        severity: "error",
        rule: "img-alt",
        message: "Image is missing alt text",
        elementId: id,
      });
    }

    // Check: Empty alt (decorative image should have alt="")
    if (type === "image" && attrs.alt === "") {
      issues.push({
        id: `alt-empty-${id}`,
        severity: "info",
        rule: "img-alt-empty",
        message: "Empty alt text - ensure this image is decorative",
        elementId: id,
      });
    }

    // Check: Empty buttons/links
    if ((type === "button" || type === "link") && !content.trim()) {
      issues.push({
        id: `empty-interactive-${id}`,
        severity: "error",
        rule: "button-name",
        message: `${type === "button" ? "Button" : "Link"} has no accessible name`,
        elementId: id,
      });
    }

    // Check: Heading hierarchy
    if (type === "heading") {
      const level = parseInt(attrs["data-level"] || "1", 10);
      headingLevels.push(level);
    }

    // Check: Color contrast
    if (type === "text" || type === "paragraph" || type === "heading") {
      const color = styles.color || "#000000";
      const bg = styles.backgroundColor || "#ffffff";
      const ratio = calculateContrastRatio(color, bg);

      if (ratio < 4.5) {
        issues.push({
          id: `contrast-${id}`,
          severity: ratio < 3 ? "error" : "warning",
          rule: "color-contrast",
          message: `Low contrast ratio: ${ratio.toFixed(1)}:1 (min 4.5:1)`,
          elementId: id,
        });
      }
    }

    // Check: Small font size
    const fontSize = parseFloat(styles.fontSize || "16");
    if (fontSize > 0 && fontSize < 12) {
      issues.push({
        id: `font-size-${id}`,
        severity: "warning",
        rule: "font-size",
        message: "Font size may be too small for readability",
        elementId: id,
      });
    }

    // Traverse children
    const children = el.getChildren?.() || [];
    for (const child of children) {
      traverse(child);
    }
  };

  traverse(rootElement);

  // Check: Heading order
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      issues.push({
        id: `heading-order-${i}`,
        severity: "warning",
        rule: "heading-order",
        message: `Heading level skipped: h${headingLevels[i - 1]} to h${headingLevels[i]}`,
      });
    }
  }

  // Check: No h1
  if (headingLevels.length > 0 && !headingLevels.includes(1)) {
    issues.push({
      id: "no-h1",
      severity: "warning",
      rule: "page-has-h1",
      message: "Page should have an h1 heading",
    });
  }

  return issues;
}

function calculateContrastRatio(fg: string, bg: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace("#", "");
    const r = parseInt(rgb.slice(0, 2), 16) / 255;
    const g = parseInt(rgb.slice(2, 4), 16) / 255;
    const b = parseInt(rgb.slice(4, 6), 16) / 255;

    const sRGB = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({
  composer,
  onSelectElement,
}) => {
  const [issues, setIssues] = React.useState<A11yIssue[]>([]);
  const [checked, setChecked] = React.useState(false);

  const runCheck = React.useCallback(() => {
    const results = checkAccessibility(composer);
    setIssues(results);
    setChecked(true);
  }, [composer]);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const severityColors = {
    error: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", icon: "🔴" },
    warning: { bg: "rgba(234, 179, 8, 0.1)", border: "#eab308", icon: "🟡" },
    info: { bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6", icon: "🔵" },
  };

  if (!checked) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>♿</div>
        <div style={{ marginBottom: 16, color: "var(--aqb-text-muted)" }}>
          Check your design for accessibility issues including missing alt text, color contrast, and
          heading structure.
        </div>
        <Button onClick={runCheck}>🔍 Run Accessibility Check</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Summary */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          padding: 12,
          background: "var(--aqb-bg-panel-secondary)",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>{errorCount}</div>
          <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>Errors</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#eab308" }}>{warningCount}</div>
          <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>Warnings</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>{infoCount}</div>
          <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>Info</div>
        </div>
      </div>

      <Button
        size="sm"
        variant="secondary"
        onClick={runCheck}
        style={{ marginBottom: 16, width: "100%" }}
      >
        🔄 Re-check
      </Button>

      {/* Issues List */}
      {issues.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            background: "rgba(34, 197, 94, 0.1)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ color: "#22c55e", fontWeight: 500 }}>No accessibility issues found!</div>
        </div>
      ) : (
        <div>
          {issues.map((issue) => {
            const colors = severityColors[issue.severity];
            return (
              <div
                key={issue.id}
                onClick={() => issue.elementId && onSelectElement?.(issue.elementId)}
                style={{
                  padding: 12,
                  background: colors.bg,
                  borderLeft: `3px solid ${colors.border}`,
                  borderRadius: 4,
                  marginBottom: 8,
                  cursor: issue.elementId ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{colors.icon}</span>
                  <Badge variant="default" size="sm">
                    {issue.rule}
                  </Badge>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "var(--aqb-text)",
                  }}
                >
                  {issue.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccessibilityChecker;
