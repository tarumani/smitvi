import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { KnowledgeUploader } from "@/components/knowledge/knowledge-uploader";
import { VisibilityToggle } from "@/components/knowledge/visibility-toggle";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Knowledge",
};

export default async function KnowledgePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const sources = await container.knowledge.listByUser(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Knowledge
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Paste text or upload documents to train your Twin. We extract,
            chunk, embed, summarize, and tag automatically.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={ROUTES.twinChat}>Open Twin Chat</Link>
        </Button>
      </div>

      <KnowledgeUploader />

      {sources.length === 0 ? (
        <EmptyState
          title="No knowledge yet"
          description="Paste notes or upload a PDF, Word doc, deck, or markdown file to create your first intelligence source."
        />
      ) : (
        <div className="grid gap-4">
          {sources.map((source) => (
            <GlassCard key={source.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{source.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {source.type} · {source.status}
                    {source.chunkCount ? ` · ${source.chunkCount} chunks` : ""}
                  </p>
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
                </div>
                {source.status === "READY" ? (
                  <VisibilityToggle
                    sourceId={source.id}
                    isPublic={source.isPublic}
                  />
                ) : null}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
