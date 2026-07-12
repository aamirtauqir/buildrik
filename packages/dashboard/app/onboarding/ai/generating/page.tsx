"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import type { WizardData } from "@buildrik/shared/schemas/onboarding";

const INDUSTRY_TO_TYPE: Record<string, "PORTFOLIO" | "BUSINESS" | "BLOG" | "RESTAURANT" | "AGENCY" | "ECOMMERCE"> = {
  restaurant: "RESTAURANT",
  clinic: "BUSINESS",
  agency: "AGENCY",
  shop: "ECOMMERCE",
  portfolio: "PORTFOLIO",
  events: "BUSINESS",
  saas: "BUSINESS",
  other: "BUSINESS",
};

const TONE_MAP: Record<string, "professional" | "casual" | "creative" | "minimal" | "bold" | "playful"> = {
  professional: "professional",
  friendly: "casual",
  premium: "creative",
  bold: "bold",
  minimal: "minimal",
};

const GOAL_LABEL: Record<string, string> = {
  leads: "get leads",
  calls: "book calls",
  sell: "sell products",
  portfolio: "show portfolio",
  inform: "share information",
};

// Fold the rich A2/A3 answers the generate schema doesn't take (goal, audience,
// CTA, location, style, colors) into the description so the AI still uses them.
function buildInput(ai: NonNullable<WizardData["ai"]>) {
  const parts = [ai.desc];
  if (ai.goal) parts.push(`Goal: ${GOAL_LABEL[ai.goal] ?? ai.goal}.`);
  if (ai.audience) parts.push(`Audience: ${ai.audience}.`);
  if (ai.cta) parts.push(`Primary CTA: ${ai.cta}.`);
  if (ai.location) parts.push(`Location: ${ai.location}.`);
  if (ai.style) parts.push(`Visual style: ${ai.style}.`);
  if (ai.color) parts.push(`Colors: ${ai.color}.`);
  return {
    name: (ai.name ?? "My Site").slice(0, 100),
    businessType: INDUSTRY_TO_TYPE[ai.industry ?? "other"] ?? "BUSINESS",
    pages: (ai.pages && ai.pages.length ? ai.pages : ["Home", "About", "Contact"]).slice(0, 8),
    description: parts.filter(Boolean).join(" ").slice(0, 500),
    tone: TONE_MAP[ai.tone ?? "professional"] ?? "professional",
    content: "generate" as const,
    // Real seeded photos so the first AI draft looks finished, not grey-boxed.
    images: "stock" as const,
  };
}

// Turn backend error codes into something a person can read.
function friendlyError(msg: string): string {
  if (msg.includes("AI_MONTHLY_LIMIT")) return "You've used all your AI drafts for this month. Try a template or blank canvas instead.";
  if (msg.includes("rate limited") || msg.includes("AI_RATE_LIMITED")) return "Too many AI drafts in a short time. Wait a bit, or start from a template or blank canvas.";
  if (msg.includes("OPENAI_API_KEY") || msg.includes("credentials")) return "AI drafting isn't configured yet. Start from a template or blank canvas for now.";
  return msg;
}

const STEPS = [
  { label: "Creating sitemap", at: 5 },
  { label: "Writing page sections", at: 40 },
  { label: "Building wireframe layout", at: 70 },
  { label: "Preparing editor", at: 95 },
];

/** A4 · Generating. Fires the real generation job, polls status, and advances to
 *  A5 on completion. Requires a configured AI provider (OPENAI_API_KEY); without
 *  it the job fails and this surfaces the error with a way back. */
export default function AiGeneratingPage() {
  const router = useRouter();
  const { data, saveAndGo } = useWizard();
  const started = useRef(false);
  const [jobId, setJobId] = useState<string>();
  const [error, setError] = useState<string>();

  const createJob = trpc.templates.generate.create.useMutation();
  const cancelJob = trpc.templates.generate.cancel.useMutation();
  const statusQ = trpc.templates.generate.status.useQuery(
    { jobId: jobId! },
    // Keep polling even when the tab is backgrounded — generation takes minutes
    // and users switch away; without this the poll pauses and never sees the
    // terminal COMPLETED/FAILED state, stranding them on the spinner.
    { enabled: !!jobId, refetchInterval: 2000, refetchIntervalInBackground: true }
  );

  // Kick off exactly once.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!data.ai?.industry || !data.ai?.name) {
      router.replace("/onboarding/ai/basics");
      return;
    }
    createJob
      .mutateAsync(buildInput(data.ai))
      .then((job) => setJobId(job.id))
      .catch((e) => setError(e instanceof Error ? friendlyError(e.message) : "Couldn't start generation."));
  }, [data.ai, createJob, router]);

  // React to terminal status.
  const status = statusQ.data;
  useEffect(() => {
    if (!status) return;
    if (status.status === "COMPLETED" && status.siteId) {
      saveAndGo("/onboarding/ai/preview", { siteId: status.siteId, path: "ai" });
    } else if (status.status === "FAILED") {
      setError(friendlyError(status.error ?? "Generation failed. Please try again."));
    }
  }, [status, saveAndGo]);

  const progress = status?.progress ?? (jobId ? 5 : 0);

  async function cancel() {
    if (jobId) {
      try {
        await cancelJob.mutateAsync({ jobId });
      } catch {
        /* best-effort */
      }
    }
    router.push("/onboarding/ai/brand");
  }

  return (
    <WizardShell chrome={{ variant: "simple" }}>
      {error ? (
        <div className="text-center">
          <AlertCircle className="mx-auto w-10 h-10 text-onb-error" />
          <h1 className="mt-4 text-onb-title font-bold text-onb-ink">Couldn't create your draft</h1>
          <p className="mt-2 text-sm text-onb-muted">{error}</p>
          <div className="mt-8 flex flex-col gap-2">
            <OnbButton onClick={() => router.push("/onboarding/ai/brand")}>Edit answers &amp; retry</OnbButton>
            <button
              type="button"
              onClick={() => router.push("/onboarding/path")}
              className="text-sm text-onb-muted hover:text-onb-text"
            >
              Choose a different path
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-10">
            <h1 className="text-onb-title font-bold text-onb-ink">Creating your site draft</h1>
            <p className="mt-2 text-sm text-onb-muted">This usually takes a moment.</p>
          </div>

          <div className="flex flex-col gap-3 mb-10">
            {STEPS.map((s) => {
              const done = progress > s.at + 25;
              const active = progress >= s.at && !done;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border shrink-0",
                      done ? "border-onb-primary bg-onb-primary text-white" : active ? "border-onb-primary text-onb-primary" : "border-onb-line text-onb-subtle"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  </span>
                  <span className={cn("text-sm", done || active ? "text-onb-ink font-medium" : "text-onb-subtle")}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={cancel} className="w-full text-center text-sm text-onb-muted hover:text-onb-text">
            Cancel and go back
          </button>
        </>
      )}
    </WizardShell>
  );
}
