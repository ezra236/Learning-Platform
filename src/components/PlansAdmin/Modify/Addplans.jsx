"use client";

import React, { useState, useEffect } from "react";
import styles from "./Addplans.module.css";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";

const API_PREFIX = "/api";

const EXAM_CHOICES = [
  { value: "ATI_TEAS_7", label: "ATI TEAS 7" },
  { value: "HESI_A2", label: "HESI A2" },
  { value: "NCLEX", label: "NCLEX" },
  { value: "NURSING_TEST_BANK", label: "Nursing Test Bank" },
  { value: "EXIT_EXAM", label: "Exit Exam" },
];

export default function Addplans({ visible = false, onClose = () => {}, onSuccess = () => {}, onError = () => {} }) {
  const [examType, setExamType] = useState(EXAM_CHOICES[0].value);
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [title, setTitle] = useState("");
  const [featuresRaw, setFeaturesRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      // reset form when panel closes
      setExamType(EXAM_CHOICES[0].value);
      setDuration(30);
      setPrice("");
      setCurrency("USD");
      setTitle("");
      setFeaturesRaw("");
    }
  }, [visible]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const features = featuresRaw.split(",").map(s => s.trim()).filter(Boolean);
      const payload = {
        exam_type: examType,
        duration_days: Number(duration),
        price: String(price),
        currency,
        title: title || undefined,
        features,
        active: true
      };
      const res = await fetchWithCsrf(`${API_PREFIX}/plans/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || j?.detail || `Failed (${res.status})`);
      }
      onSuccess();
    } catch (err) {
      onError(err.message || "Failed to add plan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={`${styles.overlay} ${visible ? styles.showOverlay : ''}`} onClick={onClose} />
      <aside className={`${styles.panel} ${visible ? styles.show : ''}`} aria-hidden={!visible}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h3 className={styles.panelTitle}>➕ Create New Plan</h3>
            <p className={styles.panelSubtitle}>Configure a new subscription plan</p>
          </div>
          <button className={styles.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              📊 Exam Type
            </label>
            <select 
              value={examType} 
              onChange={e => setExamType(e.target.value)}
              className={styles.select}
            >
              {EXAM_CHOICES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              ⏱️ Duration (days)
            </label>
            <select 
              value={duration} 
              onChange={e => setDuration(Number(e.target.value))}
              className={styles.select}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days</option>
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                💰 Price
              </label>
              <input 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                placeholder="19.99"
                className={styles.input}
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                💵 Currency
              </label>
              <select 
                value={currency} 
                onChange={e => setCurrency(e.target.value)}
                className={styles.select}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              📝 Plan Title
            </label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., Premium 30-Day Access"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              ✨ Features <span className={styles.hint}>(comma-separated list)</span>
            </label>
            <textarea 
              value={featuresRaw} 
              onChange={e => setFeaturesRaw(e.target.value)} 
              placeholder="Full practice access, Timed exam mode, Detailed solutions, Progress tracking, 24/7 support"
              className={styles.textarea}
              rows={4}
              required
            />
          </div>

          <div className={styles.actions}>
            <button 
              type="submit" 
              disabled={submitting} 
              className={styles.primaryBtn}
            >
              {submitting ? (
                <>
                  <span className={styles.btnIcon}>⏳</span>
                  Creating Plan...
                </>
              ) : (
                <>
                  <span className={styles.btnIcon}>✓</span>
                  Create Plan
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.secondaryBtn}
            >
              <span className={styles.btnIcon}>✕</span>
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}