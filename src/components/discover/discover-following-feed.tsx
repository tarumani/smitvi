import Link from "next/link";
import { BookOpen, Package, Rss } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FollowingFeedItem } from "@/application/discover/get-following-feed";
import { ROUTES } from "@/config/constants";

function formatWhen(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type DiscoverFollowingFeedProps = {
  items: FollowingFeedItem[];
  followingCount: number;
};

export function DiscoverFollowingFeed({
  items,
  followingCount,
}: DiscoverFollowingFeedProps) {
  return (
    <section
      aria-labelledby="discover-following"
      className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--accent-soft)]/25 px-6 py-10 sm:px-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Rss className="h-4 w-4" />
            <p className="text-sm font-semibold tracking-[0.16em] uppercase">
              Your network
            </p>
          </div>
          <h2
            id="discover-following"
            className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            From people you follow
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[var(--muted-foreground)]">
            {followingCount} expert{followingCount === 1 ? "" : "s"} in your
            feed — fresh knowledge and offers from their hubs.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={ROUTES.search}>Find more experts</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          No recent updates yet. Follow more Twins or check back when they
          publish knowledge or offers.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {items.map((item) => {
            const Icon = item.kind === "knowledge" ? BookOpen : Package;
            const profileHref = `${ROUTES.publicProfile(item.expert.username)}#hub-tab-activity`;
            return (
              <li key={item.id}>
                <Link
                  href={profileHref}
                  className="group flex gap-4 py-5 transition-colors hover:bg-[var(--surface)]/40 sm:items-center"
                >
                  <Avatar
                    src={item.expert.avatarUrl}
                    name={item.expert.displayName}
                    className="h-11 w-11 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                      <Icon className="mr-1 inline h-3 w-3 opacity-70" />
                      {item.kind === "knowledge" ? "Knowledge" : "Offer"} ·{" "}
                      {formatWhen(item.occurredAt)}
                    </p>
                    <p className="mt-0.5 font-semibold group-hover:text-[var(--accent)]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                      @{item.expert.username}
                      {item.detail
                        ? ` · ${item.detail.slice(0, 100)}${item.detail.length > 100 ? "…" : ""}`
                        : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
