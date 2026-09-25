import { notFound, redirect } from "next/navigation";
import { auth } from "@server/auth";
import { getEditorAccess } from "@server/services/sites.service";
import { EditorClient } from "@/components/editor-route/EditorClient";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { siteId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    // Preserve the deep-link (?el=<id>&page=<slug>, etc.) through the login
    // round trip — dropping it landed a signed-out visitor back at the bare
    // editor with the element/page they were on lost. The query is folded
    // into `next` as one encoded segment so it survives login's own parsing
    // of `next` as a single value.
    const query = (await searchParams) ?? {};
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (typeof v === "string") qs.set(k, v);
    }
    const qsString = qs.toString();
    redirect(
      `/auth/login?next=/edit/${encodeURIComponent(siteId)}${qsString ? encodeURIComponent(`?${qsString}`) : ""}`,
    );
  }

  const access = await getEditorAccess(session.user.id, siteId);
  if (!access) notFound();

  /* A VIEWER opens the editor in its read-only view mode, which is a URL mode
     (`?view=readonly`, read by the editor's getEditorViewMode). Forcing it here
     keeps one source of truth: the editor needs no second "viewer" switch, and
     dropping the param just lands back on this redirect. Server writes are
     role-gated independently, so the URL is presentation, not the lock. */
  if (access === "view") {
    const query = (await searchParams) ?? {};
    if (query.view !== "readonly") {
      const next = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (typeof v === "string") next.set(k, v);
      }
      next.set("view", "readonly");
      redirect(`/edit/${encodeURIComponent(siteId)}?${next.toString()}`);
    }
  }

  return <EditorClient siteId={siteId} />;
}
