import type { Metadata } from "next";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import {
  APP_MISSION,
  APP_NAME,
  APP_VISION,
  ROUTES,
} from "@/config/constants";

export const metadata: Metadata = {
  title: "About",
  description: `What ${APP_NAME} is building — a Human Intelligence OS for experts.`,
};

export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="Company"
      title={`About ${APP_NAME}`}
      description={APP_VISION}
      primaryCta={{ href: ROUTES.signup, label: "Join the network" }}
      secondaryCta={{ href: ROUTES.howItHelps, label: "How it helps" }}
    >
      <h2>Mission</h2>
      <p>{APP_MISSION}</p>
      <h2>What we are building</h2>
      <p>
        Smitvi is a Human Intelligence OS: train an AI Twin on your sources,
        grow an audience, earn from consultations and knowledge products, and
        keep answers grounded in what you actually know.
      </p>
      <h2>For experts &amp; teams</h2>
      <p>
        Creators get an Intelligence Hub — profile, knowledge library, Twin chat,
        marketplace, and consultations in one place. Visitors discover real hubs
        on Discover, search by topic, and book humans when judgment matters.
      </p>
      <h2>Contact &amp; company</h2>
      <p>
        {APP_NAME} is operated from India and serves experts and visitors
        worldwide. Product questions, abuse reports, and partnership inquiries:
        <a href="mailto:support@smitvi.com"> support@smitvi.com</a> or{" "}
        <a href={ROUTES.contact}>contact form</a>.
      </p>
    </InfoPageShell>
  );
}
