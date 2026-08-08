import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ROUTES } from "@/config/constants";
import { GlassCard } from "@/components/ui/glass-card";

export default async function MonetizationAnalyticsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const analytics = await container.monetizationAnalytics.getDetailedAnalytics(
    session.user.id,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.monetizationDashboard}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Monetization
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Analytics</h1>
      </div>
      <GlassCard className="p-5">
        <p className="text-sm text-[var(--muted-foreground)]">
          Completed orders
        </p>
        <p className="mt-2 text-3xl font-bold">{analytics.orderCount}</p>
      </GlassCard>
      <GlassCard className="p-5">
        <h2 className="font-semibold">Top products</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {analytics.topProducts.map((p) => (
            <li key={p.id} className="flex justify-between gap-4">
              <span>{p.title}</span>
              <span className="text-[var(--muted)]">{p.salesCount} sales</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
