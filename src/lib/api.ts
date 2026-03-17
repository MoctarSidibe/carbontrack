import { API_URL } from '@/constants/config';
import { getToken } from '@/lib/auth';

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (token) {
    headers['Cookie'] = `token=${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'omit',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }

  // Handle 204 No Content
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Upload a file (multipart/form-data) — does NOT set Content-Type so the boundary is auto-set.
 */
export async function apiUpload<T = unknown>(
  path: string,
  body: FormData
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Cookie'] = `token=${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body,
    credentials: 'omit',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err?.error ?? res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}
