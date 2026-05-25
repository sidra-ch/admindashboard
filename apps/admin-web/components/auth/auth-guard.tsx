'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import {
  clearStoredSession,
  getRawStoredSession,
  getStoredSession,
  isAccessTokenValid,
  setStoredSession,
} from '../../lib/auth-storage';
import { getApiUrl } from '../../lib/api-client';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // First check: valid access token already in storage
    const session = getStoredSession();
    if (session?.accessToken) {
      setReady(true);
      return;
    }

    // Second check: expired access token — try a silent refresh
    const raw = getRawStoredSession();
    if (!raw?.refreshToken) {
      router.replace('/auth/login');
      return;
    }

    fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: raw.refreshToken }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('refresh_failed'))))
      .then((data: { accessToken: string; refreshToken: string; user?: StoredSession['user'] }) => {
        setStoredSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user ?? raw.user,
        });
        setReady(true);
      })
      .catch(() => {
        clearStoredSession();
        router.replace('/auth/login');
      });
  }, [router]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'oklch(0.082 0.018 265)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid oklch(0.248 0.020 265)',
            borderTopColor: 'oklch(0.688 0.196 256)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'oklch(0.50 0.010 265)', fontSize: '0.875rem' }}>Preparing secure workspace…</p>
      </div>
    );
  }

  return <>{children}</>;
}

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: { sub: string; tenantId: string; email: string; role: string };
};
