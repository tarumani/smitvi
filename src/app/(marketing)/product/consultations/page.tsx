import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Scale, Sparkles } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Consultations",
  description:
    "Offer paid consultations alongside your Knowledge Twin on Smitvi — Twin for FAQs, humans for judgment.",
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
        href: ROUTES.guide("monetize-expertise-with-twin-plus-human"),
        label: "Monetization guide",
      }}
    >
      <InfoPageIntro>
        Consultations are for contextual work: prioritization, diagnosis, and
        decisions under uncertainty. Keep FAQ material in public sources so the
        Twin deflects repetitive asks before they hit your calendar.
      </InfoPageIntro>

      <InfoContentSection title="Set your offer" icon={CalendarCheck}>
        <p>
          Add headline, duration, pricing, and outcome in consultation settings.
          Your public profile can show a request form when consults are enabled.
          Write scope clearly — what you will cover and what belongs in a longer
          engagement.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Twin + human workflow" icon={Sparkles}>
        <p>
          Visitors learn from chat first; they book you when the Twin flags limits
          or when they need a live conversation. Use inbox transcripts to improve
          sources and to spot new consultation packages worth listing.
        </p>
        <p>
          Full model:{" "}
          <Link href={ROUTES.guide("monetize-expertise-with-twin-plus-human")}>
            Monetize expertise without burnout
          </Link>
          .
        </p>
      </InfoContentSection>

      <InfoContentSection title="Professional boundaries" icon={Scale}>
        <p>
          For regulated domains, state that Twin chat is educational and that paid
          sessions are where accountable advice happens. Do not promise outcomes
          you cannot control. Clear boundaries protect clients and keep the
          marketplace trustworthy.
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
