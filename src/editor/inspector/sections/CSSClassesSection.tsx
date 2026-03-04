/**
 * CSS Classes Section - Add/Remove CSS classes
 * SSOT: reads classes from composer.elements.getElement().getClasses() on each render.
 * No cached useState — always reflects live state.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { devWarn } from "../../../shared/utils/devLogger";
import { runTransaction } from "../../../shared/utils/helpers";
import { Section } from "../shared/Controls";

interface CSSClassesSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer?: Composer | null;
}

export const CSSClassesSection: React.FC<CSSClassesSectionProps> = ({
  selectedElement,
  composer,
}) => {
  const [newClass, setNewClass] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // SSOT: read directly from composer on every render (ARCH-05 / H-07 fix)
  const classes = React.useMemo<string[]>(() => {
    if (!composer || !selectedElement?.id) return [];
    const el = composer.elements.getElement(selectedElement.id);
    return el?.getClasses?.() ?? [];
  }, [composer, selectedElement?.id]);

  // Global class suggestions from project stylesheet (H-06 / L-05 fix: no Tailwind)
  const globalClasses = React.useMemo<string[]>(() => {
    const global = (
      composer?.styles as { getGlobalClasses?: () => string[] } | null
    )?.getGlobalClasses?.();
    return global ?? [];
  }, [composer]);

  const addClass = (className: string) => {
    const normalized = className.trim();
    if (!normalized) return;

    if (classes.includes(normalized)) {
      devWarn("CSSClasses", `Class "${normalized}" already applied`, {
        elementId: selectedElement.id,
      });
      return;
    }

    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "add-class", () => {
      el.addClass?.(normalized);
    });

    setNewClass("");
    setShowSuggestions(false);
  };

  const removeClass = (className: string) => {
    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "remove-class", () => {
      el.removeClass?.(className);
    });
  };

  const suggestions = React.useMemo(() => {
    if (!newClass) return [];
    return globalClasses
      .filter((c) => c.toLowerCase().includes(newClass.toLowerCase()) && !classes.includes(c))
      .slice(0, 8);
  }, [newClass, globalClasses, classes]);

  return (
    <Section title="CSS Classes" icon="Tag" defaultOpen id="inspector-section-css-classes">
      {/* Applied Classes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--aqb-text-tertiary)", marginBottom: 8 }}>
          Applied Classes
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <span
                key={cls}
                style={{
                  padding: "6px 10px",
                  background: "rgba(0,115,230,0.15)",
                  border: "1px solid rgba(0,115,230,0.3)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#0073E6",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                .{cls}
                <button
                  type="button"
                  onClick={() => removeClass(cls)}
                  aria-label={`Remove class ${cls}`}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--aqb-error)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--aqb-text-tertiary)", fontStyle: "italic" }}>
              No classes applied yet
            </span>
          )}
        </div>
      </div>

      {/* Add Class Input */}
      <div style={{ position: "relative" as const }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newClass}
            onChange={(e) => {
              setNewClass(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addClass(newClass);
              }
              // M-08 fix: Tab should NOT submit — just move focus
              if (e.key === "Tab") {
                setShowSuggestions(false);
                // default Tab behavior (focus moves to next element) is preserved
              }
            }}
            placeholder="Add class name…"
            aria-label="Add CSS class"
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "var(--aqb-text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => addClass(newClass)}
            aria-label="Add class"
            style={{
              padding: "10px 16px",
              background: "var(--aqb-primary)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        {/* Global class autocomplete (H-06 fix) */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            role="listbox"
            aria-label="Class suggestions"
            style={{
              position: "absolute" as const,
              top: "100%",
              left: 0,
              right: 60,
              marginTop: 4,
              background: "var(--aqb-surface-3)",
              border: "1px solid var(--aqb-border)",
              borderRadius: 6,
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => addClass(suggestion)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--aqb-border-subtle)",
                  color: "var(--aqb-text-primary)",
                  fontSize: 12,
                  textAlign: "left" as const,
                  cursor: "pointer",
                }}
              >
                .{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};

export default CSSClassesSection;
