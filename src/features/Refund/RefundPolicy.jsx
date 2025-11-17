import styles from './RefundPolicy.module.css';

export default function RefundPolicy() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>📄</span>
            Policy Document
          </div>
          <h1 className={styles.heroTitle}>Refund Policy</h1>
          <p className={styles.heroDescription}>
            Clear guidelines for your Rushhourcamp experience
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.policySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerIcon}>💡</div>
            <h2>Understanding Our Policy</h2>
            <p>Important information about payments and refunds</p>
          </div>

          <div className={styles.cardsGrid}>
            <PolicyCard
              icon="⚡"
              title="Instant Access"
              description="Immediate activation of all study materials upon payment completion"
            />
            <PolicyCard
              icon="🔒"
              title="Final Transactions"
              description="All payments are final and non-refundable once processed"
            />
            <PolicyCard
              icon="📚"
              title="Complete Resources"
              description="Full access to ATI TEAS 7, NCLEX, and nursing test banks"
            />
          </div>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <span className={styles.detailIcon}>⚠️</span>
              <h3>No Refund Policy</h3>
            </div>
            <div className={styles.detailContent}>
              <p>
                Once payment has been processed for any Rushhourcamp service, 
                you cannot request a refund. All sales are final and non-refundable.
              </p>
              <ul className={styles.featureList}>
                <li>✓ Immediate access to all study materials</li>
                <li>✓ Comprehensive exam preparation resources</li>
                <li>✓ Continuous platform updates</li>
                <li>✓ 24/7 learning accessibility</li>
              </ul>
            </div>
          </div>

          <div className={styles.processFlow}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Payment Processing</h4>
                <p>Secure transaction completion</p>
              </div>
              <div className={styles.stepIcon}>💳</div>
            </div>
            
            <div className={styles.processConnector}></div>
            
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Instant Activation</h4>
                <p>Immediate access granted</p>
              </div>
              <div className={styles.stepIcon}>🎯</div>
            </div>
            
            <div className={styles.processConnector}></div>
            
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Final Transaction</h4>
                <p>No refunds available</p>
              </div>
              <div className={styles.stepIcon}>🔐</div>
            </div>
          </div>
        </div>

        <div className={styles.supportSection}>
          <div className={styles.supportCard}>
            <div className={styles.supportIcon}>💬</div>
            <div className={styles.supportContent}>
              <h3>Questions About Your Account?</h3>
              <p>
                Our support team is here to help with any questions about 
                your subscription or learning materials.
              </p>
              <button className={styles.supportButton}>
                <span>Contact Support</span>
                <span className={styles.buttonIcon}>→</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footerNote}>
          <div className={styles.noteIcon}>ℹ️</div>
          <p>
            By completing your payment, you acknowledge and agree to our refund policy 
            and terms of service. Rushhourcamp is committed to providing quality 
            exam preparation resources for nursing students.
          </p>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ icon, title, description }) {
  return (
    <div className={styles.policyCard}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </div>
  );
}