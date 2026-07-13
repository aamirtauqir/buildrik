"use client";

import { useMemo, useState } from "react";
import { BarChart3, ShoppingCart, Mail, FileText, Search, MessageSquare, Lock, type LucideIcon } from "lucide-react";
import { CATALOG_APPS, MARKETPLACE_CATEGORIES, FEATURED_APP, type AppCategory } from "@/components/marketplace/catalog";
import { PageHeader, Pill } from "@/components/dashboard/primitives";

const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  ShoppingCart,
  Mail,
  FileText,
  Search,
  MessageSquare,
  Lock,
};

type Filter = "All" | AppCategory;

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("All");

  const filters: Filter[] = ["All", ...MARKETPLACE_CATEGORIES];

  const apps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG_APPS.filter((app) => {
      const matchesCategory = category === "All" || app.category === category;
      const matchesQuery =
        q === "" ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div>
      <PageHeader title="Marketplace" description="Apps, integrations and templates to extend your sites." />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps & templates…"
          className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
          style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const selected = filter === category;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setCategory(filter)}
              className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                selected
                  ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }
                  : { borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }
              }
            >
              {filter}
            </button>
          );
        })}
      </div>

      <div
        className="mb-6 flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-subtle)" }}
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Featured</span>
          <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{FEATURED_APP.name}</h2>
          <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>{FEATURED_APP.description}</p>
        </div>
        {/* No marketplace backend yet — inert rather than a silent no-op. */}
        <button
          type="button"
          disabled
          title="Coming soon"
          className="shrink-0 cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
        >
          Coming soon
        </button>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}>
          No apps match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const Icon = iconMap[app.icon] ?? FileText;
            return (
              <div
                key={app.id}
                className="flex flex-col rounded-xl border p-5"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{app.name}</h3>
                <div className="mt-1.5">
                  <Pill tone="neutral">{app.category}</Pill>
                </div>
                <p className="mt-2 flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{app.description}</p>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="mt-4 self-start cursor-not-allowed rounded-lg border px-3.5 py-1.5 text-sm font-semibold"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}
                >
                  Coming soon
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
