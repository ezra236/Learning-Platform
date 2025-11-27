import React from 'react';
import CreateExam from './exams/CreateExam';
import QuestionUploader from './exams/QuestionUploader';

export default function NclexAdmin() {
  return (
    <div style={{ margin: '20px auto', padding: 12 }}>
      <p
  style={{
    textAlign: "center",
    fontSize: "30px",
    fontWeight: "400",
    color: "white",
    padding: "15px 20px",
    backgroundColor: "#6f20deff",
    borderRadius: "8px",
    width: "fit-content",
    margin: "20px auto"
  }}
>
  Create NCLEX RN Exam
</p>

      <CreateExam onCreated={() => window.location.reload()} />
      <QuestionUploader />
    </div>
  );
}
