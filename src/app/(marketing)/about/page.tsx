import type { Metadata } from "next";
import Link from "next/link";
import {
  Globe2,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import {
  InfoContentSection,
  InfoPageIntro,
} from "@/components/marketing/info-content-section";
import { InfoPageShell } from "@/components/marketing/info-page-shell";
import {
  APP_MISSION,
  APP_NAME,
  APP_OUTCOME,
  APP_TAGLINE,
  APP_VISION,
  PLATFORM_PILLAR_DETAILS,
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
      visual="about"
      primaryCta={{ href: ROUTES.signup, label: "Join the network" }}
      secondaryCta={{ href: ROUTES.guides, label: "Read guides" }}
    >
      <InfoPageIntro>
        {APP_TAGLINE} {APP_OUTCOME} We connect verified human expertise with
        people who need it — through discoverable Intelligence Hubs, graph-powered
        search, and an AI Twin that stays grounded in what experts actually publish.
      </InfoPageIntro>

      <InfoContentSection title="Mission" icon={Sparkles}>
        <p>{APP_MISSION}</p>
        <p>
          We believe the next layer of the internet is not more content — it is
          structured human intelligence: skills, evidence, projects, and answers
          you can trace back to real people.
        </p>
      </InfoContentSection>

      <InfoContentSection title="What we are building" icon={Layers}>
        <p>
          Smitvi is a <strong>Human Intelligence Operating System</strong>. Experts
          upload knowledge, map it to a Human Intelligence Graph, and publish a
          public hub with Twin chat, marketplace offers, and consultations.
        </p>
        <ul>
          <li>Train an AI Twin on sources you control</li>
          <li>Get discovered via semantic search and recommendations</li>
          <li>Monetize templates, packs, consults, and subscriptions</li>
          <li>Keep answers tied to evidence — not anonymous AI guesswork</li>
        </ul>
      </InfoContentSection>

      <InfoContentSection title="Platform pillars" icon={Globe2}>
        <p>Everything in the product maps to five pillars:</p>
        <ul>
          {PLATFORM_PILLAR_DETAILS.map((pillar) => (
            <li key={pillar.name}>
              <strong>{pillar.name}</strong> — {pillar.summary}
            </li>
          ))}
        </ul>
        <p>
          For a deeper walkthrough, see{" "}
          <Link href={ROUTES.guide("human-intelligence-os-explained")}>
            Human Intelligence OS explained
          </Link>
          .
        </p>
      </InfoContentSection>

      <InfoContentSection title="For experts & teams" icon={Users}>
        <p>
          Creators get an Intelligence Hub: profile, knowledge library, Twin chat,
          marketplace storefront, and booking — in one place. Teams can organize
          expertise in workspaces as the product evolves.
        </p>
        <p>
          Visitors use <Link href={ROUTES.discover}>Discover</Link> and{" "}
          <Link href={ROUTES.search}>Search</Link> to find humans by skill,
          industry, and evidence — then book or buy when judgment matters. Our{" "}
          <Link href={ROUTES.guides}>Guides</Link> explain how to evaluate Twins
          and how creators publish high-quality hubs.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Content & advertising standards">
        <p>
          Public hubs should feature original expert writing and curated sources —
          not mirrored third-party pages. Google ads, when enabled, appear only on
          first-party pages such as Guides, About, product explainers, and legal
          documents — never on user Twin chat or imported knowledge screens.
        </p>
      </InfoContentSection>

      <InfoContentSection title="Contact & company">
        <p>
          {APP_NAME} is operated from India and serves experts and visitors
          worldwide. Product questions, abuse reports, and partnerships:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a href="mailto:support@smitvi.com">support@smitvi.com</a>
          </li>
          <li>
            <Link href={ROUTES.contact}>Contact page</Link>
          </li>
          <li>
            <Link href={ROUTES.privacy}>Privacy Policy</Link> ·{" "}
            <Link href={ROUTES.terms}>Terms</Link>
          </li>
        </ul>
      </InfoContentSection>
    </InfoPageShell>
  );
}
