// components/NursingTestBanks.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope, faUsers, faCheckCircle, faUpload } from '@fortawesome/free-solid-svg-icons';
import styles from './NursingTestBanks.module.css';

export default function NursingTestBanks() {
  const stats = {
    registeredUsers: 18700,
    examsCompleted: 12300,
    questionsUploaded: 67000
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FontAwesomeIcon icon={faStethoscope} className={styles.icon} />
        <h2 className={styles.title}>Nursing Test Banks</h2>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <FontAwesomeIcon icon={faUsers} className={styles.statIcon} />
            <span className={styles.statLabel}>Registered Users</span>
          </div>
          <div className={styles.statValue}>{stats.registeredUsers.toLocaleString()}</div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <FontAwesomeIcon icon={faCheckCircle} className={styles.statIcon} />
            <span className={styles.statLabel}>Exams Completed</span>
          </div>
          <div className={styles.statValue}>{stats.examsCompleted.toLocaleString()}</div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <FontAwesomeIcon icon={faUpload} className={styles.statIcon} />
            <span className={styles.statLabel}>Questions Uploaded</span>
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