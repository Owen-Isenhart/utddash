export function getBackendUrl(): string {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export async function parseBackendError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    
    // Handle simple string details
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    
    // Handle Pydantic validation errors (array of detail objects)
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      return payload.detail.map((err: { loc?: string[]; msg: string }) => `${err.loc?.join(".") || "Field"}: ${err.msg}`).join(", ");
    }
    
    // Handle generic message strings
    if (typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    // Ignore parse errors and fallback to generic message.
  }

  return `Request failed with status ${response.status}`;
}
