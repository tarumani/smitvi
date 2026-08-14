import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import {
  AdminUserListFilters,
  parseAdminUserListFilter,
} from "@/components/admin/admin-user-list-filters";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/constants";
import { ACTIVATION_MISSING_LABELS } from "@/domain/profile/activation";
import { isPrivileged } from "@/domain/user/entities";

export const metadata: Metadata = {
  title: "Admin · Users",
};

function formatAdminWhen(date: Date | null, emptyLabel: string): string {
  if (!date) return emptyLabel;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function onboardingStatus(user: {
  profile: {
    username: string;
    isOnboarded: boolean;
    activationStatus: string | null;
  } | null;
}): { label: string; tone: "ok" | "warn" } {
  if (!user.profile) {
    return { label: "Never started onboarding", tone: "warn" };
  }
  const status = user.profile.activationStatus ?? "REGISTERED";
  if (
    status === "REGISTERED" ||
    status === "ONBOARDING_STARTED" ||
    status === "PROFILE_DRAFTED" ||
    status === "PROFILE_REVIEWED" ||
    !user.profile.isOnboarded
  ) {
    return { label: "Incomplete profile", tone: "warn" };
  }
  return { label: "Profile activated", tone: "ok" };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) return null;

  const { q, filter: filterParam } = await searchParams;
  const filter = parseAdminUserListFilter(filterParam);

  const [users, counts] = await Promise.all([
    container.users.listForAdmin({
      query: q,
      filter,
      take: 200,
    }),
    Promise.all([
      container.users.countForAdminList({ query: q, filter: "all" }),
      container.users.countForAdminList({ query: q, filter: "incomplete" }),
      container.users.countForAdminList({ query: q, filter: "stale" }),
      container.users.countForAdminList({ query: q, filter: "paused" }),
      container.users.countForAdminList({ query: q, filter: "dormant" }),
    ]).then(([all, incomplete, stale, paused, dormant]) => ({
      all,
      incomplete,
      stale,
      paused,
      dormant,
    })),
  ]);

  const canMutate = isPrivileged(session.user.role);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Review signup quality: incomplete onboarding is common and not always
        fake. Dormant accounts have no uploads, no chats, and never finished
        onboarding.
      </p>

      <AdminUserListFilters active={filter} q={q} counts={counts} />

      <form className="flex flex-wrap gap-2">
        {filter !== "all" ? (
          <input type="hidden" name="filter" value={filter} />
        ) : null}
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

      <p className="text-xs text-[var(--muted)]">
        Showing {users.length} of {counts[filter]} matching users
        {q?.trim() ? ` for “${q.trim()}”` : ""}.
      </p>

      {users.length === 0 ? (
        <GlassCard className="p-4 text-sm text-[var(--muted-foreground)]">
          No users match this filter.
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => {
            const hasUsername = Boolean(user.profile?.username);
            const onboarding = onboardingStatus(user);
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
                        {user.emailVerified ? "Verified" : "Unverified"}
                        {" · "}
                        {user.knowledgeCount} uploads · {user.conversationCount}{" "}
                        chats
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Joined {formatAdminWhen(user.createdAt, "—")}
                        {" · "}
                        Last login{" "}
                        {formatAdminWhen(user.lastLoginAt, "Never")}
                        {" · "}
                        {user.daysSinceJoin}d
                      </p>
                      <p
                        className={
                          onboarding.tone === "warn"
                            ? "mt-1 text-xs font-medium text-amber-600"
                            : "mt-1 text-xs text-[var(--muted-foreground)]"
                        }
                      >
                        {onboarding.label}
                        {user.profile?.activationStatus
                          ? ` · ${user.profile.activationStatus.replaceAll("_", " ")}`
                          : ""}
                        {!user.isActive && user.inactiveBlockedAt
                          ? " · Auto-paused"
                          : ""}
                        {user.eligibleToDelete && onboarding.tone === "warn"
                          ? " · Eligible to delete"
                          : ""}
                      </p>
                      {user.missingActivation.length > 0 ? (
                        <p className="mt-1 text-xs text-amber-700">
                          Missing:{" "}
                          {user.missingActivation
                            .map((key) => ACTIVATION_MISSING_LABELS[key] ?? key)
                            .join(", ")}
                        </p>
                      ) : null}
                      {hasUsername ? (
                        <Link
                          href={ROUTES.publicProfile(user.profile!.username)}
                          className="mt-1 inline-block text-xs text-[var(--accent)] hover:underline"
                        >
                          @{user.profile!.username}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <UserAdminActions
                    userId={user.id}
                    email={user.email}
                    role={user.role}
                    isBanned={user.isBanned}
                    canMutate={canMutate && user.id !== session.user.id}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
