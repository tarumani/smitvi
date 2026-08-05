export type ProfileVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

export type SkillEntity = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly level: number;
};

export type ExperienceEntity = {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly isCurrent: boolean;
  readonly sortOrder: number;
};

export type SocialLinkEntity = {
  readonly id: string;
  readonly platform: string;
  readonly url: string;
};

export type PortfolioItemEntity = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly url: string | null;
  readonly imageUrl: string | null;
  readonly sortOrder: number;
};

export type ProfileEntity = {
  readonly id: string;
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly bio: string | null;
  readonly headline: string | null;
  readonly avatarUrl: string | null;
  readonly coverUrl: string | null;
  readonly websiteUrl: string | null;
  readonly location: string | null;
  readonly timezone: string | null;
  readonly visibility: ProfileVisibility;
  readonly isOnboarded: boolean;
  readonly publicTwinEnabled: boolean;
  readonly followersCount: number;
  readonly followingCount: number;
  readonly ratingAverage: number;
  readonly ratingCount: number;
  readonly hubArchetypeId: string | null;
  readonly reputationScore: number;
  readonly onboardingStep: string | null;
  readonly skills: readonly SkillEntity[];
  readonly experiences: readonly ExperienceEntity[];
  readonly socialLinks: readonly SocialLinkEntity[];
  readonly portfolio: readonly PortfolioItemEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProfileSummary = {
  readonly id: string;
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly bio: string | null;
  readonly headline: string | null;
  readonly avatarUrl: string | null;
  readonly coverUrl: string | null;
  readonly isOnboarded: boolean;
  readonly visibility: ProfileVisibility;
  readonly publicTwinEnabled: boolean;
  readonly followersCount: number;
  readonly ratingAverage: number;
  readonly ratingCount: number;
  readonly hubArchetypeId: string | null;
  readonly reputationScore: number;
  readonly onboardingStep: string | null;
};
