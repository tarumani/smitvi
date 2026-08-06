import {
  INTELLIGENCE_MAX_SCORE,
  INTELLIGENCE_POINT_WEIGHTS,
} from "@/config/onboarding-flow";

export type IntelligenceScoreInput = {
  hasAvatar: boolean;
  hasProfession: boolean;
  interestCount: number;
  hasBio: boolean;
  knowledgeSourceCount: number;
  followingCount: number;
  emailVerified: boolean;
  skippedPhoto?: boolean;
};

export type IntelligenceScoreResult = {
  score: number;
  percent: number;
  points: number;
  nextAchievements: Array<{
    id: string;
    label: string;
    points: number;
    done: boolean;
  }>;
};

export function calculateIntelligenceScore(
  input: IntelligenceScoreInput,
): IntelligenceScoreResult {
  let points = 0;

  if (input.hasAvatar) points += INTELLIGENCE_POINT_WEIGHTS.profilePicture;
  if (input.hasProfession) points += INTELLIGENCE_POINT_WEIGHTS.profession;
  if (input.interestCount >= 3) points += INTELLIGENCE_POINT_WEIGHTS.interests;
  if (input.hasBio) points += INTELLIGENCE_POINT_WEIGHTS.bio;
  if (input.knowledgeSourceCount > 0) {
    points += INTELLIGENCE_POINT_WEIGHTS.knowledgeUpload;
  }
  if (input.followingCount >= 5) {
    points += INTELLIGENCE_POINT_WEIGHTS.followExperts;
  }
  if (input.emailVerified) points += INTELLIGENCE_POINT_WEIGHTS.emailVerified;

  const capped = Math.min(points, INTELLIGENCE_MAX_SCORE);
  const percent = capped;

  const nextAchievements = [
    {
      id: "photo",
      label: "Add profile photo",
      points: INTELLIGENCE_POINT_WEIGHTS.profilePicture,
      done: input.hasAvatar,
    },
    {
      id: "knowledge",
      label: "Upload knowledge",
      points: INTELLIGENCE_POINT_WEIGHTS.knowledgeUpload,
      done: input.knowledgeSourceCount > 0,
    },
    {
      id: "follow",
      label: "Follow 5+ experts",
      points: INTELLIGENCE_POINT_WEIGHTS.followExperts,
      done: input.followingCount >= 5,
    },
    {
      id: "bio",
      label: "Complete your bio",
      points: INTELLIGENCE_POINT_WEIGHTS.bio,
      done: input.hasBio,
    },
  ];

  return { score: capped, percent, points: capped, nextAchievements };
}
