// app/user/ati/[mode]/[examname]/page.js
import React from 'react';
import AuthGate from "../../../signin/AuthGate";
import Frame from '@/components/Userdashboard/Exams/ati/Frame'; // import main component

export default async function AtiModePage({ params }) {
  const { mode, examname } = await params;
  const displayExam = decodeURIComponent(examname);

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'tutormode': return '🎓';
      case 'exammode': return '📋';
      case 'reviewmode': return '🔍';
      default: return '📁';
    }
  };

  return (
    <>
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
        {/* Render the Frame component and pass params */}
        <Frame mode={mode} examname={examname} displayExam={displayExam} />
      </section>
    </main>

    </AuthGate>
    </>
  );
}
