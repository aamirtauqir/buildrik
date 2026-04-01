"use client";
import { useState, useEffect } from "react";
import { X, Plus, LayoutTemplate, Sparkles, Check, Lock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { trpc } from "@lib/trpc/client";

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

  const slug = slugify(name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={onClose}>
      <div className="w-[480px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>Create New Site</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-[#F4F4F4]"><X className="h-5 w-5" style={{ color: "#7A7A7A" }} /></button>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium" style={{ color: "#7A7A7A" }}>Site Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }} />
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs" style={{ color: "#B0B0B0" }}>{slug}.buildrik.app</p>
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
            <Lock className="mx-auto h-8 w-8 mb-2" style={{ color: "#E42313" }} />
            <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Site limit reached ({sitesUsed}/{sitesLimit})
            </p>
            <p className="mt-1 text-xs" style={{ color: "#7A7A7A" }}>
              Upgrade your plan to create more sites.
            </p>
            <Link
              href="/dashboard/billing"
              onClick={onClose}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "#E42313" }}
            >
              Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <button onClick={() => onSubmit({ name, method: "template" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#F4F4F4" }}><LayoutTemplate className="h-5 w-5" style={{ color: "#7A7A7A" }} /></div>
              <div><p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Use a Template</p><p className="text-xs" style={{ color: "#7A7A7A" }}>Browse 50+ templates</p></div>
            </button>
            <button onClick={() => onSubmit({ name, method: "ai" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-red-50/50" style={{ borderColor: "#E8E8E8" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FEF2F2" }}><Sparkles className="h-5 w-5" style={{ color: "#E42313" }} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Generate with AI</p>
                <p className="text-xs" style={{ color: "#7A7A7A" }}>AI-powered site creation</p>
              </div>
              {aiCredits && (
                <div className="text-right">
                  {aiCredits.used < aiCredits.limit ? (
                    <p className="text-xs" style={{ color: "#7A7A7A" }}>
                      {aiCredits.used}/{aiCredits.limit} credits remaining
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs" style={{ color: "#B0B0B0" }}>
                      <Lock className="h-3 w-3" /> Upgrade for more
                    </p>
                  )}
                </div>
              )}
            </button>
            <button onClick={() => onSubmit({ name, method: "blank" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#F4F4F4" }}><Plus className="h-5 w-5" style={{ color: "#7A7A7A" }} /></div>
              <div><p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Start from Scratch</p><p className="text-xs" style={{ color: "#7A7A7A" }}>Full creative control</p></div>
            </button>
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>Cancel</button>
      </div>
    </div>
  );
}
