"use client";
import { useState } from "react";
import { X, Plus, LayoutTemplate, Sparkles } from "lucide-react";

interface CreateSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; method: string }) => void;
}

export function CreateSiteModal({ open, onClose, onSubmit }: CreateSiteModalProps) {
  const [name, setName] = useState("My New Site");
  if (!open) return null;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
          <p className="mt-1 text-xs" style={{ color: "#B0B0B0" }}>{slug}.buildrik.app</p>
        </div>
        <div className="mt-6 space-y-3">
          <button onClick={() => onSubmit({ name, method: "template" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#F4F4F4" }}><LayoutTemplate className="h-5 w-5" style={{ color: "#7A7A7A" }} /></div>
            <div><p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Use a Template</p><p className="text-xs" style={{ color: "#7A7A7A" }}>Browse 50+ templates</p></div>
          </button>
          <button onClick={() => onSubmit({ name, method: "ai" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-red-50/50" style={{ borderColor: "#E8E8E8" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FEF2F2" }}><Sparkles className="h-5 w-5" style={{ color: "#E42313" }} /></div>
            <div><p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Generate with AI</p><p className="text-xs" style={{ color: "#7A7A7A" }}>AI-powered site creation</p></div>
          </button>
          <button onClick={() => onSubmit({ name, method: "blank" })} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#F4F4F4" }}><Plus className="h-5 w-5" style={{ color: "#7A7A7A" }} /></div>
            <div><p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Start from Scratch</p><p className="text-xs" style={{ color: "#7A7A7A" }}>Full creative control</p></div>
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>Cancel</button>
      </div>
    </div>
  );
}
