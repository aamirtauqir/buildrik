import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ email?: string; returnUrl?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { email, returnUrl, next } = await searchParams;
  // Forward the post-login destination — /auth already honours ?returnUrl (and
  // validates it via safeReturnUrl). Dropping it here sent logged-out users who
  // followed a transfer-accept or editor deep-link back to /dashboard instead of
  // their destination.
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  const dest = returnUrl ?? next;
  if (dest) params.set("returnUrl", dest);
  const qs = params.toString();
  redirect(qs ? `/auth?${qs}` : "/auth");
}
