import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquareWarning, BookOpen } from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import {
  APP_NAME,
  PRODUCTION_APP_URL,
  ROUTES,
  SOCIAL_LINKS,
} from "@/config/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${APP_NAME} team for support, partnerships, and abuse reports.`,
};

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Contact"
      description="Questions about your account, billing, publishing your Intelligence Hub, or reporting abuse? We are here to help."
      visual="contact"
      primaryCta={{ href: ROUTES.signup, label: "Create your hub" }}
      secondaryCta={{ href: ROUTES.guides, label: "Read guides" }}
    >
      <InfoPageIntro>
        Prefer self-serve first? Our{" "}
        <Link href={ROUTES.guides}>Guides</Link> cover Twin training, hub trust,
        and monetization. For account-specific issues, email is the fastest path.
      </InfoPageIntro>

      <InfoContentSection title="Email support" icon={Mail}>
        <p>
          Reach us at{" "}
          <a href="mailto:support@smitvi.com">support@smitvi.com</a>. Include
          your account email, @username if you have one, and a short description
          of the issue. We typically respond within two business days.
        </p>
        <ul>
          <li>
            <strong>Billing</strong> — plan changes, invoices, failed payments
          </li>
          <li>
            <strong>Hub / Twin</strong> — publishing, imports, chat quality
          </li>
          <li>
            <strong>Partnerships</strong> — education, enterprise, press
          </li>
        </ul>
      </InfoContentSection>

      <InfoContentSection title="Report abuse or policy issues" icon={MessageSquareWarning}>
        <p>
          If you see impersonation, spam, scraped content republished without
          value, or other policy problems on a public hub, email{" "}
          <a href="mailto:support@smitvi.com">support@smitvi.com</a> with the
          hub URL and a brief explanation. We review reports and may suspend
          accounts that harm the network.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Product help" icon={BookOpen}>
        <ul>
          <li>
            <Link href={ROUTES.productTrainTwin}>Train your AI Twin</Link>
          </li>
          <li>
            <Link href={ROUTES.guide("train-your-ai-twin-without-copying-the-internet")}>
              Source quality playbook
            </Link>
          </li>
          <li>
            <Link href={ROUTES.discover}>Discover experts</Link>
          </li>
          <li>
            <Link href={ROUTES.pricing}>Plans &amp; pricing</Link>
          </li>
          <li>
            <Link href={ROUTES.privacy}>Privacy</Link> ·{" "}
            <Link href={ROUTES.terms}>Terms</Link> ·{" "}
            <Link href={ROUTES.disclaimer}>Disclaimer</Link>
          </li>
        </ul>
      </InfoContentSection>

      <InfoContentSection title="Company">
        <p>
          {APP_NAME} —{" "}
          <a href={PRODUCTION_APP_URL}>
            {PRODUCTION_APP_URL.replace("https://", "")}
          </a>
          . Operated from India; serving experts and visitors worldwide.
        </p>
        <p>
          Follow us on{" "}
          {SOCIAL_LINKS.map((link, index) => (
            <span key={link.id}>
              {index > 0 ? (index === SOCIAL_LINKS.length - 1 ? ", and " : ", ") : null}
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </span>
          ))}
          .
        </p>
      </InfoContentSection>
    </InfoPageShell>
  );
}
