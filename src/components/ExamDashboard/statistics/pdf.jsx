// components/ATITeas.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf , faUsers, faCheckCircle, faUpload } from '@fortawesome/free-solid-svg-icons';
import styles from './pdf.module.css';

export default function PDFstats() {
  const stats = {
    registeredUsers: 12500,
    examsCompleted: 8900,
    questionsUploaded: 45000
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FontAwesomeIcon icon={faFilePdf} className={styles.icon} />
        <h2 className={styles.title}>PDFs</h2>
      </div>
      
      <div className={styles.stats}>
        
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <FontAwesomeIcon icon={faCheckCircle} className={styles.statIcon} />
            <span className={styles.statLabel}>Pdfs Uploaded</span>
          </div>
          <div className={styles.statValue}>{stats.examsCompleted.toLocaleString()}</div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <FontAwesomeIcon icon={faUpload} className={styles.statIcon} />
            <span className={styles.statLabel}>Pdfs sold</span>
          </div>
          <div className={styles.statValue}>{stats.questionsUploaded.toLocaleString()}</div>
        </div>
      </div>
      
      <div className={styles.growth}>
        <span className={styles.growthText}>↑ 12% Growth This Month</span>
      </div>
    </div>
  );
}