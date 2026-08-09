import { describe, expect, it } from "vitest";
import { TwinQueryUnderstandingService } from "@/application/twin/twin-query-understanding-service";
import { TwinQueryPlanner } from "@/application/twin/twin-query-planner";
import { TwinConfidenceEngine } from "@/application/twin/twin-confidence-engine";
import { TwinEvaluationService } from "@/application/twin/twin-evaluation-service";
import { TwinResponseGenerator } from "@/application/twin/twin-response-generator";
import { INSUFFICIENT_EVIDENCE_REPLY } from "@/config/twin-ai";

describe("TwinQueryUnderstandingService", () => {
  const svc = new TwinQueryUnderstandingService();

  it("detects project query with healthcare entity", () => {
    const u = svc.understand(
      "What projects have I worked on in healthcare?",
    );
    expect(u.intent).toBe("PROJECT_QUERY");
    expect(u.entities).toContain("healthcare");
  });

  it("detects recommendation intent", () => {
    const u = svc.understand("Recommend a skill I should learn.");
    expect(u.intent).toBe("RECOMMENDATION_QUERY");
  });

  it("detects conversational thanks without needing knowledge", () => {
    expect(svc.understand("Thanks for the update.").intent).toBe(
      "CONVERSATIONAL",
    );
    expect(svc.understand("Thank you").intent).toBe("CONVERSATIONAL");
    expect(svc.understand("ok").intent).toBe("CONVERSATIONAL");
  });
});

describe("TwinResponseGenerator conversational", () => {
  const gen = new TwinResponseGenerator();

  it("answers conversational turns without evidence", () => {
    expect(
      gen.shouldAnswer({
        confidenceLevel: "UNKNOWN",
        claimLevel: "UNKNOWN",
        intent: "CONVERSATIONAL",
        hasEvidence: false,
        ragCanAnswer: false,
        useLlm: false,
      }),
    ).toBe(true);
  });

  it("returns a welcome reply for thanks", () => {
    const reply = gen.deterministicAnswer({
      understanding: {
        intent: "CONVERSATIONAL",
        entities: [],
        subject: "twin_owner",
        requiredSources: ["NONE"],
        rawQuestion: "Thanks for the update.",
      },
      graph: null,
      ownerDisplayName: "Alex",
    });
    expect(reply).toMatch(/welcome/i);
    expect(reply).not.toBe(INSUFFICIENT_EVIDENCE_REPLY);
  });
});

describe("TwinQueryPlanner", () => {
  const planner = new TwinQueryPlanner();
  const understanding = new TwinQueryUnderstandingService();

  it("uses memory for yesterday questions", () => {
    const u = understanding.understand("What did I tell you yesterday?");
    const plan = planner.plan(u);
    expect(plan.sources).toContain("MEMORY");
  });

  it("RAG-only for organization workspace", () => {
    const u = understanding.understand("Summarize our docs");
    const plan = planner.plan(u, { hasOrganization: true });
    expect(plan.sources).toEqual(["RAG"]);
  });
});

describe("TwinConfidenceEngine", () => {
  const engine = new TwinConfidenceEngine();

  it("returns UNKNOWN with no evidence", () => {
    const r = engine.compute({
      evidence: [],
      ragConfidence: 0,
      ragTopScore: 0,
      graphEvidenceCount: 0,
    });
    expect(r.level).toBe("UNKNOWN");
    expect(r.claimLevel).toBe("UNKNOWN");
  });
});

describe("TwinResponseGenerator policy", () => {
  const gen = new TwinResponseGenerator();

  it("refuses hallucination probe without evidence", () => {
    const ok = gen.shouldAnswer({
      confidenceLevel: "UNKNOWN",
      claimLevel: "UNKNOWN",
      intent: "PERSONAL_FACT_RETRIEVAL",
      hasEvidence: false,
      ragCanAnswer: false,
      useLlm: true,
      hallucinationProbe: true,
    });
    expect(ok).toBe(false);
  });

  it("includes insufficient reply in system prompt", () => {
    const prompt = gen.buildSystemPrompt({
      ownerDisplayName: "Alex",
      mode: "factual",
      claimLevel: "SUPPORTED",
      contradictions: [],
    });
    expect(prompt).toContain(INSUFFICIENT_EVIDENCE_REPLY);
  });
});

describe("TwinEvaluationService golden questions", () => {
  it("passes understanding coverage", () => {
    const report = new TwinEvaluationService().evaluateUnderstanding();
    expect(report.pass).toBe(true);
    expect(report.golden.length).toBeGreaterThan(3);
  });
});
