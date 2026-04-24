import styles from './SessionTimeoutModal.module.css';

export default function SessionTimeoutModal({ countdown, onContinue, onSignOut }) {
  const isUrgent = countdown <= 15;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="timeout-title">
      <div className={styles.card}>
        <span className={styles.iconWrap}>⏰</span>

        <div className={styles.ringWrap}>
          <div className={`${styles.ring} ${isUrgent ? styles.ringUrgent : ''}`}>
            <span className={styles.ringNum}>{countdown}</span>
            <span className={styles.ringSub}>secs</span>
          </div>
        </div>

        <h2 id="timeout-title" className={styles.title}>Session expiring soon</h2>
        <p className={styles.body}>
          You've been inactive for a while. You'll be signed out automatically in{' '}
          <span className={styles.bodyHighlight}>{countdown} second{countdown !== 1 ? 's' : ''}</span>{' '}
          to keep your account secure.
        </p>

        <div className={styles.actions}>
          <button className={styles.stayBtn} onClick={onContinue} autoFocus>
            Stay Logged In
          </button>
          <button className={styles.signOutBtn} onClick={onSignOut}>
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
