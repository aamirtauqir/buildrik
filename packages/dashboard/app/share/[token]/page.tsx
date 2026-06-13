import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@lib/prisma";
import { SharePasswordGate } from "./password-gate";

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
    include: { site: { select: { publishedUrl: true, slug: true } } },
  });

  if (!link || !link.isActive) {
    return <SharePasswordGate />; // gate renders the "no longer available" path on submit
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return <SharePasswordGate />;
  }

  // No password → straight through (count handled by the verify route when
  // used; here we just forward).
  if (!link.passwordHash) {
    redirect(link.site.publishedUrl ?? `/${link.site.slug}`);
  }

  // Password set: honor a prior successful verification cookie.
  const jar = await cookies();
  if (jar.get(`share_${token}`)?.value === "1") {
    redirect(link.site.publishedUrl ?? `/${link.site.slug}`);
  }

  return <SharePasswordGate />;
}
