import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { getEntitlements } from "@/domain/billing/entitlements";
import { getPlanDefinition } from "@/config/billing";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function BillingSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const [subscription, payments] = await Promise.all([
    container.billing.getActiveSubscription(session.user.id),
    container.billing.listPayments(session.user.id),
  ]);

  const entitlements = getEntitlements(session.user.plan);
  const plan = getPlanDefinition(session.user.plan);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Billing
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Manage your Smitvi plan, invoices, and payment history.
        </p>
      </div>

      <GlassCard className="p-6">
        <p className="text-sm text-[var(--muted)]">Current plan</p>
        <p className="mt-2 font-display text-3xl font-bold">{plan.name}</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {entitlements.unlimitedAi
            ? "Unlimited Twin chats"
            : `${entitlements.dailyAiChatLimit} Twin chats / day`}
        </p>
        {subscription ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            {subscription.provider} · {subscription.status}
            {subscription.currentPeriodEnd
              ? ` · renews ${subscription.currentPeriodEnd.toLocaleDateString()}`
              : ""}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={ROUTES.pricing}>Change plan</Link>
          </Button>
          {subscription?.provider === "STRIPE" ? <ManageBillingButton /> : null}
        </div>
      </GlassCard>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
            No payments yet.
          </GlassCard>
        ) : (
          payments.map((payment) => (
            <GlassCard key={payment.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{payment.purpose}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {payment.provider} · {payment.status}
                  </p>
                </div>
                <p className="font-semibold">
                  {(payment.amountCents / 100).toFixed(2)} {payment.currency}
                </p>
              </div>
            </GlassCard>
          ))
        )}
      </section>
    </div>
  );
}
