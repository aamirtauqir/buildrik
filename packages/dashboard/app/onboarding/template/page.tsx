"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutTemplate } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const CATEGORIES = [
  { value: "ALL", label: "All" },
  { value: "AGENCY", label: "Agency" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BUSINESS", label: "Business" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "BLOG", label: "Blog" },
] as const;

const LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/** T1 · Choose a template. Real templates from templates.list; picking one
 *  stores its id in wizardData and advances to the preview (T2). Back → S3. */
export default function TemplateGalleryPage() {
  const router = useRouter();
  const { saveAndGo } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");

  const list = trpc.templates.list.useQuery({ category, search: search || undefined, perPage: 12 });
  const templates = list.data?.data ?? [];

  return (
    <WizardShell chrome={{ variant: "simple" }} wide onSkip={skipSetup} skipping={skipping}>
      <div className="text-center mb-6">
        <h1 className="text-onb-title font-bold text-onb-ink">Choose a template</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-onb-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full h-onb-input pl-9 pr-3 rounded-onb bg-onb-surface border border-onb-line text-sm text-onb-text outline-none focus:border-onb-primary placeholder:text-onb-subtle"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              "h-8 px-3 rounded-onb border text-xs transition-colors",
              category === c.value
                ? "border-onb-primary bg-onb-primary-tint text-onb-primary font-medium"
                : "border-onb-line text-onb-text hover:border-onb-subtle"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-onb-line border-t-onb-primary" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-center text-sm text-onb-muted py-16">No templates match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => saveAndGo("/onboarding/template/preview", { template: { id: t.id } })}
              className="text-left rounded-onb border border-onb-line hover:border-onb-primary overflow-hidden transition-colors"
            >
              <div className="aspect-video bg-onb-surface flex items-center justify-center">
                {t.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.thumbnail} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <LayoutTemplate className="w-7 h-7 text-onb-subtle" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-onb-ink truncate">{t.name}</p>
                <p className="text-xs text-onb-muted mt-0.5">{LABEL[t.category] ?? t.category}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push("/onboarding/path")}
        className="mt-8 w-full text-center text-sm text-onb-muted hover:text-onb-text"
      >
        Back
      </button>
    </WizardShell>
  );
}
