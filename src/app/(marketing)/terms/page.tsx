import type { Metadata } from "next";
import Link from "next/link";
import { Bot, FileText, Scale, ShoppingBag } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { APP_NAME, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms for using ${APP_NAME} as a creator or visitor.`,
};

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description={`By using ${APP_NAME}, you agree to these terms. Please read them before publishing a public Intelligence Hub or selling on the marketplace.`}
      visual="legal"
      primaryCta={{ href: ROUTES.signup, label: "Create account" }}
    >
      <InfoPageIntro>
        These terms govern your use of Smitvi as a visitor, creator, or buyer.
        They work together with our Privacy Policy and Disclaimer. If you do not
        agree, do not use the service.
      </InfoPageIntro>

      <InfoContentSection title="Eligibility & accounts" icon={FileText}>
        <p>
          You must be able to form a binding contract in your jurisdiction. You
          are responsible for keeping your login credentials secure and for all
          activity under your account. Provide accurate profile information —
          impersonation and misrepresentation are prohibited.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Your content">
        <p>
          You retain ownership of knowledge you upload. You grant {APP_NAME} a
          license to host, process, index, and display content as needed to operate
          your Twin, search, marketplace listings, and public hub at the
          visibility you select.
        </p>
        <p>
          You represent that you have the rights to publish what you upload and
          that it does not infringe others&apos; intellectual property or privacy
          rights.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Acceptable use">
        <ul>
          <li>No unlawful, harassing, or hateful content</li>
          <li>No malware, scraping that violates others&apos; terms, or credential theft</li>
          <li>No spam, fake reviews, or marketplace fraud</li>
          <li>No attempts to bypass security, rate limits, or payment systems</li>
        </ul>
        <p>
          We may suspend or terminate accounts that harm the network or other
          users, with notice where reasonable.
        </p>
      </InfoContentSection>

      <InfoContentSection title="AI Twin outputs" icon={Bot}>
        <p>
          Twin responses are generated from expert-uploaded sources. {APP_NAME}{" "}
          does not guarantee accuracy, completeness, or fitness for a particular
          purpose. See our <Link href={ROUTES.disclaimer}>Disclaimer</Link> for
          limits of liability. Creators are responsible for what they publish and
          how visitors interpret automated answers.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Marketplace & payments" icon={ShoppingBag}>
        <p>
          Sellers set their own offers; platform fees apply as shown on{" "}
          <Link href={ROUTES.pricing}>pricing</Link>. {APP_NAME} facilitates
          checkout and fulfillment workflows but independent experts deliver
          services and digital goods unless stated otherwise on a listing.
        </p>
        <p>
          Refunds and disputes are handled per listing terms, checkout disclosures,
          and applicable payment provider rules. Contact support if a paid order
          fails to deliver.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Governing law & disputes" icon={Scale}>
        <p>
          These terms are governed by applicable law in India unless mandatory
          consumer protection rules in your jurisdiction require otherwise. Please
          raise disputes first via <Link href={ROUTES.contact}>contact</Link> so
          we can resolve issues in good faith.
        </p>
        <p className="text-sm !text-[var(--muted)]">
          Last updated: August 2026. Questions:{" "}
          <Link href={ROUTES.contact}>contact</Link> ·{" "}
          <Link href={ROUTES.privacy}>Privacy</Link>
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
