import Link from "next/link";
import { BarChart3, ShoppingCart, Mail, FileText, Search, MessageSquare, Lock, ArrowRight, type LucideIcon } from "lucide-react";
import { CATALOG_APPS } from "@/components/marketplace/catalog";
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

export default function AppsPage() {
  const apps = [...CATALOG_APPS].sort((a, b) => Number(b.installed) - Number(a.installed));

  return (
    <div>
      <PageHeader title="Apps" description="Extend your sites with first-party and partner apps." />

      <div
        className="mb-6 flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-subtle)" }}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Discover 120+ apps in the marketplace</h2>
          <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Analytics, commerce, CRM, and automation — one-click install.
          </p>
        </div>
        <Link
          href="/dashboard/marketplace"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Browse marketplace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const Icon = iconMap[app.icon] ?? FileText;
          return (
            <div
              key={app.id}
              className="flex flex-col rounded-xl border p-5"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
                  <Icon className="h-5 w-5" />
                </div>
                <Pill tone={app.installed ? "success" : "neutral"}>
                  {app.installed ? "Installed" : "Available"}
                </Pill>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{app.name}</h3>
              <p className="mt-2 flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{app.description}</p>
              <button
                type="button"
                className="mt-4 self-start rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {app.installed ? "Open" : "Install"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
