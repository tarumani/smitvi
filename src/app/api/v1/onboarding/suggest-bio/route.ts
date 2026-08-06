import { requireSession } from "@/application/auth/get-current-session";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { CHAT_MODEL, getOpenAIClient } from "@/infrastructure/ai/openai-client";

export async function POST(request: Request) {
  try {
    await requireSession();
    const body: unknown = await request.json();
    const hint =
      typeof body === "object" &&
      body !== null &&
      "hint" in body &&
      typeof (body as { hint?: string }).hint === "string"
        ? (body as { hint: string }).hint.trim()
        : "";

    let bio: string;
    try {
      const openai = getOpenAIClient();
      const response = await openai.responses.create({
        model: CHAT_MODEL,
        input: [
          {
            role: "system",
            content:
              "Write a concise professional bio (max 2 sentences, first person) for a Human Intelligence profile. Plain text only.",
          },
          {
            role: "user",
            content: hint || "A professional sharing expertise online.",
          },
        ],
      });
      bio = response.output_text.trim();
    } catch {
      bio = hint
        ? `I share expertise about ${hint.slice(0, 80)}.`
        : "I help people learn from my experience and knowledge.";
    }

    return jsonOk({ bio });
  } catch (error) {
    return jsonError(error);
  }
}
