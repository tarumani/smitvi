import type {
  Experience,
  PortfolioItem,
  Profile,
  ProfileSkill,
  Skill,
  SocialLink,
  User,
} from "@/generated/prisma/client";
import type {
  ExperienceEntity,
  PortfolioItemEntity,
  ProfileEntity,
  ProfileSummary,
  SkillEntity,
  SocialLinkEntity,
} from "@/domain/profile/entities";
import type { UserEntity } from "@/domain/user/entities";

type ProfileWithRelations = Profile & {
  skills: Array<ProfileSkill & { skill: Skill }>;
  experiences: Experience[];
  socialLinks: SocialLink[];
  portfolio: PortfolioItem[];
};

export function toUserEntity(user: User): UserEntity {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    plan: user.plan,
    isActive: user.isActive,
    isBanned: user.isBanned,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toSkillEntity(
  row: ProfileSkill & { skill: Skill },
): SkillEntity {
  return {
    id: row.skill.id,
    name: row.skill.name,
    slug: row.skill.slug,
    level: row.level,
  };
}

export function toExperienceEntity(row: Experience): ExperienceEntity {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    description: row.description,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    isCurrent: row.isCurrent,
    sortOrder: row.sortOrder,
  };
}

export function toSocialLinkEntity(row: SocialLink): SocialLinkEntity {
  return {
    id: row.id,
    platform: row.platform,
    url: row.url,
  };
}

export function toPortfolioItemEntity(row: PortfolioItem): PortfolioItemEntity {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
  };
}

export function toProfileEntity(profile: ProfileWithRelations): ProfileEntity {
  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    headline: profile.headline,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    websiteUrl: profile.websiteUrl,
    location: profile.location,
    timezone: profile.timezone,
    visibility: profile.visibility,
    isOnboarded: profile.isOnboarded,
    publicTwinEnabled: profile.publicTwinEnabled,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    ratingAverage: profile.ratingAverage,
    ratingCount: profile.ratingCount,
    hubArchetypeId: profile.hubArchetypeId,
    reputationScore: profile.reputationScore,
    onboardingStep: profile.onboardingStep,
    hubDigestEmailEnabled: profile.hubDigestEmailEnabled,
    skills: profile.skills.map(toSkillEntity),
    experiences: profile.experiences
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toExperienceEntity),
    socialLinks: profile.socialLinks.map(toSocialLinkEntity),
    portfolio: profile.portfolio
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toPortfolioItemEntity),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toProfileSummary(profile: Profile): ProfileSummary {
  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    headline: profile.headline,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    isOnboarded: profile.isOnboarded,
    visibility: profile.visibility,
    publicTwinEnabled: profile.publicTwinEnabled,
    followersCount: profile.followersCount,
    ratingAverage: profile.ratingAverage,
    ratingCount: profile.ratingCount,
    hubArchetypeId: profile.hubArchetypeId,
    reputationScore: profile.reputationScore,
    onboardingStep: profile.onboardingStep,
  };
}
