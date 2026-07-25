"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ShoppingCart, Mail, FileText, Search, MessageSquare, Lock, Check, Settings2, type LucideIcon } from "lucide-react";
import { CATALOG_APPS, MARKETPLACE_CATEGORIES, FEATURED_APP, type AppCategory, type CatalogApp } from "@/lib/marketplace-catalog";
import { PageHeader, IconChip, InputField, Button, ButtonLink, Modal } from "@/components/dashboard/primitives";
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

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("All");
  const [actionError, setActionError] = useState<string>();
  // The design confirms an install in a dialog before it runs; uninstall stays direct.
  const [confirming, setConfirming] = useState<CatalogApp>();
  // Configurable apps (Live Chat, …) open a settings dialog instead — saving it
  // both installs the app and stores the config that makes it work.
  const [configuring, setConfiguring] = useState<CatalogApp>();
  const [form, setForm] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const installed = trpc.marketplace.listInstalled.useQuery(undefined, { staleTime: 30_000 });
  const installedIds = useMemo(() => new Set(installed.data ?? []), [installed.data]);

  const onSettled = () => {
    void utils.marketplace.listInstalled.invalidate();
  };
  const onError = (e: { message: string }) => setActionError(e.message);

  const install = trpc.marketplace.install.useMutation({ onSettled, onError });
  const uninstall = trpc.marketplace.uninstall.useMutation({ onSettled, onError });
  const configure = trpc.marketplace.configure.useMutation({
    onSettled,
    onError,
    onSuccess: () => setConfiguring(undefined),
  });
  const pendingId =
    install.isPending ? install.variables?.appId : uninstall.isPending ? uninstall.variables?.appId : undefined;

  // Pre-fill the config dialog from stored config when it opens.
  const existingConfig = trpc.marketplace.getConfig.useQuery(
    { appId: configuring?.id ?? "" },
    { enabled: !!configuring, staleTime: 0 },
  );
  useEffect(() => {
    if (!configuring) return;
    const stored = (existingConfig.data ?? {}) as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const f of configuring.configFields ?? []) {
      next[f.key] = typeof stored[f.key] === "string" ? (stored[f.key] as string) : "";
    }
    setForm(next);
  }, [configuring, existingConfig.data]);

  const openConfigure = (app: CatalogApp) => {
    setActionError(undefined);
    setConfiguring(app);
  };

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
    <div className="mx-auto max-w-[1200px] px-6">
      <PageHeader title="Marketplace" description="Apps and integrations to extend your sites." />

      <InputField
        wrapperClassName="mb-6"
        leading={<Search className="h-4 w-4" />}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search apps & integrations…"
        aria-label="Search apps and integrations"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const selected = filter === category;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setCategory(filter)}
              className="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
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
        className="mb-6 flex flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <div className="min-w-0">
          <span className="text-eyebrow font-bold uppercase" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.66px" }}>Featured</span>
          <h2 className="mt-2 text-[20px] font-bold leading-tight text-white">{FEATURED_APP.name}</h2>
          <p className="mt-2 max-w-[420px] text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>{FEATURED_APP.description}</p>
          <Link
            href={INTEGRATIONS_HREF}
            className="mt-3 inline-flex h-[38px] items-center justify-center rounded-[10px] bg-white px-4 text-[13px] font-semibold transition-opacity hover:opacity-90"
            style={{ color: "var(--color-ink)" }}
          >
            {FEATURED_APP.cta}
          </Link>
        </div>
        <div
          className="hidden h-[128px] w-[178px] shrink-0 items-end justify-center gap-[5px] rounded-xl p-[14px] sm:flex"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-hidden
        >
          {[
            { h: 34, o: 0.5 },
            { h: 52, o: 0.8 },
            { h: 24, o: 0.4 },
            { h: 44, o: 1 },
          ].map((bar, i) => (
            <span key={i} className="w-3.5 rounded-[3px]" style={{ height: `${bar.h}%`, backgroundColor: `rgba(255,255,255,${bar.o})` }} />
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
                className="flex flex-col gap-3 rounded-xl border p-4 shadow-card"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
              >
                <div className="flex items-center gap-3">
                  <IconChip color={app.color}>
                    <Icon className="h-5 w-5" />
                  </IconChip>
                  <div className="flex min-w-0 flex-col gap-px">
                    <h3 className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{app.name}</h3>
                    <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{app.category}</p>
                  </div>
                </div>
                <p className="flex-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{app.description}</p>

                {app.action === "Connect" ? (
                  <ButtonLink href={INTEGRATIONS_HREF} variant="ghost" className="w-full">
                    Set up in Integrations
                  </ButtonLink>
                ) : app.configFields ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => openConfigure(app)}
                    className="w-full"
                  >
                    {isInstalled ? <Settings2 className="h-4 w-4" /> : null}
                    {isInstalled ? "Configure" : "Set up"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setActionError(undefined);
                      if (isInstalled) uninstall.mutate({ appId: app.id });
                      else setConfirming(app);
                    }}
                    className="w-full"
                  >
                    {isInstalled && <Check className="h-4 w-4" />}
                    {busy ? "…" : isInstalled ? "Installed" : "Install"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={confirming !== undefined}
        onClose={() => setConfirming(undefined)}
        title={confirming ? `Install ${confirming.name}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(undefined)}>Cancel</Button>
            <Button
              disabled={install.isPending}
              onClick={() => {
                if (!confirming) return;
                install.mutate({ appId: confirming.id });
                setConfirming(undefined);
              }}
            >
              {install.isPending ? "Installing…" : "Install"}
            </Button>
          </>
        }
      >
        {confirming && (
          <div className="flex items-start gap-3">
            <IconChip color={confirming.color}>
              {(() => {
                const Icon = iconMap[confirming.icon] ?? FileText;
                return <Icon className="h-5 w-5" />;
              })()}
            </IconChip>
            <div className="min-w-0">
              <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{confirming.name}</p>
              <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{confirming.description}</p>
              {/* Honesty: first-party apps are tracked but not yet functional. */}
              <p className="mt-2 text-body-sm" style={{ color: "#92400e" }}>
                Preview — installing marks this app as enabled for your workspace, but it isn&apos;t active yet.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={configuring !== undefined}
        onClose={() => setConfiguring(undefined)}
        title={configuring ? `${configuring.name} settings` : ""}
        footer={
          configuring && (
            <>
              {installedIds.has(configuring.id) && (
                <Button
                  variant="ghost"
                  disabled={uninstall.isPending}
                  onClick={() => {
                    uninstall.mutate({ appId: configuring.id });
                    setConfiguring(undefined);
                  }}
                  style={{ marginRight: "auto", color: "var(--color-error-text)" }}
                >
                  Remove
                </Button>
              )}
              <Button variant="ghost" onClick={() => setConfiguring(undefined)}>Cancel</Button>
              <Button
                disabled={
                  configure.isPending ||
                  (configuring.configFields ?? []).some((f) => !form[f.key]?.trim())
                }
                onClick={() => {
                  if (!configuring) return;
                  const config: Record<string, string> = {};
                  for (const f of configuring.configFields ?? []) config[f.key] = form[f.key]?.trim() ?? "";
                  configure.mutate({ appId: configuring.id, config });
                }}
              >
                {configure.isPending ? "Saving…" : "Save & activate"}
              </Button>
            </>
          )
        }
      >
        {configuring && (
          <div className="flex flex-col gap-4">
            <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              {configuring.description} Once saved, it&apos;s added to every published site on your next publish.
            </p>
            {(configuring.configFields ?? []).map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-body-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{f.label}</span>
                <InputField
                  type="text"
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
                {f.hint && (
                  <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{f.hint}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
