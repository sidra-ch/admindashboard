export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    sub: string;
    tenantId: string;
    email: string;
    role: string;
  };
};

const STORAGE_KEY = 'fleetrent-session';

function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = window.atob(padded);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function isAccessTokenValid(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp !== 'number') {
    return true;
  }

  return payload.exp * 1000 > Date.now();
}

/**
 * Returns the session only if the access token is still valid.
 * Does NOT remove the session when expired — callers that need refresh logic
 * should use getRawStoredSession() instead.
 */
export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as StoredSession;
    if (!session?.accessToken || !session?.refreshToken) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Return null when expired but DO NOT remove — refresh token may still be valid
    if (!isAccessTokenValid(session.accessToken)) {
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Returns the raw stored session without checking access token expiry.
 * Use this when you need to attempt a token refresh.
 */
export function getRawStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as StoredSession;
    return session?.accessToken && session?.refreshToken ? session : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export { isAccessTokenValid };
