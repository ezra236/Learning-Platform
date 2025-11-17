// components/StatCard.js
import styles from './StatCard.module.css';

const StatCard = ({ children, className = '' }) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {children}
    </div>
  );
};

export default StatCard;