export function parseHeadersJson(text: string): Record<string, string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Headers must be a valid JSON object");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Headers must be a JSON object of string values");
  }

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (value == null) {
      continue;
    }
    out[key] = String(value);
  }
  return out;
}

/** Empty / placeholder JSON bodies are omitted from the scan request. */
export function resolveRequestBody(body: string | undefined): string | undefined {
  const trimmed = body?.trim() ?? "";
  if (!trimmed || trimmed === "{}") {
    return undefined;
  }
  return body;
}
