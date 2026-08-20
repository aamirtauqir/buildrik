"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { PageHeader } from "@/components/dashboard/primitives";
import { SubmissionsPanel } from "@/components/site-detail/submissions-panel";
import { ErrorState } from "@/components/states";

export default function SiteFeedbackPage() {
  const params = useParams();
  const siteId = params.id as string;

  const blocksQuery = trpc.forms.listBlocks.useQuery({ siteId });

  return (
    <div>
      <PageHeader
        title="Submissions"
        /* Not "captured from your published site" — nothing on a published
           page posts here yet (see the panel's empty states). */
        description="Form entries sent to this site's form endpoint."
      />
      {blocksQuery.isError ? (
        <ErrorState title="Couldn't load submissions" onRetry={() => blocksQuery.refetch()} />
      ) : (
        <SubmissionsPanel
          siteId={siteId}
          formBlocks={blocksQuery.data ?? []}
          isLoading={blocksQuery.isLoading}
        />
      )}
    </div>
  );
}
