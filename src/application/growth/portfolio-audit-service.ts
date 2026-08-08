import { inferMonetizationPaths } from "@/application/growth/growth-scoring-service";

export type PortfolioAuditResult = {
  strengths: string[];
  skills: string[];
  experienceSignals: string[];
  knowledgeOpportunities: string[];
  monetizationOpportunities: string[];
  suggestedHubFocus: string;
  cta: string;
  disclaimer: string;
};

export class PortfolioAuditService {
  auditFromUrl(portfolioUrl: string, hints?: {
    profession?: string | null;
    skills?: string[];
  }): PortfolioAuditResult {
    const skills = hints?.skills?.length
      ? hints.skills
      : this.inferSkillsFromUrl(portfolioUrl);

    const profession = hints?.profession ?? "UNKNOWN";
    const paths = inferMonetizationPaths({
      skills,
      topics: [],
      profession,
      portfolioUrl,
    });

    const strengths: string[] = [];
    if (portfolioUrl.startsWith("http")) {
      strengths.push("Public portfolio URL provided for review");
    }
    if (skills.length >= 3) strengths.push("Multiple skill areas detected from input");
    if (strengths.length === 0) strengths.push("UNKNOWN — add skills or resume text for richer audit");

    return {
      strengths,
      skills: skills.length ? skills : ["UNKNOWN"],
      experienceSignals: profession !== "UNKNOWN" ? [`Profession hint: ${profession}`] : ["UNKNOWN"],
      knowledgeOpportunities: [
        "Publish case studies as knowledge sources",
        "Map skills to the Human Intelligence Graph",
      ],
      monetizationOpportunities: paths,
      suggestedHubFocus:
        skills[0] && skills[0] !== "UNKNOWN"
          ? `${skills[0]} expertise hub`
          : "Professional expertise hub",
      cta: "Build your free Smitvi Intelligence Hub.",
      disclaimer:
        "This audit uses only information you provide. Smitvi does not log into private accounts or scrape authenticated pages.",
    };
  }

  private inferSkillsFromUrl(url: string): string[] {
    const lower = url.toLowerCase();
    const found: string[] = [];
    const catalog = ["figma", "ux", "ui", "react", "healthcare", "design", "product"];
    for (const token of catalog) {
      if (lower.includes(token)) found.push(token);
    }
    return found;
  }
}
