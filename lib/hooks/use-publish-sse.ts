"use client";

import { useEffect, useState } from "react";

export interface PublishJobState {
  id: string;
  siteId: string;
  status: string;
  progress: number;
  steps: unknown;
  error: string | null;
  deploymentId: string | null;
}

export function usePublishSSE(jobId: string | null) {
  const [job, setJob] = useState<PublishJobState | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/sse/publish/${jobId}`);

    es.addEventListener("status", (e) => {
      setJob(JSON.parse(e.data));
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [jobId]);

  return job;
}
