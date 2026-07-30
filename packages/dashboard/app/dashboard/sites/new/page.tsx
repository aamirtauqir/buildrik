"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutTemplate, Sparkles, FileText } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { InputField } from "@/components/dashboard/primitives";
import { WizardProgress } from "@/components/ai-wizard/wizard-progress";
import { StepType, BUSINESS_TYPES } from "@/components/ai-wizard/step-type";
import { StepPages } from "@/components/ai-wizard/step-pages";
import { GenerationProgress } from "@/components/ai-wizard/generation-progress";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

import { initialViewFor, isTemplateRedirect, type NewSiteView as View } from "./initial-view";

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

  // Templates live in their own full browser now. A template-shaped URL
  // (?method=template from empty-state / quick-actions / the create modal, or a
  // bare ?template=<id>) redirects there instead of opening a view here — the
  // single canonical template surface.
  const redirectToTemplates = isTemplateRedirect(searchParams.get("method"), searchParams.get("template"));
  useEffect(() => {
    if (redirectToTemplates) router.replace("/dashboard/templates");
  }, [redirectToTemplates, router]);

  const [view, setView] = useState<View>(initialViewFor(searchParams.get("method")));
  const [siteName, setSiteName] = useState(searchParams.get("name") ?? "My New Site");

  // AI wizard state
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState(false);

  const jobStatusQuery = trpc.templates.generate.status.useQuery(
    { jobId: jobId! },
    { enabled: !!jobId && view === "ai-progress", refetchInterval: 2000 }
  );

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

  // Mid-redirect (template URL): render nothing rather than flashing the chooser.
  if (redirectToTemplates) return null;

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
          <InputField
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            wrapperClassName="mt-1 w-full"
            placeholder="My New Site"
          />
        </div>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => router.push("/dashboard/templates")}
            className="flex w-full items-center gap-4 rounded-lg border p-5 text-left transition-colors hover:bg-[var(--color-bg-page)]"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <LayoutTemplate className="h-6 w-6" style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div>
              <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Use a Template</p>
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Browse the full template gallery</p>
            </div>
          </button>
          <button
            onClick={() => setView("ai-type")}
            className="flex w-full items-center gap-4 rounded-lg border p-5 text-left transition-colors hover:bg-[var(--color-primary-subtle)]/30"
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
            className="flex w-full items-center gap-4 rounded-lg border p-5 text-left transition-colors hover:bg-[var(--color-bg-page)] disabled:opacity-50"
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
    // A polling error (e.g. the job row vanished → NOT_FOUND) used to be
    // swallowed, leaving the user stuck on "Queued 0%" forever. Surface it as a
    // failure so the error path (retry / use a template / start blank) shows.
    const pollErrored = jobId && !creditsExhausted && jobStatusQuery.isError;
    return (
      <div className="pt-8">
        <WizardProgress step={3} total={3} />
        <GenerationProgress
          status={pollErrored ? "FAILED" : (status?.status ?? "QUEUED")}
          progress={status?.progress ?? 0}
          steps={(status?.steps ?? null) as { step: string; status: string }[] | null}
          error={pollErrored ? "We lost track of this generation. Please try again." : (status?.error ?? null)}
          siteId={status?.siteId ?? null}
          creditsExhausted={creditsExhausted}
          onUpgrade={() => router.push("/dashboard/settings/billing")}
          onUseTemplate={() => router.push("/dashboard/templates")}
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
