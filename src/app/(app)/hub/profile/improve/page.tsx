import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { IntelligenceOnboardingWizard } from "@/components/onboarding/intelligence-onboarding-wizard";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Improve your Intelligence Profile",
};

export default async function ImproveProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  return (
    <div className="mx-auto max-w-3xl py-8">
      <IntelligenceOnboardingWizard mode="improve" />
    </div>
  );
}
