"use client";

import { useState } from "react";
import { Search, LayoutTemplate } from "lucide-react";
import { Spinner } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { OnbEmpty } from "@/components/onboarding/wizard/onb-empty";
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
  const { saveAndGo } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");

  const list = trpc.templates.list.useQuery({ category, search: search || undefined, perPage: 12 });
  const templates = list.data?.data ?? [];

  return (
    <WizardShell chrome={{ variant: "simple" }} wide onSkip={skipSetup} skipping={skipping} padY={60}>
      <div className="flex flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-4 self-stretch">
          <h1 className="text-onb-title font-bold text-onb-text">Choose a template</h1>

          <div className="flex h-[41px] w-[560px] max-w-full items-center gap-2.5 rounded-onb bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-onb-line)] focus-within:shadow-[inset_0_0_0_1px_var(--color-onb-primary)]">
            <Search className="h-4 w-4 shrink-0 text-onb-subtle" strokeWidth={1.8} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="h-full w-full bg-transparent text-sm text-onb-text outline-none placeholder:text-onb-subtle"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={cn(
                "rounded-full px-3.5 py-[7px] text-[13px] font-medium transition-colors",
                category === c.value
                  ? "bg-onb-primary text-white"
                  : "bg-white text-onb-muted shadow-[inset_0_0_0_1px_var(--color-onb-line)] hover:text-onb-text"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {list.isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center self-stretch">
            <Spinner size="md" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center self-stretch">
            <OnbEmpty
              icon={<Search className="h-4 w-4 text-onb-muted" strokeWidth={1.8} />}
              title="No templates found"
              body="Try a different category, or clear the search."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("ALL");
                  }}
                  className="mt-2 flex h-10 items-center rounded-onb px-5 text-[13px] font-semibold text-onb-text shadow-[inset_0_0_0_1px_var(--color-onb-line)] transition-colors hover:bg-onb-surface"
                >
                  Clear filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 self-stretch">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => saveAndGo("/onboarding/template/preview", { template: { id: t.id } })}
                className="flex flex-col overflow-hidden rounded-xl bg-white text-left shadow-[inset_0_0_0_1px_var(--color-onb-line)] transition-shadow hover:shadow-[inset_0_0_0_2px_var(--color-onb-primary)]"
              >
                <div className="flex h-[170px] items-center justify-center border-b border-onb-line bg-gray-100">
                  {t.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnail} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <LayoutTemplate className="h-7 w-7 text-onb-subtle" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 p-4">
                  <span className="truncate text-[15px] font-semibold text-onb-text">{t.name}</span>
                  <span className="text-xs text-onb-muted">{LABEL[t.category] ?? t.category}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex self-stretch">
          <OnbBack to="/onboarding/path" />
        </div>
      </div>
    </WizardShell>
  );
}
