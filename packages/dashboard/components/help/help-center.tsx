"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Rocket, Globe, Users, CreditCard, Link, Pencil, MessageSquare, Printer } from "lucide-react";
import { HELP_CATEGORIES } from "@buildrik/shared/schemas/help";
import { SectionCard, Pill, IconChip, InputField, Button } from "@/components/dashboard/primitives";

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

// Accent + blurb per category — presentation-only, so it stays out of the
// shared schema (HELP_CATEGORIES is still the SSOT for key/label/icon).
const CATEGORY_STYLE: Record<string, { color: string; description: string }> = {
  "getting-started": { color: "var(--color-primary)", description: "Build and publish your first site in minutes." },
  sites: { color: "var(--color-teal)", description: "Publish, organize, and manage every site in your workspace." },
  team: { color: "var(--color-primary)", description: "Roles, invites, reviews, and permissions." },
  billing: { color: "var(--color-amber)", description: "Upgrade, invoices, and payment methods." },
  domains: { color: "var(--color-pink)", description: "Connect a custom domain and manage DNS records." },
  editor: { color: "var(--color-success)", description: "Sections, styles, AI drafting, and components." },
};

const POPULAR_CATEGORY_KEY = "getting-started";

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
      {/* Hero */}
      <div className="text-center">
        {/* text-display (28/700) — this was text-[30px]/extrabold, the only
            30px in the dashboard. The token existed with no consumer; a
            centred hero on a sidebar-less page is what it is for. */}
        <h1 className="text-display tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>
          How can we help?
        </h1>
        <p className="mt-1.5 text-body" style={{ color: "var(--color-text-secondary)" }}>
          Search the docs or browse by topic.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="mx-auto max-w-[560px]">
        <InputField
          leading={<Search className="h-4 w-4" />}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles..."
          aria-label="Search help articles"
        />
      </form>

      {/* Categories */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HELP_CATEGORY_LIST.map((cat) => {
          const Icon = ICON_MAP[cat.icon];
          const style = CATEGORY_STYLE[cat.key];
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key, cat.label)}
              className="flex cursor-pointer flex-col rounded-lg border p-5 text-left shadow-card transition-colors hover:border-[var(--color-border-strong)]"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <IconChip color={style?.color} className="mb-3">
                {Icon && <Icon className="h-5 w-5" />}
              </IconChip>
              <div className="flex items-center gap-2">
                <h3 className="text-section-title" style={{ color: "var(--color-text-primary)" }}>{cat.label}</h3>
                {cat.key === POPULAR_CATEGORY_KEY && <Pill tone="warning">Popular</Pill>}
              </div>
              <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{style?.description}</p>
            </button>
          );
        })}
      </div>

      {/* Contact Support */}
      <button
        type="button"
        onClick={onContactSupport}
        className="flex w-full cursor-pointer items-center gap-4 rounded-lg border p-5 text-left shadow-card transition-colors hover:border-[var(--color-border-strong)]"
        style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
      >
        <IconChip color="var(--color-text-secondary)">
          <MessageSquare className="h-5 w-5" />
        </IconChip>
        <div>
          <p className="text-section-title" style={{ color: "var(--color-text-primary)" }}>Contact support</p>
          <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Still stuck? Reach the team directly — response time depends on your plan.
          </p>
        </div>
      </button>

      {/* Keyboard Shortcuts */}
      <SectionCard
        title="Keyboard Shortcuts"
        actions={
          <Button variant="ghost" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        }
        padding="none"
      >
        {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b px-4 py-3 last:border-0"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <span className="text-body" style={{ color: "var(--color-text-primary)" }}>{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, ki) => (
                <kbd
                  key={ki}
                  className="rounded border px-1.5 py-0.5 text-body-sm font-medium"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-subtle)" }}
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
