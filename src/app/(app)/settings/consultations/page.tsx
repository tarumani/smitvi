import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ConsultationInbox } from "@/components/consultations/consultation-inbox";
import { ConsultationOfferForm } from "@/components/consultations/consultation-offer-form";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Consultations",
};

export default async function ConsultationSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const [offer, requests] = await Promise.all([
    container.consultations.getOfferByUserId(session.user.id),
    container.consultations.listRequestsForExpert(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            Sprint 4
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Consultations
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Offer booking on your public profile and manage incoming requests.
          </p>
        </div>
        {session.profile?.username ? (
          <Button asChild variant="secondary">
            <Link href={ROUTES.publicProfile(session.profile.username)}>
              View public profile
            </Link>
          </Button>
        ) : null}
      </div>

      <GlassCard className="p-6 sm:p-8">
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
