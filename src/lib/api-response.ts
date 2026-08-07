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
