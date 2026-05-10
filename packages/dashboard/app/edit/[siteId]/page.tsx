import { notFound, redirect } from "next/navigation";
import { auth } from "@server/auth";
import { userCanEditSite } from "@server/services/sites.service";
import { EditorClient } from "@/components/editor-route/EditorClient";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/login?next=/edit/${encodeURIComponent(siteId)}`);
  }

  const ok = await userCanEditSite(session.user.id, siteId);
  if (!ok) notFound();

  return <EditorClient siteId={siteId} />;
}
