// lib/fetchWithCsrf.js
export async function ensureCsrf() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  try {
    await fetch(`${API}/api/auth/csrf/`, {
      method: "GET",
      credentials: "include",
    });
  } catch (err) {
    console.warn("ensureCsrf failed", err);
  }
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const re = new RegExp("(?:^|; )" + name.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1") + "=([^;]*)");
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function fetchWithCsrf(relativeOrFullUrl, options = {}) {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const url = relativeOrFullUrl.startsWith("http")
    ? relativeOrFullUrl
    : `${API}${relativeOrFullUrl.startsWith("/") ? "" : "/"}${relativeOrFullUrl}`;

  const method = ((options.method || "GET").toString() || "GET").toUpperCase();

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrf();
  }

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const csrftoken = getCookie("csrftoken");
  if (csrftoken && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRFToken", csrftoken);
  }

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
  return res;
}
