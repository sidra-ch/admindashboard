import { clearStoredSession, getStoredSession } from './auth-storage';

const DEFAULT_API_URL = 'http://localhost:4000/api';
const LOGIN_PATH = '/auth/login';

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

export function getApiOrigin() {
  return getApiUrl().replace(/\/api\/?$/, '');
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getStoredSession();
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    // Try a silent token refresh before giving up
    const { getRawStoredSession, setStoredSession } = await import('./auth-storage');
    const raw = getRawStoredSession();
    if (raw?.refreshToken) {
      try {
        const refreshRes = await fetch(`${getApiUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: raw.refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json() as { accessToken: string; refreshToken: string; user?: typeof raw.user };
          setStoredSession({
            accessToken: refreshData.accessToken,
            refreshToken: refreshData.refreshToken,
            user: refreshData.user ?? raw.user,
          });
          // Retry the original request with the new token
          const retryResponse = await fetch(`${getApiUrl()}${path}`, {
            ...init,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${refreshData.accessToken}`,
              ...(init?.headers ?? {}),
            },
            cache: 'no-store',
          });
          if (retryResponse.ok) {
            if (retryResponse.status === 204) return undefined as T;
            return retryResponse.json() as Promise<T>;
          }
        }
      } catch {
        // Refresh failed — fall through to redirect
      }
    }
    clearStoredSession();
    if (typeof window !== 'undefined' && window.location.pathname !== LOGIN_PATH) {
      const redirectTo = `${LOGIN_PATH}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      window.location.replace(redirectTo);
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message ?? payload?.error?.message ?? payload?.error ?? 'Request failed';
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
