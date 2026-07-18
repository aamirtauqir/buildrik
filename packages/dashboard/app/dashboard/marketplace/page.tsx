"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ShoppingCart, Mail, FileText, Search, MessageSquare, Lock, Check, type LucideIcon } from "lucide-react";
import { CATALOG_APPS, MARKETPLACE_CATEGORIES, FEATURED_APP, type AppCategory, type CatalogApp } from "@/lib/marketplace-catalog";
import { PageHeader } from "@/components/dashboard/primitives";
import { trpc } from "@lib/trpc/client";

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

/** Third-party apps aren't installed here — their OAuth connections live in
 *  Settings › Integrations, so the card links there instead of faking a connect. */
const INTEGRATIONS_HREF = "/dashboard/settings/integrations";

/** Brand tile: the app's colour at low alpha behind a solid glyph. */
function AppTile({ app, Icon }: { app: CatalogApp; Icon: LucideIcon }) {
  return (
    <div
      className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
      style={{ backgroundColor: `color-mix(in srgb, ${app.color} 14%, white)`, color: app.color }}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("All");
  const [actionError, setActionError] = useState<string>();

  const utils = trpc.useUtils();
  const installed = trpc.marketplace.listInstalled.useQuery(undefined, { staleTime: 30_000 });
  const installedIds = useMemo(() => new Set(installed.data ?? []), [installed.data]);

  const onSettled = () => {
    void utils.marketplace.listInstalled.invalidate();
  };
  const onError = (e: { message: string }) => setActionError(e.message);

  const install = trpc.marketplace.install.useMutation({ onSettled, onError });
  const uninstall = trpc.marketplace.uninstall.useMutation({ onSettled, onError });
  const pendingId =
    install.isPending ? install.variables?.appId : uninstall.isPending ? uninstall.variables?.appId : undefined;

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
          className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-body outline-none transition-colors focus:border-[var(--color-primary)]"
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
              className="rounded-full border px-3.5 py-1.5 text-body font-semibold transition-colors"
              style={
                selected
                  ? { borderColor: "var(--color-ink)", backgroundColor: "var(--color-ink)", color: "#fff" }
                  : { borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }
              }
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Featured hero — ink card per the design. */}
      <div
        className="mb-6 flex flex-col gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <div className="min-w-0">
          <span className="text-eyebrow font-bold uppercase tracking-wide" style={{ color: "var(--color-amber)" }}>Featured</span>
          <h2 className="mt-2 text-[26px] font-bold leading-tight text-white">{FEATURED_APP.name}</h2>
          <p className="mt-2 max-w-md text-body" style={{ color: "rgba(255,255,255,0.66)" }}>{FEATURED_APP.description}</p>
          <Link
            href={INTEGRATIONS_HREF}
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-body font-bold transition-opacity hover:opacity-90"
            style={{ color: "var(--color-ink)" }}
          >
            {FEATURED_APP.cta}
          </Link>
        </div>
        <div
          className="hidden h-[150px] w-[260px] shrink-0 items-end justify-center gap-2.5 rounded-xl p-6 sm:flex"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)" }}
          aria-hidden
        >
          {[42, 74, 30, 92].map((h, i) => (
            <span key={i} className="w-7 rounded-md" style={{ height: `${h}%`, backgroundColor: `rgba(255,255,255,${i === 3 ? 0.95 : 0.45 + i * 0.1})` }} />
          ))}
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border px-4 py-2.5 text-body" style={{ borderColor: "var(--color-error-subtle)", backgroundColor: "var(--color-error-subtle)", color: "var(--color-error-text)" }}>
          {actionError}
        </p>
      )}

      {apps.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-body" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}>
          No apps match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const Icon = iconMap[app.icon] ?? FileText;
            const isInstalled = installedIds.has(app.id);
            const busy = pendingId === app.id;
            return (
              <div
                key={app.id}
                className="flex flex-col rounded-xl border p-5 shadow-card"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
              >
                <AppTile app={app} Icon={Icon} />
                <h3 className="text-body font-bold" style={{ color: "var(--color-text-primary)" }}>{app.name}</h3>
                <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{app.category}</p>
                <p className="mt-3 flex-1 text-body" style={{ color: "var(--color-text-secondary)" }}>{app.description}</p>

                {app.action === "Connect" ? (
                  <Link
                    href={INTEGRATIONS_HREF}
                    className="mt-4 rounded-lg border py-2 text-center text-body font-semibold transition-colors hover:bg-[var(--color-bg-subtle)]"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                  >
                    Connect
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setActionError(undefined);
                      if (isInstalled) uninstall.mutate({ appId: app.id });
                      else install.mutate({ appId: app.id });
                    }}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 text-body font-semibold transition-colors disabled:opacity-60"
                    style={
                      isInstalled
                        ? { borderColor: "var(--color-border-default)", color: "var(--color-text-primary)", backgroundColor: "var(--color-bg-surface)" }
                        : { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary)", color: "#fff" }
                    }
                  >
                    {isInstalled && <Check className="h-4 w-4" />}
                    {busy ? "…" : isInstalled ? "Installed" : "Install"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
