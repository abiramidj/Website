import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import styles from './Auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email, password);
      const dest = result.profile?.role === 'admin' ? '/admin' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Left brand panel */}
      <div className={styles.panel}>
        <video
          className={styles.panelBg}
          src="/wallpaper1.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className={styles.panelInner}>
          <img src="/logo1.jpg" alt="OncoCliniq" className={styles.panelLogo} />
          <h2 className={styles.panelTitle}>OncoCliniq</h2>
          <p className={styles.panelSub}>
            Evidence-based MCQs and clinical updates for surgical oncology learners — from MBBS to MCh fellows.
          </p>

          <ul className={styles.panelFeatures}>
            <li>
              <div className={styles.featureIcon}>🎯</div>
              <div className={styles.featureText}>
                <strong>Adaptive quizzes</strong>
                <span>Topic-based MCQs that track your progress</span>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureText}>
                <strong>Performance analytics</strong>
                <span>Spot weak areas, track improvement</span>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>🤖</div>
              <div className={styles.featureText}>
                <strong>AI-curated content</strong>
                <span>Surgeon-reviewed, evidence-based questions</span>
              </div>
            </li>
          </ul>

          <div className={styles.panelStats}>
            <div className={styles.panelStat}><span>2000+</span>Questions</div>
            <div className={styles.panelStat}><span>50+</span>Topics</div>
            <div className={styles.panelStat}><span>Pro</span>Subscription</div>
          </div>

          <p className={styles.panelDisclaimer}>
            Educational platform only. Content does not constitute clinical advice.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.mobileLogo}><img src="/logo1.jpg" alt="" className={styles.mobileLogoImg} /> OncoCliniq</div>

          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Sign in to OncoCliniq</h1>
            <p className={styles.subtitle}>New or returning — start your learning journey</p>
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
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className={styles.input} placeholder="you@example.com"
                required autoComplete="email" autoFocus
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                  required autoComplete="current-password"
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

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Sign in →'}
            </button>
          </form>

          <p className={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.switchLink}>Create one</Link>
          </p>

          <p className={styles.disclaimer}>
            Educational platform only. Content does not constitute medical advice or replace clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}
