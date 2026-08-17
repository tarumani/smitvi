import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, Database, Mail, Shield } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
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
      visual="legal"
      primaryCta={{ href: ROUTES.contact, label: "Contact us" }}
    >
      <InfoPageIntro>
        We design Smitvi so experts own their knowledge and visitors can discover
        real people — not shadow profiles. This page summarizes our data practices
        in plain language. If anything is unclear, contact us before publishing a
        public hub.
      </InfoPageIntro>

      <InfoContentSection title="Information we collect" icon={Database}>
        <ul>
          <li>
            <strong>Account data</strong> — email, display name, profile fields,
            and authentication identifiers (via Supabase Auth).
          </li>
          <li>
            <strong>Knowledge &amp; graph</strong> — files and text you upload,
            extracted entities, and relationships used for search and your Twin.
          </li>
          <li>
            <strong>Usage</strong> — chat sessions, marketplace orders, search
            queries (often aggregated), and security or audit logs.
          </li>
          <li>
            <strong>Device data</strong> — IP address, browser type, cookies, and
            approximate location for fraud prevention and reliability.
          </li>
        </ul>
      </InfoContentSection>

      <InfoContentSection title="Cookies & advertising" icon={Cookie}>
        <p>
          We use essential cookies for sign-in and preferences. Where required by
          law, we ask consent before advertising cookies. Google Analytics
          (G-ZJXYL2S12J) is used to measure traffic. Google may also show ads
          (including AdSense) after you accept advertising cookies. Use{" "}
          <strong>Cookie settings</strong> in the footer to change your choice, or
          manage cookies in your browser and via Google&apos;s ad settings.
        </p>
        <p>
          Google-served ads appear only on first-party Smitvi pages (for example
          Guides, About, product explainers, and legal pages). We do not place
          Google ads on user Intelligence Hubs, Twin chat, imported knowledge
          views, or other screens that primarily show third-party or user-uploaded
          material.
        </p>
      </InfoContentSection>

      <InfoContentSection title="How we use your data" icon={Shield}>
        <p>We process data to:</p>
        <ul>
          <li>Authenticate you and host your Intelligence Hub</li>
          <li>Run AI Twin inference on your uploaded sources</li>
          <li>Process marketplace and subscription payments</li>
          <li>Prevent abuse, spam, and security incidents</li>
          <li>Improve search, recommendations, and platform reliability</li>
        </ul>
        <p>
          <strong>We do not sell your personal information.</strong> We share data
          only with subprocessors needed to run the service (hosting, auth,
          payments, AI inference) under contractual safeguards.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Your choices">
        <ul>
          <li>Update profile and visibility in hub settings</li>
          <li>Delete individual knowledge uploads</li>
          <li>Request account deletion by emailing support</li>
          <li>Opt out of marketing emails via unsubscribe links</li>
        </ul>
        <p>
          Public hubs and marketplace listings are visible according to the
          visibility you choose. Private sources stay out of public search when
          marked private.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Retention & international transfers">
        <p>
          We retain account data while your account is active. After deletion
          requests, we remove or anonymize personal data except where law requires
          retention (e.g. payment records). Data may be processed in regions where
          our providers operate, with appropriate safeguards.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Contact" icon={Mail}>
        <p>
          Data controller: {APP_NAME}. Privacy requests:{" "}
          <a href="mailto:support@smitvi.com">support@smitvi.com</a> or the{" "}
          <Link href={ROUTES.contact}>contact page</Link>.
        </p>
        <p className="text-sm !text-[var(--muted)]">
          Last updated: August 2026. See also{" "}
          <Link href={ROUTES.terms}>Terms of Service</Link>.
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
