// AssistantsList.jsx
import React from "react";
import styles from "./AssistantsList.module.css";

export default function AssistantsList({ 
  loading, 
  assistants = [], 
  searchTerm = "",
  onSearchChange,
  onActivate, 
  onDeactivate, 
  onDelete, 
  onRefresh 
}) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h2 className={styles.title}>
            <i className="fas fa-list-check"></i>
            Assistant Accounts
          </h2>
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search assistants..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button onClick={onRefresh} className={styles.refreshBtn}>
              <i className="fas fa-rotate"></i>
              Refresh
            </button>
          </div>
        </div>
        
        <div className={styles.statsBar}>
          <span className={styles.stat}>
            <strong>{assistants.length}</strong> assistants found
          </span>
          {searchTerm && (
            <span className={styles.searchInfo}>
              Filtered by: "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      <div className={styles.listContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}>
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading assistants...</p>
          </div>
        ) : assistants.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-user-slash"></i>
            </div>
            <h3>No assistants found</h3>
            <p>
              {searchTerm 
                ? "No assistants match your search criteria. Try adjusting your search terms."
                : "Get started by adding your first admin assistant using the form."
              }
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {assistants.map((assistant, index) => (
              <div 
                key={assistant.id} 
                className={styles.card}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      <i className="fas fa-user"></i>
                      <div className={`${styles.status} ${assistant.is_active ? styles.active : styles.inactive}`}>
                        <i className={`fas ${assistant.is_active ? 'fa-circle' : 'fa-circle-pause'}`}></i>
                      </div>
                    </div>
                    <div className={styles.userDetails}>
                      <h4 className={styles.email}>{assistant.email}</h4>
                      <div className={styles.meta}>
                        <span className={`${styles.verification} ${assistant.email_verified ? styles.verified : styles.pending}`}>
                          <i className={`fas ${assistant.email_verified ? 'fa-check-circle' : 'fa-clock'}`}></i>
                          {assistant.email_verified ? 'Email Verified' : 'Pending Verification'}
                        </span>
                        <span className={styles.date}>
                          <i className="far fa-calendar"></i>
                          Joined {new Date(assistant.date_joined).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.actions}>
                    {assistant.is_active ? (
                      <button 
                        className={`${styles.actionBtn} ${styles.secondary}`}
                        onClick={() => onDeactivate(assistant.id)}
                        title="Deactivate account"
                      >
                        <i className="fas fa-pause"></i>
                        Deactivate
                      </button>
                    ) : (
                      <button 
                        className={`${styles.actionBtn} ${styles.primary}`}
                        onClick={() => onActivate(assistant.id)}
                        title="Activate account"
                      >
                        <i className="fas fa-play"></i>
                        Activate
                      </button>
                    )}
                    <button 
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => onDelete(assistant.id, assistant.email)}
                      title="Delete account"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <div className={styles.cardFooter}>
                  <div className={styles.activity}>
                    <span className={styles.activityLabel}>
                      Status: 
                      <span className={`${styles.statusText} ${assistant.is_active ? styles.active : styles.inactive}`}>
                        {assistant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <div className={styles.lastActive}>
                    Last active: {new Date(assistant.last_login || assistant.date_joined).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}