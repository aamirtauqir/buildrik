"use client";

import { useState } from "react";
import { Library, Rocket, LayoutGrid, ShoppingBag, Newspaper } from "lucide-react";
import { StateEmpty } from "@/components/states";

const TABS = [
  { value: "templates", label: "Templates" },
  { value: "libraries", label: "Libraries" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const TEMPLATES = [
  { name: "SaaS Landing", category: "Marketing", icon: Rocket },
  { name: "Portfolio Grid", category: "Personal", icon: LayoutGrid },
  { name: "Store Starter", category: "Commerce", icon: ShoppingBag },
  { name: "Blog & News", category: "Content", icon: Newspaper },
] as const;

export default function LibrariesPage() {
  const [tab, setTab] = useState<Tab>("templates");

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Libraries &amp; Templates</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Reusable starting points and shared design systems.
        </p>
      </header>

      <div
        className="mb-6 inline-flex gap-1 rounded-lg border p-1"
        style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}
        role="tablist"
      >
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: active ? "var(--color-primary-subtle)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "templates" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map(({ name, category, icon: Icon }) => (
            <div
              key={name}
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <div className="flex h-32 items-center justify-center" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                <Icon className="h-9 w-9" style={{ color: "var(--color-text-muted)" }} />
              </div>
              <div className="p-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{name}</h2>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}
                  >
                    {category}
                  </span>
                  <button
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StateEmpty
          icon={<Library className="h-7 w-7" />}
          title="No shared libraries yet"
          description="Capture a site's colors, type and components as a shared design system to reuse across every Buildrick site in this workspace."
        />
      )}
    </div>
  );
}
