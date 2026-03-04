/**
 * Aquibra Keyboard Shortcuts Panel
 * Displays all available keyboard shortcuts
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Modal } from "../../shared/ui";

interface ShortcutCategory {
  name: string;
  icon: string;
  shortcuts: {
    label: string;
    keys: string[];
  }[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: "General",
    icon: "⌨️",
    shortcuts: [
      { label: "Save Project", keys: ["Ctrl", "S"] },
      { label: "Undo", keys: ["Ctrl", "Z"] },
      { label: "Redo", keys: ["Ctrl", "Shift", "Z"] },
      { label: "Preview", keys: ["Ctrl", "P"] },
      { label: "Deselect", keys: ["Esc"] },
    ],
  },
  {
    name: "Edit",
    icon: "✏️",
    shortcuts: [
      { label: "Copy", keys: ["Ctrl", "C"] },
      { label: "Cut", keys: ["Ctrl", "X"] },
      { label: "Paste", keys: ["Ctrl", "V"] },
      { label: "Duplicate", keys: ["Ctrl", "D"] },
      { label: "Delete", keys: ["Delete"] },
      { label: "Select All", keys: ["Ctrl", "A"] },
    ],
  },
  {
    name: "View",
    icon: "👁️",
    shortcuts: [
      { label: "Zoom In", keys: ["Ctrl", "+"] },
      { label: "Zoom Out", keys: ["Ctrl", "-"] },
      { label: "Reset Zoom", keys: ["Ctrl", "0"] },
      { label: "Desktop View", keys: ["Ctrl", "1"] },
      { label: "Tablet View", keys: ["Ctrl", "2"] },
      { label: "Mobile View", keys: ["Ctrl", "3"] },
    ],
  },
  {
    name: "Panels",
    icon: "📋",
    shortcuts: [
      { label: "Open Templates", keys: ["Ctrl", "Shift", "T"] },
      { label: "Open Exporter", keys: ["Ctrl", "Shift", "E"] },
      { label: "Open AI Assistant", keys: ["Ctrl", "Shift", "A"] },
      { label: "Component View", keys: ["Ctrl", "Shift", "C"] },
    ],
  },
];

export interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardKey: React.FC<{ children: string }> = ({ children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 28,
      height: 26,
      padding: "0 8px",
      background: "var(--aqb-bg-panel-secondary)",
      border: "1px solid var(--aqb-border)",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "system-ui, sans-serif",
      color: "var(--aqb-text-primary)",
      boxShadow: "0 2px 0 var(--aqb-border)",
    }}
  >
    {children}
  </span>
);

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⌨️ Keyboard Shortcuts" size="md">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 24,
          maxHeight: "60vh",
          overflow: "auto",
          padding: "8px 0",
        }}
      >
        {shortcutCategories.map((category) => (
          <div key={category.name}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid var(--aqb-border)",
              }}
            >
              <span style={{ fontSize: 16 }}>{category.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--aqb-text-primary)",
                }}
              >
                {category.name}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {category.shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--aqb-text-secondary)",
                    }}
                  >
                    {shortcut.label}
                  </span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {shortcut.keys.map((key, keyIdx) => (
                      <React.Fragment key={keyIdx}>
                        <KeyboardKey>{key}</KeyboardKey>
                        {keyIdx < shortcut.keys.length - 1 && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--aqb-text-muted)",
                            }}
                          >
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "var(--aqb-bg-panel-secondary)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--aqb-text-muted)",
          textAlign: "center",
        }}
      >
        💡 Tip: On Mac, use ⌘ Command instead of Ctrl
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsPanel;
