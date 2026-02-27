/**
 * CSS Classes Section - Add/Remove CSS classes
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

// Common utility classes (Tailwind-like)
const COMMON_CLASSES = {
  Layout: ["container", "flex", "grid", "block", "inline", "hidden"],
  Spacing: ["p-4", "p-8", "m-4", "m-auto", "mx-auto", "my-4"],
  Typography: ["text-center", "text-left", "text-right", "font-bold", "text-sm", "text-lg"],
  Colors: ["bg-white", "bg-black", "bg-primary", "text-white", "text-black"],
  Effects: ["shadow", "shadow-lg", "rounded", "rounded-lg", "border"],
};

export const CSSClassesSection: React.FC<CSSClassesSectionProps> = ({
  selectedElement,
  composer,
}) => {
  const [classes, setClasses] = React.useState<string[]>([]);
  const [newClass, setNewClass] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Load classes when element changes
  React.useEffect(() => {
    if (!selectedElement?.id) {
      setClasses([]);
      return;
    }

    if (!composer) {
      setClasses([]);
      return;
    }

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) {
      setClasses([]);
      return;
    }

    const classList = el.getClasses ? el.getClasses() : [];
    setClasses(classList || []);
  }, [selectedElement, composer]);

  // Add class with duplication check
  const addClass = (className: string) => {
    if (!className.trim()) return;

    const normalized = className.trim();

    // L1 → L2 fix: Explicit duplicate check with warning
    if (classes.includes(normalized)) {
      devWarn("CSSClasses", `Class "${normalized}" already applied to element`, {
        elementId: selectedElement.id,
        currentClasses: classes,
      });
      return;
    }

    // Prefer engine element classes
    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "add-class", () => {
      el.addClass?.(normalized);
    });

    setClasses([...classes, normalized]);
    setNewClass("");
    setShowSuggestions(false);
  };

  // Remove class
  const removeClass = (className: string) => {
    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "remove-class", () => {
      el.removeClass?.(className);
    });

    setClasses(classes.filter((c) => c !== className));
  };

  // Filter suggestions based on input
  const getSuggestions = (): string[] => {
    if (!newClass) return [];
    const allClasses = Object.values(COMMON_CLASSES).flat();
    return allClasses
      .filter((c) => c.toLowerCase().includes(newClass.toLowerCase()) && !classes.includes(c))
      .slice(0, 8);
  };

  const suggestions = getSuggestions();

  return (
    <Section title="CSS Classes" icon="Tag" defaultOpen>
      {/* Current Classes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#52525b", marginBottom: 8 }}>Applied Classes</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <span
                key={cls}
                style={{
                  padding: "6px 10px",
                  background: "rgba(0,115,230,0.15)",
                  border: "1px solid rgba(0,115,230,0.3)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#0073E6",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                .{cls}
                <button
                  onClick={() => removeClass(cls)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#DC3545",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                    lineHeight: 1,
                    opacity: 0.7,
                  }}
                  title="Remove class"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span style={{ fontSize: 11, color: "#52525b", fontStyle: "italic" }}>
              No classes applied
            </span>
          )}
        </div>
      </div>

      {/* Add Class Input */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newClass}
            onChange={(e) => {
              setNewClass(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addClass(newClass);
              }
            }}
            placeholder="Add class..."
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "#e4e4e7",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button
            onClick={() => addClass(newClass)}
            style={{
              padding: "10px 16px",
              background: "#0073E6",
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

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 60,
              marginTop: 4,
              background: "#27272a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addClass(suggestion)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  color: "#e4e4e7",
                  fontSize: 11,
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,115,230,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                .{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Common Classes Quick Add */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: "#52525b", marginBottom: 8 }}>Quick Add</div>
        {Object.entries(COMMON_CLASSES).map(([category, classList]) => (
          <div key={category} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#71717a", marginBottom: 6 }}>{category}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {classList.map((cls) => (
                <button
                  key={cls}
                  onClick={() => addClass(cls)}
                  disabled={classes.includes(cls)}
                  style={{
                    padding: "4px 8px",
                    background: classes.includes(cls)
                      ? "rgba(0,115,230,0.2)"
                      : "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 4,
                    color: classes.includes(cls) ? "#0073E6" : "#71717a",
                    fontSize: 10,
                    cursor: classes.includes(cls) ? "default" : "pointer",
                    opacity: classes.includes(cls) ? 0.5 : 1,
                  }}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default CSSClassesSection;
