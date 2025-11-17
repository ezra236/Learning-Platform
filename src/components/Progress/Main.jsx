// main.jsx
import React, { useState } from "react";
import AtiProgress from "./statistics/AtiProgress";
import HesiProgress from "./statistics/HesiProgress";

export default function Main() {

  return (
    <div style={{ padding:0 }}>
      <AtiProgress/>
      <HesiProgress/>
    </div>
  );
}
