// Payment.jsx
"use client";
import React, { useEffect, useState } from "react";
import panelStyles from "./Payment.module.css";
import { fetchWithCsrf } from "@/lib/fetchCsrf";
import Stack from "./Stack";
import Done from "./Done";
import ErrorToast from "./Error";
import { FaTimes, FaTrashAlt, FaShoppingCart, FaSpinner } from "react-icons/fa";

export default function Payment({ visible = false, onClose = () => {}, onRemoved = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doneMsg, setDoneMsg] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  useEffect(() => {
    if (visible) loadItems();
  }, [visible]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetchWithCsrf("/api/intended-plans/", { method: "GET" });
      if (res.status === 401) throw new Error("Not authenticated.");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed (${res.status})`);
      }
      const data = await res.json();
      setItems(data.intended || []);
    } catch (err) {
      setErrMsg(err.message || "Failed to load cart");
      setTimeout(() => setErrMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemId) {
    if (!confirm("Remove this plan from your cart?")) return;
    try {
      const res = await fetchWithCsrf(`/api/intended-plans/${itemId}/`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || j?.detail || `Failed (${res.status})`);
      }
      setDoneMsg("Removed");
      setTimeout(() => setDoneMsg(null), 2500);
      // refresh
      await loadItems();
      onRemoved();
    } catch (err) {
      setErrMsg(err.message || "Failed to remove");
      setTimeout(() => setErrMsg(null), 4000);
    }
  }

  return (
    <aside className={`${panelStyles.panel} ${visible ? panelStyles.show : ""}`} aria-hidden={!visible}>
      <div className={panelStyles.overlay} onClick={onClose}></div>
      <div className={panelStyles.panelContent}>
        <div className={panelStyles.header}>
          <h3><FaShoppingCart className={panelStyles.cartIcon} /> Your Selections</h3>
          <button className={panelStyles.close} onClick={onClose} aria-label="Close cart">
            <FaTimes />
          </button>
        </div>

        <div className={panelStyles.content}>
          {loading && (
            <div className={panelStyles.loadingState}>
              <FaSpinner className={panelStyles.spinner} />
              <span>Loading your cart...</span>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className={panelStyles.empty}>
              <FaShoppingCart className={panelStyles.emptyIcon} />
              <p>No items in cart</p>
              <p className={panelStyles.emptySubtext}>Add plans to get started</p>
            </div>
          )}

          <div className={panelStyles.measure}>
            <div className={panelStyles.items}>
              {items.map((it) => (
                <div key={it.id} className={panelStyles.itemBox}>
                  <button 
                    className={panelStyles.remove} 
                    onClick={() => removeItem(it.id)}
                    aria-label="Remove item"
                  >
                    <FaTrashAlt />
                  </button>
                  <div className={panelStyles.itemTitle}>
                    {it.plan.title || `${it.plan.duration_days} Days Access`}
                  </div>
                  <div className={panelStyles.itemPrice}>
                    {it.plan.currency} {it.plan.price}
                  </div>
                  <div className={panelStyles.itemMeta}>
                    <span className={panelStyles.metaBadge}>{it.plan.duration_days} days</span>
                    <span className={panelStyles.metaBadge}>{it.plan.exam_type}</span>
                  </div>
                  <ul className={panelStyles.features}>
                    {(it.plan.features || []).map((f) => (
                      <li key={f.id}>
                        <span className={panelStyles.featureDot}></span>
                        {f.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <Stack />
        </div>
      </div>

      {doneMsg && <Done message={doneMsg} />}
      {errMsg && <ErrorToast message={errMsg} />}
    </aside>
  );
}