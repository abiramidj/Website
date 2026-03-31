import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, supabase } from '../hooks/useAuth.jsx';
import styles from './Auth.module.css';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);   // true once recovery session is active
  const [invalid, setInvalid] = useState(false); // true if link is expired/invalid
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link.
    // The SDK automatically exchanges the token in the URL hash for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if there's already an active session (page refresh after recovery)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // If no PASSWORD_RECOVERY fires within 3 seconds, the link is likely invalid
    const timeout = setTimeout(() => {
      setReady(prev => {
        if (!prev) setInvalid(true);
        return prev;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <video
          className={styles.panelBg}
          src="/wallpaper1.mp4"
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

          {done ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✅</div>
              <h2 className={styles.successTitle}>Password updated!</h2>
              <p className={styles.successMsg}>
                Your password has been changed successfully. Redirecting you to sign in…
              </p>
              <Link to="/login" className={styles.backToLogin}>Sign in now →</Link>
            </div>
          ) : invalid ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>⚠️</div>
              <h2 className={styles.successTitle}>Link expired</h2>
              <p className={styles.successMsg}>
                This reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/forgot-password" className={styles.backToLogin}>Request new link →</Link>
            </div>
          ) : !ready ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>⏳</div>
              <p className={styles.successMsg}>Verifying your reset link…</p>
            </div>
          ) : (
            <>
              <div className={styles.cardHeader}>
                <h1 className={styles.title}>Set new password</h1>
                <p className={styles.subtitle}>Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                  <div className={styles.error}>
                    <span className={styles.errorIcon}>!</span>
                    {error}
                  </div>
                )}

                <div className={styles.field}>
                  <label htmlFor="password" className={styles.label}>New password</label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={styles.input}
                      placeholder="Min. 8 characters"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirm" className={styles.label}>Confirm new password</label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={styles.input}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : 'Update password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
