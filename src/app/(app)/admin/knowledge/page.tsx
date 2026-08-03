import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Admin · Uploads",
};

export default async function AdminKnowledgePage() {
  const sources = await container.knowledge.listRecentForAdmin({ take: 80 });

  return (
    <div className="grid gap-3">
      {sources.map((source) => (
        <GlassCard key={source.id} className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{source.title}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {source.type} · {source.status}
                {source.chunkCount ? ` · ${source.chunkCount} chunks` : ""}
                {source.isPublic ? " · public" : " · private"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {source.owner.displayName ?? source.owner.email}
                {source.owner.username ? (
                  <>
                    {" · "}
                    <Link
                      href={ROUTES.publicProfile(source.owner.username)}
                      className="text-[var(--accent)] hover:underline"
                    >
                      @{source.owner.username}
                    </Link>
                  </>
                ) : null}
              </p>
              {source.errorMessage ? (
                <p className="mt-2 text-sm text-red-500">{source.errorMessage}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-[var(--muted)]">
              {source.createdAt.toLocaleString()}
            </p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
