import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";

export default async function AdminMarketplacePage() {
  const [fees, listings] = await Promise.all([
    container.platformFees.listAll(),
    container.marketplace.listActive(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">
          Marketplace admin
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Fees, listings, and revenue operations.
        </p>
      </div>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Platform fees</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {fees.map((f) => (
            <li key={f.category} className="flex justify-between gap-4">
              <span>
                {f.category}
                {f.label ? ` — ${f.label}` : ""}
              </span>
              <span>{Math.round(f.commissionRate * 100)}%</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="font-semibold">Active listings</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {listings.map((l) => (
            <li key={l.id} className="flex justify-between gap-4">
              <span>{l.title}</span>
              <span className="text-[var(--muted)]">{l.type}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
