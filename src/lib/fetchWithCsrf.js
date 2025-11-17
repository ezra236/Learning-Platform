// lib/fetchWithCsrf.js
export async function ensureCsrf() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  try {
    await fetch(`${API}/api/csrf/`, {
      method: "GET",
      credentials: "include",
    });
  } catch (err) {
    // ignore network errors here; they will surface in the caller
    console.warn("ensureCsrf failed", err);
  }
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const re = new RegExp("(?:^|; )" + name.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1") + "=([^;]*)");
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Performs fetch with credentials and CSRF header (for unsafe methods).
 * options.method defaults to GET.
 */
export async function fetchWithCsrf(url, options = {}) {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const full = url.startsWith("http") ? url : `${API}${url.startsWith("/") ? "" : "/"}${url}`;

  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    await ensureCsrf(); // ensure csrftoken cookie exists
  }

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const csrftoken = getCookie("csrftoken");
  if (csrftoken && method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    headers.set("X-CSRFToken", csrftoken);
  }

  const res = await fetch(full, {
    credentials: "include",
    ...options,
    headers,
  });
  return res;
}
