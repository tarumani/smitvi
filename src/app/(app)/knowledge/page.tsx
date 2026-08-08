import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ConnectSourceGrid } from "@/components/knowledge/connect-source-grid";
import { KnowledgeNextSteps } from "@/components/knowledge/knowledge-next-steps";
import { KnowledgeUploader } from "@/components/knowledge/knowledge-uploader";
import { KnowledgeSourceActions } from "@/components/knowledge/knowledge-source-actions";
import { VisibilityToggle } from "@/components/knowledge/visibility-toggle";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { LaunchWizardReturnBanner } from "@/components/dashboard/launch-wizard-return-banner";
import {
  APP_OUTCOME,
  ROUTES,
  TRAIN_TWIN_LABEL,
} from "@/config/constants";

export const metadata: Metadata = {
  title: TRAIN_TWIN_LABEL,
};

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const sources = await container.knowledge.listByUser(session.user.id);
  const readyCount = sources.filter((s) => s.status === "READY").length;
  const processingCount = sources.filter(
    (s) => s.status !== "READY" && s.status !== "FAILED",
  ).length;

  return (
    <div className="space-y-8">
      {from === "launch" ? (
        <LaunchWizardReturnBanner step="knowledge" />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">
            {APP_OUTCOME}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            {TRAIN_TWIN_LABEL}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
            Add what you know — articles, decks, notes — so your AI Twin can
            answer for you 24/7, bring visitors to your profile, and support
            paid consults and marketplace offers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            className="bg-[var(--accent)] font-semibold shadow-md ring-2 ring-[var(--accent)]/30 hover:bg-[var(--accent)]/90"
          >
            <Link href={ROUTES.marketplaceSell}>Sell your expertise</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={ROUTES.twinChat}>Test your Twin</Link>
          </Button>
        </div>
      </div>

      <GlassCard id="knowledge-connect" className="scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">
          Connect sources
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          LinkedIn, Notion, Google Docs, website, and file uploads — your hub
          learns from what you already know.
        </p>
        <ConnectSourceGrid mode="interactive" className="mt-4" />
      </GlassCard>

      {sources.length > 0 ? (
        <KnowledgeNextSteps
          username={session.profile.username}
          readyCount={readyCount}
          processingCount={processingCount}
        />
      ) : null}

      <div id="knowledge-upload">
        <KnowledgeUploader />
      </div>

      {sources.length === 0 ? (
        <div id="training-sources" className="scroll-mt-24">
          <EmptyState
            title="Your Twin is waiting for expertise"
            description="Paste or upload what you’re known for. After import, you’ll see next steps and training status here."
          />
        </div>
      ) : (
        <div id="training-sources-list" className="scroll-mt-24 space-y-3">
          <h2 className="font-display text-lg font-semibold">
            Training sources
          </h2>
          <div className="grid gap-4">
            {sources.map((source) => (
              <GlassCard key={source.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold">{source.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {source.type} · {source.status}
                          {source.chunkCount
                            ? ` · ${source.chunkCount} chunks`
                            : ""}
                        </p>
                      </div>
                      <KnowledgeSourceActions
                        sourceId={source.id}
                        title={source.title}
                      />
                    </div>
                    {source.summary ? (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {source.summary}
                      </p>
                    ) : null}
                    {source.tags.length ? (
                      <p className="mt-3 text-xs text-[var(--muted)]">
                        {source.tags.join(" · ")}
                      </p>
                    ) : null}
                    {source.errorMessage ? (
                      <p className="mt-3 text-sm text-red-500">
                        {source.errorMessage}
                      </p>
                    ) : null}
                    {source.status === "READY" ? (
                      <div className="mt-4 border-t border-[var(--border)]/80 pt-4">
                        <VisibilityToggle
                          sourceId={source.id}
                          isPublic={source.isPublic}
                          username={session.profile?.username}
                        />
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-[var(--muted)]">
                        Set visibility after this source finishes processing.
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
