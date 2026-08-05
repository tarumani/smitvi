import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { APP_NAME, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_NAME} collects, uses, and protects your data.`,
};

export default function PrivacyPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description={`This policy explains what we collect when you use ${APP_NAME}, why we collect it, and the choices you have.`}
      primaryCta={{ href: ROUTES.contact, label: "Contact us" }}
    >
      <h2>Information we collect</h2>
      <ul>
        <li>Account details you provide (email, display name, profile fields).</li>
        <li>Knowledge sources you upload to train your Intelligence Hub.</li>
        <li>Usage data such as chat sessions, marketplace activity, and security logs.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We use your data to operate the platform — authentication, hosting your
        Twin, processing payments, preventing abuse, and improving reliability.
        We do not sell your personal information.
      </p>
      <h2>Your choices</h2>
      <p>
        You can update profile settings, delete uploads, and request account
        deletion by contacting support. Public hubs and marketplace listings are
        visible according to the visibility you choose.
      </p>
      <p className="text-sm">
        Last updated: August 2026. For questions, use the{" "}
        <a href={ROUTES.contact}>contact page</a>.
      </p>
    </InfoPageShell>
  );
}
