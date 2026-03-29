/**
 * Keyboard Hints Section
 * Shows contextual keyboard shortcuts based on current selection
 * @license BSD-3-Clause
 */

import * as React from "react";

/** Selected element info (matches ProInspector's prop type) */
interface SelectedElementInfo {
  id: string;
  type: string;
  tagName?: string;
}

interface KeyboardHintsSectionProps {
  selectedElement: SelectedElementInfo | null;
}

interface Shortcut {
  label: string;
  keys: string[];
  visible?: (element: SelectedElementInfo | null) => boolean;
}

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
const cmdKey = isMac ? "⌘" : "Ctrl";

const TEXT_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "label",
  "button",
  "heading",
  "text",
];

const ALL_SHORTCUTS: Shortcut[] = [
  { label: "Delete", keys: ["⌫"] },
  { label: "Duplicate", keys: [cmdKey, "D"] },
  { label: "Copy", keys: [cmdKey, "C"] },
  { label: "Paste", keys: [cmdKey, "V"] },
  { label: "Cut", keys: [cmdKey, "X"] },
  { label: "Select Parent", keys: ["Alt", "↑"] },
  { label: "Undo", keys: [cmdKey, "Z"] },
  { label: "Redo", keys: [cmdKey, "Shift", "Z"] },
  {
    label: "Edit Text",
    keys: ["Double-click"],
    visible: (el) => {
      if (!el) return false;
      const tag = (el.tagName || el.type || "").toLowerCase();
      return TEXT_TAGS.includes(tag);
    },
  },
];

const KeyboardKey: React.FC<{ children: string }> = ({ children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 22,
      height: 20,
      padding: "0 6px",
      background: "rgba(255, 255, 255, 0.08)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "system-ui, sans-serif",
      color: "#cdd6f4",
      boxShadow: "0 1px 0 rgba(255, 255, 255, 0.1)",
    }}
  >
    {children}
  </span>
);

export const KeyboardHintsSection: React.FC<KeyboardHintsSectionProps> = ({ selectedElement }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Filter shortcuts based on element context
  const visibleShortcuts = React.useMemo(() => {
    return ALL_SHORTCUTS.filter((s) => !s.visible || s.visible(selectedElement));
  }, [selectedElement]);

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: "rgba(137, 180, 250, 0.08)",
          border: "1px solid rgba(137, 180, 250, 0.2)",
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "#89b4fa",
          }}
        >
          <span>⌨️</span>
          <span>Quick Actions</span>
        </span>
        <span style={{ color: "#6c7086", fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: "rgba(30, 30, 46, 0.5)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {visibleShortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
              }}
            >
              <span style={{ fontSize: 12, color: "#a6adc8" }}>{shortcut.label}</span>
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {shortcut.keys.map((key, keyIdx) => (
                  <React.Fragment key={keyIdx}>
                    <KeyboardKey>{key}</KeyboardKey>
                    {keyIdx < shortcut.keys.length - 1 && (
                      <span style={{ fontSize: 12, color: "#585b70" }}>+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeyboardHintsSection;
