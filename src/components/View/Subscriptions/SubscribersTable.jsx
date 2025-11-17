// components/subscriptions/SubscribersTable.jsx
import React, { useState } from "react";
import styles from "./SubscribersTable.module.css";
// Modal import removed — modal now lives in SubscriptionsPage

export default function SubscribersTable({ subscriptions = [], loading = false, deletingId = null, onRequestDelete = () => {} }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.plan.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && sub.is_active) ||
                         (statusFilter === "expired" && !sub.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.tableTitle}>
              <span className={styles.titleIcon}>📊</span>
              Subscriptions
            </h2>
            <div className={styles.tableSummary}>
              Showing <strong>{filteredSubscriptions.length}</strong> of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search users, emails, plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>
        
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.sortable}>
                  <span>👤 User</span>
                  <span className={styles.sortIcon}>↕️</span>
                </th>
                <th>📋 Plan Details</th>
                <th className={styles.sortable}>
                  <span>🔔 Status</span>
                  <span className={styles.sortIcon}>↕️</span>
                </th>
                <th className={styles.sortable}>
                  <span>📅 Finish Date</span>
                  <span className={styles.sortIcon}>↕️</span>
                </th>
                <th className={styles.sortable}>
                  <span>⏰ Days Left</span>
                  <span className={styles.sortIcon}>↕️</span>
                </th>
                <th>⚡ Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && subscriptions.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.loadingCell}>
                    <div className={styles.loadingState}>
                      <div className={styles.loadingSpinner}></div>
                      <span>Loading subscriptions...</span>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                      <div className={styles.emptyIcon}>🔍</div>
                      <div className={styles.emptyTitle}>No subscriptions found</div>
                      <div className={styles.emptyText}>
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filters"
                          : "No subscriptions available in the system"
                        }
                      </div>
                      {(searchTerm || statusFilter !== "all") && (
                        <button 
                          className={styles.resetFilters}
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {filteredSubscriptions.map((s, index) => (
                <tr 
                  key={s.id} 
                  className={`${styles.tableRow} ${s.is_active ? styles.rowActive : styles.rowExpired}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {s.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{s.user.username}</div>
                        <div className={styles.userEmail}>{s.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.planInfo}>
                      <div className={styles.planTitle}>{s.plan.title}</div>
                      <div className={styles.planType}>
                        <span className={styles.examBadge}>{s.plan.exam_type}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.statusContainer}>
                      {s.is_active ? (
                        <span className={styles.statusActive}>
                          <span className={styles.statusPulse}></span>
                          <span className={styles.statusIcon}>✅</span>
                          Active
                        </span>
                      ) : (
                        <span className={styles.statusExpired}>
                          <span className={styles.statusIcon}>❌</span>
                          Expired
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.dateCell}>
                      <div className={styles.dateMain}>
                        {new Date(s.finish_date).toLocaleDateString()}
                      </div>
                      <div className={styles.timeText}>
                        {new Date(s.finish_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`
                      ${styles.daysContainer} 
                      ${s.days_remaining > 30 ? styles.daysExcellent :
                        s.days_remaining > 7 ? styles.daysGood :
                        s.days_remaining > 0 ? styles.daysWarning :
                        styles.daysExpired}
                    `}>
                      <div className={styles.daysValue}>{s.days_remaining}</div>
                      <div className={styles.daysLabel}>days</div>
                      <div className={styles.daysProgress}>
                        <div 
                          className={styles.daysProgressBar}
                          style={{ 
                            width: `${Math.max(0, Math.min(100, (s.days_remaining / 365) * 100))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => onRequestDelete(s)}
                        disabled={deletingId === s.id}
                      >
                        {deletingId === s.id ? (
                          <>
                            <span className={styles.btnSpinner}></span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <span className={styles.btnIcon}>🗑️</span>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
