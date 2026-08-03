import Link from "next/link";
import { ArrowRight, GraduationCap, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { InfographicPanel } from "@/components/landing/infographic-panel";
import { ROUTES } from "@/config/constants";

const audiences = [
  {
    icon: Briefcase,
    title: "For experts & creators",
    points: [
      "Stop repeating the same answers in DMs and calls",
      "Publish a Twin that cites your real sources",
      "Monetize consultations and knowledge packs",
    ],
  },
  {
    icon: GraduationCap,
    title: "For learners & teams",
    points: [
      "Ask an expert’s Twin anytime — grounded answers",
      "Discover people by skills and topics, not just titles",
      "Hire when you need a human, not for every FAQ",
    ],
  },
  {
    icon: Users,
    title: "For organizations",
    points: [
      "Shared workspace Twins for internal knowledge",
      "Onboard faster with org-scoped intelligence",
      "Keep institutional memory searchable",
    ],
  },
] as const;

type HowItHelpsProps = {
  showIntro?: boolean;
  showPageLink?: boolean;
};

export function HowItHelps({
  showIntro = true,
  showPageLink = true,
}: HowItHelpsProps) {
  return (
    <section id="how-it-helps" className="relative overflow-hidden">
      <div className="absolute inset-0 section-band" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        {showIntro ? (
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
              How it helps
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
              Scale your mind. Find expertise that answers back.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted-foreground)]">
              Smitvi turns human expertise into a searchable Knowledge Twin —
              useful for the people who teach, and for the people who need
              answers.
            </p>
          </div>
        ) : null}

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-center">
          <InfographicPanel variant="pipeline" className="animate-fade-up" />
          <GlassCard className="animate-fade-up-delay-1 space-y-4 p-6 text-sm leading-relaxed text-[var(--muted-foreground)]">
            <p>
              <strong className="text-[var(--foreground)]">Upload</strong> the
              artifacts of your expertise — documents, notes, decks, and more.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Index</strong> them
              into a private intelligence graph with embeddings and citations.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Launch</strong> a Twin
              that answers on your behalf, then open marketplace offers when
              you’re ready to earn.
            </p>
          </GlassCard>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {audiences.map((item, index) => (
            <GlassCard
              key={item.title}
              className={`p-6 ${index === 0 ? "animate-fade-up" : index === 1 ? "animate-fade-up-delay-1" : "animate-fade-up-delay-2"}`}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                <item.icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted-foreground)]">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {point}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <GlassCard className="overflow-hidden p-4 sm:p-5">
            <InfographicPanel variant="value" />
            <p className="mt-4 px-1 text-sm text-[var(--muted-foreground)]">
              Experts multiply their time. Learners get instant, cited help —
              then book a human when it matters.
            </p>
          </GlassCard>
          <GlassCard className="overflow-hidden p-4 sm:p-5">
            <InfographicPanel variant="network" />
            <p className="mt-4 px-1 text-sm text-[var(--muted-foreground)]">
              Your Twin sits at the center of your knowledge sources — not a
              generic chatbot trained on the open web.
            </p>
          </GlassCard>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={ROUTES.signup}>
              Create your Twin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {showPageLink ? (
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.howItHelps}>Read the full story</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.discover}>Explore experts</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
