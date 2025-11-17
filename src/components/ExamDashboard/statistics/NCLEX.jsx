// components/NCLEX.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills, faUsers, faCheckCircle, faUpload } from '@fortawesome/free-solid-svg-icons';
import styles from './NCLEX.module.css';

export default function NCLEX() {
  const stats = {
    registeredUsers: 24300,
    examsCompleted: 18700,
    questionsUploaded: 89000
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FontAwesomeIcon icon={faPills} className={styles.icon} />
        <h2 className={styles.title}>NCLEX</h2>
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