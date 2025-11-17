// components/subscriptions/SubscriptionsPage.jsx
import React, { useEffect, useState } from "react";
import SubscribersStats from "./SubscribersStats";
import SubscribersTable from "./SubscribersTable";
import Success from "./Success";
import Modal from "./Modal";
import styles from "./SubscriptionsPage.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function SubscriptionsPage() {
  const [data, setData] = useState({ total: 0, active_count: 0, expired_count: 0, subscriptions: [] });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(null);

  // Modal / delete state (moved to page level)
  const [showModal, setShowModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscriptionsdata/`);
      if (!res.ok) throw new Error("Failed to load subscriptions");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch subscriptions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDeleteModal = (subscription) => {
    setSubscriptionToDelete(subscription);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSubscriptionToDelete(null);
  };

  const deleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      // ensure CSRF cookie is set
      await fetch(`${API_BASE}/api/csrf/`, {
        credentials: "include",
      });

      const csrftoken = getCookie("csrftoken") || getCookie("csrf") || null;

      setDeletingId(subscriptionToDelete.id);
      const res = await fetch(`${API_BASE}/api/subscriptionsdata/${subscriptionToDelete.id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete");
      }

      // refresh data and show toast
      await fetchData();
      setShowSuccess("🎉 Subscription deleted successfully! User has been notified.");
      setTimeout(() => setShowSuccess(null), 4000);

      // close modal
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundDecoration}></div>
      
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>✨ Subscription Manager</h1>
            <div className={styles.titleGradient}></div>
          </div>
          <p className={styles.subtitle}>Efficiently manage and monitor all user subscriptions in one place</p>
        </div>
        <div className={styles.statsSection}>
          <SubscribersStats total={data.total} active={data.active_count} expired={data.expired_count} />
        </div>
      </div>

      <div className={styles.tableSection}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner}>🔄</div>
              <p className={styles.loadingText}>Loading subscriptions...</p>
              <p className={styles.loadingSubtext}>Please wait while we fetch the latest data</p>
            </div>
          </div>
        ) : (
          <SubscribersTable
            subscriptions={data.subscriptions}
            loading={loading}
            deletingId={deletingId}
            onRequestDelete={(subscription) => openDeleteModal(subscription)}
          />
        )}
      </div>

      {/* Modal is rendered at page level so it centers in the viewport */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        onConfirm={deleteSubscription}
        subscription={subscriptionToDelete}
        loading={deletingId !== null}
      />

      {showSuccess && <Success message={showSuccess} />}
    </div>
  );
}
