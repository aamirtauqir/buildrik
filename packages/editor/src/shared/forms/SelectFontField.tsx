/**
 * Aquibra Font Selector Field
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface FontOption {
  family: string;
  category: "serif" | "sans-serif" | "monospace" | "display" | "handwriting";
  variants?: string[];
  url?: string;
}

export interface SelectFontFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  fonts?: FontOption[];
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
}

const defaultFonts: FontOption[] = [
  { family: "Inter", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Georgia", category: "serif" },
  { family: "Times New Roman", category: "serif" },
  { family: "Fira Code", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace" },
  { family: "Monaco", category: "monospace" },
  { family: "Courier New", category: "monospace" },
  { family: "Pacifico", category: "handwriting" },
  { family: "Dancing Script", category: "handwriting" },
  { family: "Oswald", category: "display" },
  { family: "Bebas Neue", category: "display" },
];

const categoryIcons: Record<string, string> = {
  serif: "📜",
  "sans-serif": "🔤",
  monospace: "💻",
  display: "🎨",
  handwriting: "✍️",
};

export const SelectFontField: React.FC<SelectFontFieldProps> = ({
  label,
  value,
  onChange,
  fonts = defaultFonts,
  showPreview = true,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const categories = [...new Set(fonts.map((f) => f.category))];

  const filteredFonts = fonts.filter((font) => {
    const matchesSearch = font.family.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || font.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Selected font available for future preview feature
  // const selectedFont = fonts.find((f) => f.family === value);

  return (
    <div className={`aqb-select-font-field ${className || ""}`} style={{ position: "relative" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 6,
            color: "var(--aqb-text-secondary)",
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "var(--aqb-bg-input)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 6,
          color: "var(--aqb-text-primary)",
          fontSize: 13,
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: showPreview ? value : "inherit" }}>
          {value || "Select font..."}
        </span>
        <span style={{ opacity: 0.5 }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--aqb-bg-panel)",
            border: "1px solid var(--aqb-border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div style={{ padding: 8, borderBottom: "1px solid var(--aqb-border)" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fonts..."
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "var(--aqb-bg-input)",
                border: "1px solid var(--aqb-border)",
                borderRadius: 4,
                color: "var(--aqb-text-primary)",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>

          {/* Categories */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 8,
              borderBottom: "1px solid var(--aqb-border)",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                padding: "4px 8px",
                background: !activeCategory
                  ? "var(--aqb-primary)"
                  : "var(--aqb-bg-panel-secondary)",
                border: "none",
                borderRadius: 4,
                color: !activeCategory ? "#fff" : "var(--aqb-text-muted)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "4px 8px",
                  background:
                    activeCategory === cat ? "var(--aqb-primary)" : "var(--aqb-bg-panel-secondary)",
                  border: "none",
                  borderRadius: 4,
                  color: activeCategory === cat ? "#fff" : "var(--aqb-text-muted)",
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {categoryIcons[cat]} {cat}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div style={{ maxHeight: 240, overflow: "auto" }}>
            {filteredFonts.map((font) => (
              <div
                key={font.family}
                onClick={() => {
                  onChange(font.family);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  background: value === font.family ? "var(--aqb-bg-hover)" : "transparent",
                }}
              >
                <span
                  style={{
                    fontFamily: showPreview ? font.family : "inherit",
                    fontSize: 14,
                  }}
                >
                  {font.family}
                </span>
                <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
                  {categoryIcons[font.category]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SelectFontField;
