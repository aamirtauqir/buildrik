"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutTemplate, Sparkles, FileText } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { TemplatePreview } from "@/components/templates/template-preview";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { WizardProgress } from "@/components/ai-wizard/wizard-progress";
import { StepType, BUSINESS_TYPES } from "@/components/ai-wizard/step-type";
import { StepPages } from "@/components/ai-wizard/step-pages";
import { GenerationProgress } from "@/components/ai-wizard/generation-progress";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

import { initialViewFor, type NewSiteView as View } from "./initial-view";

// Wraps NewSitePageInner in Suspense because useSearchParams() requires it
// in Next.js 16 production builds (causes CSR bailout error otherwise).
export default function NewSitePage() {
  return (
    <Suspense fallback={null}>
      <NewSitePageInner />
    </Suspense>
  );
}

function NewSitePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const unified = useUnifiedEditorFlag();

  // Deep link into one template's preview (from the Templates tab cards) via
  // ?template=<id>, instead of `?method=template` which only lands on the full
  // gallery. See initial-view.ts for the routing.
  const initial = initialViewFor({
    method: searchParams.get("method"),
    template: searchParams.get("template"),
  });
  const [view, setView] = useState<View>(initial.view);

  const [siteName, setSiteName] = useState(searchParams.get("name") ?? "My New Site");

  // Template state
  const [templateCategory, setTemplateCategory] = useState("ALL");
  const [templateSort, setTemplateSort] = useState("popular");
  const [templatePage, setTemplatePage] = useState(1);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(initial.previewTemplateId);

  // AI wizard state
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState(false);

  // Queries
  const templatesQuery = trpc.templates.list.useQuery(
    {
      category: templateCategory as "ALL" | "PORTFOLIO" | "BUSINESS" | "BLOG" | "AGENCY" | "ECOMMERCE" | "RESTAURANT",
      page: templatePage,
      perPage: 6,
      sort: templateSort as "popular" | "newest" | "alphabetical",
    },
    { enabled: view === "templates" }
  );

  const previewQuery = trpc.templates.get.useQuery(
    { id: previewTemplateId! },
    { enabled: !!previewTemplateId && view === "preview" }
  );

  const jobStatusQuery = trpc.templates.generate.status.useQuery(
    { jobId: jobId! },
    { enabled: !!jobId && view === "ai-progress", refetchInterval: 2000 }
  );

  // Mutations
  const useTemplateMutation = trpc.templates.use.useMutation({
    onSuccess: (site) => {
      addToast("success", "Site created from template");
      const href = getEditorHref(site.id, unified);
      if (unified) router.push(href);
      else window.location.href = href;
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const createSiteMutation = trpc.sites.create.useMutation({
    onSuccess: (site) => {
      addToast("success", "Blank site created");
      const href = getEditorHref(site.id, unified);
      if (unified) router.push(href);
      else window.location.href = href;
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const generateMutation = trpc.templates.generate.create.useMutation({
    onSuccess: (job) => {
      setJobId(job.id);
      setCreditsExhausted(false);
      setView("ai-progress");
    },
    onError: (err) => {
      // Monthly AI quota gone — surface the upgrade/template modal instead of
      // a raw failure toast (the modal props existed but were never wired).
      if (err.message === "AI_MONTHLY_LIMIT") {
        setCreditsExhausted(true);
        setView("ai-progress");
        return;
      }
      addToast("error", "Generation failed", err.message);
    },
  });

  const cancelMutation = trpc.templates.generate.cancel.useMutation({
    onSuccess: () => {
      setJobId(null);
      setView("ai-type");
      addToast("info", "Generation cancelled");
    },
    onError: (err) => addToast("error", "Couldn't cancel", err.message),
  });

  // Choose method view (default)
  if (view === "choose") {
    return (
      <div className="mx-auto max-w-[600px] pt-12 text-center">
        <h1 className="text-page-title" style={{ color: "var(--color-text-primary)" }}>
          Create New Site
        </h1>
        <p className="mt-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
          Choose how you want to get started
        </p>
        <div className="mt-6 text-left">
          <label className="text-body font-medium" style={{ color: "var(--color-text-secondary)" }}>Site name</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-body outline-none focus:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            placeholder="My New Site"
          />
        </div>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => setView("templates")}
            className="flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-[var(--color-bg-page)]"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <LayoutTemplate className="h-6 w-6" style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div>
              <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Use a Template</p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Browse 50+ professionally designed templates</p>
            </div>
          </button>
          <button
            onClick={() => setView("ai-type")}
            className="flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-[var(--color-primary-subtle)]/30"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)" }}>
              <Sparkles className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Generate with AI</p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Describe your site and let AI build it</p>
            </div>
          </button>
          <button
            onClick={() => createSiteMutation.mutate({ name: siteName.trim() || "My New Site", method: "blank" })}
            disabled={createSiteMutation.isPending}
            className="flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-50"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <FileText className="h-6 w-6" style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div>
              <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Start from Scratch</p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Full creative control from the first pixel</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Template gallery
  if (view === "templates") {
    return (
      <TemplateGallery
        open={true}
        onClose={() => setView("choose")}
        templates={templatesQuery.data?.data ?? []}
        isLoading={templatesQuery.isLoading}
        category={templateCategory}
        onCategoryChange={(cat) => { setTemplateCategory(cat); setTemplatePage(1); }}
        sort={templateSort}
        onSortChange={setTemplateSort}
        onPreview={(id) => { setPreviewTemplateId(id); setView("preview"); }}
        onUse={(id) => useTemplateMutation.mutate({ templateId: id, siteName })}
        onLoadMore={() => setTemplatePage((p) => p + 1)}
        hasMore={(templatesQuery.data?.page ?? 0) < (templatesQuery.data?.totalPages ?? 0)}
        onStartBlank={() => createSiteMutation.mutate({ name: siteName, method: "blank" })}
      />
    );
  }

  // Template preview. On a deep link (?template=<id>) this is the first view, so
  // it has to cover the cold-load states the in-app path never hit: the data is
  // still fetching, or the id is bad. Without this the page fell through to the
  // final `return null` and showed a blank screen.
  if (view === "preview") {
    if (previewQuery.isLoading) {
      return (
        <div className="pt-8">
          <LoadingSkeleton rows={3} variant="card" />
        </div>
      );
    }
    if (previewQuery.isError || !previewQuery.data) {
      return (
        <div className="pt-8">
          <ErrorState
            title="Couldn't load that template"
            description="It may have been removed. Browse the full gallery instead."
            retryLabel="Browse templates"
            onRetry={() => setView("templates")}
          />
        </div>
      );
    }
    return (
      <TemplatePreview
        template={previewQuery.data as any}
        onBack={() => setView("templates")}
        onUse={() => useTemplateMutation.mutate({ templateId: previewQuery.data!.id, siteName })}
      />
    );
  }

  // AI wizard - step 1
  if (view === "ai-type") {
    return (
      <div className="pt-8">
        <WizardProgress step={1} total={3} />
        <StepType
          selected={businessType}
          onSelect={setBusinessType}
          onNext={() => setView("ai-pages")}
        />
      </div>
    );
  }

  // AI wizard - step 2
  if (view === "ai-pages" && businessType) {
    const typeConfig = BUSINESS_TYPES.find((t) => t.value === businessType);
    return (
      <div className="pt-8">
        <WizardProgress step={2} total={3} />
        <StepPages
          businessType={businessType}
          suggestedPages={typeConfig?.pages ? [...typeConfig.pages] : []}
          onBack={() => setView("ai-type")}
          onGenerate={(data) =>
            generateMutation.mutate({
              name: siteName,
              businessType: businessType as "PORTFOLIO" | "BUSINESS" | "BLOG" | "RESTAURANT" | "AGENCY" | "ECOMMERCE",
              pages: data.pages,
              description: data.description,
              tone: data.tone as "bold" | "professional" | "casual" | "creative" | "minimal" | "playful" | undefined,
              content: data.content as "generate" | "lorem" | "empty" | undefined,
              images: data.images as "stock" | "placeholders" | "none" | undefined,
            })
          }
        />
      </div>
    );
  }

  // AI wizard - step 3 (generation progress; also hosts the credits-exhausted
  // modal, which can fire before any job exists)
  if (view === "ai-progress" && (jobId || creditsExhausted)) {
    const status = jobStatusQuery.data;
    return (
      <div className="pt-8">
        <WizardProgress step={3} total={3} />
        <GenerationProgress
          status={status?.status ?? "QUEUED"}
          progress={status?.progress ?? 0}
          steps={(status?.steps ?? null) as { step: string; status: string }[] | null}
          error={status?.error ?? null}
          siteId={status?.siteId ?? null}
          creditsExhausted={creditsExhausted}
          onUpgrade={() => router.push("/dashboard/settings/billing")}
          onUseTemplate={() => {
            setCreditsExhausted(false);
            setJobId(null);
            setView("templates");
          }}
          onStartBlank={() => {
            setCreditsExhausted(false);
            setJobId(null);
            createSiteMutation.mutate({ name: siteName, method: "blank" });
          }}
          onCancel={() => jobId && cancelMutation.mutate({ jobId })}
          onRetry={() => {
            setJobId(null);
            setView("ai-pages");
          }}
          onViewSite={(siteId) => {
            const href = getEditorHref(siteId, unified);
            if (unified) router.push(href);
            else window.location.href = href;
          }}
        />
      </div>
    );
  }

  return null;
}
