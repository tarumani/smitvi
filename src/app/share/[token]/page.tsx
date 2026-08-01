import { redirect, notFound } from "next/navigation";
import { container } from "@/application/container";
import { ROUTES } from "@/config/constants";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ShareRedirectPage({ params }: PageProps) {
  const { token } = await params;
  const link = await container.social.resolveShareLink(token);
  if (!link) notFound();

  const profile = await container.profiles.findSummaryByUserId(link.ownerUserId);
  if (!profile) notFound();

  if (link.type === "TWIN_CHAT") {
    redirect(ROUTES.publicTwinChat(profile.username));
  }

  redirect(ROUTES.publicProfile(profile.username));
}
