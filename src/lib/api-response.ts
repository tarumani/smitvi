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
  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof (json as { error?: { message?: string } }).error?.message ===
      "string"
  ) {
    return (json as { error: { message: string } }).error.message;
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
