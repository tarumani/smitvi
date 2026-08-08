import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { APP_NAME, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Important disclaimers for ${APP_NAME} AI Twins, marketplace, and expert content.`,
};

export default function DisclaimerPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Disclaimer"
      description={`${APP_NAME} hosts expert-owned content and AI Twins. This page explains limits of liability and how to interpret automated answers.`}
      visual="legal"
      primaryCta={{ href: ROUTES.contact, label: "Contact support" }}
    >
      <InfoPageIntro>
        Smitvi helps experts share knowledge at scale. Automated Twins and
        marketplace listings are tools — not replacements for licensed
        professionals. Read this page before relying on any answer or purchase
        for high-stakes decisions.
      </InfoPageIntro>

      <InfoContentSection title="Not professional advice" icon={AlertTriangle}>
        <p>
          Twin chat answers are generated from an expert&apos;s uploaded sources
          and profile. They are for general information and exploration only.
          They do <strong>not</strong> replace licensed medical, legal, financial,
          tax, or engineering advice. Always verify critical decisions with a
          qualified human professional.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Accuracy & citations" icon={BookOpen}>
        <p>
          We aim to ground answers in published knowledge and show citations when
          available. AI can still be incomplete, outdated, or misinterpret context.
          Read original sources before relying on summaries. Match scores and
          verification labels indicate evidence strength — not guarantees.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Marketplace & consultations" icon={MessageSquare}>
        <p>
          Listings and booking flows connect buyers with independent experts.{" "}
          {APP_NAME} is a platform, not the seller of every offer. Delivery scope,
          timelines, refunds, and quality are defined by each listing, checkout
          terms, and direct communication between buyer and seller.
        </p>
        <p>
          Order status (e.g. pending payment) reflects payment provider
          confirmation — not automatic delivery of custom work.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Third-party links & advertising" icon={ExternalLink}>
        <p>
          Public hubs may link to external websites. We are not responsible for
          third-party content, privacy practices, or transactions off-platform.
          This site may display advertising (including Google AdSense); ad
          partners may use cookies as described in our{" "}
          <Link href={ROUTES.privacy}>Privacy Policy</Link>.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {APP_NAME} and its operators are
          not liable for indirect, incidental, or consequential damages arising
          from use of Twins, search results, or marketplace transactions. Your
          use of the service is at your own risk subject to our{" "}
          <Link href={ROUTES.terms}>Terms of Service</Link>.
        </p>
        <p className="text-sm !text-[var(--muted)]">
          Last updated: August 2026. See also{" "}
          <Link href={ROUTES.terms}>Terms</Link> and{" "}
          <Link href={ROUTES.privacy}>Privacy</Link>.
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
