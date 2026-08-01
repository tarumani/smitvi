import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare, Upload } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { FREE_AI_CHATS_PER_DAY, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  if (!session.profile?.isOnboarded) {
    redirect(ROUTES.onboarding);
  }

  const sources = await container.knowledge.listByUser(session.user.id);
  const readyCount = sources.filter((source) => source.status === "READY").length;
  const usedToday = await container.conversations.getDailyUsage(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome, {session.profile.displayName}
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Your Knowledge Twin workspace — upload intelligence, then chat with it.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted)]">Plan</p>
          <p className="mt-2 font-display text-2xl font-bold">
            {session.user.plan}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {usedToday}/{FREE_AI_CHATS_PER_DAY} AI chats used today
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted)]">Knowledge ready</p>
          <p className="mt-2 font-display text-2xl font-bold">{readyCount}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {sources.length} total sources
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--muted)]">Public profile</p>
          <p className="mt-2 font-display text-2xl font-bold">
            @{session.profile.username}
          </p>
          <Link
            href={ROUTES.publicProfile(session.profile.username)}
            className="mt-1 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Open /@{session.profile.username}
          </Link>
        </GlassCard>
      </div>

      {readyCount === 0 ? (
        <EmptyState
          title="Train your Twin"
          description="Upload PDFs, Word docs, decks, or markdown to build your knowledge graph."
          icon={<Upload className="h-8 w-8 text-[var(--accent)]" />}
          action={
            <Button asChild>
              <Link href={ROUTES.knowledge}>Upload knowledge</Link>
            </Button>
          }
        />
      ) : (
        <GlassCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
            <div>
              <h2 className="font-semibold">Your Twin is ready</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Ask questions grounded in your uploaded knowledge with citations.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={ROUTES.twinChat}>Open Twin Chat</Link>
          </Button>
        </GlassCard>
      )}
    </div>
  );
}
