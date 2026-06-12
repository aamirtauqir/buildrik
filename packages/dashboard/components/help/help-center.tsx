"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Rocket, Globe, Users, CreditCard, Link, Pencil, Mail, Printer } from "lucide-react";
import { HELP_CATEGORIES } from "@buildrik/shared/schemas/help";

export const HELP_CATEGORY_LIST = HELP_CATEGORIES.map((c) => ({ ...c }));

export const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open search" },
  { keys: ["⌘", "N"], description: "New site" },
  { keys: ["⌘", ","], description: "Open settings" },
  { keys: ["Esc"], description: "Close modal / dialog" },
  { keys: ["?"], description: "Open help center" },
  { keys: ["G", "D"], description: "Go to Dashboard" },
  { keys: ["G", "S"], description: "Go to Sites" },
  { keys: ["G", "T"], description: "Go to Team" },
  { keys: ["G", "B"], description: "Go to Billing" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Rocket,
  Globe,
  Users,
  CreditCard,
  Link,
  Pencil,
};

interface HelpCenterProps {
  onSearch: (query: string) => void;
  onSelectCategory: (key: string, label: string) => void;
  onContactSupport: () => void;
  searchQuery?: string;
}

export function HelpCenter({ onSearch, onSelectCategory, onContactSupport, searchQuery = "" }: HelpCenterProps) {
  const [query, setQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) onSearch(query.trim());
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
          <input
            type="text"
            placeholder="Search help articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2"
            style={{
              borderColor: "var(--color-border-default)",
              color: "var(--color-text-primary)",
            }}
          />
          {query && (
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Search
            </button>
          )}
        </div>
      </form>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Browse by Category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HELP_CATEGORY_LIST.map((cat) => {
            const Icon = ICON_MAP[cat.icon];
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key, cat.label)}
                className="flex cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[#FFF5F4]"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                {Icon && <Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />}
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{cat.label}</p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Browse articles</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Contact Support */}
      <section>
        <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Contact Support</h2>
        <button
          onClick={onContactSupport}
          className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[#FFF5F4]"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFF5F4" }}>
            <Mail className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Submit a Ticket</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Response time depends on your plan</p>
          </div>
        </button>
      </section>

      {/* Keyboard Shortcuts */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Keyboard Shortcuts</h2>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
        <div className="rounded-xl border" style={{ borderColor: "var(--color-border-default)" }}>
          {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < KEYBOARD_SHORTCUTS.length - 1 ? "1px solid var(--color-border-default)" : "none" }}
            >
              <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, ki) => (
                  <kbd
                    key={ki}
                    className="rounded border px-1.5 py-0.5 text-xs font-medium"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-subtle)" }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
