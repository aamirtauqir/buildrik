"use client";
import { X } from "lucide-react";
import { TemplateCard } from "./template-card";
import { cn } from "@lib/utils";

export const TEMPLATE_CATEGORIES = [
  { value: "ALL", label: "All" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BUSINESS", label: "Business" },
  { value: "BLOG", label: "Blog" },
  { value: "AGENCY", label: "Agency" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "RESTAURANT", label: "Restaurant" },
] as const;

export const TEMPLATE_SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "alphabetical", label: "A-Z" },
] as const;

interface Template { id: string; name: string; category: string; thumbnail: string | null; usageCount: number; difficulty: string; }

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  templates: Template[];
  isLoading: boolean;
  category: string;
  onCategoryChange: (cat: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onPreview: (id: string) => void;
  onUse: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onStartBlank: () => void;
}

export function TemplateGallery({ open, onClose, templates, isLoading, category, onCategoryChange, sort, onSortChange, onPreview, onUse, onLoadMore, hasMore, onStartBlank }: TemplateGalleryProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#0000004D" }}>
      <div className="flex flex-1 flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#E8E8E8" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>Choose a Template</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F4F4F4]"><X className="h-5 w-5" style={{ color: "#7A7A7A" }} /></button>
        </div>
        {/* Category tabs */}
        <div className="flex items-center gap-1 border-b px-6" style={{ borderColor: "#E8E8E8" }}>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => onCategoryChange(cat.value)} className={cn("px-4 py-2.5 text-sm font-medium transition-colors", category === cat.value ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[#7A7A7A] hover:text-[#0D0D0D]")}>{cat.label}</button>
          ))}
          <div className="ml-auto flex gap-1">
            {TEMPLATE_SORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => onSortChange(opt.value)} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: sort === opt.value ? "#FEF2F2" : "transparent", color: sort === opt.value ? "var(--color-primary)" : "#7A7A7A" }}>{opt.label}</button>
            ))}
          </div>
        </div>
        {/* Grid */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>No templates in this category yet.</p>
              <p className="mt-1 text-xs" style={{ color: "#7A7A7A" }}>Try another category or start blank.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                {templates.map((t) => <TemplateCard key={t.id} template={t} onPreview={onPreview} onUse={onUse} />)}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <button onClick={onLoadMore} className="rounded-lg border px-6 py-2 text-sm font-medium" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>Load More</button>
                </div>
              )}
            </>
          )}
        </div>
        {/* Footer */}
        <div className="border-t px-6 py-3 text-center" style={{ borderColor: "#E8E8E8" }}>
          <button onClick={onStartBlank} className="text-sm font-medium" style={{ color: "#7A7A7A" }}>Start Blank →</button>
        </div>
      </div>
    </div>
  );
}
