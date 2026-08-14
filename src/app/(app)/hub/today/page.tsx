import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { IntelligenceTodayClient } from "@/components/intelligence/intelligence-today-client";
import { IntelligenceAlerts } from "@/components/intelligence/intelligence-alerts";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Your Intelligence Today",
};

export default async function IntelligenceTodayPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  return (
    <div className="space-y-6">
      <IntelligenceAlerts userId={session.user.id} />
      <IntelligenceTodayClient />
    </div>
  );
}
