import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getOnboardingState } from "@/server/services/onboarding.service";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const state = await getOnboardingState(session.user.id);

  if (state.completed || state.dismissed) {
    redirect("/dashboard");
  }

  if (!state.step || state.step === "ROLE_SELECT") {
    redirect("/onboarding/role");
  }

  if (state.step === "PROJECT_SETUP") {
    redirect("/onboarding/setup");
  }

  redirect("/dashboard");
}
