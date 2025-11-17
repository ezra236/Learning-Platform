// pages/admin-exams.jsx
import React, { useState } from "react";
import QuestionUploader from "./exams/QuestionUploader";

export default function AdminExamsPage() {

  return (
    <div style={{ padding:0 }}>
      <QuestionUploader/>
    </div>
  );
}
