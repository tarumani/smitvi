import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, UserRound, Waypoints } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Twin Chat",
  description:
    "How public and private Twin chat works on Smitvi Intelligence Hubs — grounded answers with citations.",
};

export default function TwinChatProductPage() {
  return (
    <InfoPageShell
      eyebrow="Product"
      title="Twin Chat"
      description="Ask an expert’s Twin questions grounded in their uploaded sources — with citations when available."
      visual="chat"
      primaryCta={{ href: ROUTES.discover, label: "Find a hub" }}
      secondaryCta={{
        href: ROUTES.guide("grounded-ai-vs-hallucination"),
        label: "Evaluate grounded AI",
      }}
    >
      <InfoPageIntro>
        Twin Chat is not a general web search bot. It retrieves from the expert’s
        library, answers in their framing, and should refuse when sources do not
        cover the question. That design protects visitors from fluent but empty
        answers.
      </InfoPageIntro>

      <InfoContentSection title="For visitors" icon={MessagesSquare}>
        <p>
          Open a public profile and start chat when the creator has enabled it.
          Prefer hubs with original bios and multiple public sources. Ask one
          in-domain question and one outside-domain question — good Twins cite on
          the first and refuse on the second.
        </p>
        <p>
          See our guide:{" "}
          <Link href={ROUTES.guide("grounded-ai-vs-hallucination")}>
            Grounded AI vs hallucination
          </Link>
          .
        </p>
      </InfoContentSection>

      <InfoContentSection title="For creators" icon={UserRound}>
        <p>
          Monitor conversations in Twin Inbox, refine sources when answers miss,
          and route high-stakes questions to consultations. Set greeting text that
          states limits (regulated advice, confidential deals, etc.).
        </p>
      </InfoContentSection>

      <InfoContentSection title="Where ads appear" icon={Waypoints}>
        <p>
          Advertising creatives are not shown on Twin chat screens or imported
          knowledge views. Product education and{" "}
          <Link href={ROUTES.guides}>Guides</Link> are separate first-party pages.
          Example hubs on marketing surfaces help new visitors understand layout
          until live creators fill the network — they are labeled as examples.
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
