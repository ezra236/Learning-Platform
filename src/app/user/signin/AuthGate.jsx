// AuthGate.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/authgate.module.css';

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || '';

function getApiUrl(path) {
  if (!API_BASE) return `/api/auth/${path}`;
  return `${API_BASE.replace(/\/+$/, '')}/api/auth/${path}`;
}

export default function AuthGate({ children, fallback = null }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function checkSession() {
      try {
        const resp = await fetch(getApiUrl('session/'), {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!mounted) return;

        if (resp.ok) {
          // authenticated -> render children
          setChecking(false);
          return;
        }

        // not authenticated -> parse optional redirect from payload, then redirect.
        // Do NOT set checking to false here (we must not render children while redirecting).
        const payload = await resp.json().catch(() => ({}));
        const redirectTo = (payload && payload.redirect) || '/user/signin/';
        router.replace(redirectTo);
      } catch (err) {
        // network error or aborted -> redirect to signin (safe fallback)
        if (!mounted) return;
        console.error('Auth check failed:', err);
        router.replace('/user/signin/');
      }
    }

    checkSession();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [router]);

  if (checking) {
    // Use provided fallback if any, otherwise show a simple spinner (styled via your CSS module)
    if (fallback) return fallback;

    return (
      <div className={styles.loadingWrap ?? ''} aria-live="polite">
        <div className={styles.spinner ?? ''} aria-hidden />
        <div className={styles.loadingText ?? ''}>Checking authentication…</div>
      </div>
    );
  }

  // only render children after successful auth (resp.ok)
  return <>{children}</>;
}
