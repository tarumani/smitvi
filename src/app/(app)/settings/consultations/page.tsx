import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ConsultationInbox } from "@/components/consultations/consultation-inbox";
import { ConsultationOfferForm } from "@/components/consultations/consultation-offer-form";
import { LaunchWizardReturnBanner } from "@/components/dashboard/launch-wizard-return-banner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";

export const metadata: Metadata = {
  title: "Consultations",
};

type PageProps = {
  searchParams: Promise<{ setup?: string; from?: string }>;
};

export default async function ConsultationSettingsPage({ searchParams }: PageProps) {
  const { from, setup } = await searchParams;
  if (setup === "1") {
    redirect(ROUTES.consultationSetup);
  }
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const userId = session.user.id;

  const [offer, requests, profileRow] = await Promise.all([
    container.consultations.getOfferByUserId(userId),
    container.consultations.listRequestsForExpert(userId),
    prisma.profile.findUnique({
      where: { userId },
      select: {
        displayName: true,
        profession: true,
        headline: true,
        bio: true,
        username: true,
      },
    }),
  ]);

  const showWizard = !offer;

  const offerInitial = offer
    ? {
        enabled: offer.enabled,
        headline: offer.headline ?? "",
        description: offer.description ?? "",
        durationMinutes: offer.durationMinutes,
        priceCents: offer.priceCents,
        currency: offer.currency,
      }
    : {
        enabled: true,
        headline: "",
        description: "",
        durationMinutes: 0,
        priceCents: 0,
        currency: "USD",
      };

  const profileHint = [
    profileRow?.displayName,
    profileRow?.headline,
    profileRow?.profession,
    profileRow?.bio,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {from === "launch" ? <LaunchWizardReturnBanner step="book" /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            Monetize
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            {showWizard ? "Set up booking" : "Consultations"}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {showWizard
              ? "Enable the Book tab on your public hub so visitors can request time with you."
              : "Offer booking on your public profile and manage incoming requests."}
          </p>
        </div>
        {offer ? (
          <Button asChild variant="secondary">
            <Link href="#consultation-offer-form">Edit offer</Link>
          </Button>
        ) : null}
        {session.profile?.username ? (
          <Button asChild variant="secondary">
            <Link href={`${ROUTES.publicProfile(session.profile.username)}#hub-tab-book`}>
              Preview Book tab
            </Link>
          </Button>
        ) : null}
      </div>

      <GlassCard id="consultation-offer-form" className="scroll-mt-24 p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
          {showWizard ? "Enable booking" : "Your Book tab offer"}
        </p>
        <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
          {showWizard ? "Set up your consultation offer" : "Edit consultation offer"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {showWizard
            ? "Turn on the Book tab on your public hub — adjust headline, price, and duration below."
            : "Update headline, price, and duration — changes apply on your public hub immediately."}
        </p>
        <div className="mt-6">
          <ConsultationOfferForm
            initial={offerInitial}
            profileHint={profileHint}
          />
        </div>
      </GlassCard>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold">Incoming requests</h2>
        <ConsultationInbox
          requests={requests.map((item) => ({
            id: item.id,
            requesterName: item.requesterName,
            requesterEmail: item.requesterEmail,
            message: item.message,
            preferredAt: item.preferredAt?.toISOString() ?? null,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
