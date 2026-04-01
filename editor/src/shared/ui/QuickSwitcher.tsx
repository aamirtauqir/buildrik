/**
 * QuickSwitcher - Phase 3 UX Global Search & Navigation
 *
 * Extended from CommandPalette.tsx to become a unified Quick Switcher (Cmd+K).
 * Provides global search across:
 * - Recent items (files, pages, elements)
 * - Pages (navigate to any page)
 * - Elements (insert into canvas)
 * - Templates (apply template)
 * - Commands (all editor actions)
 *
 * Features:
 * - Cmd+K keyboard shortcut
 * - Fuzzy search with highlighting
 * - Section-based organization
 * - Keyboard navigation
 * - Recent items persistence
 *
 * @module components/ui/QuickSwitcher
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  STORAGE_KEY,
  MAX_RECENT,
  SECTIONS,
  backdropStyles,
  containerStyles,
  inputContainerStyles,
  inputStyles,
  listStyles,
  sectionHeaderStyles,
  itemStyles,
  itemSelectedStyles,
  itemLeftStyles,
  iconStyles,
  textContainerStyles,
  labelStyles,
  subtitleStyles,
  shortcutStyles,
  footerStyles,
  emptyStyles,
  hintKeyStyles,
} from "./QuickSwitcher.styles";
import type {
  QuickSwitcherItem,
  QuickSwitcherItemType,
  QuickSwitcherProps,
} from "./QuickSwitcher.types";
import { getItemScore } from "./useQuickSwitcher";
// Re-export types for backward compatibility
export type {
  QuickSwitcherItemType,
  QuickSwitcherItem,
  QuickSwitcherProps,
  UseQuickSwitcherResult,
} from "./QuickSwitcher.types";
// Re-export hook for backward compatibility
export { useQuickSwitcher } from "./useQuickSwitcher";

// ============================================
// Component: ShortcutBadge
// ============================================

const ShortcutBadge: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const display = shortcut
    .replace(/Cmd/g, isMac ? "\u2318" : "Ctrl")
    .replace(/Alt/g, isMac ? "\u2325" : "Alt")
    .replace(/Shift/g, isMac ? "\u21E7" : "Shift")
    .replace(/Del/g, isMac ? "\u232B" : "Del")
    .replace(/\+/g, " ");

  return <span style={shortcutStyles}>{display}</span>;
};

// ============================================
// Component: QuickSwitcher
// ============================================

export const QuickSwitcher: React.FC<QuickSwitcherProps> = ({
  isOpen,
  onClose,
  items,
  placeholder = "Search pages, elements, commands...",
}) => {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load recent items from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setRecentIds(JSON.parse(stored));
        } catch {
          setRecentIds([]);
        }
      }
    }
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter and organize items
  const { filteredItems, flatItems } = React.useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();

    // If no query, show recent items first
    if (!lowerQuery) {
      const recentItems = recentIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is QuickSwitcherItem => !!item)
        .map((item) => ({ ...item, type: "recent" as const }));

      const otherItems = items.filter((item) => !recentIds.includes(item.id));

      // Group by type
      const grouped: Record<QuickSwitcherItemType, QuickSwitcherItem[]> = {
        recent: recentItems.slice(0, 5),
        page: otherItems.filter((i) => i.type === "page").slice(0, 5),
        element: otherItems.filter((i) => i.type === "element").slice(0, 5),
        template: otherItems.filter((i) => i.type === "template").slice(0, 5),
        command: otherItems.filter((i) => i.type === "command").slice(0, 5),
      };

      const flat = [
        ...grouped.recent,
        ...grouped.page,
        ...grouped.element,
        ...grouped.template,
        ...grouped.command,
      ];

      return { filteredItems: grouped, flatItems: flat };
    }

    // Search mode: score all items and sort by relevance
    const scored = items
      .map((item) => ({ item, score: getItemScore(item, lowerQuery) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    // Group by type for display
    const grouped: Record<QuickSwitcherItemType, QuickSwitcherItem[]> = {
      recent: [],
      page: [],
      element: [],
      template: [],
      command: [],
    };

    for (const { item } of scored) {
      grouped[item.type].push(item);
    }

    const flat = scored.map(({ item }) => item);

    return { filteredItems: grouped, flatItems: flat };
  }, [items, query, recentIds]);

  // Reset selection when filtered list changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const selectedEl = list.querySelector("[data-selected='true']") as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Execute selection
  const executeItem = React.useCallback(
    (item: QuickSwitcherItem) => {
      // Update recent items
      const newRecent = [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, MAX_RECENT);
      setRecentIds(newRecent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));

      // Execute and close
      item.onSelect();
      onClose();
    },
    [recentIds, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            executeItem(flatItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatItems, selectedIndex, executeItem, onClose]
  );

  if (!isOpen) return null;

  const hasResults = flatItems.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div style={backdropStyles} onClick={onClose} aria-hidden="true" />

      {/* Container */}
      <div style={containerStyles} role="dialog" aria-label="Quick Switcher" aria-modal="true">
        {/* Search Input */}
        <div style={inputContainerStyles}>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyles}
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls="quick-switcher-list"
          />
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="quick-switcher-list"
          style={listStyles}
          role="listbox"
          aria-label="Search results"
        >
          {!hasResults ? (
            <div style={emptyStyles}>
              {query ? `No results for "${query}"` : "Start typing to search..."}
            </div>
          ) : (
            SECTIONS.map((section) => {
              const sectionItems = filteredItems[section.type];
              if (sectionItems.length === 0) return null;

              return (
                <div key={section.type}>
                  {/* Section Header */}
                  <div style={sectionHeaderStyles}>
                    <span>{section.icon}</span>
                    <span>{section.label}</span>
                  </div>

                  {/* Section Items */}
                  {sectionItems.map((item) => {
                    const globalIndex = flatItems.indexOf(item);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={`${section.type}-${item.id}`}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        style={{
                          ...itemStyles,
                          ...(isSelected ? itemSelectedStyles : {}),
                        }}
                        role="option"
                        aria-selected={isSelected}
                        data-selected={isSelected}
                        type="button"
                      >
                        <div style={itemLeftStyles}>
                          {item.icon && (
                            <span style={iconStyles}>
                              {typeof item.icon === "string" ? item.icon : item.icon}
                            </span>
                          )}
                          <div style={textContainerStyles}>
                            <div style={labelStyles}>{item.label}</div>
                            {item.subtitle && <div style={subtitleStyles}>{item.subtitle}</div>}
                          </div>
                        </div>

                        {item.shortcut && <ShortcutBadge shortcut={item.shortcut} />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div style={footerStyles}>
          <div>
            <span style={hintKeyStyles}>{"\u2191"}</span>
            <span style={hintKeyStyles}>{"\u2193"}</span>
            <span> Navigate</span>
          </div>
          <div>
            <span style={hintKeyStyles}>{"\u21B5"}</span>
            <span> Select</span>
          </div>
          <div>
            <span style={hintKeyStyles}>esc</span>
            <span> Close</span>
          </div>
        </div>
      </div>
    </>
  );
};

QuickSwitcher.displayName = "QuickSwitcher";

// ============================================
// Default Export
// ============================================

export default QuickSwitcher;
