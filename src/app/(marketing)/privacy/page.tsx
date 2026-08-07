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
        <li>Device and browser data (IP address, cookies, approximate location) for security and analytics.</li>
      </ul>
      <h2>Cookies &amp; advertising</h2>
      <p>
        We use essential cookies for sign-in and preferences. With your consent
        where required, we and partners such as Google may use cookies to measure
        traffic and show ads (including Google AdSense). You can control cookies
        in your browser settings and via Google&apos;s ad settings.
      </p>
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
      <h2>Data retention &amp; deletion</h2>
      <p>
        We retain account data while your account is active. You may request
        deletion by emailing support; we will remove or anonymize personal data
        except where law requires retention (e.g. payment records).
      </p>
      <h2>Contact</h2>
      <p>
        Data controller: {APP_NAME}. For privacy requests, use the{" "}
        <a href={ROUTES.contact}>contact page</a> or email support@smitvi.com.
      </p>
      <p className="text-sm">
        Last updated: August 2026. For questions, use the{" "}
        <a href={ROUTES.contact}>contact page</a>.
      </p>
    </InfoPageShell>
  );
}
