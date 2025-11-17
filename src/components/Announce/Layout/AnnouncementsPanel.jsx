// components/AnnouncementsPanel.jsx
"use client"
import React, { useEffect, useState } from "react";
import styles from "./AnnouncementsPanel.module.css";
import Success from "./Success";
import Error from "./Error";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
}

async function ensureCsrfCookie() {
  try {
    await fetch(`${API_BASE}/api/csrf/`, { credentials: "include" });
  } catch (err) {
    console.warn("ensureCsrfCookie", err);
  }
}

export default function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/announcements/`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        setError("Failed to load announcements");
        setAnnouncements([]);
        return;
      }
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id, currentState) {
    if (updatingId) return;
    setUpdatingId(id);
    setError("");
    setSuccess("");
    try {
      await ensureCsrfCookie();
      const csrftoken = getCookie("csrftoken");

      const res = await fetch(`${API_BASE}/api/announcements/${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || "",
        },
        body: JSON.stringify({ is_active: !currentState }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json.detail || "Failed to update";
        setError(String(msg));
        return;
      }

      setAnnouncements((prev) => prev.map((a) => (a.id === json.id ? json : a)));
      setSuccess(json.is_active ? "Announcement activated" : "Announcement deactivated");
    } catch (err) {
      setError("Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteAnnouncement(id) {
    if (deletingId) return;
    const ok = window.confirm("Delete this announcement and remove media from Cloudinary? This action cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await ensureCsrfCookie();
      const csrftoken = getCookie("csrftoken");

      const res = await fetch(`${API_BASE}/api/announcements/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrftoken || "",
        },
      });

      let json = {};
      try { json = await res.json(); } catch (e) { json = {}; }

      if (!res.ok) {
        const msg = json.detail || "Failed to delete";
        setError(String(msg));
        return;
      }

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setSuccess("Announcement deleted");
    } catch (err) {
      setError("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.iconContainer}>
              <div className={styles.icon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1zm6 0c0 .55-.45 1-1 1h-3v-3c0-.55.45-1 1-1s1 .45 1 1v4z"/>
                </svg>
              </div>
            </div>
            <div className={styles.titleGroup}>
              <h2 className={styles.title}>Announcements</h2>
              <p className={styles.subtitle}>Manage and activate your media announcements</p>
            </div>
          </div>
          <button 
            onClick={fetchAnnouncements} 
            disabled={loading}
            className={styles.refreshButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {success && <Success message={success} onClose={() => setSuccess("")} />}
      {error && <Error message={error} onClose={() => setError("")} />}

      <div className={styles.announcementsGrid}>
        {announcements.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15c0-1.66 1.34-3 3-3 .35 0 .69.07 1 .18V6h5v2h-3v7.03c-.02 1.64-1.35 2.97-3 2.97-1.66 0-3-1.34-3-3z"/>
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No announcements</h3>
            <p className={styles.emptyDescription}>Upload media files to create announcements</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className={styles.announcementCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardBadge}>
                  {a.format === "video" ? "Video" : "Image"}
                </div>
                <div className={`${styles.status} ${a.is_active ? styles.statusActive : styles.statusInactive}`}>
                  <div className={styles.statusDot}></div>
                  {a.is_active ? "Active" : "Inactive"}
                </div>
              </div>
              
              <div className={styles.mediaContainer}>
                {a.format === "video" ? (
                  <video src={a.mediapath} controls className={styles.media} />
                ) : (
                  <img src={a.mediapath} alt="Announcement" className={styles.media} />
                )}
              </div>

              <div className={styles.cardContent}>
                <div className={styles.meta}>
                  <span className={styles.id}>ID: {a.id}</span>
                  <div className={styles.date}>
                    {new Date(a.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <div className={styles.actions}>
                  <button
                    className={`${styles.actionButton} ${a.is_active ? styles.pauseButton : styles.activateButton}`}
                    onClick={() => toggleActive(a.id, a.is_active)}
                    disabled={updatingId === a.id || deletingId === a.id}
                  >
                    {updatingId === a.id ? (
                      <>
                        <div className={styles.spinner}></div>
                        Updating...
                      </>
                    ) : a.is_active ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Activate
                      </>
                    )}
                  </button>

                  <button
                    className={styles.deleteButton}
                    onClick={() => deleteAnnouncement(a.id)}
                    disabled={deletingId === a.id || updatingId === a.id}
                  >
                    {deletingId === a.id ? (
                      <>
                        <div className={styles.spinner}></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}