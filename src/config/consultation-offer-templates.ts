export type ConsultationOfferDraft = {
  headline: string;
  description: string;
  durationMinutes: number;
  priceUsd: string;
  currency: string;
};

export const CONSULTATION_QUICK_PLANS = [
  {
    id: "intro",
    label: "Free intro call",
    summary: "15 minutes — great for first bookings and trust.",
    draft: {
      durationMinutes: 15,
      priceUsd: "0",
    },
  },
  {
    id: "standard",
    label: "Standard session",
    summary: "30 minutes — typical paid consultation.",
    draft: {
      durationMinutes: 30,
      priceUsd: "49",
    },
  },
  {
    id: "deep",
    label: "Deep dive",
    summary: "60 minutes — strategy or project review.",
    draft: {
      durationMinutes: 60,
      priceUsd: "99",
    },
  },
] as const;

function specialtyFromProfile(input: {
  profession: string | null;
  headline: string | null;
  displayName: string;
}): string {
  return (
    input.headline?.trim() ||
    input.profession?.trim() ||
    `${input.displayName}'s expertise`
  );
}

export function suggestConsultationOffer(
  planId: (typeof CONSULTATION_QUICK_PLANS)[number]["id"],
  profile: {
    displayName: string;
    profession: string | null;
    headline: string | null;
    bio: string | null;
  },
): ConsultationOfferDraft {
  const plan =
    CONSULTATION_QUICK_PLANS.find((p) => p.id === planId) ??
    CONSULTATION_QUICK_PLANS[1];
  const specialty = specialtyFromProfile(profile);
  const bio = profile.bio?.trim();

  return {
    headline: `${plan.draft.durationMinutes}-min ${specialty} session`,
    description: bio
      ? `${bio.slice(0, 320)}${bio.length > 320 ? "…" : ""}\n\nBook time for focused help, feedback, and next steps.`
      : `Book a ${plan.draft.durationMinutes}-minute session for focused help on ${specialty.toLowerCase()}. You'll leave with clear next steps.`,
    durationMinutes: plan.draft.durationMinutes,
    priceUsd: plan.draft.priceUsd,
    currency: "USD",
  };
}

export function defaultConsultationPlan(): (typeof CONSULTATION_QUICK_PLANS)[number]["id"] {
  return "standard";
}
