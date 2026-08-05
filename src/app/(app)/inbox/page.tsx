import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Twin Inbox",
};

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function TwinInboxPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const items = await container.conversations.listInboxForOwner(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Twin Inbox
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Visitors who chatted with your Twin — each thread is a chance to
          convert interest into paid consults or marketplace sales.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No Twin chats yet"
          description="When someone messages your public Twin, their conversation will show up here."
          icon={<Inbox className="h-8 w-8 text-[var(--accent)]" />}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const name =
              item.visitor.displayName ??
              (item.visitor.username
                ? `@${item.visitor.username}`
                : item.visitor.email);
            const preview =
              item.lastMessage?.content.slice(0, 120) ??
              item.title ??
              "No messages yet";

            return (
              <Link key={item.id} href={ROUTES.inboxConversation(item.id)}>
                <GlassCard className="p-4 transition-colors hover:bg-[var(--surface-elevated)]">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={item.visitor.avatarUrl}
                      name={name}
                      className="h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{name}</p>
                          <p className="truncate text-xs text-[var(--muted)]">
                            {item.visitor.username
                              ? `@${item.visitor.username}`
                              : item.visitor.email}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-[var(--muted)]">
                          {formatRelative(item.updatedAt)}
                        </p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                        {preview}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {item.messageCount} message
                        {item.messageCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
