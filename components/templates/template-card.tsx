"use client";
import { Globe } from "lucide-react";

interface TemplateCardProps {
  template: { id: string; name: string; category: string; thumbnail: string | null; usageCount: number };
  onPreview: (id: string) => void;
  onUse: (id: string) => void;
}

export function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  const count = template.usageCount >= 1000 ? `${(template.usageCount / 1000).toFixed(1)}K` : String(template.usageCount);
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md" style={{ borderColor: "#E8E8E8" }}>
      <div className="flex h-44 items-center justify-center" style={{ backgroundColor: "#F4F4F4" }}>
        <Globe className="h-12 w-12" style={{ color: "#B0B0B0" }} />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>{template.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#F4F4F4", color: "#7A7A7A" }}>{template.category.toLowerCase()}</span>
          <span className="text-xs" style={{ color: "#B0B0B0" }}>{count} sites</span>
        </div>
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => onPreview(template.id)} className="rounded-lg border border-white px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">Preview</button>
        <button onClick={() => onUse(template.id)} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Use Template</button>
      </div>
    </div>
  );
}
