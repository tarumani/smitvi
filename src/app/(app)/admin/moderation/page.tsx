import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Admin · Flags",
};

export default async function AdminModerationPage() {
  const [failedUploads, users] = await Promise.all([
    container.knowledge.listRecentForAdmin({ status: "FAILED", take: 50 }),
    container.users.listForAdmin({ take: 200 }),
  ]);
  const banned = users.filter((user) => user.isBanned);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold">Failed uploads</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Knowledge sources that failed processing — common moderation /
            ops signals until a dedicated report system exists.
          </p>
        </div>
        {failedUploads.length === 0 ? (
          <GlassCard className="p-4 text-sm text-[var(--muted-foreground)]">
            No failed uploads right now.
          </GlassCard>
        ) : (
          <div className="grid gap-3">
            {failedUploads.map((source) => (
              <GlassCard key={source.id} className="p-4">
                <p className="font-semibold">{source.title}</p>
                <p className="mt-1 text-sm text-red-500">
                  {source.errorMessage ?? "Processing failed"}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {source.owner.email}
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
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold">Banned accounts</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Users currently blocked from signing in.
          </p>
        </div>
        {banned.length === 0 ? (
          <GlassCard className="p-4 text-sm text-[var(--muted-foreground)]">
            No banned users.
          </GlassCard>
        ) : (
          <div className="grid gap-3">
            {banned.map((user) => (
              <GlassCard key={user.id} className="p-4">
                <p className="font-semibold">
                  {user.profile?.displayName ?? user.email}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {user.email} · {user.role}
                </p>
                <Link
                  href={ROUTES.adminUsers}
                  className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
                >
                  Manage in Users
                </Link>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
