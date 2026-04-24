/**
 * CSS Classes Section - Add/Remove CSS classes
 * SSOT: reads classes from composer.elements.getElement().getClasses() on each render.
 * No cached useState — always reflects live state.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { InputField } from "../../../shared/forms/InputField";
import { devWarn } from "../../../shared/utils/devLogger";
import { runTransaction } from "../../../shared/utils/helpers";
import { Section, type SectionTier } from "../shared/controls";

export interface CSSClassesSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer?: Composer | null;
  /** Controlled open state for the section wrapper. */
  isOpen?: boolean;
  /** Called when the section header is toggled. */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
}

export const CSSClassesSection: React.FC<CSSClassesSectionProps> = ({
  selectedElement,
  composer,
  isOpen,
  onToggle,
  tier = "secondary",
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
    <Section title="CSS Classes" icon="Tag" defaultOpen isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-css-classes">
      {/* Applied Classes */}
      <div className="bdi-chips" style={{ marginBottom: 6 }}>
        {classes.length > 0 ? (
          classes.map((cls, i) => (
            <span key={cls} className={`bdi-chip${i === 0 ? " pri" : ""}`}>
              .{cls}
              <button
                type="button"
                className="bdi-chip-x"
                onClick={() => removeClass(cls)}
                aria-label={`Remove class ${cls}`}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span
            style={{
              font: "500 10px var(--bd-font)",
              color: "var(--bd-fg-muted)",
              fontStyle: "italic",
            }}
          >
            No classes — add one below
          </span>
        )}
      </div>

      {/* Add Class Input */}
      <div style={{ position: "relative" as const }}>
        <div style={{ display: "flex", gap: 8 }}>
          <InputField
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
              if (e.key === "Tab") {
                setShowSuggestions(false);
              }
            }}
            placeholder="Add class name…"
            aria-label="Add CSS class"
          />
          <button
            type="button"
            onClick={() => addClass(newClass)}
            aria-label="Add class"
            style={{
              padding: "10px 16px",
              background: "var(--buildrick-accent)",
              border: "none",
              borderRadius: 6,
              color: "var(--buildrick-text-on-accent)",
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
              background: "var(--buildrick-surface-3)",
              border: "1px solid var(--buildrick-border)",
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
                  borderBottom: "1px solid var(--buildrick-border-subtle)",
                  color: "var(--buildrick-text-primary)",
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
