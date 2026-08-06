import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

type HubUpdatesBannerProps = {
  username: string;
  isFollowing: boolean;
  followSlot: React.ReactNode;
  isOwner: boolean;
};

export function HubUpdatesBanner({
  username,
  isFollowing,
  followSlot,
  isOwner,
}: HubUpdatesBannerProps) {
  if (isOwner) {
    return (
      <GlassCard className="border-dashed p-4 text-sm text-[var(--muted-foreground)]">
        Publish knowledge, offers, or respond to reviews — activity here helps
        visitors see a live hub.
      </GlassCard>
    );
  }

  if (isFollowing) {
    return (
      <GlassCard className="border-[var(--accent)]/25 bg-[var(--accent-soft)]/25 p-4 text-sm">
        You follow @{username}. New public updates appear here and in{" "}
        <Link href={ROUTES.discover} className="text-[var(--accent)] hover:underline">
          Discover
        </Link>
        . Email digests are coming soon.
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--muted-foreground)]">
        Follow @{username} to track new knowledge and offers on this hub.
      </p>
      {followSlot}
    </GlassCard>
  );
}
