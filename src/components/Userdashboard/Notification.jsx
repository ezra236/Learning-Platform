// src/components/Notification.jsx
import React, { useEffect, useState, useRef } from "react";

/**
 * Notification — improved
 * - More polished visuals (gradient, rounded card, subtle shadow).
 * - Dismiss (×) button.
 * - Auto-dismiss after `duration` milliseconds (default 60_000ms = 60s).
 * - Shows a small progress bar and remaining seconds.
 * - Calls optional onClose() when fully dismissed.
 *
 * Usage: <Notification title="..." message="..." duration={60000} onClose={() => {}} />
 */
export default function Notification({ title, message, duration = 60000, onClose }) {
  const [visible, setVisible] = useState(true); // controls opacity/translate for animation
  const [removed, setRemoved] = useState(false); // after fade out, hide completely
  const [remaining, setRemaining] = useState(duration);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    setRemaining(duration);

    // update remaining at ~60fps for smooth progress (uses requestAnimationFrame)
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const rem = Math.max(duration - elapsed, 0);
      setRemaining(rem);
      if (rem <= 0) {
        // trigger hide animation
        setVisible(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    // ensure fallback hide after duration (in case RAF stalls)
    const hideTimeout = setTimeout(() => setVisible(false), duration + 50);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(hideTimeout);
    };
  }, [duration]);

  // After visibility goes false, wait for CSS transition then remove and call onClose
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setRemoved(true);
        if (typeof onClose === "function") onClose();
      }, 350); // should match transition duration below
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, onClose]);

  if (removed) return null;

  // visual calculations
  const percent = Math.round((remaining / duration) * 100);
  const secondsLeft = Math.ceil(remaining / 1000);

  // inline styles (self-contained)
  const containerStyle = {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
    width: 340,
    maxWidth: "calc(100% - 40px)",
    background: "linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)",
    border: "1px solid rgba(20, 30, 60, 0.06)",
    boxShadow: "0 10px 30px rgba(20,30,60,0.12)",
    padding: "12px 14px",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transform: visible ? "translateY(0px)" : "translateY(-12px)",
    opacity: visible ? 1 : 0,
    transition: "transform 280ms cubic-bezier(.2,.9,.2,1), opacity 280ms ease",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0f172a",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  };

  const titleStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 15,
    fontWeight: 700,
    color: "#0b1220",
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg,#5eead4,#60a5fa)",
    color: "white",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(96,165,250,0.14)",
    flexShrink: 0,
  };

  const closeBtnStyle = {
    background: "transparent",
    border: "none",
    color: "#334155",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    padding: 6,
    borderRadius: 8,
  };

  const messageStyle = {
    margin: 0,
    fontSize: 13,
    color: "#334155",
    lineHeight: 1.35,
  };

  const footerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  };

  const progressContainer = {
    flex: 1,
    height: 6,
    background: "rgba(15, 23, 42, 0.06)",
    borderRadius: 6,
    overflow: "hidden",
    boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.4)",
  };

  const progressBar = {
    width: `${percent}%`,
    height: "100%",
    background: "linear-gradient(90deg,#60a5fa,#7c3aed)",
    transition: "width 200ms linear",
  };

  const timeStyle = {
    minWidth: 56,
    textAlign: "right",
    fontSize: 12,
    color: "#475569",
  };

  return (
    <div style={containerStyle} role="status" aria-live="polite" aria-atomic="true">
      <div style={headerStyle}>
        <div style={titleStyle}>
          <div style={badgeStyle} aria-hidden>
            ⏱
          </div>
          <div>{title}</div>
        </div>

        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
          title="Dismiss"
          style={closeBtnStyle}
        >
          ×
        </button>
      </div>

      <div>
        <p style={messageStyle}>{message}</p>
      </div>

      <div style={footerStyle}>
        <div style={progressContainer} aria-hidden>
          <div style={progressBar} />
        </div>

        <div style={timeStyle}>
          {secondsLeft}s
        </div>
      </div>
    </div>
  );
}
