import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Sell consultations, knowledge packs, and courses on the Smitvi marketplace.",
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
      <h2>Listing types</h2>
      <p>
        Consultations, knowledge packs, subscriptions, and courses — each tied
        to your profile so buyers know who stands behind the work.
      </p>
      <h2>Example listings</h2>
      <p>
        When no live listings exist yet, the marketplace shows sample offers with
        detail pages so the experience looks complete for new visitors.
      </p>
    </InfoPageShell>
  );
}
