import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <video
          className={styles.panelBg}
          src="/frontpagebg.mp4"
          autoPlay loop muted playsInline
        />
        <div className={styles.panelInner}>
          <img src="/logo1.jpg" alt="OncoCliniq" className={styles.panelLogo} />
          <h2 className={styles.panelTitle}>OncoCliniq</h2>
          <p className={styles.panelSub}>
            Evidence-based MCQs and clinical updates for surgical oncology learners.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.mobileLogo}>
            <img src="/logo1.jpg" alt="" className={styles.mobileLogoImg} /> OncoCliniq
          </div>

          {sent ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✉️</div>
              <h2 className={styles.successTitle}>Check your email</h2>
              <p className={styles.successMsg}>
                We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
              </p>
              <p className={styles.successNote}>
                Didn't receive it? Check your spam folder, or{' '}
                <button className={styles.resendBtn} onClick={() => setSent(false)}>try again</button>.
              </p>
              <Link to="/login" className={styles.backToLogin}>← Back to sign in</Link>
            </div>
          ) : (
            <>
              <div className={styles.cardHeader}>
                <h1 className={styles.title}>Reset your password</h1>
                <p className={styles.subtitle}>Enter your email and we'll send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                  <div className={styles.error}>
                    <span className={styles.errorIcon}>!</span>
                    {error}
                  </div>
                )}

                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : 'Send reset link →'}
                </button>
              </form>

              <p className={styles.switchText}>
                Remembered your password?{' '}
                <Link to="/login" className={styles.switchLink}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
