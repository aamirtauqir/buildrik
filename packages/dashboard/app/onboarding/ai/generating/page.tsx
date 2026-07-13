"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
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
  if (ai.refs) parts.push(`Reference sites: ${ai.refs}.`);
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

  // React to terminal status. The poll keeps running until this unmounts, so the
  // handoff is latched — otherwise a second COMPLETED tick fires saveAndGo again
  // while the first is still in flight.
  const status = statusQ.data;
  const settled = useRef(false);
  useEffect(() => {
    if (!status || settled.current) return;
    if (status.status === "COMPLETED") {
      settled.current = true;
      // `siteId` is nullable. Without this branch a completed-but-siteless job
      // matches no case and the user watches the spinner forever.
      if (status.siteId) {
        saveAndGo("/onboarding/ai/preview", { siteId: status.siteId, path: "ai" });
      } else {
        setError("The draft finished but no site came back. Please try again.");
      }
    } else if (status.status === "FAILED") {
      settled.current = true;
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
    <WizardShell chrome={{ variant: "simple" }} header="compact" padY={100}>
      {error ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-10 w-10 text-onb-error" />
            <h1 className="text-onb-title font-bold text-onb-text">Couldn't create your draft</h1>
            <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">{error}</p>
          </div>
          <div className="flex w-full flex-col gap-6">
            <OnbButton onClick={() => router.push("/onboarding/ai/brand")}>Edit answers &amp; retry</OnbButton>
            <OnbBack to="/onboarding/path">Choose a different path</OnbBack>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-onb-title font-bold text-onb-text">Creating your site draft</h1>
            <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">This usually takes a moment.</p>
          </div>

          <div className="flex w-[280px] flex-col gap-5">
            {STEPS.map((s) => {
              const done = progress > s.at + 25;
              const active = progress >= s.at && !done;
              return (
                <div key={s.label} className={cn("flex items-center gap-3", !done && !active && "opacity-40")}>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-onb-success" strokeWidth={3} />
                    ) : (
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full",
                          active ? "bg-onb-primary" : "shadow-[inset_0_0_0_2px_var(--color-onb-muted)]"
                        )}
                      />
                    )}
                  </span>
                  <span className={cn("text-[15px] text-onb-text", active ? "font-bold" : "font-medium")}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex w-[400px] flex-col items-center gap-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-onb-line">
              <div className="h-full rounded-full bg-onb-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <button
              type="button"
              onClick={cancel}
              className="text-[13px] font-semibold text-onb-muted transition-colors hover:text-onb-text"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      )}
    </WizardShell>
  );
}
