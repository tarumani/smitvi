import Link from "next/link";
import {
  ArrowRight,
  Building2,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { NetworkHomeViewModel } from "@/application/network/get-network-home";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type NetworkHomeProps = NetworkHomeViewModel;

function SectionHeading({
  title,
  href,
  linkLabel = "See all",
  live,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  live?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {live !== undefined ? (
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              live
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "bg-[var(--surface-elevated)] text-[var(--muted)]",
            )}
          >
            {live ? "Live" : "Featured"}
          </span>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function NetworkHome(props: NetworkHomeProps) {
  const showNetworkNotice =
    !props.hasLiveExperts ||
    !props.hasLiveTopics ||
    !props.hasLiveKnowledge;

  return (
    <section
      id="network"
      className="border-t border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
              The network
            </p>
            <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
              Trending Intelligence Hubs, open questions, and creators earning
              from what they know — never an empty feed.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href={ROUTES.discover}>
              <Sparkles className="h-4 w-4" />
              Explore Discover
            </Link>
          </Button>
        </div>

        {showNetworkNotice ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
            Featured highlights fill the network while new Intelligence Hubs go
            live.{" "}
            <Link
              href={ROUTES.signup}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Launch yours →
            </Link>
          </p>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div className="space-y-4">
              <SectionHeading
                title="Trending experts"
                href={ROUTES.discover}
                live={props.hasLiveExperts}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {props.trendingExperts.slice(0, 4).map((expert) => (
                  <Link key={expert.username} href={ROUTES.publicProfile(expert.username)}>
                    <GlassCard className="flex h-full gap-3 p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                      <Avatar
                        src={expert.avatarUrl}
                        name={expert.displayName}
                        className="h-11 w-11 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {expert.displayName}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                          {expert.headline ?? `@${expert.username}`}
                        </p>
                        {expert.followersCount != null ? (
                          <p className="mt-2 text-[11px] text-[var(--muted)]">
                            {expert.followersCount} followers
                          </p>
                        ) : null}
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading
                title="Latest intelligence"
                href={ROUTES.search}
                linkLabel="Search knowledge"
                live={props.hasLiveKnowledge}
              />
              <div className="grid gap-3">
                {props.latestIntelligence.slice(0, 4).map((item) => (
                  <GlassCard key={item.id} className="p-4">
                    <Link
                      href={ROUTES.publicProfile(item.ownerUsername)}
                      className="text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      @{item.ownerUsername}
                    </Link>
                    <p className="mt-1 font-semibold">{item.title}</p>
                    {item.summary ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                        {item.summary}
                      </p>
                    ) : null}
                    {item.topics.length ? (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {item.topics.slice(0, 4).join(" · ")}
                      </p>
                    ) : null}
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading title="Success stories" />
              <div className="grid gap-3 sm:grid-cols-2">
                {props.successStories.map((story) => (
                  <GlassCard key={story.username} className="p-4">
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                      “{story.quote}”
                    </p>
                    <p className="mt-3 text-sm font-semibold">{story.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {story.role} · {story.metric}
                    </p>
                    <Link
                      href={ROUTES.publicProfile(story.username)}
                      className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
                    >
                      View hub
                    </Link>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-4">
              <SectionHeading
                title="Questions looking for experts"
                href={ROUTES.search}
                live={props.hasLiveQuestions}
              />
              <div className="space-y-2">
                {props.openQuestions.slice(0, 4).map((q, index) => (
                  <GlassCard key={`${q.ownerUsername}-${index}`} className="p-4">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {q.topic} · suggested @{q.ownerUsername}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading
                title="Trending topics"
                href={ROUTES.discover}
                live={props.hasLiveTopics}
              />
              <div className="flex flex-wrap gap-2">
                {props.trendingTopics.slice(0, 8).map((topic) => (
                  <Link
                    key={topic.topic}
                    href={`${ROUTES.search}?q=${encodeURIComponent(topic.topic)}`}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {topic.topic}
                    <span className="ml-1.5 text-[var(--muted)]">
                      {topic.sourceCount}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading
                title="Top earners"
                href={ROUTES.marketplace}
                live={props.hasLiveEarners}
              />
              <div className="space-y-2">
                {props.topEarners.slice(0, 4).map((earner, index) => (
                  <Link
                    key={earner.username}
                    href={ROUTES.publicProfile(earner.username)}
                  >
                    <GlassCard className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-[var(--surface-elevated)]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {earner.displayName}
                          </p>
                          <p className="truncate text-xs text-[var(--muted-foreground)]">
                            {earner.headline ?? `@${earner.username}`}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[var(--accent)]">
                        {earner.earningsLabel}
                      </p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            <SectionHeading title="Top creators" href={ROUTES.discover} />
            <div className="space-y-2">
              {props.topCreators.slice(0, 4).map((creator) => (
                <Link
                  key={creator.username}
                  href={ROUTES.publicProfile(creator.username)}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--glass)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-elevated)]"
                >
                  <Avatar
                    src={creator.avatarUrl}
                    name={creator.displayName}
                    className="h-9 w-9"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {creator.displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      New on the network
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading title="Popular AI conversations" />
            <div className="space-y-2">
              {props.popularConversations.map((convo) => (
                <GlassCard key={convo.title} className="p-4">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-medium">{convo.title}</p>
                      <Link
                        href={ROUTES.publicTwinChat(convo.hubUsername)}
                        className="mt-1 inline-block text-xs text-[var(--accent)] hover:underline"
                      >
                        @{convo.hubUsername} · {convo.replyCount} replies
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <SectionHeading title="Communities" />
              <div className="space-y-2">
                {props.communities.map((community) => (
                  <GlassCard key={community.name} className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--accent)]" />
                      <p className="font-semibold">{community.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {community.topic} · {community.memberCount.toLocaleString()}{" "}
                      members
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--muted)]">
                      Opening soon on Smitvi
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading title="Companies hiring" />
              <div className="space-y-2">
                {props.companiesHiring.map((company) => (
                  <GlassCard key={company.name} className="flex gap-3 p-4">
                    <Building2 className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                    <div>
                      <p className="font-semibold">{company.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {company.role}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {company.skill}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </div>

        <GlassCard className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <TrendingUp className="h-5 w-5" />
              <p className="font-display text-lg font-bold">
                Build your Intelligence Hub
              </p>
            </div>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
              Join the network — train your AI, get discovered, and earn while
              you sleep.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={ROUTES.signup}>
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </GlassCard>
      </div>
    </section>
  );
}
