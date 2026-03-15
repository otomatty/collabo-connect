/**
 * Railway API client. All data (profiles, postings, etc.) goes through this.
 * Auth: Better Auth session cookie is sent with credentials: "include".
 */

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function getApiUrl(): string {
  return API_URL.replace(/\/$/, "");
}

export interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const base = getApiUrl();
  if (!base) {
    throw new Error("VITE_API_URL is not set. Configure the API URL for Railway.");
  }
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const errBody = await res.text();
    let message = errBody;
    try {
      const j = JSON.parse(errBody) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      // use errBody as message
    }
    throw new Error(message || `API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
