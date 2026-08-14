import { prisma } from "@/infrastructure/database/prisma";
import { container } from "@/application/container";
import {
  evaluateActivation,
  evaluateIntelligenceReady,
  maxActivationStatus,
  type ActivationStatus,
} from "@/domain/profile/activation";
import { classifyBioQuality } from "@/domain/profile/bio-quality";
import { calculateIntelligenceReadiness } from "@/domain/profile/intelligence-readiness";
import { parseStringArray, trackProfileEvent } from "@/application/onboarding/onboarding-helpers";
import type { IntelligenceReadinessLevel, ProfileActivationStatus } from "@/generated/prisma/client";

export class ProfileActivationService {
  async gather(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        portfolio: true,
        user: {
          include: {
            knowledgeSources: { select: { status: true, isPublic: true } },
            marketplaceListings: { select: { status: true }, take: 1 },
            consultationOffer: { select: { enabled: true } },
          },
        },
      },
    });
    if (!profile) return null;

    const knowledgeReady = profile.user.knowledgeSources.filter(
      (s) => s.status === "READY",
    ).length;
    const graphStats = await prisma.graphRelationship.count({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        sourceEntity: { linkedUserId: userId, deletedAt: null },
      },
    });
    const verified = await prisma.graphRelationship.count({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        verificationStatus: "USER_VERIFIED",
        sourceEntity: { linkedUserId: userId, deletedAt: null },
      },
    });

    const expertise = parseStringArray(profile.expertiseAreas);
    const industries = parseStringArray(profile.industries);
    const quality = classifyBioQuality(profile.bio);

    const activation = evaluateActivation({
      username: profile.username,
      profileType: profile.profileType,
      headline: profile.headline,
      bio: profile.bio,
      confirmedSkillCount: profile.skills.length,
      expertiseCount: expertise.length,
      industryCount: industries.length,
    });

    const intelligence = evaluateIntelligenceReady({
      activated: activation.activated,
      confirmedSkillCount: profile.skills.length,
      hasProjectOrExperience:
        profile.portfolio.length > 0 || profile.experiences.length > 0,
      hasKnowledgeOrExpertise: knowledgeReady > 0 || expertise.length >= 2,
      graphConnectionCount: graphStats,
      verifiedEvidenceCount: verified,
    });

    const readiness = calculateIntelligenceReadiness({
      hasUsername: Boolean(profile.username?.trim()),
      hasProfileType: Boolean(profile.profileType),
      hasMeaningfulSummary:
        Boolean(profile.headline?.trim()) ||
        (Boolean(profile.bio?.trim()) &&
          quality !== "EMPTY" &&
          quality !== "LOW_QUALITY"),
      confirmedSkillCount: profile.skills.length,
      hasExperience: profile.experiences.length > 0,
      hasProject: profile.portfolio.length > 0,
      knowledgeReadyCount: knowledgeReady,
      graphConnectionCount: graphStats,
      userVerifiedFactCount: verified,
    });

    const monetizable =
      profile.user.marketplaceListings.length > 0 ||
      Boolean(profile.user.consultationOffer?.enabled);

    const discoverable =
      activation.activated &&
      profile.visibility === "PUBLIC" &&
      profile.appearInExpertDiscovery;

    return {
      profile,
      activation,
      intelligence,
      readiness,
      monetizable,
      discoverable,
      bioQuality: quality,
    };
  }

  async refresh(userId: string) {
    const snapshot = await this.gather(userId);
    if (!snapshot) return null;

    let status: ActivationStatus = snapshot.profile.activationStatus;
    const now = new Date();
    const data: {
      intelligenceReadinessScore: number;
      intelligenceReadinessLevel: IntelligenceReadinessLevel;
      activationStatus: ProfileActivationStatus;
      profileActivatedAt?: Date;
      intelligenceReadyAt?: Date;
      discoverableAt?: Date | null;
      monetizableAt?: Date;
      isOnboarded?: boolean;
      onboardingCompletedAt?: Date;
      appearInExpertDiscovery?: boolean;
    } = {
      intelligenceReadinessScore: snapshot.readiness.score,
      intelligenceReadinessLevel: snapshot.readiness.level,
      activationStatus: snapshot.profile.activationStatus,
    };

    if (snapshot.activation.activated) {
      const next = maxActivationStatus(status, "PROFILE_ACTIVATED");
      if (next !== status) {
        status = next;
        data.profileActivatedAt = snapshot.profile.profileActivatedAt ?? now;
        data.isOnboarded = true;
        data.onboardingCompletedAt =
          snapshot.profile.onboardingCompletedAt ?? now;
        if (
          snapshot.profile.visibility === "PUBLIC" &&
          !snapshot.profile.appearInExpertDiscovery
        ) {
          data.appearInExpertDiscovery = true;
        }
        await trackProfileEvent(userId, "PROFILE_ACTIVATED", {
          score: snapshot.readiness.score,
        });
      } else if (!snapshot.profile.isOnboarded) {
        data.isOnboarded = true;
        data.onboardingCompletedAt =
          snapshot.profile.onboardingCompletedAt ?? now;
      }
    }

    if (snapshot.intelligence.ready) {
      const next = maxActivationStatus(status, "INTELLIGENCE_READY");
      if (next !== status) {
        status = next;
        data.intelligenceReadyAt = snapshot.profile.intelligenceReadyAt ?? now;
        await trackProfileEvent(userId, "PROFILE_INTELLIGENCE_READY", {
          score: snapshot.readiness.score,
        });
      }
    }

    if (snapshot.discoverable) {
      const next = maxActivationStatus(status, "DISCOVERABLE");
      if (next !== status) {
        status = next;
        data.discoverableAt = snapshot.profile.discoverableAt ?? now;
        await trackProfileEvent(userId, "PROFILE_DISCOVERABILITY_ENABLED", {});
      }
    } else if (
      snapshot.profile.activationStatus === "DISCOVERABLE" &&
      !snapshot.discoverable &&
      snapshot.activation.activated
    ) {
      status = snapshot.intelligence.ready
        ? "INTELLIGENCE_READY"
        : "PROFILE_ACTIVATED";
      data.discoverableAt = null;
    }

    if (snapshot.monetizable) {
      status = maxActivationStatus(status, "MONETIZABLE");
      data.monetizableAt = snapshot.profile.monetizableAt ?? now;
    }

    data.activationStatus = status;

    await prisma.profile.update({
      where: { userId },
      data,
    });

    void container.syncProfileToGraph.execute(userId).catch(() => undefined);

    return {
      ...snapshot,
      activationStatus: status,
    };
  }
}
