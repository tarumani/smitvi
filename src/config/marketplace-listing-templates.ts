import type { MarketplaceListingType } from "@/generated/prisma/enums";

export type FirstListingDraft = {
  type: MarketplaceListingType;
  title: string;
  description: string;
  priceUsd: string;
  durationMinutes: string;
};

export type ListingTemplateId =
  | "consultation"
  | "knowledge_pack"
  | "service_package";

export const FIRST_LISTING_TEMPLATES: Array<{
  id: ListingTemplateId;
  type: MarketplaceListingType;
  label: string;
  summary: string;
}> = [
  {
    id: "consultation",
    type: "CONSULTATION",
    label: "1:1 consultation",
    summary: "Best first offer — book calls from your public hub.",
  },
  {
    id: "knowledge_pack",
    type: "KNOWLEDGE_PACK",
    label: "Knowledge pack",
    summary: "Sell templates, guides, or curated resources.",
  },
  {
    id: "service_package",
    type: "SERVICE_PACKAGE",
    label: "Service package",
    summary: "Fixed-scope projects with clear deliverables.",
  },
];

function specialtyFromProfile(input: {
  profession: string | null;
  headline: string | null;
  bio: string | null;
  displayName: string;
}): string {
  const fromHeadline = input.headline?.trim();
  if (fromHeadline && fromHeadline.length <= 80) return fromHeadline;
  const fromProfession = input.profession?.trim();
  if (fromProfession) return fromProfession;
  return `${input.displayName}'s expertise`;
}

function bioSnippet(bio: string | null, max = 280): string {
  const text = bio?.trim();
  if (!text) {
    return "You'll get practical, source-backed guidance tailored to your situation. Sessions are focused on clear next steps you can apply immediately.";
  }
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function suggestFirstListing(
  templateId: ListingTemplateId,
  profile: {
    displayName: string;
    profession: string | null;
    headline: string | null;
    bio: string | null;
  },
): FirstListingDraft {
  const specialty = specialtyFromProfile(profile);
  const snippet = bioSnippet(profile.bio);

  switch (templateId) {
    case "knowledge_pack":
      return {
        type: "KNOWLEDGE_PACK",
        title: `${specialty} — starter pack`,
        description: `${snippet}\n\nIncludes curated notes, frameworks, and examples you can use right away. Delivered digitally after purchase.`,
        priceUsd: "29",
        durationMinutes: "30",
      };
    case "service_package":
      return {
        type: "SERVICE_PACKAGE",
        title: `${specialty} — focused project`,
        description: `${snippet}\n\nFixed scope with defined deliverables, timeline, and one round of revisions. Ideal for a single outcome.`,
        priceUsd: "199",
        durationMinutes: "30",
      };
    case "consultation":
    default:
      return {
        type: "CONSULTATION",
        title: `30-min ${specialty} session`,
        description: `${snippet}\n\nBook a live session to ask questions, review your work, or get a concrete action plan.`,
        priceUsd: "49",
        durationMinutes: "30",
      };
  }
}

export function defaultFirstListingTemplate(
  profile: { profession: string | null },
): ListingTemplateId {
  const p = profile.profession?.toLowerCase() ?? "";
  if (
    p.includes("teacher") ||
    p.includes("writer") ||
    p.includes("consultant")
  ) {
    return "consultation";
  }
  if (p.includes("design") || p.includes("developer") || p.includes("ux")) {
    return "service_package";
  }
  return "consultation";
}
