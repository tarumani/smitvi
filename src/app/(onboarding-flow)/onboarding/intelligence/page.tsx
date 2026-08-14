import type { Metadata } from "next";
import { IntelligenceOnboardingWizard } from "@/components/onboarding/intelligence-onboarding-wizard";

export const metadata: Metadata = {
  title: "Build your Intelligence Profile",
};

export default function IntelligenceOnboardingPage() {
  return <IntelligenceOnboardingWizard mode="onboarding" />;
}
