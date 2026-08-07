import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { TwinChat } from "@/components/chat/twin-chat";
import { ownerTwinChatSuggestions } from "@/lib/twin-chat-suggestions";
import { getEntitlements } from "@/domain/billing/entitlements";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Twin Chat",
};

export default async function TwinChatPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);
  if (!session.profile?.isOnboarded) redirect(ROUTES.onboarding);

  const sources = await container.knowledge.listByUser(session.user.id);
  const ready = sources.filter((source) => source.status === "READY");
  const suggested = ownerTwinChatSuggestions(session.profile, ready.length);
  const entitlements = getEntitlements(session.user.plan);

  return (
    <TwinChat
      voiceEnabled={entitlements.voiceTwin}
      suggestedQuestions={suggested}
    />
  );
}
