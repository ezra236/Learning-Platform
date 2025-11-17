// components/Left.jsx — replace file contents with this code

import React, { useState } from "react";
import styles from "./Left.module.css";

export default function Left({ pdfs = [], loading, error, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.icon}>📚</span>
          <h2 className={styles.title}>Uploaded Documents</h2>
          <span className={styles.countBadge}>{pdfs.length}</span>
        </div>
        <button 
          className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ''}`} 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <span className={styles.spinner}></span>
              Refreshing...
            </>
          ) : (
            <>
              <span className={styles.refreshIcon}>🔄</span>
              Refresh List
            </>
          )}
        </button>
      </div>

      <div className={styles.content}>
        {loading && !refreshing && (
          <div className={styles.message}>
            <span className={styles.loadingIcon}>⏳</span>
            Loading documents...
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>❌</span>
            {error}
          </div>
        )}
        
        {!loading && !error && pdfs.length === 0 && (
          <div className={styles.message}>
            <span className={styles.emptyIcon}>📭</span>
            No documents uploaded yet
            <div className={styles.emptySubtext}>Upload your first document using the form on the right</div>
          </div>
        )}

        {!loading && !error && pdfs.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className={styles.table}>
              <div className={styles.rowHeader}>
                <div className={styles.cellIcon}></div>
                <div className={styles.cellHeader}>Document</div>
                <div className={styles.cellHeader}>Category</div>
                <div className={styles.cellHeader}>Price</div>
                <div className={styles.cellHeader}>Uploaded by</div>
                <div className={styles.cellHeader}>Created</div>
              </div>
              <div className={styles.tableBody}>
                {pdfs.map((p) => {
                  const { date, time } = formatDate(p.created_at);
                  return (
                    <div key={p.id} className={styles.row}>
                      <div className={styles.cellIcon}>
                        {p.proof_image ? (
                          <img src={p.proof_image} alt={`${p.name} proof`} className={styles.thumbnail} />
                        ) : (
                          <span className={styles.pdfIcon}>📄</span>
                        )}
                      </div>
                      <div className={styles.cellName}>
                        <span className={styles.nameText}>{p.name}</span>
                        {p.description && (
                          <span className={styles.description}>
                            <span className={styles.descIcon}>📝</span>
                            {p.description}
                          </span>
                        )}
                      </div>
                      <div className={styles.cellCategory}>
                        <span className={styles.categoryTag}>{p.category}</span>
                      </div>
                      <div className={styles.cellPrice}>
                        <span className={styles.priceTag}>💲 {parseFloat(p.price).toFixed(2)}</span>
                      </div>
                      <div className={styles.cellUser}>
                        <span className={styles.userIcon}>👤</span>
                        {p.uploaded_by || "Anonymous"}
                      </div>
                      <div className={styles.cellDate}>
                        <span className={styles.calendarIcon}>📅</span>
                        <div className={styles.dateWrapper}>
                          <span className={styles.date}>{date}</span>
                          <span className={styles.time}>{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className={styles.cardList}>
              {pdfs.map((p) => {
                const { date, time } = formatDate(p.created_at);
                return (
                  <div key={p.id} className={styles.pdfCard}>
                    <div className={styles.cardHeader}>
                      {p.proof_image ? (
                        <img src={p.proof_image} alt={`${p.name} proof`} className={styles.cardThumbnail} />
                      ) : (
                        <span className={styles.pdfIcon}>📄</span>
                      )}
                      <div className={styles.cardTitle}>
                        <h3 className={styles.cardName}>{p.name}</h3>
                        <div className={styles.cardPrice}>💲 {parseFloat(p.price).toFixed(2)}</div>
                        <div className={styles.cardCategory}>{p.category}</div>
                      </div>
                    </div>
                    
                    {p.description && (
                      <div className={styles.cardDescription}>
                        <span className={styles.descIcon}>📝</span>
                        {p.description}
                      </div>
                    )}
                    
                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>👤</span>
                        {p.uploaded_by || "Anonymous"}
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>📅</span>
                        {date}
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>🕒</span>
                        {time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}