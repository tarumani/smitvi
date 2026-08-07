import type { Metadata } from "next";
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
      primaryCta={{ href: ROUTES.contact, label: "Contact support" }}
    >
      <h2>Not professional advice</h2>
      <p>
        Twin chat answers are generated from an expert&apos;s uploaded sources
        and profile. They are for general information only and do not replace
        licensed professional, medical, legal, or financial advice. Always verify
        critical decisions with a qualified human.
      </p>
      <h2>Accuracy &amp; citations</h2>
      <p>
        We aim to ground answers in published knowledge, but AI can be incomplete
        or outdated. Citations and source links are provided when available; you
        should read original materials before relying on summaries.
      </p>
      <h2>Marketplace &amp; consultations</h2>
      <p>
        Listings and booking flows connect buyers with independent experts.
        {APP_NAME} is a platform, not the seller of every offer. Delivery,
        refunds, and scope are defined by each listing and applicable terms at
        checkout.
      </p>
      <h2>Third-party links &amp; ads</h2>
      <p>
        Public hubs may link to external sites. We are not responsible for
        third-party content or policies. This site may display advertising
        (including Google AdSense); ad partners may use cookies as described in
        our Privacy Policy.
      </p>
      <p className="text-sm">
        Last updated: August 2026. See also{" "}
        <a href={ROUTES.terms}>Terms of Service</a> and{" "}
        <a href={ROUTES.privacy}>Privacy Policy</a>.
      </p>
    </InfoPageShell>
  );
}
