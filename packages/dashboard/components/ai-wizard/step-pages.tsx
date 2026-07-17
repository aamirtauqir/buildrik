"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

// Module-local — no external consumers. Was exported, but grep across
// packages/ + server/ shows zero importers. Keeping export was a false
// "may be reused" signal that bloats the public surface.
const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "creative", label: "Creative" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "playful", label: "Playful" },
] as const;

const CONTENT_OPTIONS = [
  { value: "generate", label: "Generate placeholder content" },
  { value: "lorem", label: "Use lorem ipsum" },
  { value: "empty", label: "Leave empty" },
] as const;

const IMAGE_OPTIONS = [
  { value: "stock", label: "Stock photos" },
  { value: "placeholders", label: "Colored placeholders" },
  { value: "none", label: "No images" },
] as const;

const DEFAULT_PAGES = ["Home", "About", "Contact", "Services", "Blog", "Gallery", "Pricing", "FAQ"];

interface StepPagesProps {
  businessType: string;
  suggestedPages: string[];
  onBack: () => void;
  onGenerate: (data: { pages: string[]; description?: string; tone?: string; content?: string; images?: string }) => void;
}

export function StepPages({ businessType, suggestedPages, onBack, onGenerate }: StepPagesProps) {
  const [selectedPages, setSelectedPages] = useState<string[]>(["Home"]);
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState("");

  const allPages = [...new Set(["Home", ...suggestedPages, ...DEFAULT_PAGES])];

  const togglePage = (page: string) => {
    if (page === "Home") return;
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : prev.length < 8 ? [...prev, page] : prev
    );
  };

  return (
    <div className="mx-auto max-w-[600px]">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <ArrowLeft className="h-4 w-4" />Back
      </button>
      <h1 className="text-page-title" style={{ color: "var(--color-text-primary)" }}>Choose your pages</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Select which pages to include (1-8)</p>

      {/* Page list */}
      <div className="mt-6 space-y-2">
        {allPages.map((page) => (
          <label key={page} className="flex items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-bg-page)]" style={{ borderColor: selectedPages.includes(page) ? "var(--color-primary)" : "var(--color-border-default)" }}>
            <input type="checkbox" checked={selectedPages.includes(page)} disabled={page === "Home"} onChange={() => togglePage(page)} className="h-4 w-4 rounded accent-[var(--color-primary)]" />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{page}</span>
            {page === "Home" && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>(required)</span>}
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs" style={{ color: selectedPages.length >= 8 ? "var(--color-primary)" : "var(--color-text-secondary)" }}>{selectedPages.length}/8 pages selected</p>

      {/* Description */}
      <div className="mt-6">
        <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Describe your business (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border-default)" }} placeholder="Describe your business (optional)" />
        <p className="mt-1 text-xs text-right" style={{ color: description.length > 450 ? "var(--color-primary)" : "var(--color-text-muted)" }}>{description.length}/500</p>
      </div>

      {/* Preferences */}
      <div className="mt-6 space-y-4">
        <PreferenceRow label="Tone" options={TONE_OPTIONS} value={tone} onChange={setTone} />
        <PreferenceRow label="Content" options={CONTENT_OPTIONS} value={content} onChange={setContent} />
        <PreferenceRow label="Images" options={IMAGE_OPTIONS} value={images} onChange={setImages} />
      </div>

      {/* Generate CTA */}
      <div className="mt-8 text-center">
        <button onClick={() => onGenerate({ pages: selectedPages, description: description || undefined, tone: tone || undefined, content: content || undefined, images: images || undefined })} disabled={selectedPages.length === 0} className="rounded-lg px-8 py-2.5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
          Generate Site
        </button>
      </div>
    </div>
  );
}

function PreferenceRow({ label, options, value, onChange }: { label: string; options: ReadonlyArray<{ value: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(value === opt.value ? "" : opt.value)} className="rounded-full px-3 py-1 text-xs font-medium transition-colors" style={{ backgroundColor: value === opt.value ? "#FEF2F2" : "var(--color-bg-subtle)", color: value === opt.value ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
