import type { TwinContradiction } from "@/domain/twin/types";

export class TwinContradictionEngine {
  detect(input: {
    profileBio: string | null;
    profileHeadline: string | null;
    graphSummaryLines: string[];
  }): TwinContradiction[] {
    const out: TwinContradiction[] = [];
    const blob = `${input.profileBio ?? ""} ${input.profileHeadline ?? ""}`;
    const yearsInProfile = extractYears(blob);
    const yearsInGraph = input.graphSummaryLines.flatMap(extractYears);

    if (yearsInProfile.length >= 2) {
      const min = Math.min(...yearsInProfile);
      const max = Math.max(...yearsInProfile);
      if (max - min >= 2) {
        out.push({
          field: "experience_years",
          valueA: String(min),
          sourceA: "Profile text",
          valueB: String(max),
          sourceB: "Profile text",
        });
      }
    }

    if (yearsInProfile.length === 1 && yearsInGraph.length === 1) {
      const a = yearsInProfile[0]!;
      const b = yearsInGraph[0]!;
      if (Math.abs(a - b) >= 2) {
        out.push({
          field: "experience_years",
          valueA: `${a} years`,
          sourceA: "Profile",
          valueB: `${b} years (inferred from graph summary)`,
          sourceB: "Graph",
        });
      }
    }

    return out;
  }
}

function extractYears(text: string): number[] {
  const matches = [...text.matchAll(/(\d+)\+?\s*years?/gi)];
  return matches.map((m) => Number(m[1])).filter((n) => n > 0 && n < 50);
}
