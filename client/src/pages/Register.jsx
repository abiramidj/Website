import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import styles from './Auth.module.css';

const DESIGNATIONS = [
  '',
  'Medical Student (MBBS)',
  'Intern',
  'Junior Resident',
  'Senior Resident',
  'Fellow – Surgical Oncology',
  'Fellow – Other Surgical Specialty',
  'Consultant / Attending Surgeon',
  'Surgical Oncologist',
  'Other',
];

const SPECIALTIES = [
  '',
  'Breast Oncology',
  'GI / Colorectal Oncology',
  'Hepato-Pancreato-Biliary (HPB)',
  'Head & Neck Oncology',
  'Gynaecological Oncology',
  'Urological Oncology',
  'Thoracic Oncology',
  'Bone & Soft Tissue Tumours',
  'General Surgery',
  'Other / Not yet decided',
];

export default function Register() {
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [designation, setDesignation] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialty,   setSpecialty]   = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  const { signUp } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!designation)        { setError('Please select your position.'); return; }
    setLoading(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await signUp(email, password, fullName, { designation, institution, specialty, dateOfBirth });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.panel}>
          <img src="/logo1.jpg" alt="OncoCliniq" className={styles.panelLogo} />
          <h2 className={styles.panelTitle}>You're almost in!</h2>
          <p className={styles.panelSub}>Confirm your email to activate your account and start your surgical oncology journey.</p>
        </div>
        <div className={styles.formSide}>
          <div className={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '3rem' }}>📬</div>
            <h1 className={styles.title}>Check your inbox</h1>
            <p className={styles.subtitle}>We sent a confirmation link to <strong>{email}</strong></p>
            <div className={styles.success} style={{ marginTop: '1.5rem' }}>
              Click the link in the email to activate your account, then sign in.
            </div>
            <p className={styles.switchText} style={{ marginTop: '1.5rem' }}>
              Already confirmed? <Link to="/login" className={styles.switchLink}>Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    );
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
            Join medical students, residents, fellows, and surgeons building surgical oncology expertise.
          </p>
          <ul className={styles.panelFeatures}>
            <li>
              <div className={styles.featureIcon}>✅</div>
              <div className={styles.featureText}>
                <strong>Free to register</strong>
                <span>Start with a 7-day Pro trial</span>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>🔐</div>
              <div className={styles.featureText}>
                <strong>Secure &amp; private</strong>
                <span>Your data is never shared</span>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>📱</div>
              <div className={styles.featureText}>
                <strong>Study anywhere</strong>
                <span>Desktop and mobile friendly</span>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>🏆</div>
              <div className={styles.featureText}>
                <strong>Track progress</strong>
                <span>Performance analytics per topic</span>
              </div>
            </li>
          </ul>
          <p className={styles.panelDisclaimer}>
            Educational platform only. Content does not constitute clinical advice.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.formSide}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.mobileLogo}>
            <img src="/logo1.jpg" alt="" className={styles.mobileLogoImg} /> OncoCliniq
          </div>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Register and subscribe to unlock quizzes and chapters</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}><span className={styles.errorIcon}>!</span>{error}</div>}

            {/* Account details */}
            <div className={styles.sectionLabel}>Account details</div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="firstName" className={styles.label}>First name</label>
                <input id="firstName" type="text" value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={styles.input} placeholder="Jane"
                  required autoComplete="given-name" />
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName" className={styles.label}>Last name</label>
                <input id="lastName" type="text" value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={styles.input} placeholder="Smith"
                  required autoComplete="family-name" />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email address</label>
                <input id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={styles.input} placeholder="you@example.com"
                  required autoComplete="email" />
              </div>
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input id="password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={styles.input} placeholder="Min. 8 characters"
                  required minLength={8} autoComplete="new-password" />
              </div>
            </div>

            {/* Professional details */}
            <div className={styles.sectionLabel}>Professional details</div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="designation" className={styles.label}>Position *</label>
                <select id="designation" value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className={styles.input} required>
                  {DESIGNATIONS.map(d => (
                    <option key={d} value={d} disabled={d === ''}>
                      {d === '' ? 'Select position…' : d}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="dob" className={styles.label}>Date of birth</label>
                <input id="dob" type="date" value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="institution" className={styles.label}>Institution / Hospital</label>
              <input id="institution" type="text" value={institution}
                onChange={e => setInstitution(e.target.value)}
                className={styles.input}
                placeholder="e.g. AIIMS New Delhi, Johns Hopkins Hospital" />
            </div>

            <div className={styles.field}>
              <label htmlFor="specialty" className={styles.label}>Area of interest / Specialty</label>
              <select id="specialty" value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className={styles.input}>
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s === '' ? 'Select specialty…' : s}</option>
                ))}
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.switchLink}>Sign in</Link>
          </p>

          <p className={styles.disclaimer}>
            By registering you acknowledge this platform is for educational use only.
            Your data is stored securely and never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
