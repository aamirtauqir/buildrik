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
  const [addingInline, setAddingInline] = React.useState(false);
  const inlineInputRef = React.useRef<HTMLInputElement>(null);

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

  const startInlineAdd = () => {
    setAddingInline(true);
    setShowSuggestions(true);
    requestAnimationFrame(() => inlineInputRef.current?.focus());
  };

  const cancelInlineAdd = () => {
    setNewClass("");
    setAddingInline(false);
    setShowSuggestions(false);
  };

  return (
    <Section title="Classes" icon="Tag" defaultOpen isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-css-classes">
      <div className="bdi-chips" style={{ position: "relative" }}>
        {classes.map((cls, i) => (
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
        ))}

        {addingInline ? (
          <span className="bdi-chip bdi-chip-input" role="presentation">
            <span aria-hidden="true" style={{ opacity: 0.5 }}>.</span>
            <input
              ref={inlineInputRef}
              type="text"
              value={newClass}
              onChange={(e) => {
                setNewClass(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => {
                if (newClass.trim()) addClass(newClass);
                else cancelInlineAdd();
              }, 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addClass(newClass);
                  setAddingInline(false);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelInlineAdd();
                }
              }}
              placeholder="class-name"
              aria-label="Add CSS class"
            />
          </span>
        ) : (
          <button
            type="button"
            className="bdi-chip bdi-chip-add"
            onClick={startInlineAdd}
            aria-label="Add class"
            title="Add class"
          >
            +
          </button>
        )}

        {addingInline && showSuggestions && suggestions.length > 0 && (
          <div
            role="listbox"
            aria-label="Class suggestions"
            className="bdi-chip-suggest"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  addClass(suggestion);
                  setAddingInline(false);
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
