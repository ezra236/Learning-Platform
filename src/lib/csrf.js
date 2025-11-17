// lib/csrf.js
export async function ensureCSRF() {
  // call backend to set cookie
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
    method: 'GET',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF cookie');
  return getCookie('csrftoken');
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
