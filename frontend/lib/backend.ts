export function getBackendUrl(): string {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export async function parseBackendError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown; message?: unknown };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    // Ignore parse errors and fallback to generic message.
  }

  return `Request failed with status ${response.status}`;
}
