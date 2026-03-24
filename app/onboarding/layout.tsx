import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <OnboardingSidebar />
      <main className="ml-[72px] flex min-h-screen items-center justify-center">
        {children}
      </main>
    </div>
  );
}
