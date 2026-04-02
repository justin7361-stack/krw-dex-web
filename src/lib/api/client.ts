import { bigintReviver } from '../bigint/reviver';

// ─── API Client ───────────────────────────────────────────────────────────────
// All HyperKRW server REST calls go through this client.
// Numeric fields in responses are auto-converted to bigint via reviver.

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  body?: unknown;
  apiKey?: string;
  signal?: AbortSignal;
}

/**
 * Core fetch wrapper.
 * - Parses response JSON with bigintReviver (converts price/amount/etc to bigint)
 * - Injects X-Api-Key header for authenticated endpoints
 * - Throws ApiError for non-2xx responses
 */
async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, apiKey, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await response.text();

  if (!response.ok) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    throw new ApiError(response.status, parsed, `API ${method} ${path} → ${response.status}`);
  }

  if (!text) return undefined as unknown as T;

  return JSON.parse(text, bigintReviver) as T;
}

// ─── Typed API methods ────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return apiFetch<T>(path, { signal });
  },

  post<T>(path: string, body: unknown, apiKey?: string): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body, apiKey });
  },

  delete<T>(path: string, apiKey?: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE', apiKey });
  },

  patch<T>(path: string, body: unknown, apiKey?: string): Promise<T> {
    return apiFetch<T>(path, { method: 'PATCH', body, apiKey });
  },
};
