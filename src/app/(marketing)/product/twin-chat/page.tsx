import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Twin Chat",
  description:
    "How public and private Twin chat works on Smitvi Intelligence Hubs.",
};

export default function TwinChatProductPage() {
  return (
    <InfoPageShell
      eyebrow="Product"
      title="Twin Chat"
      description="Ask an expert’s Twin questions grounded in their uploaded sources — with citations when available."
      primaryCta={{ href: ROUTES.discover, label: "Find a hub" }}
      secondaryCta={{ href: ROUTES.signup, label: "Publish your Twin" }}
    >
      <h2>For visitors</h2>
      <p>
        Open a public profile and start chat when the creator has enabled it.
        Answers reference knowledge they published — not the open web by default.
      </p>
      <h2>For creators</h2>
      <p>
        Monitor conversations in Twin Inbox, refine sources when answers miss,
        and route high-stakes questions to consultations.
      </p>
      <h2>Featured examples</h2>
      <p>
        Example hubs on the homepage link to showcase pages until live creators
        fill the network — so you can always see a complete hub layout.
      </p>
    </InfoPageShell>
  );
}
