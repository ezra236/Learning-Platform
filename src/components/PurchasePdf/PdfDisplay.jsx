// components/PdfDisplay.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import PurchaseModal from "./PurchaseModal";
import styles from "./PdfDisplay.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split("=");
    const key = decodeURIComponent(parts.shift());
    const val = parts.join("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}

// keep these exact category labels (match server)
const CATEGORIES = [
  "ATI TEAS",
  "NCLEX",
  "EXIT EXAMS",
  "HESI A2",
  "NURSING TESTBANK",
];

export default function PdfDisplay() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, sessionId: null, pdf: null });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState(null);
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPdfs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/public/pdfs/`);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setPdfs(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load PDFs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // ensure CSRF cookie present (keeps behavior consistent)
    fetch(`${API_BASE}/api/csrf/`, { credentials: "include" })
      .catch(() => {})
      .finally(() => fetchPdfs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived category counts (for navbar)
  const categoryCounts = useMemo(() => {
    const counts = { All: pdfs.length };
    CATEGORIES.forEach((c) => (counts[c] = 0));
    pdfs.forEach((p) => {
      if (p.category && counts[p.category] !== undefined) counts[p.category] += 1;
    });
    return counts;
  }, [pdfs]);

  const filtered = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") return pdfs;
    return pdfs.filter((p) => p.category === selectedCategory);
  }, [pdfs, selectedCategory]);

  const handleBuyNow = async (pdf) => {
    setLoadingPdfId(pdf.id);
    try {
      const csrf = getCookie("csrftoken");
      const res = await fetch(`${API_BASE}/api/public/purchase_sessions/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {}),
        },
        body: JSON.stringify({ pdf_id: pdf.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed create session");
      setModal({ open: true, sessionId: data.session_id, pdf: data.pdf });
    } catch (err) {
      alert("Failed to start purchase: " + (err.message || err));
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleRefresh = () => {
    fetchPdfs(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📚 Digital Library</h1>
          <p className={styles.subtitle}>Discover resources to boost your exam prep</p>
        </div>

        {/* Category navbar */}
        <div className={styles.navbar}>
          <button
            className={`${styles.navBtn} ${selectedCategory === "All" ? styles.active : ""}`}
            onClick={() => setSelectedCategory("All")}
          >
            All <span className={styles.navCount}>{categoryCounts.All}</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.navBtn} ${selectedCategory === cat ? styles.active : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} <span className={styles.navCount}>{categoryCounts[cat] || 0}</span>
            </button>
          ))}

          <button 
            className={`${styles.refresh} ${refreshing ? styles.refreshing : ''}`} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className={styles.refreshIcon}>
              {refreshing ? <div className={styles.spinnerSmall} /> : '🔄'}
            </span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading content...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorContent}>
            <strong>Error:</strong> {error}
          </div>
          <button className={styles.retryBtn} onClick={fetchPdfs}>
            Try Again
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>No PDFs in this category</h3>
          <p>Try another category or refresh the list.</p>
        </div>
      )}

      <div className={styles.grid}>
        {filtered.map((p) => (
          <div className={styles.card} key={p.id}>
            <div className={styles.cardHeader}>
              <div className={styles.leftHeader}>
                {p.proof_image ? (
                  <img src={p.proof_image} alt={`${p.name} proof`} className={styles.thumbnail} />
                ) : (
                  <div className={styles.pdfIcon}>📄</div>
                )}
                <div className={styles.titleBlock}>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <div className={styles.categoryRow}>
                    <span className={styles.categoryBadge}>{p.category}</span>
                    <span className={styles.badgeSpacer} />
                    <span className={styles.smallCreated}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.rightHeader}>
                <div className={styles.cardBadge}>Digital PDF</div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.desc}>{p.description}</p>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.priceContainer}>
                <div className={styles.priceLabel}>Price</div>
                <div className={styles.price}>${parseFloat(p.price).toFixed(2)}</div>
              </div>
              <button 
                className={`${styles.buyBtn} ${loadingPdfId === p.id ? styles.loading : ''}`} 
                onClick={() => handleBuyNow(p)}
                disabled={loadingPdfId === p.id}
              >
                <span className={styles.btnIcon}>
                  {loadingPdfId === p.id ? <div className={styles.spinnerSmall} /> : '🛒'}
                </span>
                {loadingPdfId === p.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <PurchaseModal
          sessionId={modal.sessionId}
          pdf={modal.pdf}
          onClose={() => setModal({ open: false, sessionId: null, pdf: null })}
        />
      )}
    </div>
  );
}