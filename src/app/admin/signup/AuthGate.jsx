// AuthGate.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AuthGate({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);  // true while we're deciding
  const [allowed, setAllowed] = useState(false);   // true only when it's safe to render children

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function verifyAdminStatus() {
      try {
        const res = await fetch(`${API_BASE.replace(/\/+$/, '')}/api/superadmin/exists/`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!mounted) return;

        // If the request itself failed (non-2xx), treat it as "allow user to continue"
        if (!res.ok) {
          console.warn('AuthGate: non-OK response when checking superadmin:', res.status);
          setAllowed(true);
          setChecking(false);
          return;
        }

        const data = await res.json().catch(() => ({}));
        // If a superadmin already exists -> redirect and do not render children.
        if (data && data.exists) {
          // Use replace so user can't navigate back to signup
          router.replace('/admin/signin/');
          // do NOT setAllowed(true) or setChecking(false) — leave the spinner while redirect happens
          return;
        }

        // No superadmin exists -> allow the signup UI to render
        setAllowed(true);
        setChecking(false);
      } catch (err) {
        if (!mounted) return;
        console.warn('AuthGate: error checking superadmin status:', err);
        // On network error, allow user to continue to signup (matching your prior behavior)
        setAllowed(true);
        setChecking(false);
      }
    }

    verifyAdminStatus();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [router]);

  // While checking -> show centered full-page spinner (children are blocked)
  if (checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          Checking authorization...
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Only render children when explicitly allowed
  return allowed ? children : null;
}
