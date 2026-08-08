/** Read a field from `{ data: T }` API success payloads. */
export function readApiDataField(
  json: unknown,
  field: string,
): string | null {
  if (typeof json !== "object" || json === null) return null;

  const root = json as Record<string, unknown>;
  if (field in root && typeof root[field] === "string") {
    return root[field];
  }

  const data = root.data;
  if (typeof data === "object" && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field];
    return typeof value === "string" ? value : null;
  }

  return null;
}

export function readApiErrorMessage(json: unknown, fallback: string): string {
  if (typeof json === "object" && json !== null && "error" in json) {
    const err = (json as { error?: { message?: string; details?: Record<string, string[]> } })
      .error;
    const message = err?.message;
    if (typeof message === "string") {
      const trimmed = message.trim();
      if (trimmed && trimmed !== "{}") {
        if (trimmed === "Invalid profile data" && err?.details) {
          const firstDetail = Object.values(err.details).flat()[0];
          if (firstDetail) return firstDetail;
        }
        return trimmed;
      }
    }
  }
  return fallback;
}

export function readImportJobFromResponse(json: unknown): {
  status: string;
  errorMessage: string | null;
} | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: { job?: { status?: string; errorMessage?: string | null } } })
    .data;
  const job = data?.job;
  if (!job || typeof job.status !== "string") return null;
  return {
    status: job.status,
    errorMessage:
      typeof job.errorMessage === "string" ? job.errorMessage : null,
  };
}
