// View.jsx (enhanced with unicode icons)
"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "./View.module.css";
import { fetchWithCsrf } from "@/lib/fetchWithCsrf";
import Addplans from "./Addplans";
import Done from "./Done";
import ErrorToast from "./Error";
import EditPlan from "./EditPlan";

const API_PREFIX = "/api";

export default function View() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [doneMessage, setDoneMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`${API_PREFIX}/plans/`, { method: "GET" });
      if (res.status === 401) throw new Error("Not authenticated. Sign in as superadmin.");
      if (res.status === 403) throw new Error("Forbidden: not a superadmin.");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch plans");
      }
      const data = await res.json();
      setGroups(data.exam_groups || []);
    } catch (err) {
      setErrorMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  function showDone(msg) {
    setDoneMessage(msg);
    setTimeout(() => setDoneMessage(null), 3500);
  }

  function showError(msg) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  }

  async function handleToggleActive(planId, newState) {
    try {
      const res = await fetchWithCsrf(`${API_PREFIX}/plans/${planId}/`, {
        method: "PATCH",
        body: JSON.stringify({ active: newState }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || j?.detail || `Failed (${res.status})`);
      }
      showDone("🔄 Plan status updated successfully");
      fetchPlans();
    } catch (err) {
      showError(err.message || "❌ Failed to update plan status");
    }
  }

  async function handleDelete(planId) {
    if (!confirm("🗑️ Are you sure you want to delete this plan? This action cannot be undone.")) return;
    try {
      const res = await fetchWithCsrf(`${API_PREFIX}/plans/${planId}/`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || j?.detail || `Failed (${res.status})`);
      }
      showDone("🗑️ Plan deleted successfully");
      fetchPlans();
    } catch (err) {
      showError(err.message || "❌ Failed to delete plan");
    }
  }

  function handleEditClick(plan) {
    setEditingPlan(plan);
    setShowEdit(true);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>📊 Exam Plans Management</h1>
          <p className={styles.subtitle}>🎯 Manage subscription plans for different exam types</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
          <span className={styles.btnIcon}>➕</span>
          Add New Plan
        </button>
      </header>

      {loading && (
        <div className={styles.loading}>
          <span className={styles.spinner}>🔄</span>
          <span>Loading plans...</span>
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No plans found</h3>
          <p>Get started by creating your first exam plan</p>
          <button className={styles.emptyBtn} onClick={() => setShowAdd(true)}>
            <span className={styles.btnIcon}>✨</span>
            Create First Plan
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {groups.map((g) => (
          <section key={g.exam_type} className={styles.group}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitleSection}>
                <h2 className={styles.groupTitle}>{g.exam_display}</h2>
                <span className={styles.examType}>📝 {g.exam_type}</span>
              </div>
              <div className={styles.groupBadge}>
                <span className={styles.badgeIcon}>📦</span>
                {g.plans.length} plan{g.plans.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className={styles.plans}>
              {g.plans.length === 0 && (
                <div className={styles.noPlans}>
                  <span className={styles.noPlansIcon}>😴</span>
                  <span>No plans available for this exam type</span>
                </div>
              )}
              {g.plans.map((p) => (
                <div key={p.id} className={`${styles.planCard} ${p.active ? styles.active : styles.inactive}`}>
                  <div className={styles.planHeader}>
                    <div className={styles.planTitleSection}>
                      <div className={styles.planTitle}>{p.title}</div>
                      <div className={styles.planMeta}>
                        <span className={styles.duration}>📅 {p.duration_days} days</span>
                        <div className={`${styles.status} ${p.active ? styles.activeStatus : styles.inactiveStatus}`}>
                          {p.active ? '🟢 Active' : '⚪ Inactive'}
                        </div>
                      </div>
                    </div>
                    <div className={styles.price}>
                      <span className={styles.currency}>{p.currency}</span>
                      <span className={styles.priceAmount}>{p.price}</span>
                    </div>
                  </div>
                  
                  <ul className={styles.features}>
                    {p.features.map((f, index) => (
                      <li key={f.id || `${f.name}-${index}`} className={styles.feature}>
                        <span className={styles.featureIcon}>✅</span>
                        <span className={styles.featureText}>{f.name || f}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className={styles.actions}>
                    <button 
                      onClick={() => handleToggleActive(p.id, !p.active)} 
                      className={`${styles.actionBtn} ${p.active ? styles.deactivate : styles.activate}`}
                    >
                      <span className={styles.btnIcon}>
                        {p.active ? '🔴' : '🟢'}
                      </span>
                      {p.active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => handleEditClick(p)}
                      className={styles.editBtn}
                    >
                      <span className={styles.btnIcon}>✏️</span>
                      Edit
                    </button>

                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className={styles.deleteBtn}
                    >
                      <span className={styles.btnIcon}>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Addplans
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => {
          fetchPlans();
          setShowAdd(false);
          showDone("✨ Plan added successfully");
        }}
        onError={(msg) => showError(msg)}
      />

      <EditPlan
        visible={showEdit}
        plan={editingPlan}
        onClose={() => { setShowEdit(false); setEditingPlan(null); }}
        onSuccess={(msg) => { fetchPlans(); showDone(msg); }}
        onError={(msg) => showError(msg)}
      />

      {doneMessage && <Done message={doneMessage} />}
      {errorMessage && <ErrorToast message={errorMessage} />}
    </div>
  );
}