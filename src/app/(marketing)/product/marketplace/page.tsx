import type { Metadata } from "next";
import Link from "next/link";
import { Package, Shield, Store } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Sell consultations, knowledge packs, and courses on the Smitvi marketplace — tied to a real Intelligence Hub.",
};

export default function MarketplaceProductPage() {
  return (
    <InfoPageShell
      eyebrow="Product"
      title="Marketplace"
      description="Package expertise into offers visitors can buy — alongside your public Intelligence Hub."
      visual="marketplace"
      primaryCta={{ href: ROUTES.marketplace, label: "Browse live offers" }}
      secondaryCta={{ href: ROUTES.marketplaceSell, label: "Sell on Smitvi" }}
    >
      <InfoPageIntro>
        Listings work best when they sit next to a mature hub: original bio,
        tested Twin, and clear deliverables. Empty seller pages with copied blurbs
        convert poorly and weaken network quality.
      </InfoPageIntro>

      <InfoContentSection title="Listing types" icon={Package}>
        <p>
          Consultations, knowledge packs, subscriptions, templates, courses, and
          more — each tied to your profile so buyers know who stands behind the
          work. Describe audience, prerequisites, deliverables, and exclusions in
          plain language.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Quality expectations" icon={Shield}>
        <p>
          Write original listing copy. Do not paste third-party course syllabi or
          scraped product pages. If you reference external frameworks, add your
          commentary and how you apply them. Buyers and policy reviewers both look
          for unique value.
        </p>
        <p>
          Creators: see{" "}
          <Link href={ROUTES.guides}>Smitvi Guides</Link> for monetization and
          hub trust checklists.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Browsing as a visitor" icon={Store}>
        <p>
          Prefer offers linked to hubs you can chat with. When the network is
          still filling in, sample offers may appear so you can understand the
          layout — they are labeled as examples and are not a substitute for live
          expert inventory.
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
