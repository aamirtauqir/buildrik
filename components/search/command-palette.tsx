"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";

export const PALETTE_SECTIONS = [
  { key: "recent", label: "Recent" },
  { key: "actions", label: "Quick Actions" },
  { key: "navigation", label: "Navigation" },
];

export const SEARCH_SCOPES = [
  { key: "sites", label: "Sites" },
  { key: "pages", label: "Pages" },
  { key: "team", label: "Team" },
  { key: "settings", label: "Settings" },
  { key: "actions", label: "Actions" },
  { key: "help", label: "Help" },
];

const NAVIGATION_ITEMS = [
  { label: "Dashboard", url: "/dashboard" },
  { label: "Sites", url: "/dashboard/sites" },
  { label: "Team", url: "/dashboard/team" },
  { label: "Settings", url: "/dashboard/settings" },
  { label: "Notifications", url: "/dashboard/notifications" },
  { label: "Billing", url: "/dashboard/billing" },
];

const QUICK_ACTIONS = [
  { label: "Create new site", action: "new-site" },
  { label: "Invite team member", action: "invite-member" },
  { label: "View analytics", action: "analytics" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const isSearching = debouncedQuery.length >= 2;

  const filteredNavigation = isSearching
    ? NAVIGATION_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(debouncedQuery.toLowerCase()),
      )
    : NAVIGATION_ITEMS;

  const filteredActions = isSearching
    ? QUICK_ACTIONS.filter((item) =>
        item.label.toLowerCase().includes(debouncedQuery.toLowerCase()),
      )
    : QUICK_ACTIONS;

  const allItems = [...filteredNavigation, ...filteredActions];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allItems[activeIndex]) {
        e.preventDefault();
        const item = allItems[activeIndex];
        if ("url" in item) {
          window.location.href = item.url;
        }
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [allItems, activeIndex, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full overflow-hidden rounded-xl border bg-white shadow-2xl"
        style={{ maxWidth: 640, maxHeight: 480, borderColor: "#E8E8E8" }}
      >
        <div className="flex items-center gap-3 border-b px-4" style={{ borderColor: "#E8E8E8" }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: "#7A7A7A" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to..."
            className="flex-1 border-0 bg-transparent py-3 text-sm outline-none"
            style={{ color: "#0D0D0D" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "#7A7A7A" }}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {isSearching && allItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: "#7A7A7A" }}>
              No results for "{debouncedQuery}"
            </p>
          ) : (
            <>
              {filteredNavigation.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: "#7A7A7A" }}>
                    Navigation
                  </p>
                  {filteredNavigation.map((item, i) => (
                    <a
                      key={item.url}
                      href={item.url}
                      onClick={onClose}
                      className="flex items-center px-4 py-2 text-sm transition-colors"
                      style={{
                        color: "#0D0D0D",
                        backgroundColor: activeIndex === i ? "#F4F4F4" : "transparent",
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
              {filteredActions.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: "#7A7A7A" }}>
                    Quick Actions
                  </p>
                  {filteredActions.map((item, i) => (
                    <button
                      key={item.action}
                      onClick={onClose}
                      className="flex w-full items-center px-4 py-2 text-sm transition-colors"
                      style={{
                        color: "#0D0D0D",
                        backgroundColor:
                          activeIndex === filteredNavigation.length + i ? "#F4F4F4" : "transparent",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-4 border-t px-4 py-2" style={{ borderColor: "#E8E8E8" }}>
          {SEARCH_SCOPES.map((scope) => (
            <button
              key={scope.key}
              className="text-xs transition-colors hover:underline"
              style={{ color: "#7A7A7A" }}
              onClick={() => { setQuery(`${scope.label}: `); inputRef.current?.focus(); }}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
