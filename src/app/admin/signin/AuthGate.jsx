// AuthGate.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AuthGate({ children }) {
  const router = useRouter();
  // `checking` starts true so nothing is shown until we explicitly allow it
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    async function check() {
      try {
        // ensure we always hit the network and not stale cache
        const resp = await fetch(`${API_BASE}/api/superadmin/me/`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal,
        });

        if (!mounted) return;

        if (resp.ok) {
          // authorized -> stop checking and render children
          setChecking(false);
          return;
        }

        // not ok -> redirect (do not render children)
        router.replace('/admin/signin/');
      } catch (err) {
        // fetch failed or was aborted -> redirect to signin
        if (mounted) {
          router.replace('/admin/signin/');
        }
      }
    }

    check();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [router]);

  if (checking) {
    // show a centered spinner while the auth check runs (no children rendered)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '6px solid rgba(18, 10, 127, 1)',
          borderTopColor: '#111',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // only after checking is false (i.e., authenticated) do we render children
  return <>{children}</>;
}
