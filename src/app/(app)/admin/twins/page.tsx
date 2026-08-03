import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Admin · Twins",
};

export default async function AdminTwinsPage() {
  const twins = await container.profiles.listForAdmin({ take: 100 });

  return (
    <div className="grid gap-3">
      {twins.map((twin) => (
        <GlassCard key={twin.id} className="p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={twin.avatarUrl}
              name={twin.displayName}
              className="h-10 w-10"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{twin.displayName}</p>
                <Link
                  href={ROUTES.publicProfile(twin.username)}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  @{twin.username}
                </Link>
                {!twin.publicTwinEnabled ? (
                  <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)] uppercase">
                    Twin off
                  </span>
                ) : null}
                {twin.isBanned ? (
                  <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 uppercase">
                    Banned
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {twin.email}
                {twin.headline ? ` · ${twin.headline}` : ""}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {twin.visibility} · {twin.plan} · {twin.knowledgeCount} uploads ·{" "}
                {twin.conversationCount} chats ·{" "}
                {twin.followersCount} followers
                {twin.ratingCount
                  ? ` · ${twin.ratingAverage.toFixed(1)}★ (${twin.ratingCount})`
                  : ""}
              </p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
