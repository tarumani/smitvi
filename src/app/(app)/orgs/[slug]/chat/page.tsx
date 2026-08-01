import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { TwinChat } from "@/components/chat/twin-chat";
import { getEntitlements } from "@/domain/billing/entitlements";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Workspace Twin",
};

export default async function OrganizationChatPage({
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

  const entitlements = getEntitlements(session.user.plan);

  return (
    <div className="mx-auto max-w-3xl">
      <TwinChat
        organizationId={organization.id}
        voiceEnabled={entitlements.voiceTwin}
        title={`${organization.name} Twin`}
        subtitle="Answers only from this workspace’s knowledge — with citations."
        suggestedQuestions={[
          "What does our shared knowledge say about our product?",
          "Summarize the company documents",
          "What policies or processes are documented?",
        ]}
      />
    </div>
  );
}
