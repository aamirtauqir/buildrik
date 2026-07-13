import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/primitives";
import { IntegrationsContent } from "@/components/settings/integrations-content";

export default function AppsIntegrationsPage() {
  return (
    <div>
      <PageHeader title="Apps & Integrations" description="Connect Buildrick to the tools your team already uses." />
      {/* IntegrationsContent reads the OAuth ?error param with useSearchParams, which
          fails static prerendering unless it sits behind a Suspense boundary. */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />}>
        <IntegrationsContent />
      </Suspense>
    </div>
  );
}
