// Done.jsx
"use client";
import React from "react";
import style from "./Toasts.module.css";
import { FaCheckCircle } from "react-icons/fa";

export default function Done({ message = "Done" }) {
  return (
    <div className={style.done}>
      <FaCheckCircle className={style.icon} />
      {message}
    </div>
  );
}