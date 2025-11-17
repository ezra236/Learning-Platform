// Main.jsx (unchanged logic, enhanced structure)
import React, { useEffect, useState } from "react";
import HeaderStats from "./HeaderStats";
import AssistantsList from "./AssistantsList";
import AssistantForm from "./AssistantForm";
import SuccessToast from "./SuccessToast";
import ErrorToast from "./ErrorToast";
import AddModal from "./AddModal";
import RemoveModal from "./RemoveModal";
import styles from "./Main.module.css";

const API_BASE_RAW = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
const API_BASE = API_BASE_RAW ? API_BASE_RAW.replace(/\/+$/, "") : "";
const ADMIN_LIST_ENDPOINT = API_BASE ? `${API_BASE}/api/admin-assistants/` : "/api/admin-assistants/";
const CSRF_ENDPOINT = API_BASE ? `${API_BASE}/api/csrf/` : "/api/csrf/";
const CREATE_ENDPOINT = API_BASE ? `${API_BASE}/api/admin-assistants/create/` : "/api/admin-assistants/create/";

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export default function Main() {
  const [assistants, setAssistants] = useState([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // toasts / modals state
  const [success, setSuccess] = useState({ show: false, message: "" });
  const [error, setError] = useState({ show: false, message: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState({ show: false, id: null, email: "" });

  // Filter assistants based on search
  const filteredAssistants = assistants.filter(assistant =>
    assistant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ensure csrf cookie present
  useEffect(() => {
    fetch(CSRF_ENDPOINT, { method: "GET", credentials: "include" }).catch(() => {});
  }, []);

  const refreshList = async () => {
    setLoading(true);
    try {
      const res = await fetch(ADMIN_LIST_ENDPOINT, { method: "GET", credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setError({ show: true, message: json?.error || "Failed to fetch assistants" });
      } else {
        setAssistants(json.assistants || []);
        setCounts(json.counts || { total: 0, active: 0, inactive: 0 });
      }
    } catch (err) {
      setError({ show: true, message: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshList(); }, []);

  // callbacks that child components will call:
  const handleCreate = async ({ email, password }) => {
    const csrftoken = getCookie("csrftoken") || "";
    try {
      const res = await fetch(CREATE_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || json?.detail || `Failed (${res.status})`);
      }
      setSuccess({ show: true, message: "Admin assistant added successfully" });
      setShowAddModal(true);
      refreshList();
    } catch (err) {
      setError({ show: true, message: err.message || "Failed to create admin assistant" });
    }
  };

  const handleActivate = async (id) => {
    const csrftoken = getCookie("csrftoken") || "";
    const url = API_BASE ? `${API_BASE}/api/admin-assistants/${id}/activate/` : `/api/admin-assistants/${id}/activate/`;
    try {
      const res = await fetch(url, { method: "POST", credentials: "include", headers: { "X-CSRFToken": csrftoken } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.detail || `Failed (${res.status})`);
      setSuccess({ show: true, message: "Assistant activated successfully" });
      refreshList();
    } catch (err) {
      setError({ show: true, message: err.message || "Failed to activate assistant" });
    }
  };

  const handleDeactivate = async (id) => {
    const csrftoken = getCookie("csrftoken") || "";
    const url = API_BASE ? `${API_BASE}/api/admin-assistants/${id}/deactivate/` : `/api/admin-assistants/${id}/deactivate/`;
    try {
      const res = await fetch(url, { method: "POST", credentials: "include", headers: { "X-CSRFToken": csrftoken } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.detail || `Failed (${res.status})`);
      setSuccess({ show: true, message: "Assistant deactivated successfully" });
      refreshList();
    } catch (err) {
      setError({ show: true, message: err.message || "Failed to deactivate assistant" });
    }
  };

  const handleDelete = async (id) => {
    const csrftoken = getCookie("csrftoken") || "";
    const url = API_BASE ? `${API_BASE}/api/admin-assistants/${id}/` : `/api/admin-assistants/${id}/`;
    try {
      const res = await fetch(url, { method: "DELETE", credentials: "include", headers: { "X-CSRFToken": csrftoken } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.detail || `Failed (${res.status})`);
      setSuccess({ show: true, message: "Assistant deleted successfully" });
      refreshList();
    } catch (err) {
      setError({ show: true, message: err.message || "Failed to delete assistant" });
    } finally {
      setConfirmRemove({ show: false, id: null, email: "" });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.background}>
        <div className={styles.gradientBg}></div>
      </div>
      
      <div className={styles.content}>
        <HeaderStats counts={counts} />

        <div className={styles.row}>
          <div className={styles.left}>
            <AssistantsList
              loading={loading}
              assistants={filteredAssistants}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onDelete={(id, email) => setConfirmRemove({ show: true, id, email })}
              onRefresh={refreshList}
            />
          </div>

          <div className={styles.right}>
            <AssistantForm onCreate={handleCreate} />
          </div>
        </div>

        <SuccessToast show={success.show} message={success.message} onClose={() => setSuccess({ show: false, message: "" })} />
        <ErrorToast show={error.show} message={error.message} onClose={() => setError({ show: false, message: "" })} />

        <AddModal show={showAddModal} onClose={() => setShowAddModal(false)} />
        <RemoveModal
          show={confirmRemove.show}
          email={confirmRemove.email}
          onCancel={() => setConfirmRemove({ show: false, id: null, email: "" })}
          onConfirm={() => handleDelete(confirmRemove.id)}
        />
      </div>
    </div>
  );
}