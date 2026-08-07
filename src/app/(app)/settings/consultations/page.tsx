import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ConsultationInbox } from "@/components/consultations/consultation-inbox";
import { ConsultationOfferForm } from "@/components/consultations/consultation-offer-form";
import { FirstConsultationWizard } from "@/components/consultations/first-consultation-wizard";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";

export const metadata: Metadata = {
  title: "Consultations",
};

type PageProps = {
  searchParams: Promise<{ setup?: string }>;
};

export default async function ConsultationSettingsPage({
  searchParams,
}: PageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const { setup } = await searchParams;
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

  const showWizard = setup === "1" || !offer?.enabled;
  const publicProfilePath = profileRow?.username
    ? ROUTES.publicProfile(profileRow.username)
    : ROUTES.dashboard;

  const wizardProfile = {
    displayName: profileRow?.displayName ?? session.profile.displayName,
    profession: profileRow?.profession ?? null,
    headline: profileRow?.headline ?? null,
    bio: profileRow?.bio ?? null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
        {session.profile?.username ? (
          <Button asChild variant="secondary">
            <Link href={`${ROUTES.publicProfile(session.profile.username)}#hub-tab-book`}>
              Preview Book tab
            </Link>
          </Button>
        ) : null}
      </div>

      <GlassCard className="p-6 sm:p-8">
        {showWizard ? (
          <FirstConsultationWizard
            profile={wizardProfile}
            publicProfilePath={publicProfilePath}
          />
        ) : null}
        {!showWizard ? (
          <ConsultationOfferForm
            initial={{
              enabled: offer?.enabled ?? false,
              headline: offer?.headline ?? "",
              description: offer?.description ?? "",
              durationMinutes: offer?.durationMinutes ?? 30,
              priceCents: offer?.priceCents ?? 0,
              currency: offer?.currency ?? "USD",
            }}
          />
        ) : (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Advanced manual setup
            </summary>
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <ConsultationOfferForm
                initial={{
                  enabled: offer?.enabled ?? false,
                  headline: offer?.headline ?? "",
                  description: offer?.description ?? "",
                  durationMinutes: offer?.durationMinutes ?? 30,
                  priceCents: offer?.priceCents ?? 0,
                  currency: offer?.currency ?? "USD",
                }}
              />
            </div>
          </details>
        )}
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
