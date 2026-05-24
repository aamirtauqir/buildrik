import { Space_Grotesk } from "next/font/google";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen ${spaceGrotesk.variable}`} style={{ backgroundColor: "var(--color-bg-page)" }}>
      <OnboardingSidebar />
      <main className="ml-[72px] flex min-h-screen items-center justify-center">
        {children}
      </main>
    </div>
  );
}
