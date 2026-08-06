import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Upload, Users } from "lucide-react";
import { calculateIntelligenceScore } from "@/application/onboarding/calculate-intelligence-score";
import { container } from "@/application/container";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";

type Props = {
  userId: string;
  emailVerified: boolean;
};

export async function IntelligenceActivationHub({
  userId,
  emailVerified,
}: Props) {
  const profile = await container.profiles.findByUserId(userId);
  if (!profile) return null;

  const row = await prisma.profile.findUnique({
    where: { userId },
    select: { profession: true, interests: true, intelligencePoints: true },
  });

  const knowledgeCount = (await container.knowledge.listByUser(userId)).length;
  const interestCount = Array.isArray(row?.interests)
    ? (row.interests as string[]).length
    : 0;

  const score = calculateIntelligenceScore({
    hasAvatar: Boolean(profile.avatarUrl),
    hasProfession: Boolean(row?.profession),
    interestCount,
    hasBio: Boolean(profile.bio?.trim()),
    knowledgeSourceCount: knowledgeCount,
    followingCount: profile.followingCount,
    emailVerified,
  });

  const [experts, topics] = await Promise.all([
    container.search.trendingExperts(),
    container.search.trendingTopics(),
  ]);

  return (
    <div className="space-y-6">
      <GlassCard className="border-[var(--accent)]/25 bg-[var(--accent-soft)]/20 p-6 sm:p-8">
        <p className="text-sm font-medium text-[var(--accent)]">
          Welcome back!
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Human Intelligence Score
            </h2>
            <p className="mt-1 text-4xl font-bold tabular-nums text-[var(--accent)]">
              {score.percent}%
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={ROUTES.profileSettings}>Complete profile</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile
            href={ROUTES.hub.intelligence}
            icon={Upload}
            label="Upload knowledge"
            detail={TRAIN_TWIN_LABEL}
          />
          <ActionTile
            href={ROUTES.hub.intelligence}
            icon={Sparkles}
            label="Build AI Twin"
            detail="Train from your sources"
          />
          <ActionTile
            href={ROUTES.publicProfile(profile.username)}
            icon={BookOpen}
            label="View public hub"
            detail="Share your profile"
          />
          <ActionTile
            href={ROUTES.discover}
            icon={Users}
            label="Follow experts"
            detail="Grow your network"
          />
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="font-display text-lg font-semibold">
            Recommended experts
          </h3>
          <ul className="mt-3 space-y-2">
            {experts.slice(0, 5).map((expert) => (
              <li key={expert.username}>
                <Link
                  href={ROUTES.publicProfile(expert.username)}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:border-[var(--accent)]"
                >
                  <span>
                    {expert.displayName}{" "}
                    <span className="text-[var(--muted)]">@{expert.username}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-display text-lg font-semibold">
            Trending knowledge topics
          </h3>
          <ul className="mt-3 space-y-2">
            {topics.slice(0, 6).map((topic) => (
              <li key={topic.topic}>
                <Link
                  href={`${ROUTES.search}?q=${encodeURIComponent(topic.topic)}`}
                  className="block rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:border-[var(--accent)]"
                >
                  {topic.topic}
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {topic.sourceCount} sources
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <GlassCard className="p-5">
        <p className="text-sm font-semibold">Next achievements</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
          {score.nextAchievements.map((item) => (
            <li key={item.id} className={item.done ? "text-[var(--accent)]" : ""}>
              {item.done ? "✓" : "○"} {item.label}{" "}
              <span className="text-[var(--muted)]">+{item.points} pts</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function ActionTile({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition-colors hover:border-[var(--accent)]"
    >
      <Icon className="h-5 w-5 text-[var(--accent)]" />
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{detail}</p>
    </Link>
  );
}
