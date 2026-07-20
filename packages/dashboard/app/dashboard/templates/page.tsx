"use client";

import { useState } from "react";
import { Library, Rocket, LayoutGrid, ShoppingBag, Newspaper } from "lucide-react";
import { StateEmpty } from "@/components/states";
import { PageHeader, FilterTabs } from "@/components/dashboard/primitives";

const TABS = [
  { value: "templates", label: "Templates" },
  { value: "libraries", label: "Libraries" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const TEMPLATES = [
  { name: "SaaS Landing", category: "Marketing", icon: Rocket, color: "var(--color-primary)" },
  { name: "Portfolio Grid", category: "Personal", icon: LayoutGrid, color: "var(--color-pink)" },
  { name: "Store Starter", category: "Commerce", icon: ShoppingBag, color: "var(--color-amber)" },
  { name: "Blog & News", category: "Content", icon: Newspaper, color: "var(--color-teal)" },
] as const;

export default function LibrariesPage() {
  const [tab, setTab] = useState<Tab>("templates");

  return (
    <div>
      <PageHeader title="Libraries & Templates" description="Reusable starting points and shared design systems." />

      <div className="mb-5">
        <FilterTabs value={tab} onChange={setTab} options={TABS} />
      </div>

      {tab === "templates" ? (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map(({ name, category, icon: Icon, color }) => (
            <div
              key={name}
              className="overflow-hidden rounded-xl border shadow-card"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <div
                className="flex h-[196px] items-center justify-center"
                style={{ background: `linear-gradient(140deg, color-mix(in srgb, ${color} 8%, white), color-mix(in srgb, ${color} 20%, white))` }}
              >
                <Icon className="h-10 w-10" style={{ color }} />
              </div>
              <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                <div>
                  <h2 className="text-[13.5px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{name}</h2>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--color-text-secondary)" }}>{category}</p>
                </div>
                {/* No template-apply backend wired on this route — inert rather than a
                    silent no-op. The real browse/apply flow is /dashboard/sites/new?method=template. */}
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="shrink-0 cursor-not-allowed text-body-sm font-semibold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Coming soon
                </button>
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
