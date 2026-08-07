import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import { APP_NAME, PRODUCTION_APP_URL, ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${APP_NAME} team.`,
};

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Contact"
      description="Questions about your account, billing, or publishing your Intelligence Hub? We are here to help."
      visual="contact"
      primaryCta={{ href: ROUTES.signup, label: "Create your hub" }}
    >
      <h2>Email</h2>
      <p>
        Reach us at{" "}
        <a href="mailto:support@smitvi.com" className="text-[var(--accent)]">
          support@smitvi.com
        </a>{" "}
        — include your account email and a short description of the issue.
      </p>
      <h2>Product help</h2>
      <ul>
        <li>
          <a href={ROUTES.productTrainTwin}>Train your AI Twin</a>
        </li>
        <li>
          <a href={ROUTES.discover}>Discover experts</a>
        </li>
        <li>
          <a href={ROUTES.pricing}>Plans &amp; pricing</a>
        </li>
      </ul>
      <h2>Site</h2>
      <p>
        {APP_NAME} —{" "}
        <a href={PRODUCTION_APP_URL}>{PRODUCTION_APP_URL.replace("https://", "")}</a>
      </p>
    </InfoPageShell>
  );
}
