import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { ExpertInvitePanel } from "@/components/dashboard/expert-invite-panel";
import { prisma } from "@/infrastructure/database/prisma";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Invite experts",
};

export default async function HubInvitePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const referralCount = await prisma.profile.count({
    where: { referrerUsername: session.profile.username },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <ExpertInvitePanel
        username={session.profile.username}
        displayName={session.profile.displayName}
        referralCount={referralCount}
      />
    </div>
  );
}
