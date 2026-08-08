import { inferMonetizationPaths } from "@/application/growth/growth-scoring-service";

export class GrowthValuePropositionService {
  build(input: {
    name: string;
    profession?: string | null;
    skills: string[];
    portfolioUrl?: string | null;
    publicSignals?: Record<string, unknown>;
  }): { headline: string; body: string; archetype: string } {
    const prof = (input.profession ?? "").toLowerCase();
    const paths = inferMonetizationPaths({
      skills: input.skills,
      topics: [],
      profession: input.profession,
      portfolioUrl: input.portfolioUrl,
    });

    if (/teach|professor|instructor|educator/.test(prof)) {
      return {
        archetype: "teacher",
        headline: "Teach at scale with an AI expert",
        body: `Hi ${input.name.split(" ")[0] ?? "there"} — Smitvi helps educators turn teaching material into an AI-powered expert that answers questions 24/7. Paths: ${paths.slice(0, 3).join(", ")}.`,
      };
    }
    if (/consult|coach|advisor/.test(prof)) {
      return {
        archetype: "consultant",
        headline: "Let people interact with your expertise 24/7",
        body: `Hi ${input.name.split(" ")[0] ?? "there"} — Smitvi lets consultants offer an Intelligence Hub + AI Twin so clients can engage between sessions. Monetize via ${paths.slice(0, 2).join(" and ")}.`,
      };
    }
    if (/design|ux|ui/.test(prof) || input.portfolioUrl) {
      return {
        archetype: "designer",
        headline: "Turn your portfolio into an interactive AI expert",
        body: `Hi ${input.name.split(" ")[0] ?? "there"} — Smitvi turns public portfolio work into a discoverable Intelligence Hub. Consider ${paths.slice(0, 3).join(", ")} on our marketplace.`,
      };
    }
    return {
      archetype: "creator",
      headline: "Turn your knowledge into products",
      body: `Hi ${input.name.split(" ")[0] ?? "there"} — Smitvi helps experts publish an Intelligence Hub, AI Twin, and marketplace products (${paths.slice(0, 3).join(", ")}).`,
    };
  }
}
