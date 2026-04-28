/**
 * Keyboard Shortcuts Panel
 * Full reference of all keyboard shortcuts — PRD §17.2
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { GROUPED_TABS_CONFIG } from "../rail/tabsConfig";
import { Stack } from "@/editor/shared/vibcoder";

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
        background: "var(--buildrick-surface-3)",
        border: "1px solid var(--buildrick-border)",
        borderRadius: "var(--buildrick-radius-sm)",
        fontSize: 11,
        fontFamily: "var(--buildrick-font-family-mono)",
        color: "var(--buildrick-text-primary)",
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
    <OverlayMount>
      <Modal open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Keyboard Shortcuts</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
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
                color: "var(--buildrick-text-muted)",
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: "1px solid var(--buildrick-border)",
                fontWeight: 600,
              }}
            >
              {group.label}
            </div>

            {/* Shortcut rows */}
            <Stack gap="sm">
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
                      color: "var(--buildrick-text-secondary)",
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
            </Stack>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "8px 12px",
          background: "var(--buildrick-bg-panel-secondary)",
          borderRadius: "var(--buildrick-radius-sm)",
          fontSize: 12,
          color: "var(--buildrick-text-muted)",
          textAlign: "center",
        }}
      >
        On Mac, use ⌘ Command instead of Ctrl
      </div>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};

export default KeyboardShortcutsPanel;
