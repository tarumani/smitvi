import type { Metadata } from "next";
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
      primaryCta={{ href: ROUTES.signup, label: "Create account" }}
    >
      <h2>Your content</h2>
      <p>
        You retain ownership of knowledge you upload. You grant {APP_NAME} a
        license to host, process, and display content as needed to run your Twin
        and marketplace offers. You are responsible for having rights to the
        material you publish.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not upload unlawful content, impersonate others, or attempt to bypass
        security. We may suspend accounts that harm the network or other users.
      </p>
      <h2>AI Twin outputs</h2>
      <p>
        Twin responses are generated automatically from expert-uploaded sources.
        {APP_NAME} does not guarantee accuracy. See our{" "}
        <a href={ROUTES.disclaimer}>Disclaimer</a> for limits of liability.
      </p>
      <h2>Marketplace &amp; payments</h2>
      <p>
        Sellers set their own offers; platform fees apply as shown on pricing.
        Payouts and refunds follow the flows described in product documentation
        and checkout.
      </p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by applicable law in India unless otherwise
        required by consumer protection rules in your jurisdiction. Disputes
        should first be raised via <a href={ROUTES.contact}>contact</a>.
      </p>
      <p className="text-sm">
        Last updated: August 2026. Questions:{" "}
        <a href={ROUTES.contact}>contact</a>.
      </p>
    </InfoPageShell>
  );
}
