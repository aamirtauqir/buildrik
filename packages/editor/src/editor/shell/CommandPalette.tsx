/**
 * CommandPalette — ⌘K overlay
 * Matches design spec: search input, action groups (Navigation/Edit/Save),
 * keyboard shortcuts, ↑↓ navigation, Enter to run, Esc to close.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

interface Action {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  icon?: React.ReactNode;
  onRun?: () => void;
}

const ACTIONS: Action[] = [
  // Navigation
  { id: "dashboard", label: "Go to Dashboard", group: "NAVIGATION", shortcut: "G D" },
  { id: "project-settings", label: "Open Project Settings", group: "NAVIGATION", shortcut: "⌘," },
  { id: "search-files", label: "Search Files", group: "NAVIGATION", shortcut: "⌘P" },
  // Edit
  { id: "rename", label: "Rename Symbol", group: "EDIT", shortcut: "R" },
  { id: "duplicate", label: "Duplicate Line", group: "EDIT", shortcut: "⌘D" },
  // Save / View
  { id: "toggle-sidebar", label: "Toggle Sidebar", group: "SAVE", shortcut: "⌘B" },
  { id: "toggle-preview", label: "Toggle Preview", group: "SAVE", shortcut: "⌘⇧P" },
];

const GROUP_ORDER = ["NAVIGATION", "EDIT", "SAVE"];

interface CommandPaletteProps {
  onClose: () => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconSearch: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bd-fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconArrow: React.FC<{ dir: "right" | "up-right" }> = ({ dir }) => (
  dir === "right" ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  )
);

// ─── Component ────────────────────────────────────────────────────────────────

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter actions
  const filtered = query.trim()
    ? ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : ACTIONS;

  // Reset active index on filter change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[activeIndex];
        if (action?.onRun) action.onRun();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [filtered, activeIndex, onClose]);

  // Group filtered actions
  const grouped = GROUP_ORDER.reduce<Record<string, Action[]>>((acc, g) => {
    const items = filtered.filter((a) => a.group === g);
    if (items.length) acc[g] = items;
    return acc;
  }, {});

  // Track flat index for keyboard highlight
  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          zIndex: 20000,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 120,
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          maxHeight: 400,
          background: "var(--buildrick-bg-card)",
          border: "1px solid var(--bd-border)",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          zIndex: 20001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid var(--bd-bg-subtle)",
          }}
        >
          <IconSearch />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "var(--buildrick-text-primary)",
              background: "transparent",
              fontFamily: "inherit",
            }}
          />
          <kbd
            style={{
              padding: "2px 6px",
              background: "var(--buildrick-bg-subtle)",
              border: "1px solid var(--bd-border)",
              borderRadius: 4,
              fontSize: 11,
              color: "var(--buildrick-text-muted)",
              fontFamily: "inherit",
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          style={{ flex: 1, overflowY: "auto" }}
          role="listbox"
          aria-label="Command results"
        >
          {filtered.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--buildrick-text-tertiary)", fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--buildrick-text-tertiary)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
                aria-hidden="true"
              >
                {group}
              </div>
              {items.map((action) => {
                const isActive = flatIndex === activeIndex;
                const currentIndex = flatIndex++;
                return (
                  <button
                    key={action.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => { action.onRun?.(); onClose(); }}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 16px",
                      background: isActive ? "#EFF6FF" : "transparent",
                      border: "none",
                      color: isActive ? "#1D4ED8" : "var(--bd-fg-primary)",
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "background 0.08s ease, color 0.08s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: isActive ? "#2563EB" : "var(--bd-fg-muted)", flexShrink: 0 }}>
                        <IconArrow dir="right" />
                      </span>
                      <span>{action.label}</span>
                    </div>
                    {action.shortcut && (
                      <kbd
                        style={{
                          padding: "2px 6px",
                          background: isActive ? "#DBEAFE" : "var(--bd-bg-panel)",
                          border: `1px solid ${isActive ? "#BFDBFE" : "var(--bd-border)"}`,
                          borderRadius: 4,
                          fontSize: 10,
                          color: isActive ? "#1D4ED8" : "var(--bd-fg-secondary)",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "8px 16px",
            borderTop: "1px solid var(--bd-bg-subtle)",
          }}
          aria-hidden="true"
        >
          {[
            { key: "↑↓", label: "navigate" },
            { key: "↵", label: "run" },
            { key: "Esc", label: "close" },
          ].map(({ key, label }) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--buildrick-text-tertiary)" }}>
              <kbd
                style={{
                  padding: "1px 5px",
                  background: "var(--buildrick-bg-panel)",
                  border: "1px solid var(--bd-border)",
                  borderRadius: 3,
                  fontSize: 10,
                  color: "var(--buildrick-text-muted)",
                  fontFamily: "inherit",
                }}
              >
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
