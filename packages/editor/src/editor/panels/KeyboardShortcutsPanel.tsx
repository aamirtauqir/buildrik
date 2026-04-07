/**
 * Keyboard Shortcuts Panel
 * Full reference of all keyboard shortcuts — PRD §17.2
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Modal } from "../../shared/ui";
import { GROUPED_TABS_CONFIG } from "../rail/tabsConfig";

// =============================================================================
// SHORTCUT DATA
// =============================================================================

interface ShortcutRow {
  key: string;
  desc: string;
}

interface ShortcutGroup {
  label: string;
  shortcuts: ShortcutRow[];
}

const PANEL_SHORTCUTS: ShortcutRow[] = GROUPED_TABS_CONFIG
  .filter((t) => Boolean(t.shortcut))
  .map((t) => ({ key: t.shortcut!, desc: `Open ${t.label} panel` }));

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Panels",
    shortcuts: PANEL_SHORTCUTS,
  },
  {
    label: "Edit",
    shortcuts: [
      { key: "Ctrl+Z", desc: "Undo" },
      { key: "Ctrl+Y", desc: "Redo" },
      { key: "Ctrl+C", desc: "Copy" },
      { key: "Ctrl+V", desc: "Paste" },
      { key: "Del", desc: "Delete element" },
      { key: "Ctrl+D", desc: "Duplicate" },
    ],
  },
  {
    label: "View",
    shortcuts: [
      { key: "Ctrl+P", desc: "Preview" },
      { key: "Ctrl+K", desc: "Command palette" },
      { key: "?", desc: "Keyboard shortcuts" },
      { key: "Ctrl+0", desc: "Fit to view" },
      { key: "Ctrl++", desc: "Zoom in" },
      { key: "Ctrl+-", desc: "Zoom out" },
    ],
  },
];

// =============================================================================
// KEY BADGE
// =============================================================================

const KeyBadge: React.FC<{ children: string }> = ({ children }) => {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const display = children
    .replace(/Ctrl/g, isMac ? "⌘" : "Ctrl")
    .replace(/Shift/g, isMac ? "⇧" : "Shift")
    .replace(/Alt/g, isMac ? "⌥" : "Alt");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        background: "var(--aqb-surface-3)",
        border: "1px solid var(--aqb-border)",
        borderRadius: "var(--aqb-radius-sm)",
        fontSize: 11,
        fontFamily: "var(--aqb-font-mono, monospace)",
        color: "var(--aqb-text-primary)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {display}
    </span>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

export interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          maxHeight: "60vh",
          overflowY: "auto",
          padding: "8px 0",
        }}
      >
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Group heading */}
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--aqb-text-muted)",
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: "1px solid var(--aqb-border)",
                fontWeight: 600,
              }}
            >
              {group.label}
            </div>

            {/* Shortcut rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {group.shortcuts.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "3px 0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--aqb-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                  >
                    {row.desc}
                  </span>
                  <KeyBadge>{row.key}</KeyBadge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "8px 12px",
          background: "var(--aqb-bg-panel-secondary)",
          borderRadius: "var(--aqb-radius-sm)",
          fontSize: 12,
          color: "var(--aqb-text-muted)",
          textAlign: "center",
        }}
      >
        On Mac, use ⌘ Command instead of Ctrl
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsPanel;
