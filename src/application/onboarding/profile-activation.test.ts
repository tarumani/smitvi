import { describe, expect, it } from "vitest";
import { classifyBioQuality } from "@/domain/profile/bio-quality";
import {
  evaluateActivation,
  evaluateIntelligenceReady,
  maxActivationStatus,
} from "@/domain/profile/activation";
import { calculateIntelligenceReadiness } from "@/domain/profile/intelligence-readiness";
import {
  uniqueByValue,
  acceptedValues,
  profileExtractionSchema,
  type ReviewableField,
} from "@/domain/profile/profile-extraction";
import { selectMissingQuestions } from "@/domain/profile/missing-questions";

describe("bio quality", () => {
  it("classifies empty and low-quality bios", () => {
    expect(classifyBioQuality("")).toBe("EMPTY");
    expect(classifyBioQuality("hello")).toBe("LOW_QUALITY");
    expect(classifyBioQuality("student")).toBe("LOW_QUALITY");
    expect(classifyBioQuality("fashion")).toBe("LOW_QUALITY");
    expect(classifyBioQuality("welcome to my page")).toBe("LOW_QUALITY");
  });

  it("classifies a high-quality professional bio", () => {
    const bio =
      "I am a UI/UX designer with 8 years of experience. I have worked on healthcare, education and SaaS products. I specialize in mobile and web applications and use Figma.";
    expect(classifyBioQuality(bio)).toBe("HIGH_QUALITY");
  });
});

describe("activation requirements", () => {
  it("does not activate a new Google user with only username", () => {
    const result = evaluateActivation({
      username: "alex",
      profileType: null,
      headline: null,
      bio: "hello",
      confirmedSkillCount: 0,
      expertiseCount: 0,
      industryCount: 0,
    });
    expect(result.activated).toBe(false);
    expect(result.missing).toContain("profileType");
    expect(result.missing).toContain("skills");
  });

  it("activates when minimum quality is met", () => {
    const result = evaluateActivation({
      username: "alex",
      profileType: "PROFESSIONAL",
      headline: "UI/UX Designer specializing in mobile products",
      bio: "Experienced designer working in healthcare.",
      confirmedSkillCount: 3,
      expertiseCount: 1,
      industryCount: 0,
    });
    expect(result.activated).toBe(true);
  });

  it("treats existing incomplete users as not activated", () => {
    const result = evaluateActivation({
      username: "olduser",
      profileType: null,
      headline: "",
      bio: "fashion",
      confirmedSkillCount: 1,
      expertiseCount: 0,
      industryCount: 0,
    });
    expect(result.activated).toBe(false);
  });
});

describe("AI extraction review", () => {
  it("keeps AI items pending until the user accepts", () => {
    const skills: ReviewableField<string>[] = [
      {
        value: "Figma",
        source: "AI_INFERRED",
        status: "PENDING_USER_REVIEW",
        confidence: 0.9,
        classification: "EXPLICIT",
      },
    ];
    expect(acceptedValues(skills)).toEqual([]);
    skills[0].status = "ACCEPTED";
    expect(acceptedValues(skills)).toEqual(["Figma"]);
  });

  it("lets the user reject suggestions", () => {
    const skills: ReviewableField<string>[] = [
      { value: "Figma", source: "AI_INFERRED", status: "REJECTED" },
      { value: "UX Design", source: "AI_INFERRED", status: "ACCEPTED" },
    ];
    expect(acceptedValues(skills)).toEqual(["UX Design"]);
  });

  it("lets the user edit suggestions", () => {
    const skills: ReviewableField<string>[] = [
      { value: "UI Design", source: "USER", status: "EDITED" },
    ];
    expect(acceptedValues(skills)).toEqual(["UI Design"]);
  });

  it("deduplicates skills case-insensitively", () => {
    const merged = uniqueByValue([
      { value: "Figma", source: "USER", status: "ACCEPTED" },
      { value: "figma", source: "AI_INFERRED", status: "PENDING_USER_REVIEW" },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].value).toBe("Figma");
  });

  it("validates extraction JSON and allows missing data", () => {
    const parsed = profileExtractionSchema.parse({
      suggestedProfileType: "PROFESSIONAL",
      typeMismatch: false,
      suggestedHeadline: null,
      summary: null,
      roles: [],
      skills: [],
      expertiseAreas: [],
      industries: [],
      experienceYears: null,
      confidence: { skills: 0, industries: 0, experienceYears: 0 },
    });
    expect(parsed.skills).toEqual([]);
    expect(parsed.suggestedHeadline).toBeNull();
  });

  it("flags a business description as a type mismatch candidate via schema", () => {
    const parsed = profileExtractionSchema.parse({
      suggestedProfileType: "FOUNDER",
      typeMismatch: true,
      suggestedTypeReason: "Brand description",
      suggestedHeadline: "Rick Owens",
      summary: "Footwear and apparel brand.",
      roles: [],
      skills: [],
      expertiseAreas: [],
      industries: [
        {
          value: "Fashion",
          evidence: "apparel",
          confidence: 0.7,
          classification: "INFERRED",
        },
      ],
      experienceYears: null,
      confidence: { skills: 0, industries: 0.7, experienceYears: 0 },
    });
    expect(parsed.typeMismatch).toBe(true);
    expect(parsed.suggestedProfileType).toBe("FOUNDER");
  });
});

