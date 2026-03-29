"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { TemplatePreview } from "@/components/templates/template-preview";
import { WizardProgress } from "@/components/ai-wizard/wizard-progress";
import { StepType, BUSINESS_TYPES } from "@/components/ai-wizard/step-type";
import { StepPages } from "@/components/ai-wizard/step-pages";
import { GenerationProgress } from "@/components/ai-wizard/generation-progress";

type View = "choose" | "templates" | "preview" | "ai-type" | "ai-pages" | "ai-progress";

export default function NewSitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const initialMethod = searchParams.get("method");
  const [view, setView] = useState<View>(
    initialMethod === "template" ? "templates" : initialMethod === "ai" ? "ai-type" : "choose"
  );

  const [siteName, setSiteName] = useState(searchParams.get("name") ?? "My New Site");

  // Template state
  const [templateCategory, setTemplateCategory] = useState("ALL");
  const [templateSort, setTemplateSort] = useState("popular");
  const [templatePage, setTemplatePage] = useState(1);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // AI wizard state
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

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
      router.push(`/editor/${site.id}`);
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const createSiteMutation = trpc.sites.create.useMutation({
    onSuccess: (site) => {
      addToast("success", "Blank site created");
      router.push(`/editor/${site.id}`);
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const generateMutation = trpc.templates.generate.create.useMutation({
    onSuccess: (job) => {
      setJobId(job.id);
      setView("ai-progress");
    },
    onError: (err) => addToast("error", "Generation failed", err.message),
  });

  const cancelMutation = trpc.templates.generate.cancel.useMutation({
    onSuccess: () => {
      setJobId(null);
      setView("ai-type");
      addToast("info", "Generation cancelled");
    },
  });

  // Choose method view (default)
  if (view === "choose") {
    return (
      <div className="mx-auto max-w-[600px] pt-12 text-center">
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>
          Create New Site
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
          Choose how you want to get started
        </p>
        <div className="mt-6 text-left">
          <label className="text-sm font-medium" style={{ color: "#7A7A7A" }}>Site name</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#E42313]"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            placeholder="My New Site"
          />
        </div>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => setView("templates")}
            className="flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-[#FAFAFA]"
            style={{ borderColor: "#E8E8E8" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "#F4F4F4" }}>
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Use a Template</p>
              <p className="text-xs" style={{ color: "#7A7A7A" }}>Browse 50+ professionally designed templates</p>
            </div>
          </button>
          <button
            onClick={() => setView("ai-type")}
            className="flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-red-50/30"
            style={{ borderColor: "#E8E8E8" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "#FEF2F2" }}>
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Generate with AI</p>
              <p className="text-xs" style={{ color: "#7A7A7A" }}>Describe your site and let AI build it</p>
            </div>
          </button>
          <button
            onClick={() => createSiteMutation.mutate({ name: siteName.trim() || "My New Site", method: "blank" })}
            disabled={createSiteMutation.isPending}
            className="flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors hover:bg-[#FAFAFA] disabled:opacity-50"
            style={{ borderColor: "#E8E8E8" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "#F4F4F4" }}>
              <span className="text-xl">📄</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Start from Scratch</p>
              <p className="text-xs" style={{ color: "#7A7A7A" }}>Full creative control from the first pixel</p>
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

  // Template preview
  if (view === "preview" && previewQuery.data) {
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

  // AI wizard - step 3 (generation progress)
  if (view === "ai-progress" && jobId) {
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
          onCancel={() => cancelMutation.mutate({ jobId })}
          onRetry={() => {
            setJobId(null);
            setView("ai-pages");
          }}
          onViewSite={(siteId) => router.push(`/editor/${siteId}`)}
        />
      </div>
    );
  }

  return null;
}
