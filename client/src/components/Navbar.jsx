import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import styles from './Navbar.module.css';

function navClass(isActive, extra = '') {
  return [styles.link, isActive ? styles.active : '', extra].filter(Boolean).join(' ');
}

export default function Navbar() {
  const { user, profile, isAdmin, isSubscribed, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  async function handleSignOut() {
    setDropdownOpen(false);
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    navigate('/login');
  }

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  function closeMenu() { setMenuOpen(false); }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <img src="/logo1.jpg" alt="OncoCliniq" className={styles.brandMark} />
          <span className={styles.brandName}>
            OncoCliniq
            <span className={styles.brandSub}>Surgical Oncology</span>
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <div className={styles.links}>
          {user ? (
            <>
              {isSubscribed && !isAdmin && (
                <>
                  <NavLink to="/topics" className={({ isActive }) => navClass(isActive)}>Quiz</NavLink>
                  <NavLink to="/library" className={({ isActive }) => navClass(isActive)}>Library</NavLink>
                  <NavLink to="/history" className={({ isActive }) => navClass(isActive)}>History</NavLink>
                </>
              )}
              {!isAdmin && (
                <NavLink to="/blog" className={({ isActive }) => navClass(isActive)}>Blog</NavLink>
              )}
              {isAdmin && (
                <>
                  <span className={styles.divider} />
                  <NavLink to="/admin" end className={({ isActive }) => navClass(isActive, styles.adminLink)}>Analytics</NavLink>
                  <NavLink to="/admin/generate" className={({ isActive }) => navClass(isActive, styles.adminLink)}>Generate</NavLink>
                  <NavLink to="/admin/review" className={({ isActive }) => navClass(isActive, styles.adminLink)}>Review</NavLink>
                  <NavLink to="/admin/import" className={({ isActive }) => navClass(isActive, styles.adminLink)}>Import</NavLink>
                  <NavLink to="/admin/chapters" className={({ isActive }) => navClass(isActive, styles.adminLink)}>Chapters</NavLink>
                  <NavLink to="/admin/users" className={({ isActive }) => navClass(isActive, styles.adminLink)}>Users</NavLink>
                </>
              )}
            </>
          ) : null}
        </div>

        {/* User area */}
        <div className={styles.userArea}>
          {user ? (
            <>
              {!isAdmin && !isSubscribed && (
                <Link to="/subscribe" className={styles.subscribeBtn}>Get Pro</Link>
              )}

              <div className={styles.profileWrapper} ref={dropdownRef}>
                <button
                  className={styles.profileTrigger}
                  onClick={() => { const next = !dropdownOpen; setDropdownOpen(next); if (next) refreshProfile(); }}
                  aria-expanded={dropdownOpen}
                >
                  <div className={styles.avatar}>{initials}</div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{displayName}</span>
                    <span className={`${styles.userRole} ${isAdmin ? styles.roleAdmin : isSubscribed ? styles.rolePro : styles.roleStudent}`}>
                      {isAdmin ? 'Admin' : isSubscribed ? 'Pro' : 'Free'}
                    </span>
                  </div>
                  <span className={styles.chevron}>{dropdownOpen ? '▲' : '▼'}</span>
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownAvatar}>{initials}</div>
                      <div>
                        <div className={styles.dropdownName}>{displayName}</div>
                        <div className={styles.dropdownEmail}>{user.email}</div>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <div className={styles.dropdownRow}>
                      <span className={styles.dropdownLabel}>Plan</span>
                      <span className={`${styles.dropdownBadge} ${isAdmin ? styles.badgeAdmin : isSubscribed ? styles.badgePro : styles.badgeFree}`}>
                        {isAdmin ? 'Admin' : isSubscribed ? 'Pro' : 'Free'}
                      </span>
                    </div>
                    <div className={styles.dropdownRow}>
                      <span className={styles.dropdownLabel}>Member since</span>
                      <span className={styles.dropdownValue}>
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {!isAdmin && isSubscribed && (
                      <div className={styles.dropdownRow}>
                        <Link to="/subscribe" className={styles.billingLink} onClick={() => setDropdownOpen(false)}>Manage billing →</Link>
                      </div>
                    )}
                    {!isAdmin && !isSubscribed && (
                      <div className={styles.dropdownRow}>
                        <Link to="/subscribe" className={styles.upgradeLink} onClick={() => setDropdownOpen(false)}>Upgrade to Pro →</Link>
                      </div>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button className={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
                  </div>
                )}
              </div>

              {/* Hamburger (mobile only) */}
              <button
                className={styles.hamburger}
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? '✕' : '☰'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.loginBtn}>Log in</Link>
              <Link to="/register" className={styles.registerBtn}>Register free</Link>
            </>
          )}
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className={styles.mobileMenu}>
          {isSubscribed && !isAdmin && (
            <>
              <NavLink to="/topics" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Quiz</NavLink>
              <NavLink to="/library" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Library</NavLink>
              <NavLink to="/history" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>History</NavLink>
            </>
          )}
          {!isAdmin && (
            <NavLink to="/blog" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Blog</NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin" end className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Analytics</NavLink>
              <NavLink to="/admin/generate" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Generate</NavLink>
              <NavLink to="/admin/review" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Review</NavLink>
              <NavLink to="/admin/import" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Import</NavLink>
              <NavLink to="/admin/chapters" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Chapters</NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => navClass(isActive, styles.mobileLink)} onClick={closeMenu}>Users</NavLink>
            </>
          )}
          {!isAdmin && !isSubscribed && (
            <Link to="/subscribe" className={styles.mobileLink} onClick={closeMenu}>⭐ Get Pro</Link>
          )}
        </div>
      )}
    </nav>
  );
}