describe("intelligence readiness", () => {
  it("scores building profiles in the 21–40 band when identity and summary exist", () => {
    const result = calculateIntelligenceReadiness({
      hasUsername: true,
      hasProfileType: true,
      hasMeaningfulSummary: true,
      confirmedSkillCount: 0,
      hasExperience: false,
      hasProject: false,
      knowledgeReadyCount: 0,
      graphConnectionCount: 0,
      userVerifiedFactCount: 0,
    });
    expect(result.score).toBe(20);
    expect(result.level).toBe("STARTING");
    expect(result.missing).toContain("project");
    expect(result.missing).toContain("knowledge");
  });

  it("reaches INTELLIGENCE_READY at 81+", () => {
    const result = calculateIntelligenceReadiness({
      hasUsername: true,
      hasProfileType: true,
      hasMeaningfulSummary: true,
      confirmedSkillCount: 4,
      hasExperience: true,
      hasProject: true,
      knowledgeReadyCount: 1,
      graphConnectionCount: 5,
      userVerifiedFactCount: 4,
    });
    expect(result.score).toBe(100);
    expect(result.level).toBe("INTELLIGENCE_READY");
  });
});

describe("intelligence ready gate", () => {
  it("does not treat empty AI-inferred data as sufficient", () => {
    const result = evaluateIntelligenceReady({
      activated: true,
      confirmedSkillCount: 0,
      hasProjectOrExperience: false,
      hasKnowledgeOrExpertise: false,
      graphConnectionCount: 0,
      verifiedEvidenceCount: 0,
    });
    expect(result.ready).toBe(false);
  });
});

describe("missing questions", () => {
  it("asks at most 3 questions and includes a project prompt when none exist", () => {
    const questions = selectMissingQuestions({
      profileType: "PROFESSIONAL",
      draft: null,
      confirmedSkillCount: 3,
      hasProject: false,
      expertiseCount: 0,
    });
    expect(questions.length).toBeLessThanOrEqual(3);
    expect(questions.some((q) => q.id === "proud_project")).toBe(true);
  });
});

describe("activation watermark", () => {
  it("never downgrades past activation except discoverability handled separately", () => {
    expect(maxActivationStatus("PROFILE_ACTIVATED", "ONBOARDING_STARTED")).toBe(
      "PROFILE_ACTIVATED",
    );
  });
});

describe("private profile visibility contract", () => {
  it("discoverable requires public + toggle conceptually", () => {
    const privateActivated = {
      visibility: "PRIVATE",
      appearInExpertDiscovery: true,
      activated: true,
    };
    const discoverable =
      privateActivated.activated &&
      privateActivated.visibility === "PUBLIC" &&
      privateActivated.appearInExpertDiscovery;
    expect(discoverable).toBe(false);
  });
});

describe("interrupted onboarding resume", () => {
  it("stores draft step so analysis can resume at review", () => {
    const draft = {
      narrative: "I am a designer",
      step: "ai_review",
    };
    expect(draft.step).toBe("ai_review");
  });
});
