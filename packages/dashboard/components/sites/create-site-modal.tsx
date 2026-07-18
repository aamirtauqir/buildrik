"use client";
import { useState, useEffect } from "react";
import { X, Plus, LayoutTemplate, Sparkles, Check, Lock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { trpc } from "@lib/trpc/client";
import { Button } from "@/components/dashboard/primitives";

interface CreateSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; method: string }) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateSiteModal({ open, onClose, onSubmit }: CreateSiteModalProps) {
  const [name, setName] = useState("My New Site");
  const [debouncedSlug, setDebouncedSlug] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSlug(slugify(name)), 300);
    return () => clearTimeout(id);
  }, [name]);

  const slugCheck = trpc.sites.checkSlug.useQuery(
    { slug: debouncedSlug },
    { enabled: open && debouncedSlug.length >= 3 }
  );

  const health = trpc.dashboard.health.useQuery(undefined, { enabled: open });
  const aiCredits = health.data?.aiCredits;
  const sitesUsed = health.data?.sites?.used ?? 0;
  const sitesLimit = health.data?.sites?.limit ?? 0;
  const atSiteLimit = health.data !== undefined && sitesLimit > 0 && sitesUsed >= sitesLimit;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={onClose}>
      <div className="w-[480px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Create New Site</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-[var(--color-bg-subtle)]"><X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></button>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Site Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }} />
          <div className="mt-1 flex items-center gap-2">
            {debouncedSlug.length >= 3 && slugCheck.data && (
              slugCheck.data.available ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" /> Available
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <X className="h-3 w-3" /> Taken
                </span>
              )
            )}
          </div>
        </div>
        {atSiteLimit ? (
          <div className="mt-6 rounded-xl border p-5 text-center" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }}>
            <Lock className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Site limit reached ({sitesUsed}/{sitesLimit})
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Upgrade your plan to create more sites.
            </p>
            <Link
              href="/dashboard/settings/billing"
              onClick={onClose}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <button onClick={() => onSubmit({ name, method: "template" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[var(--color-bg-subtle)]" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}><LayoutTemplate className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></div>
              <div><p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Use a Template</p><p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Browse 50+ templates</p></div>
            </button>
            <button onClick={() => onSubmit({ name, method: "ai" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[var(--color-primary-subtle)]/50" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)" }}><Sparkles className="h-5 w-5" style={{ color: "var(--color-primary)" }} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Generate with AI</p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>AI-powered site creation</p>
              </div>
              {aiCredits && (
                <div className="text-right">
                  {aiCredits.used < aiCredits.limit ? (
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {aiCredits.used}/{aiCredits.limit} credits remaining
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <Lock className="h-3 w-3" /> Upgrade for more
                    </p>
                  )}
                </div>
              )}
            </button>
            <button onClick={() => onSubmit({ name, method: "blank" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[var(--color-bg-subtle)]" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}><Plus className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></div>
              <div><p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Start from Scratch</p><p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Full creative control</p></div>
            </button>
          </div>
        )}
        <Button variant="ghost" onClick={onClose} className="mt-4 w-full">Cancel</Button>
      </div>
    </div>
  );
}
