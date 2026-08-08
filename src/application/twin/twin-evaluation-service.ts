import { HALLUCINATION_PROBE_TERMS } from "@/config/twin-ai";
import { TwinQueryUnderstandingService } from "@/application/twin/twin-query-understanding-service";

export const GOLDEN_QUESTIONS = [
  "What skills do I have?",
  "What companies have I worked with?",
  "What projects have I created?",
  "What healthcare experience do I have?",
  "What experience do I have with NASA?",
] as const;

export class TwinEvaluationService {
  private readonly understanding = new TwinQueryUnderstandingService();

  evaluateUnderstanding() {
    const results = GOLDEN_QUESTIONS.map((q) => ({
      question: q,
      understanding: this.understanding.understand(q),
    }));

    const nasa = results.find((r) => r.question.includes("NASA"));
    const hallucinationSafe =
      nasa?.understanding.entities.includes("nasa") &&
      HALLUCINATION_PROBE_TERMS.includes("nasa");

    return {
      golden: results,
      hallucinationProbeExpected:
        "Must not invent NASA experience without graph/RAG evidence",
      hallucinationIntentOk: Boolean(hallucinationSafe),
      pass: results.every((r) => r.understanding.intent !== "UNKNOWN" || r.question.includes("NASA")),
    };
  }
}
