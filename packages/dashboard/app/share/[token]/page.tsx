import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@lib/prisma";
import { shareDestination } from "@lib/share-destination";
import { SharePasswordGate } from "./password-gate";
import { ShareNotPublished } from "./not-published";

export const dynamic = "force-dynamic";

// Server component. The verify-password endpoint sets a `share_<token>` cookie
// on success; this honors it so a returning visitor skips the prompt instead
// of re-entering the password (the cookie was previously set but read by
// nothing). Note: this gate guards the share *page* — a published site is also
// reachable at its own URL, so a hard access boundary needs Vercel deployment
// protection (publishedPassword), which is enforced separately at publish.
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { site: { select: { publishedUrl: true, slug: true, name: true } } },
  });

  if (!link || !link.isActive) {
    return <SharePasswordGate />; // gate renders the "no longer available" path on submit
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return <SharePasswordGate />;
  }

  /* Nothing to send them to: the site has never been published, and no draft
     renderer exists on the server. This used to redirect to `/<slug>`, which is
     not a route — the visitor got a 404 with no idea whether the link was
     broken, expired, or wrong. */
  const destination = shareDestination(link.site);
  if (!destination) {
    return <ShareNotPublished siteName={link.site.name} />;
  }

  // No password → straight through (count handled by the verify route when
  // used; here we just forward).
  if (!link.passwordHash) {
    redirect(destination);
  }

  // Password set: honor a prior successful verification cookie.
  const jar = await cookies();
  if (jar.get(`share_${token}`)?.value === "1") {
    redirect(destination);
  }

  return <SharePasswordGate />;
}
