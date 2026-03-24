"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { PrePublishChecks } from "@/components/publish/pre-publish-checks";
import { PublishProgress } from "@/components/publish/publish-progress";
import { PublishSuccess } from "@/components/publish/publish-success";
import { PUBLISH_STEPS } from "@/components/publish/publish-progress";

type Phase = "checks" | "publishing" | "success";

export default function PublishPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;
  const [phase, setPhase] = useState<Phase>("checks");
  const [jobId, setJobId] = useState<string | null>(null);

  const checks = trpc.sites.prePublishChecks.useQuery(
    { siteId },
    { enabled: phase === "checks" }
  );

  const publishMutation = trpc.sites.publish.useMutation({
    onSuccess(data) {
      setJobId(data.id);
      setPhase("publishing");
    },
  });

  const cancelMutation = trpc.sites.cancelPublish.useMutation({
    onSuccess() {
      setPhase("checks");
      setJobId(null);
    },
  });

  const status = trpc.sites.publishStatus.useQuery(
    { jobId: jobId! },
    {
      enabled: phase === "publishing" && !!jobId,
      refetchInterval: 2000,
      refetchIntervalInBackground: false,
    }
  );

  const isComplete = status.data?.status === "COMPLETED";
  if (isComplete && phase === "publishing") {
    setPhase("success");
  }

  function handlePublish() {
    publishMutation.mutate({ siteId });
  }

  function handleCancelPublish() {
    if (jobId) cancelMutation.mutate({ jobId });
  }

  function currentStep(): number {
    if (!status.data) return 0;
    const progress = status.data.progress;
    return Math.min(Math.floor((progress / 100) * PUBLISH_STEPS.length), PUBLISH_STEPS.length - 1);
  }

  if (phase === "checks") {
    if (checks.isLoading) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200" style={{ borderTopColor: "#E42313" }} />
        </div>
      );
    }
    if (!checks.data) return null;
    return (
      <PrePublishChecks
        checks={checks.data}
        onPublish={() => handlePublish()}
        onCancel={() => router.back()}
      />
    );
  }

  if (phase === "publishing") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <PublishProgress
          progress={status.data?.progress ?? 0}
          currentStep={currentStep()}
          onCancel={handleCancelPublish}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <PublishSuccess
        siteId={siteId}
        publicUrl={status.data?.deploymentId ? `https://${status.data.deploymentId}.buildrik.com` : ""}
        lighthouseScore={null}
      />
    </div>
  );
}
