"use client";
import { useState } from "react";
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@lib/utils";

export const DEVICE_OPTIONS = [
  { value: "desktop", icon: "Monitor", width: "100%" },
  { value: "tablet", icon: "Tablet", width: "768px" },
  { value: "mobile", icon: "Smartphone", width: "375px" },
] as const;

const iconMap = { Monitor, Tablet, Smartphone } as const;

interface TemplatePreviewProps {
  template: { id: string; name: string; category: string; description: string | null; previewUrl: string | null; usageCount: number; pages?: Array<{ name: string }> };
  onBack: () => void;
  onUse: () => void;
}

export function TemplatePreview({ template, onBack, onUse }: TemplatePreviewProps) {
  const [device, setDevice] = useState("desktop");
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-3" style={{ borderColor: "#E8E8E8" }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="rounded-lg p-2 hover:bg-[#F4F4F4]"><ArrowLeft className="h-5 w-5" style={{ color: "#7A7A7A" }} /></button>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>{template.name}</h2>
            <p className="text-xs" style={{ color: "#7A7A7A" }}>{template.category.toLowerCase()} · {template.usageCount} sites</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border" style={{ borderColor: "#E8E8E8" }}>
            {DEVICE_OPTIONS.map((d) => {
              const Icon = iconMap[d.icon as keyof typeof iconMap];
              return <button key={d.value} onClick={() => setDevice(d.value)} className={cn("p-2", device === d.value && "bg-[#F4F4F4]")}><Icon className="h-4 w-4" style={{ color: device === d.value ? "#0D0D0D" : "#7A7A7A" }} /></button>;
            })}
          </div>
          {template.previewUrl && (
            <a href={template.previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}><ExternalLink className="h-3 w-3" />Live Demo</a>
          )}
          <button onClick={onUse} className="rounded-lg px-6 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Use Template</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: "#FAFAFA" }}>
        <div className="mx-auto rounded-xl border bg-white shadow-sm" style={{ borderColor: "#E8E8E8", width: DEVICE_OPTIONS.find((d) => d.value === device)?.width, minHeight: "600px" }}>
          <div className="flex h-full items-center justify-center" style={{ color: "#B0B0B0" }}>
            <p className="text-sm">Template preview placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
