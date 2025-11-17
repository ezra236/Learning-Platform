// Error.jsx
"use client";
import React from "react";
import style from "./Toasts.module.css";
import { FaExclamationTriangle } from "react-icons/fa";

export default function ErrorToast({ message = "Error" }) {
  return (
    <div className={style.error}>
      <FaExclamationTriangle className={style.icon} />
      {message}
    </div>
  );
}