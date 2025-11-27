// src/app/user/nclexpn/[mode]/[examname]/page.jsx
import React from 'react';
import AuthGate from "../../../signin/AuthGate";
import Frame from '@/components/Userdashboard/Exams/nclexpn/Frame'; // import main component

export default async function NclexpnModePage(props) {
  // Await props to satisfy the app-router's async params handling.
  const { params } = await props;
  const { mode, examname } = params;
  const displayExam = decodeURIComponent(examname);

  const getModeIcon = (m) => {
    switch (m) {
      case 'tutormode': return '🎓';
      case 'exammode': return '📋';
      case 'reviewmode': return '🔍';
      default: return '📁';
    }
  };

  return (
    <AuthGate>
      <main className="ati-exam-container">
        <nav className="ati-navbar">
          <div className="nav-content">
            <a href="/user/dashboard/" className="nav-back">
              <span>Go to Dashboard</span>
              <span className="nav-icon">📍</span>
            </a>

            <div className="nav-center">
              <div className="exam-title">
                <span className="title-icon">📚 Rushhourcamp Exams</span>
              </div>
            </div>

            <div className={`nav-mode mode-${mode}`}>
              <span className="mode-icon">{getModeIcon(mode)}</span>
              <span className="mode-text">{mode}</span>
            </div>
          </div>
        </nav>

        <section className="exam-content">
          <Frame mode={mode} examname={displayExam} />
        </section>
      </main>
    </AuthGate>
  );
}
