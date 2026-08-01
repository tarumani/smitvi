import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { KnowledgeUploader } from "@/components/knowledge/knowledge-uploader";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Workspace knowledge",
};

export default async function OrganizationKnowledgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const { slug } = await params;
  const organization = await container.organizations.findBySlug(slug);
  if (!organization) notFound();

  const membership = await container.organizations.getMembership(
    organization.id,
    session.user.id,
  );
  if (!membership) redirect(ROUTES.organizations);

  const sources = await container.knowledge.listByOrganization(organization.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Workspace knowledge
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Private to {organization.name}. Members can ask the workspace Twin.
        </p>
      </div>

      <KnowledgeUploader organizationId={organization.id} />

      <section className="space-y-3">
        {sources.map((source) => (
          <GlassCard key={source.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{source.title}</p>
                <p className="text-sm text-[var(--muted)]">
                  {source.type} · {source.status}
                  {source.chunkCount > 0
                    ? ` · ${source.chunkCount} chunks`
                    : ""}
                </p>
              </div>
            </div>
            {source.summary ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {source.summary}
              </p>
            ) : null}
          </GlassCard>
        ))}
      </section>

      {sources.length === 0 ? (
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          Upload PDFs, decks, or notes to build the company Twin.
        </GlassCard>
      ) : null}
    </div>
  );
}
