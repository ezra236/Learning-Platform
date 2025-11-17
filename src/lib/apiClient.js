// lib/apiClient.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchCsrf() {
  // Calls the Django view to ensure CSRF cookie is set and returns the token
  const res = await fetch(`${API_BASE}/api/auth/csrf/`, {
    method: "GET",
    credentials: "include", // important to send/receive cookies
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const json = await res.json();
  return json.csrfToken || null;
}

export async function apiFetch(path, { method = "GET", body = null, extraHeaders = {} } = {}) {
  const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${path.startsWith("/") ? "" : "/"}${path}`;
  const csrf = await fetchCsrf();

  const headers = {
    Accept: "application/json",
    ...extraHeaders,
  };

  // For mutating requests include the CSRF token header
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase()) && csrf) {
    headers["X-CSRFToken"] = csrf;
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(API_URL, {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data && data.detail ? data.detail : `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
