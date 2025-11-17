// components/Main.jsx — replace file contents with this code

import React, { useEffect, useState } from "react";
import Left from "./Left";
import Right from "./Right";
import styles from "./Main.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function Main() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/pdfs/`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`📡 Failed to fetch (${res.status})`);
      }
      const data = await res.json();
      setPdfs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/csrf/`, { credentials: "include" })
      .catch(() => {})
      .finally(() => fetchList());
  }, []);

  const handleCreated = (newPdf) => {
    setPdfs((prev) => [newPdf, ...prev]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Left pdfs={pdfs} loading={loading} error={error} onRefresh={fetchList} />
      </div>
      <div className={styles.right}>
        <Right onCreated={handleCreated} />
      </div>
    </div>
  );
}