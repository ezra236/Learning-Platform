// components/Right.jsx — replace the file contents with this code

import React, { useState } from "react";
import styles from "./Right.module.css";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const CATEGORIES = [
  "ATI TEAS",
  "NCLEX",
  "EXIT EXAMS",
  "HESI A2",
  "NURSING TESTBANK",
];

export default function Right({ onCreated }) {
  const [name, setName] = useState("");
  const [description, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("📛 Document name is required");
      return;
    }
    if (!price.toString().trim() || parseFloat(price) <= 0) {
      setError("💰 Please enter a valid price");
      return;
    }
    if (!category || CATEGORIES.indexOf(category) === -1) {
      setError("📚 Please select a valid category");
      return;
    }

    setSubmitting(true);
    try {
      const csrftoken = getCookie("csrftoken");

      let fetchOptions = {
        method: "POST",
        credentials: "include",
        headers: {
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
        body: null,
      };

      if (proofFile) {
        const fd = new FormData();
        fd.append("name", name.trim());
        fd.append("description", description.trim());
        fd.append("price", parseFloat(price).toFixed(2));
        fd.append("category", category);
        fd.append("proof_image", proofFile);
        fetchOptions.body = fd;
      } else {
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price).toFixed(2),
          category,
        });
      }

      const res = await fetch(`${API_BASE}/api/pdfs/`, fetchOptions);
      const data = await res.json();
      if (!res.ok) {
        const msg = data && data.error ? data.error : `📡 Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setSuccess("🎉 Document uploaded successfully!");
      setName("");
      setDesc("");
      setPrice("");
      setCategory(CATEGORIES[0]);
      setProofFile(null);
      if (onCreated) onCreated(data);
    } catch (err) {
      setError(err.message || "❌ Submission failed");
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const clearForm = () => {
    setName("");
    setDesc("");
    setPrice("");
    setCategory(CATEGORIES[0]);
    setProofFile(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.uploadIcon}>📤</span>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Upload New Document</h3>
          <p className={styles.subtitle}>Add your PDF to the collection</p>
        </div>
      </div>
      
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>📄</span>
            Document Name *
          </label>
          <input 
            className={styles.input} 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter document name..."
            disabled={submitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>📝</span>
            Description
          </label>
          <textarea 
            className={styles.textarea} 
            value={description} 
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Add a description (optional)..."
            rows="4"
            disabled={submitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>💲</span>
            Price *
          </label>
          <input
            className={styles.input}
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>🏷️</span>
            Category *
          </label>
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>📷</span>
            Proof Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files && e.target.files[0])}
            disabled={submitting}
            className={styles.fileInput}
          />
          {proofFile && <div className={styles.fileName}>Selected: {proofFile.name}</div>}
        </div>

        <div className={styles.actions}>
          <button 
            type="button"
            className={styles.clearBtn}
            onClick={clearForm}
            disabled={submitting}
          >
            <span className={styles.clearIcon}>🗑️</span>
            Clear
          </button>
          <button 
            className={`${styles.submitBtn} ${submitting ? styles.submitting : ''}`} 
            type="submit" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner}></span>
                Uploading...
              </>
            ) : (
              <>
                <span className={styles.uploadBtnIcon}>🚀</span>
                Upload Document
              </>
            )}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <div className={styles.errorContent}>
              <strong>Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className={styles.success}>
            <span className={styles.successIcon}>✅</span>
            <div className={styles.successContent}>
              <strong>Success!</strong>
              <span>{success}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}