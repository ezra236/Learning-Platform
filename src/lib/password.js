// lib/csrf.js
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export async function ensureCsrf() {
  // call endpoint to ensure cookie is set
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  await fetch(`${base}/api/auth/csrf/`, {
    credentials: "include",
  });
  return getCookie("csrftoken");
}
