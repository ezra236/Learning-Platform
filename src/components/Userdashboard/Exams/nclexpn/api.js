// src/components/Userdashboard/Exams/nclexrn/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

let CSRF_TOKEN = null;
export async function fetchCsrf() {
  if (CSRF_TOKEN) return CSRF_TOKEN;
  const resp = await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: 'include' });
  if (!resp.ok) throw new Error('Failed to fetch CSRF token');
  const json = await resp.json();
  CSRF_TOKEN = json.csrfToken;
  return CSRF_TOKEN;
}

export default async function authFetch(path, opts = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? '' : ''}/api${path.startsWith('/') ? path : '/' + path}`;
  const init = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  };
  const method = (init.method || 'GET').toUpperCase();
  if (!['GET','HEAD','OPTIONS'].includes(method)) {
    const token = await fetchCsrf();
    init.headers['X-CSRFToken'] = token;
  }
  if (init.body && typeof init.body !== 'string' && !(init.body instanceof FormData)) {
    init.body = JSON.stringify(init.body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    let errText = '';
    try { errText = await res.text(); } catch(e) {}
    const err = new Error(`API ${res.status} ${errText}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return {};
  return res.json();
}
