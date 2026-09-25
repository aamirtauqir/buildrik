import { redirect } from "next/navigation";

/**
 * A-16: the dashboard's own publish flow can never actually deploy — the
 * worker (`app/api/workers/publish/[jobId]/route.ts`) refuses any job with
 * no page-HTML payload ("No page content to deploy...") unless
 * PUBLISH_ALLOW_SIMULATION is set, and only the EDITOR renders that payload.
 * `handlePublish` here called `sites.publish` with no `pages`, so every
 * dashboard publish attempt failed after creating a job row. Publish lives
 * in the editor under any PD-18 answer today (no server-side renderer
 * exists yet) — redirect here instead of running a flow that cannot
 * succeed.
 */
export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/edit/${encodeURIComponent(id)}`);
}
