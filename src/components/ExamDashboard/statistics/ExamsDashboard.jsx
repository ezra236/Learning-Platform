// components/ExamsDashboard.js
import styles from './ExamsDashboard.module.css';
import ATITeas from './ATITeas';
import NursingTestBanks from './NursingTestBanks';
import HESIA2 from './HESIA2';
import NCLEX from './NCLEX';
import ExitExams from './ExitExams';
import PDFstats from './pdf';

export default function ExamsDashboard() {
  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Exams Statistics</h1>
      <div className={styles.grid}>
        <ATITeas />
        <HESIA2 />
        <PDFstats/>
        <NursingTestBanks />
        <NCLEX />
        <ExitExams />
      </div>
    </div>
  );
}