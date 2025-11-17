// components/MainCampaignManager.jsx
import React, { useState, useEffect } from "react";
import CampaignRow from "./CampaignRow";
import Success from "./Success";
import Error from "./Error";
import styles from "./MainCampaignManager.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getCSRFTokenFromCookie(name = "csrftoken") {
  const v = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith(name + "="));
  if (!v) return null;
  return decodeURIComponent(v.split("=")[1]);
}

async function ensureCSRFCookie() {
  await fetch(`${API_BASE}/api/csrf/`, {
    method: "GET",
    credentials: "include",
  });
}

export default function MainCampaignManager() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    ensureCSRFCookie();
    fetchCampaigns().then(() => {
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.is_active).length;
    const inactive = total - active;
    setStats({ total, active, inactive });
  }, [campaigns]);

  async function fetchCampaigns() {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns/`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAdd({ heading, description, format, link, file }) {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await ensureCSRFCookie();
      const csrfToken = getCSRFTokenFromCookie();

      const form = new FormData();
      form.append("heading", heading);
      form.append("description", description);
      form.append("format", format || "none");
      if (link) form.append("link", link);
      if (file) form.append("file", file);

      const res = await fetch(`${API_BASE}/api/campaigns/`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json.detail || (json.error || JSON.stringify(json));
        setErrorMsg(String(err));
      } else {
        setSuccessMsg("🎉 Campaign created successfully!");
        setCampaigns((prev) => [json, ...prev]);
      }
    } catch (err) {
      setErrorMsg(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(campaignId, currentState) {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await ensureCSRFCookie();
      const csrfToken = getCSRFTokenFromCookie();

      const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify({ is_active: !currentState }),
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json.detail || JSON.stringify(json);
        setErrorMsg(String(err));
        return;
      }

      setCampaigns((prev) => prev.map(c => (c.id === json.id ? json : c)));
      setSuccessMsg(json.is_active ? "🚀 Campaign activated!" : "⏸️ Campaign paused");
    } catch (err) {
      setErrorMsg(err.message || "Failed to update campaign status");
    }
  }

  async function handleDelete(campaignId) {
    setErrorMsg("");
    setSuccessMsg("");
    // simple confirmation — you can replace with a nicer modal
    const should = window.confirm("Delete this campaign? This will remove the record and delete uploaded media.");
    if (!should) return;

    try {
      await ensureCSRFCookie();
      const csrfToken = getCSRFTokenFromCookie();

      const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
      });

      if (res.status === 204) {
        setCampaigns((prev) => prev.filter(c => c.id !== campaignId));
        setSuccessMsg("🗑️ Campaign deleted");
      } else {
        const json = await res.json();
        const err = json.detail || JSON.stringify(json);
        setErrorMsg(String(err));
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete campaign");
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === "active") return campaign.is_active;
    if (filter === "inactive") return !campaign.is_active;
    return true;
  });

  return (
    <div className={`${styles.container} ${isInitialized ? styles.initialized : ''}`}>
      <div className={styles.background}></div>

      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Campaign Manager</span>
              <div className={styles.badgeGlow}></div>
            </div>
            <h1 className={styles.title}>
              <span className={styles.titleText}>Create & Manage</span>
              <span className={styles.titleGradient}>Campaigns</span>
            </h1>
            <p className={styles.subtitle}>
              Design, launch, and track your marketing campaigns in one place
            </p>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <div className={styles.statIconInner}>📊</div>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.total}</div>
                <div className={styles.statLabel}>Total Campaigns</div>
              </div>
              <div className={styles.statHover}></div>
            </div>
            <div className={`${styles.statCard} ${styles.active}`}>
              <div className={styles.statIcon}>
                <div className={styles.statIconInner}>🚀</div>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.active}</div>
                <div className={styles.statLabel}>Active Now</div>
              </div>
              <div className={styles.statHover}></div>
            </div>
            <div className={`${styles.statCard} ${styles.inactive}`}>
              <div className={styles.statIcon}>
                <div className={styles.statIconInner}>⏸️</div>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.inactive}</div>
                <div className={styles.statLabel}>Paused</div>
              </div>
              <div className={styles.statHover}></div>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <Success message={successMsg} onClose={() => setSuccessMsg("")} />
      )}
      {errorMsg && (
        <Error message={errorMsg} onClose={() => setErrorMsg("")} />
      )}

      <div className={styles.content}>
        <CampaignRow onSubmit={handleAdd} loading={loading} />

        <div className={styles.campaignsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Your Campaigns</h2>
              <p className={styles.sectionSubtitle}>
                Manage and monitor all your campaigns
              </p>
            </div>
            <div className={styles.controls}>
              <div className={styles.filterTabs}>
                <button
                  className={`${styles.filterTab} ${filter === "all" ? styles.active : ""}`}
                  onClick={() => setFilter("all")}
                >
                  <span className={styles.filterText}>All ({stats.total})</span>
                  <div className={styles.filterHover}></div>
                </button>
                <button
                  className={`${styles.filterTab} ${filter === "active" ? styles.active : ""}`}
                  onClick={() => setFilter("active")}
                >
                  <span className={styles.filterText}>Active ({stats.active})</span>
                  <div className={styles.filterHover}></div>
                </button>
                <button
                  className={`${styles.filterTab} ${filter === "inactive" ? styles.active : ""}`}
                  onClick={() => setFilter("inactive")}
                >
                  <span className={styles.filterText}>Paused ({stats.inactive})</span>
                  <div className={styles.filterHover}></div>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.campaignsGrid}>
            {filteredCampaigns.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <div className={styles.emptyIconInner}>🎯</div>
                </div>
                <h3 className={styles.emptyTitle}>
                  {filter === "all" 
                    ? "No campaigns yet" 
                    : `No ${filter} campaigns`}
                </h3>
                <p className={styles.emptyText}>
                  {filter === "all" 
                    ? "Create your first campaign to get started!" 
                    : `No ${filter} campaigns found. Try changing the filter.`}
                </p>
                {filter !== "all" && (
                  <button 
                    className={styles.emptyAction}
                    onClick={() => setFilter("all")}
                  >
                    <span className={styles.emptyActionText}>Show All Campaigns</span>
                    <div className={styles.emptyActionHover}></div>
                  </button>
                )}
              </div>
            ) : (
              filteredCampaigns.map((campaign, index) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onToggleActive={toggleActive}
                  onDelete={handleDelete}
                  index={index}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// CampaignCard is kept inside this file (as your original). We added Delete UI and deleting state.
function CampaignCard({ campaign, onToggleActive, onDelete, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDeleteClick = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(campaign.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggleActive(campaign.id, campaign.is_active);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div 
      className={`${styles.campaignCard} ${campaign.is_active ? styles.active : styles.inactive}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={styles.cardMedia}>
        {campaign.mediapath ? (
          campaign.format === "video" ? (
            <video 
              src={campaign.mediapath} 
              controls 
              className={styles.media}
              poster={campaign.thumbnail}
              onLoadedData={() => setIsImageLoaded(true)}
            />
          ) : (
            <img 
              src={campaign.mediapath} 
              alt={campaign.heading} 
              className={styles.media}
              onLoad={() => setIsImageLoaded(true)}
              style={{ opacity: isImageLoaded ? 1 : 0 }}
            />
          )
        ) : (
          <div className={styles.mediaPlaceholder}>
            <span className={styles.placeholderIcon}>
              <div className={styles.placeholderIconInner}>
                {campaign.format === "image" ? "🖼️" : campaign.format === "video" ? "🎥" : "📄"}
              </div>
            </span>
            <span className={styles.placeholderText}>
              {campaign.format === "none" ? "No Media" : `No ${campaign.format} uploaded`}
            </span>
          </div>
        )}
        
        {!isImageLoaded && campaign.mediapath && (
          <div className={styles.mediaSkeleton}>
            <div className={styles.skeletonAnimation}></div>
          </div>
        )}
        
        <div className={`${styles.cardOverlay} ${isHovered ? styles.visible : ''}`}>
          <div className={styles.overlayContent}>
            {campaign.link && (
              <a 
                href={campaign.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                <span className={styles.linkIcon}>🔗</span>
                <span className={styles.linkText}>Visit Link</span>
                <div className={styles.linkHover}></div>
              </a>
            )}
            <div className={styles.actionButtons}>
              <button className={styles.viewButton}>
                <span className={styles.viewIcon}>🎯</span>
                <span className={styles.viewText}>View</span>
                <div className={styles.viewHover}></div>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.cardBadge}>
          <span className={`${styles.statusBadge} ${campaign.is_active ? styles.active : ''}`}>
            <span className={styles.statusIcon}>
              {campaign.is_active ? '🚀' : '⏸️'}
            </span>
            <span className={styles.statusText}>
              {campaign.is_active ? 'Active' : 'Paused'}
            </span>
            <div className={styles.statusGlow}></div>
          </span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{campaign.heading}</h3>
        </div>

        <p className={styles.cardDescription}>{campaign.description}</p>

        <div className={styles.cardMeta}>
          {campaign.format !== "none" && (
            <span className={styles.metaTag}>
              <span className={styles.metaIcon}>
                {campaign.format === "image" ? "🖼️" : "🎥"}
              </span>
              <span className={styles.metaText}>
                {campaign.format === "image" ? "Image" : "Video"}
              </span>
            </span>
          )}
          {campaign.link && (
            <span className={styles.metaTag}>
              <span className={styles.metaIcon}>🔗</span>
              <span className={styles.metaText}>Has Link</span>
            </span>
          )}
          <span className={styles.metaDate}>
            {new Date(campaign.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className={styles.cardFooter}>
          <button
            className={`${styles.toggleButton} ${
              campaign.is_active ? styles.deactivate : styles.activate
            }`}
            onClick={handleToggle}
            disabled={isToggling}
          >
            <span className={styles.toggleIcon}>
              {campaign.is_active ? '⏸️' : '▶️'}
            </span>
            <span className={styles.toggleText}>
              {isToggling ? (campaign.is_active ? 'Pausing...' : 'Activating...') : (campaign.is_active ? 'Pause Campaign' : 'Activate Campaign')}
            </span>
            <div className={styles.toggleHover}></div>
          </button>

          <button
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <span className={styles.deleteIcon}>{isDeleting ? '...' : '🗑️'}</span>
            <span className={styles.deleteText}>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            <div className={styles.deleteHover}></div>
          </button>
        </div>
      </div>
      
      <div className={styles.cardGlow}></div>
    </div>
  );
}
