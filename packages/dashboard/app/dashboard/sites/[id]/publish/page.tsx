"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { PrePublishChecks } from "@/components/publish/pre-publish-checks";
import { PublishProgress } from "@/components/publish/publish-progress";
import { PublishSuccess } from "@/components/publish/publish-success";

type Phase = "checks" | "publishing" | "success" | "error";

export default function PublishPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;
  const [phase, setPhase] = useState<Phase>("checks");
  const [jobId, setJobId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const site = trpc.sites.get.useQuery({ id: siteId });
  const domains = trpc.siteDetail.domains.list.useQuery({ siteId });
  const billing = trpc.billing.overview.useQuery();
  const checks = trpc.sites.prePublishChecks.useQuery(
    { siteId },
    { enabled: phase === "checks" }
  );

  const publishMutation = trpc.sites.publish.useMutation({
    onSuccess(data) {
      setJobId(data.id);
      setPhase("publishing");
      setPublishError(null);
    },
    onError(err) {
      setPublishError(err.message);
      setPhase("error");
    },
  });

  function handlePublish() {
    publishMutation.mutate({ siteId });
  }

  const handleComplete = useCallback(() => {
    setPhase("success");
  }, []);

  function handleCancelPublish() {
    setPhase("checks");
    setJobId(null);
  }

  function handleRetryFromError() {
    setPublishError(null);
    setPhase("checks");
  }

  const slug = site.data?.slug ?? "";
  const customDomain = domains.data?.find((d: { status: string; domain: string }) => d.status === "VERIFIED")?.domain ?? null;
  const plan = billing.data?.plan ?? "FREE";

  if (phase === "checks") {
    if (checks.isLoading) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200" style={{ borderTopColor: "var(--color-primary)" }} />
        </div>
      );
    }
    if (!checks.data) return null;
    return (
      <PrePublishChecks
        checks={checks.data}
        onPublish={handlePublish}
        onCancel={() => router.back()}
      />
    );
  }

  if (phase === "publishing" && jobId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <PublishProgress
          jobId={jobId}
          onComplete={handleComplete}
          onCancel={handleCancelPublish}
          onRetry={handlePublish}
        />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>Publish Error</p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{publishError ?? "Something went wrong."}</p>
          <button
            onClick={handleRetryFromError}
            className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <PublishSuccess
        siteId={siteId}
        slug={slug}
        customDomain={customDomain}
        plan={plan}
      />
    </div>
  );
}
