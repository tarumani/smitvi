import { BookOpen, Package, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export type HubActivityItem = {
  id: string;
  kind: "knowledge" | "offer" | "review";
  title: string;
  detail?: string | null;
  at: string;
};

const KIND_META = {
  knowledge: { icon: BookOpen, label: "Knowledge" },
  offer: { icon: Package, label: "Offer" },
  review: { icon: Star, label: "Review" },
} as const;

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

type HubActivityFeedProps = {
  items: HubActivityItem[];
  updatesBanner?: React.ReactNode;
};

export function HubActivityFeed({ items, updatesBanner }: HubActivityFeedProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Activity</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Recent updates on this hub — knowledge, offers, and reviews.
        </p>
      </div>

      {updatesBanner ? <div>{updatesBanner}</div> : null}

      {items.length === 0 ? (
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          Nothing published yet. Check back soon or follow this expert for
          updates in Discover.
        </GlassCard>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <GlassCard className="flex gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                      {meta.label} · {formatWhen(item.at)}
                    </p>
                    <p className="mt-0.5 font-medium">{item.title}</p>
                    {item.detail ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
