import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { TwinChat } from "@/components/chat/twin-chat";
import { Button } from "@/components/ui/button";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { ROUTES } from "@/config/constants";
import { getExampleHubByUsername } from "@/config/example-hubs";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Chat with @${username}` };
}

export default async function PublicTwinChatPage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params;
  const { q: initialQuestion } = await searchParams;
  const profile = await container.profiles.findByUsername(username);
  if (
    !profile ||
    profile.visibility === "PRIVATE" ||
    !profile.publicTwinEnabled
  ) {
    const example = getExampleHubByUsername(username);
    if (example) {
      redirect(`${ROUTES.exampleHub(example.slug)}#twin-chat`);
    }
    notFound();
  }

  const session = await getCurrentSession();
  if (!session) {
    const chatPath = initialQuestion
      ? ROUTES.publicTwinChatWithPrompt(username, initialQuestion)
      : ROUTES.publicTwinChat(username);
    redirect(`${ROUTES.login}?next=${encodeURIComponent(chatPath)}`);
  }

  const publicKnowledge = await container.knowledge.listPublicByUser(
    profile.userId,
  );
  const suggested = publicKnowledge
    .flatMap((source) => source.faqs.map((faq) => faq.question))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-wide text-[var(--accent)] uppercase">
            Public Twin
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            <Link
              href={ROUTES.publicProfile(username)}
              className="hover:text-[var(--foreground)]"
            >
              @{username}
            </Link>
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            {profile.displayName}&apos;s Knowledge Twin
          </h1>
        </div>
        <div className="flex gap-2">
          <ShareProfileButton username={username} mode="TWIN_CHAT" />
          <Button asChild variant="secondary">
            <Link href={ROUTES.publicProfile(username)}>View profile</Link>
          </Button>
        </div>
      </div>
      <TwinChat
        ownerUserId={profile.userId}
        title={`@${username} Twin`}
        subtitle="Answers grounded only in this expert’s public knowledge."
        initialQuestion={initialQuestion ?? null}
        suggestedQuestions={
          suggested.length
            ? suggested
            : [
                "What are you an expert in?",
                "Summarize your public knowledge",
                "What should I know before consulting you?",
              ]
        }
      />
    </div>
  );
}
