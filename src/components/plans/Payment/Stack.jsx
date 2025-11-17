// Stack.jsx
"use client";
import React from "react";
import rightStyles from "./stack.module.css";
import Total from "./Price/Total"; 
import Paypal from "./Price/Paypal"

export default function Stack() {
  return (
    <div className={rightStyles.container}>
      <Total />
      <Paypal />
    </div>
  );
}