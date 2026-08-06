import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HubDigestToggle } from "@/components/profile/hub-digest-toggle";
import { ROUTES } from "@/config/constants";

type HubUpdatesBannerProps = {
  username: string;
  isFollowing: boolean;
  followSlot: React.ReactNode;
  isOwner: boolean;
  viewerDigestEnabled?: boolean;
  viewerIsAuthenticated?: boolean;
};

export function HubUpdatesBanner({
  username,
  isFollowing,
  followSlot,
  isOwner,
  viewerDigestEnabled = true,
  viewerIsAuthenticated = false,
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
      <GlassCard className="border-[var(--accent)]/25 bg-[var(--accent-soft)]/25 space-y-3 p-4 text-sm">
        <p>
          You follow @{username}. New public updates appear here and in{" "}
          <Link
            href={ROUTES.discover}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Discover → From people you follow
          </Link>
          .
        </p>
        {viewerIsAuthenticated ? (
          <div className="flex flex-wrap items-center gap-2">
            <HubDigestToggle initialEnabled={viewerDigestEnabled} />
            <span className="text-xs text-[var(--muted-foreground)]">
              Weekly email when followed hubs publish
            </span>
          </div>
        ) : null}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--muted-foreground)]">
        Follow @{username} to track new knowledge and offers on this hub and in
        Discover.
      </p>
      {followSlot}
    </GlassCard>
  );
}
