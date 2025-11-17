// lib/api.js
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getCsrf() {
  // hits path("auth/csrf/", CsrfTokenView.as_view())
  const res = await fetch(`${API_BASE}/api/auth/csrf/`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Could not fetch CSRF');
  const data = await res.json(); // expected { csrfToken: '...' } or similar - adapt if your CsrfTokenView returns differently
  return data.csrfToken || data.csrf || null;
}

export async function apiFetch(path, { method = 'GET', body = null, includeCsrf = false } = {}) {
  const headers = { 'Accept': 'application/json' };
  let csrf = null;
  if (includeCsrf) {
    csrf = await getCsrf();
    headers['X-CSRFToken'] = csrf;
  }
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    body,
  });
  if (res.status === 204) return null;
  return res.json();
}
