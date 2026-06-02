import appConfig from '../config/appConfig';

/**
 * Thin API client for the future NGI secure backend server.
 *
 * Architecture (V2 backend — NOT YET ACTIVE):
 *   Mobile app  →  NGI API Server  →  Google Sheets
 *
 * The mobile app never holds a Google service account key.
 * All Sheets writes happen server-side after the API validates the user's role.
 * Receipt / photo uploads will also route through this API to object storage.
 *
 * TODO (V2 backend):
 *   - Add bearer-token auth header using the logged-in user's JWT
 *   - Implement retry logic and offline queue
 *   - Add request/response logging in non-production builds
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  if (!appConfig.apiBaseUrl) {
    throw new Error('[apiClient] apiBaseUrl is not configured. Remote calls are disabled.');
  }

  const url = `${appConfig.apiBaseUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      // TODO (V2 backend): Add Authorization: `Bearer ${userToken}` here
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`[apiClient] ${method} ${path} failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}
