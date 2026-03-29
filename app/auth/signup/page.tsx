import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { email } = await searchParams;
  const dest = email ? `/auth?email=${encodeURIComponent(email)}` : "/auth";
  redirect(dest);
}
