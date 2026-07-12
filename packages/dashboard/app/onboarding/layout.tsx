import { WizardBoot } from "@/components/onboarding/wizard/wizard-boot";

/** M2 wizard shell host. WizardBoot loads server state once and provides it to
 *  every frame; it lives here so the provider persists across frame routes. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <WizardBoot>{children}</WizardBoot>;
}
