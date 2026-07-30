"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { UseTemplateModal } from "@/components/templates/use-template-modal";

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BEGINNER: { bg: "#DEF7EC", text: "#166534", label: "Beginner" },
  INTERMEDIATE: { bg: "#DBEAFE", text: "#1E40AF", label: "Intermediate" },
  ADVANCED: { bg: "#FDFDEA", text: "#92400E", label: "Advanced" },
};

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [useOpen, setUseOpen] = useState(false);

  const query = trpc.templates.get.useQuery({ id }, { staleTime: 30_000 });

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/dashboard/templates");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6">
      <button
        onClick={goBack}
        className="mb-5 flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--color-text-primary)]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to templates
      </button>

      {query.isLoading ? (
        <LoadingSkeleton rows={3} variant="card" />
      ) : query.isError || !query.data ? (
        <ErrorState
          title="Couldn't load that template"
          description="It may have been removed. Browse the full gallery instead."
          retryLabel="Browse templates"
          onRetry={() => router.push("/dashboard/templates")}
        />
      ) : (
        (() => {
          const t = query.data;
          const diff = DIFFICULTY_STYLES[t.difficulty] ?? DIFFICULTY_STYLES.BEGINNER;
          // No hosted preview URL for most templates, so show what's actually
          // inside — the page list — instead of a blank placeholder.
          const pages = Array.isArray(t.pages)
            ? (t.pages as { name?: string }[]).map((p) => p?.name).filter((n): n is string => !!n)
            : [];
          return (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}>
                {t.previewUrl ? (
                  <iframe src={t.previewUrl} title={t.name} className="h-[520px] w-full" />
                ) : (
                  <div className="flex h-[520px] flex-col p-6">
                    <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                      <Globe className="h-4 w-4" /> {pages.length} {pages.length === 1 ? "page" : "pages"} inside
                    </div>
                    {pages.length > 0 ? (
                      <ul className="space-y-1.5 overflow-y-auto">
                        {pages.map((name, i) => (
                          <li key={`${name}-${i}`} className="flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-[13.5px]" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}>
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>{i + 1}</span>
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-1 items-center justify-center">
                        <Globe className="h-12 w-12" style={{ color: "var(--color-text-muted)" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-[22px] font-[680] tracking-tight" style={{ color: "var(--color-text-primary)" }}>{t.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                    {t.category.toLowerCase()}
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ backgroundColor: diff.bg, color: diff.text }}>
                    {diff.label}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{t.usageCount} sites</span>
                </div>

                {t.description && (
                  <p className="mt-4 text-[13.5px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{t.description}</p>
                )}

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => setUseOpen(true)}
                    className="flex h-11 items-center justify-center rounded-lg text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Use this template →
                  </button>
                  {t.previewUrl && (
                    <a
                      href={t.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 items-center justify-center gap-1.5 rounded-lg border text-[14px] font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
                      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                    >
                      Live preview <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <UseTemplateModal templateId={t.id} templateName={t.name} open={useOpen} onClose={() => setUseOpen(false)} />
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
