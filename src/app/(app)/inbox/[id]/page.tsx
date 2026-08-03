import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inbox conversation",
};

export default async function TwinInboxConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const { id } = await params;
  const conversation = await container.conversations.getForOwner(
    id,
    session.user.id,
  );
  if (!conversation) notFound();

  const visitorName =
    conversation.user.profile?.displayName ??
    (conversation.user.profile?.username
      ? `@${conversation.user.profile.username}`
      : conversation.user.email);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.inbox}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>
      </div>

      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <Avatar
            src={conversation.user.profile?.avatarUrl}
            name={visitorName}
            className="h-12 w-12"
          />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {visitorName}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {conversation.user.profile?.username
                ? `@${conversation.user.profile.username} · `
                : ""}
              {conversation.user.email}
            </p>
            {conversation.user.profile?.headline ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {conversation.user.profile.headline}
              </p>
            ) : null}
            {conversation.user.profile?.username ? (
              <Link
                href={ROUTES.publicProfile(conversation.user.profile.username)}
                className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
              >
                View public profile
              </Link>
            ) : null}
          </div>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {conversation.messages.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No messages in this conversation.
          </p>
        ) : (
          conversation.messages.map((message) => {
            const fromVisitor = message.role === "USER";
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  fromVisitor ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    fromVisitor
                      ? "bg-[var(--surface-elevated)] text-[var(--foreground)]"
                      : "bg-[var(--accent-soft)] text-[var(--foreground)]",
                  )}
                >
                  <p className="mb-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                    {fromVisitor ? "Visitor" : "Your Twin"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-2 text-[10px] text-[var(--muted)]">
                    {message.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
