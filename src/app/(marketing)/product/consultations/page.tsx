import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Consultations",
  description:
    "Offer paid consultations alongside your Knowledge Twin on Smitvi.",
};

export default function ConsultationsProductPage() {
  return (
    <InfoPageShell
      eyebrow="Product"
      title="Consultations"
      description="Let your Twin handle repeat questions; book humans for decisions that need judgment."
      visual="consultations"
      primaryCta={{ href: ROUTES.signup, label: "Enable consults" }}
      secondaryCta={{
        href: ROUTES.consultationSettings,
        label: "Consultation settings",
      }}
    >
      <h2>Set your offer</h2>
      <p>
        Add headline, duration, and pricing in consultation settings. Your public
        profile can show a request form when consults are enabled.
      </p>
      <h2>Twin + human workflow</h2>
      <p>
        Visitors learn from chat first; they book you when the Twin flags limits
        or when they need a live conversation.
      </p>
    </InfoPageShell>
  );
}
