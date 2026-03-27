import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import styles from './SubscribeSuccess.module.css';

export default function SubscribeSuccess() {
  const { isSubscribed, refreshProfile } = useAuth();
  const [polling, setPolling] = useState(true);
  const attempts = useRef(0);

  // Poll until webhook updates the profile (up to ~8 seconds)
  useEffect(() => {
    if (isSubscribed) { setPolling(false); return; }

    const interval = setInterval(async () => {
      attempts.current += 1;
      await refreshProfile();
      if (attempts.current >= 6) {
        clearInterval(interval);
        setPolling(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isSubscribed]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🎉</div>
        <h1 className={styles.title}>You're all set!</h1>
        <p className={styles.sub}>
          Welcome to OncoCliniq Pro. Your subscription is now active and your
          7-day free trial has begun.
        </p>

        {polling && !isSubscribed && (
          <p className={styles.activating}>Activating your account…</p>
        )}

        <div className={styles.actions}>
          <Link to="/dashboard" className={styles.primaryBtn}>
            Go to Dashboard →
          </Link>
          <Link to="/library" className={styles.secondaryBtn}>
            Browse the Library
          </Link>
        </div>

        <div className={styles.bullets}>
          <div className={styles.bullet}>
            <span>✓</span> Unlimited quizzes across all surgical oncology topics
          </div>
          <div className={styles.bullet}>
            <span>✓</span> Full chapter library access
          </div>
          <div className={styles.bullet}>
            <span>✓</span> Performance analytics and score history
          </div>
          <div className={styles.bullet}>
            <span>✓</span> Cancel anytime from your billing portal
          </div>
        </div>
      </div>
    </div>
  );
}
