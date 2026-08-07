import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { CHAT_MODEL, getOpenAIClient } from "@/infrastructure/ai/openai-client";

const bodySchema = z.object({
  purpose: z.enum([
    "profile_bio",
    "profile_headline_skills",
    "marketplace_listing",
    "consultation_offer",
    "generic",
  ]),
  hint: z.string().max(2000).optional(),
  title: z.string().max(200).optional(),
  listingType: z.string().max(80).optional(),
});

const SYSTEM: Record<z.infer<typeof bodySchema>["purpose"], string> = {
  profile_bio:
    "Write a concise professional bio (2–3 sentences, first person) for a Human Intelligence hub. Plain text, no markdown. Suitable for public profile and AdSense-friendly pages.",
  profile_headline_skills:
    'Return JSON only: {"headline":"short pipe-separated tagline","skills":"comma-separated skills"}. Headline max 80 chars. 4–8 skills.',
  marketplace_listing:
    "Write a marketplace listing description (2–4 short paragraphs). Clear deliverables, audience, and outcomes. Original prose, no hype spam, suitable for SEO and AdSense policies. Plain text.",
  consultation_offer:
    "Write a consultation offer description (2–3 sentences). What happens on the call, who it is for, and follow-up. Plain text, professional tone.",
  generic:
    "Improve or draft the user's text. Plain text only, concise and professional.",
};

export async function POST(request: Request) {
  try {
    await requireSession();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid generate request");
    }

    const { purpose, hint, title, listingType } = parsed.data;
    const userContent = [
      title ? `Title: ${title}` : null,
      listingType ? `Listing type: ${listingType}` : null,
      hint ? `Context: ${hint}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    let text: string;
    try {
      const openai = getOpenAIClient();
      const response = await openai.responses.create({
        model: CHAT_MODEL,
        input: [
          { role: "system", content: SYSTEM[purpose] },
          {
            role: "user",
            content: userContent || "General expert offering knowledge online.",
          },
        ],
      });
      text = response.output_text.trim();
    } catch {
      text = fallbackCopy(purpose, hint, title);
    }

    if (purpose === "profile_headline_skills") {
      try {
        const json = JSON.parse(text) as {
          headline?: string;
          skills?: string;
        };
        return jsonOk({
          headline: json.headline?.trim() ?? "",
          skills: json.skills?.trim() ?? "",
        });
      } catch {
        return jsonOk({
          headline: hint?.slice(0, 80) ?? "Expert · Consultant",
          skills: "Strategy, Coaching, AI",
        });
      }
    }

    return jsonOk({ text });
  } catch (error) {
    return jsonError(error);
  }
}

function fallbackCopy(
  purpose: z.infer<typeof bodySchema>["purpose"],
  hint?: string,
  title?: string,
): string {
  const base = hint || title || "my area of expertise";
  switch (purpose) {
    case "profile_bio":
      return `I help people with ${base}. My Twin and hub share practical guidance from my experience.`;
    case "marketplace_listing":
      return `You get structured help with ${title || base}: clear scope, actionable deliverables, and follow-up notes. Ideal for professionals who want focused outcomes.`;
    case "consultation_offer":
      return `A focused session on ${base}. We clarify your goals, work through your questions, and leave with next steps.`;
    default:
      return base;
  }
}
