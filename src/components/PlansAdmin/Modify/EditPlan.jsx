// EditPlan.jsx (enhanced with unicode icons)
"use client";

import React, { useEffect, useState } from "react";
import styles from "./EditPlan.module.css";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";

export default function EditPlan({ visible, plan, onClose, onSuccess, onError }) {
  const [local, setLocal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addingFeature, setAddingFeature] = useState("");
  const API_PREFIX = "/api";

  useEffect(() => {
    if (plan) {
      setLocal({
        id: plan.id,
        exam_type: plan.exam_type,
        title: plan.title || "",
        price: plan.price || "",
        currency: plan.currency || "USD",
        duration_days: plan.duration_days || 30,
        active: !!plan.active,
        features: (plan.features || []).map((f, index) => 
          typeof f === "string" 
            ? { id: `feature-${Date.now()}-${index}`, name: f }
            : { id: f.id || `feature-${Date.now()}-${index}`, name: f.name || "" }
        ),
      });
    } else {
      setLocal(null);
    }
  }, [plan]);

  if (!local) return null;

  function setField(field, value) {
    setLocal((s) => ({ ...s, [field]: value }));
  }

  function addFeature() {
    const name = (addingFeature || "").trim();
    if (!name) return;
    
    if (local.features.some(f => f.name === name)) {
      setAddingFeature("");
      return;
    }
    
    const newFeature = {
      id: `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name
    };
    
    setLocal((s) => ({ 
      ...s, 
      features: [...s.features, newFeature] 
    }));
    setAddingFeature("");
  }

  function removeFeature(featureId) {
    setLocal((s) => ({ 
      ...s, 
      features: s.features.filter((f) => f.id !== featureId) 
    }));
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: local.title,
        price: local.price,
        currency: local.currency,
        duration_days: local.duration_days,
        active: local.active,
        features: local.features.map(f => f.name),
      };

      const res = await fetchWithCsrf(`${API_PREFIX}/plans/${local.id}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || j?.detail || `Failed (${res.status})`);
      }

      onSuccess && onSuccess("✨ Plan updated successfully");
      onClose && onClose();
    } catch (err) {
      onError && onError(err.message || "❌ Failed to update plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className={`${styles.overlay} ${visible ? styles.visible : ""}`}
        onClick={() => {
          if (!saving) onClose && onClose();
        }}
      />
      <aside className={`${styles.panel} ${visible ? styles.open : ""}`} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <div className={styles.headText}>
            <div className={styles.title}>
              <span className={styles.titleIcon}>✏️</span>
              Edit Plan
            </div>
            <div className={styles.subtitle}>
              {local.title || "Untitled plan"} • 📅 {local.duration_days} days • 💰 {local.currency} {local.price}
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => !saving && onClose && onClose()}
            aria-label="Close edit panel"
            disabled={saving}
          >
            ❌
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.formSection}>
            <label className={styles.label}>
              <span className={styles.labelTitle}>📝 Plan Title</span>
              <input
                className={styles.input}
                value={local.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Enter plan title..."
                required
                disabled={saving}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              <span className={styles.labelTitle}>💰 Price</span>
              <div className={styles.inputWithPrefix}>
                <span className={styles.currencySymbol}>{local.currency === 'USD' ? '$' : 
                  local.currency === 'EUR' ? '€' : 
                  local.currency === 'GBP' ? '£' : 
                  local.currency === 'JPY' ? '¥' : local.currency}</span>
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  min="0"
                  value={local.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={saving}
                />
              </div>
            </label>

            <label className={styles.label}>
              <span className={styles.labelTitle}>💳 Currency</span>
              <select
                className={styles.select}
                value={local.currency}
                onChange={(e) => setField("currency", e.target.value)}
                disabled={saving}
              >
                <option value="USD">💵 USD - US Dollar</option>
                <option value="EUR">💶 EUR - Euro</option>
                <option value="GBP">💷 GBP - British Pound</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="JPY">💴 JPY - Japanese Yen</option>
              </select>
            </label>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>
              <span className={styles.labelTitle}>📅 Access Duration</span>
              <select
                className={styles.select}
                value={local.duration_days}
                onChange={(e) => setField("duration_days", Number(e.target.value))}
                disabled={saving}
              >
                <option value={7}>7 days 🚀</option>
                <option value={14}>14 days ⚡</option>
                <option value={30}>30 days 📊</option>
                <option value={60}>60 days 🗓️</option>
                <option value={90}>90 days 📈</option>
                <option value={180}>180 days 🎯</option>
                <option value={365}>365 days 🌟</option>
              </select>
            </label>
          </div>

          <div className={styles.formSection}>
            <div className={styles.toggleRow}>
              <span className={styles.labelTitle}>🔘 Plan Status</span>
              <button
                type="button"
                className={`${styles.toggleBtn} ${local.active ? styles.active : styles.inactive}`}
                onClick={() => setField("active", !local.active)}
                disabled={saving}
              >
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleText}>
                  {local.active ? "🟢 Active" : "⚪ Inactive"}
                </span>
              </button>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.label}>
              <span className={styles.labelTitle}>✨ Features & Benefits</span>
              <div className={styles.featuresWrap}>
                {local.features.length === 0 && (
                  <div className={styles.noFeatures}>
                    <span>📭 No features added yet</span>
                    <span className={styles.noFeaturesHint}>Add your first feature below to get started!</span>
                  </div>
                )}
                <div className={styles.featureList}>
                  {local.features.map((feature) => (
                    <div key={feature.id} className={styles.featureTag}>
                      <span className={styles.featureIcon}>✅</span>
                      <span className={styles.featureText}>{feature.name}</span>
                      <button 
                        type="button" 
                        className={styles.removeFeature}
                        onClick={() => removeFeature(feature.id)}
                        disabled={saving}
                        aria-label={`Remove feature: ${feature.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.addFeatureRow}>
                  <input
                    placeholder="➕ Add a new feature (e.g., Full practice exams, 24/7 support, Progress tracking...)"
                    value={addingFeature}
                    onChange={(e) => setAddingFeature(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={styles.inputFeature}
                    disabled={saving}
                  />
                  <button 
                    type="button" 
                    className={styles.addBtn}
                    onClick={addFeature}
                    disabled={saving || !addingFeature.trim()}
                  >
                    ➕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              type="submit" 
              className={styles.saveBtn} 
              disabled={saving}
            >
              <span className={styles.btnIcon}>
                {saving ? "⏳" : "💾"}
              </span>
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => !saving && onClose && onClose()}
              disabled={saving}
            >
              <span className={styles.btnIcon}>❌</span>
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}