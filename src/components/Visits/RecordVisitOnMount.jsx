"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * RecordVisitOnMount
 *
 * - Global component to record page visits for a configured set of pages.
 * - Call it from app/layout.js so it runs across your entire app.
 *
 * Requirements:
 * - CSRF endpoint at `${API_BASE}/api/csrfs/` should set the csrftoken cookie (your @ensure_csrf_cookie view)
 * - CSRF_COOKIE_HTTPONLY must be False for JS to read the cookie
 * - POST endpoint at `${API_BASE}/api/page-visit/` must accept JSON and use CSRF protection
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const CSRF_ENDPOINT = `${API_BASE}/api/csrfs/`;
const VISIT_ENDPOINT = `${API_BASE}/api/page-visit/`;

// List of pages you asked for (exact match after normalization)
const ALLOWED_PAGES = new Set([
  "/home",
  "/user/dashboard",
  "/user/plans",
  "/rushhhour/services",
  "/rushhhour/ati",
  "/rushhhour/hesi",
  "/rushhhour/nclex",
  "/rushhhour/nursingtestbank",
  "/rushhhour/pdf",
]);

// Minimum time between repeated recordings for the same page (ms)
const DEDUPE_WINDOW_MS = 30_000;

function readCsrfFromCookie() {
  if (typeof document === "undefined" || !document.cookie) return null;
  const cookieString = document.cookie; // e.g. "a=1; csrftoken=abcd...; ..."
  const match = cookieString.split("; ").find((c) => c.startsWith("csrftoken="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "");
}

async function ensureCsrfCookieSet() {
  try {
    // Hit the csrf endpoint so the server sets the cookie if not already set
    // credentials: "include" ensures cross-site cookie is accepted when appropriate
    await fetch(CSRF_ENDPOINT, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    // not fatal — we'll try to read cookie anyway
    console.warn("Failed to call CSRF endpoint:", err);
  }
}

export default function RecordVisitOnMount() {
  const pathname = usePathname();
  const csrfTokenRef = useRef(null);
  const lastRecordedRef = useRef({ path: null, time: 0 });

  useEffect(() => {
    let cancelled = false;

    // Normalize path: remove trailing slash (except root), map "/" to "/home"
    function normalizePath(raw) {
      if (!raw) return "/home";
      // strip search/hash if present (use location if necessary)
      let p = raw.split("?")[0].split("#")[0];
      if (p === "/") return "/home";
      if (p.endsWith("/") && p.length > 1) p = p.slice(0, -1);
      return p;
    }

    async function getTokenOnce() {
      if (csrfTokenRef.current) return csrfTokenRef.current;
      await ensureCsrfCookieSet();
      const token = readCsrfFromCookie();
      csrfTokenRef.current = token;
      return token;
    }

    async function record(path) {
      try {
        if (cancelled) return;

        const now = Date.now();
        const last = lastRecordedRef.current;
        if (last.path === path && now - last.time < DEDUPE_WINDOW_MS) {
          // skip duplicate within dedupe window
          return;
        }

        // Only record allowed pages
        if (!ALLOWED_PAGES.has(path)) {
          return;
        }

        const token = await getTokenOnce();

        // Build headers — only include X-CSRFToken if we have a token
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        if (token) headers["X-CSRFToken"] = token;

        const res = await fetch(VISIT_ENDPOINT, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ page: path, visits: 1 }),
        });

        if (!res.ok) {
          // Log to help debug CSRF or other issues
          console.warn("record visit responded with status", res.status);
        } else {
          // success: update lastRecorded
          lastRecordedRef.current = { path, time: now };
        }
      } catch (err) {
        console.warn("record visit failed:", err);
      }
    }

    // run on mount & on each pathname change
    const p = normalizePath(pathname);
    record(p);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // re-run whenever pathname changes

  return null;
}
