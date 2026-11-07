/** Persist listing arrays as JSON text and tolerate legacy comma-joined values. */
export function serializeStringList(value: string[] | null | undefined): string | null {
  if (!value || value.length === 0) return null;
  return JSON.stringify(value);
}

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
      }
    } catch {
      // Fall through to legacy comma-separated storage.
    }
  }
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [trimmed];
}
