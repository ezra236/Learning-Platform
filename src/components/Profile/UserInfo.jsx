// components/UserInfo.jsx
import React, { useEffect, useState } from "react";
import Password from "./Password";
import Success from "./Success";
import Error from "./Error";
import { ensureCsrf, getCookie } from "@/lib/password";
import styles from "./UserInfo.module.css";

const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function UserInfo() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      await ensureCsrf();
      const resp = await fetch(`${base}/api/auth/profile/`, {
        method: "GET",
        credentials: "include",
        headers: { "Accept": "application/json" }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Failed to fetch profile");
      setUser(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    } catch (err) {
      setErrorMsg(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setLoading(true);
    try {
      await ensureCsrf();
      const resp = await fetch(`${base}/api/auth/profile/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Failed to save");
      setUser(data);
      setEditing(false);
      setSuccessMsg("🎉 Profile updated successfully!");
    } catch (err) {
      setErrorMsg(err.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  }

  const getInitials = () => {
    if (!user) return "👤";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return first && last ? `${first}${last}` : "👤";
  };

  return (
    <div className={styles.container}>
      <Success message={successMsg} onClose={() => setSuccessMsg("")} />
      <Error message={errorMsg} onClose={() => setErrorMsg("")} />

      <div className={styles.content}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.floatingElements}>
            <div className={styles.floatingElement}></div>
            <div className={styles.floatingElement}></div>
            <div className={styles.floatingElement}></div>
          </div>
          
          <div className={styles.header}>
            <div className={styles.avatar}>
              {getInitials()}
            </div>
            <div className={styles.userInfo}>
              <h1 className={styles.title}>
                {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User Profile' : 'User Profile'}
              </h1>
              <p className={styles.subtitle}>Manage your account settings and preferences</p>
            </div>
          </div>

          {loading && !user ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              Loading your profile...
            </div>
          ) : (
            <>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>👤</span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {user?.last_login ? '✅' : '⏳'}
                  </span>
                  <span className={styles.statLabel}>Status</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>🛡️</span>
                  <span className={styles.statLabel}>Verified</span>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>📧</span>
                    Email Address
                  </label>
                  <div className={styles.staticField}>{user?.email}</div>
                  <small style={{color: '#6b7280', marginTop: '8px', display: 'block'}}>
                    Your primary email address for communications
                  </small>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>👤</span>
                    Personal Information
                  </label>
                  <div className={styles.inputGroup}>
                    <input 
                      className={styles.input} 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      disabled={!editing} 
                      placeholder="First name"
                    />
                    <input 
                      className={styles.input} 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      disabled={!editing} 
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>⏰</span>
                    Last Login
                  </label>
                  <div className={styles.staticField}>
                    {user?.last_login ? new Date(user.last_login).toLocaleString() : "Never logged in"}
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                {!editing ? (
                  <button 
                    className={`${styles.button} ${styles.primary}`}
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      className={`${styles.button} ${styles.primary}`}
                      onClick={saveChanges} 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className={styles.loadingSpinner}></div>
                          Saving...
                        </>
                      ) : (
                        <>💾 Save Changes</>
                      )}
                    </button>
                    <button 
                      className={`${styles.button} ${styles.secondary}`}
                      onClick={() => { 
                        setEditing(false); 
                        setFirstName(user.first_name); 
                        setLastName(user.last_name); 
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}
                
              </div>
            </>
          )}
        </div>

        {/* Password Card */}
        <div className={styles.passwordCard}>
          <Password onSuccess={(m) => setSuccessMsg(m)} onError={(m) => setErrorMsg(m)} />
        </div>
      </div>
    </div>
  );
}