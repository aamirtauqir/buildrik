import { PageHeader } from "@/components/dashboard/primitives";
import { IntegrationsContent } from "@/components/settings/integrations-content";

export default function AppsIntegrationsPage() {
  return (
    <div>
      <PageHeader title="Apps & Integrations" description="Connect Buildrick to the tools your team already uses." />
      <IntegrationsContent />
    </div>
  );
}
