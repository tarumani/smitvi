import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";

export const metadata: Metadata = {
  title: TRAIN_TWIN_LABEL,
  description:
    "Upload sources, process knowledge, and launch a public Intelligence Hub on Smitvi.",
};

export default function TrainTwinProductPage() {
  return (
    <InfoPageShell
      eyebrow="Product"
      title={TRAIN_TWIN_LABEL}
      description="Turn documents, notes, and links into a Twin that answers with citations — or says it does not know."
      primaryCta={{ href: ROUTES.signup, label: "Start free" }}
      secondaryCta={{ href: ROUTES.howItHelps, label: "How it helps" }}
    >
      <h2>What you upload</h2>
      <p>
        PDFs, docs, and text sources become searchable chunks. You control what
        is public vs private before anything appears on Discover.
      </p>
      <h2>Go live on the network</h2>
      <p>
        Complete your headline, bio, and at least one public knowledge source.
        Trending and Just arrived on Discover only show hubs that meet that bar.
      </p>
      <h2>Test before visitors arrive</h2>
      <p>
        Use Twin Chat in your hub to validate answers, then enable public chat on
        your profile when you are confident in boundaries.
      </p>
    </InfoPageShell>
  );
}
