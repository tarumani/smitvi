import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/constants";
import { isPrivileged } from "@/domain/user/entities";

export const metadata: Metadata = {
  title: "Admin · Users",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) return null;

  const { q } = await searchParams;
  const users = await container.users.listForAdmin({
    query: q,
    take: 100,
  });
  const canMutate = isPrivileged(session.user.role);

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search email, username, or name"
          className="max-w-md"
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          Search
        </button>
      </form>

      <div className="grid gap-3">
        {users.map((user) => {
          const name =
            user.profile?.displayName ??
            (user.profile?.username
              ? `@${user.profile.username}`
              : user.email);
          return (
            <GlassCard key={user.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar
                    src={user.profile?.avatarUrl}
                    name={name}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{name}</p>
                    <p className="truncate text-sm text-[var(--muted-foreground)]">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {user.role} · {user.plan}
                      {user.isBanned ? " · BANNED" : ""}
                      {" · "}
                      {user.knowledgeCount} uploads · {user.conversationCount}{" "}
                      chats
                    </p>
                    {user.profile?.username ? (
                      <Link
                        href={ROUTES.publicProfile(user.profile.username)}
                        className="mt-1 inline-block text-xs text-[var(--accent)] hover:underline"
                      >
                        @{user.profile.username}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <UserAdminActions
                  userId={user.id}
                  role={user.role}
                  isBanned={user.isBanned}
                  canMutate={canMutate && user.id !== session.user.id}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
