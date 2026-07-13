import { Suspense } from "react";
import { IntegrationsContent } from "@/components/settings/integrations-content";

export default function IntegrationsPage() {
  return (
    // useSearchParams (OAuth ?error) needs a Suspense boundary to prerender.
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />}>
      <IntegrationsContent />
    </Suspense>
  );
}
