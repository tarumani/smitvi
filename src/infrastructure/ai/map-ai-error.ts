import { DomainError, ValidationError } from "@/domain/shared/errors";

function readStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function readMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "AI processing failed";
}

/** Convert OpenAI / AI provider failures into user-facing domain errors. */
export function mapAiError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;

  const status = readStatus(error);
  const message = readMessage(error);
  const lower = message.toLowerCase();

  if (
    status === 429 ||
    lower.includes("no credits remaining") ||
    lower.includes("insufficient_quota") ||
    lower.includes("rate limit")
  ) {
    return new ValidationError(
      "OpenAI has no credits remaining. Add credits at platform.openai.com billing, then try again.",
    );
  }

  if (
    status === 401 ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    lower.includes("openai_api_key is required")
  ) {
    return new ValidationError(
      "AI processing is misconfigured. Check the OpenAI API key on the server.",
    );
  }

  if (message.length <= 240) {
    return new ValidationError(message);
  }

  return new ValidationError("AI processing failed. Please try again shortly.");
}

export function throwMappedAiError(error: unknown): never {
  throw mapAiError(error);
}
