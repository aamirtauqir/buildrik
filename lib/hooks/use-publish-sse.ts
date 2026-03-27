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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retries = 0;

    function connect() {
      es = new EventSource(`/api/sse/publish/${jobId}`);

      es.addEventListener("status", (e: MessageEvent) => {
        setJob(JSON.parse(e.data));
        retries = 0;
      });

      es.onerror = () => {
        es.close();
        if (retries >= 3) {
          // Give up after 3 retries; tRPC polling will take over
          setFailed(true);
          return;
        }
        retries++;
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [jobId]);

  // Return null if SSE permanently failed so caller falls back to tRPC polling
  return failed ? null : job;
}
