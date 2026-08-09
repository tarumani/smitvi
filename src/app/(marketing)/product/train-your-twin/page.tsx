import type { Metadata } from "next";
import Link from "next/link";
import { FileUp, ShieldCheck, Sparkles } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";

export const metadata: Metadata = {
  title: TRAIN_TWIN_LABEL,
  description:
    "Upload original sources, process knowledge, and launch a public Intelligence Hub on Smitvi.",
};

export default function TrainTwinProductPage() {
  return (
    <InfoPageShell
      eyebrow="Product"
      title={TRAIN_TWIN_LABEL}
      description="Turn documents, notes, and links into a Twin that answers with citations — or says it does not know."
      visual="twin"
      primaryCta={{ href: ROUTES.signup, label: "Start free" }}
      secondaryCta={{
        href: ROUTES.guide("train-your-ai-twin-without-copying-the-internet"),
        label: "Source quality guide",
      }}
    >
      <InfoPageIntro>
        Training works best when your library is original or carefully curated.
        Imports from LinkedIn, Notion, Docs, GitHub, YouTube, and websites are
        accelerators — edit them before you make sources public.
      </InfoPageIntro>

      <InfoContentSection title="What you upload" icon={FileUp}>
        <p>
          PDFs, docs, and text sources become searchable chunks in your Human
          Intelligence Graph. Prefer workshop notes, FAQs, case write-ups, and
          curricula you authored. Thin résumé dumps and mirrored web pages make
          weak Twins and weak public pages.
        </p>
        <ul>
          <li>Mark drafts private until you have reviewed the extract</li>
          <li>Split giant imports into focused topic notes</li>
          <li>Add a short intro explaining how you use each source</li>
        </ul>
      </InfoContentSection>

      <InfoContentSection title="Go live on the network" icon={Sparkles}>
        <p>
          Complete your headline, an original bio, and at least one substantial
          public knowledge source. Trending and Just arrived on Discover only
          show hubs that meet that bar — empty shells stay out of the spotlight.
        </p>
        <p>
          Read{" "}
          <Link href={ROUTES.guide("build-an-intelligence-hub-that-people-trust")}>
            Build an Intelligence Hub people trust
          </Link>{" "}
          for the full checklist.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Test before visitors arrive" icon={ShieldCheck}>
        <p>
          Use Twin Chat in your hub to validate answers, then enable public chat
          when citations look solid and refusals work outside your domain. Keep
          improving sources from real inbox misses rather than pasting random
          internet articles to “fill gaps.”
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
