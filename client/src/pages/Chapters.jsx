import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { getChapters } from '../lib/api.js';
import styles from './Chapters.module.css';

const DOMAINS = ['All', 'Bookmarked', 'Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
const BOOKMARK_KEY = 'oncoquiz_bookmarks';

const DOMAIN_META = {
  'Breast Cancer':       { color: '#be123c', bg: '#fff1f2', border: '#fecdd3', icon: '🩺' },
  'GI Tumors':           { color: '#0f766e', bg: '#f0fdfc', border: '#99f6e4', icon: '🔬' },
  'Surgical Techniques': { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', icon: '🏥' },
};
const DEFAULT_META = { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: '📖' };

function groupByDomain(chapters) {
  const groups = {};
  for (const ch of chapters) {
    const key = ch.domain || 'General';
    if (!groups[key]) groups[key] = [];
    groups[key].push(ch);
  }
  return groups;
}

export default function Chapters() {
  const { getToken } = useAuth();
  const [chapters, setChapters]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const [bookmarks, setBookmarks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || []); }
    catch { return new Set(); }
  });

  function toggleBookmark(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  useEffect(() => {
    getChapters(getToken)
      .then(setChapters)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = chapters.filter(ch => {
    const domainMatch = filter === 'All' || (filter === 'Bookmarked' ? bookmarks.has(ch.id) : ch.domain === filter);
    const searchMatch = !search || ch.title.toLowerCase().includes(search.toLowerCase()) ||
      ch.excerpt.toLowerCase().includes(search.toLowerCase());
    return domainMatch && searchMatch;
  });

  const groups = groupByDomain(visible);

  if (loading) return <div className="page-loading">Loading library…</div>;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <video
          className={styles.heroBg}
          src="/lib_w.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Learning Library</h1>
          <p className={styles.heroSub}>
            In-depth reading material covering key surgical oncology topics — written for learners at every stage.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Controls */}
        <div className={styles.controls}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search chapters…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {DOMAINS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {visible.length === 0 && !error && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <p>No chapters found{search ? ` for "${search}"` : ''}.</p>
          </div>
        )}

        {/* Chapter groups */}
        {Object.entries(groups).map(([domain, chs]) => {
          const meta = DOMAIN_META[domain] || DEFAULT_META;
          return (
            <section key={domain} className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>{meta.icon}</span>
                <h2 className={styles.sectionTitle}>{domain}</h2>
                <span className={styles.sectionCount}>{chs.length} chapter{chs.length !== 1 ? 's' : ''}</span>
              </div>

              <div className={styles.grid}>
                {chs.map((ch, i) => (
                  <Link
                    key={ch.id}
                    to={`/library/${ch.slug}`}
                    className={styles.card}
                    style={{ '--card-border': meta.border, '--card-bg': meta.bg }}
                  >
                    <div className={styles.cardNum} style={{ color: meta.color }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{ch.title}</h3>
                      {ch.subtopic && (
                        <span className={styles.cardSub} style={{ color: meta.color, background: meta.bg }}>
                          {ch.subtopic}
                        </span>
                      )}
                      {ch.excerpt && <p className={styles.cardExcerpt}>{ch.excerpt}</p>}
                      {ch.pdf_url && (
                        <a
                          href={ch.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.pdfLink}
                          onClick={e => e.stopPropagation()}
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                    <button
                      className={`${styles.bookmarkBtn} ${bookmarks.has(ch.id) ? styles.bookmarkActive : ''}`}
                      onClick={e => toggleBookmark(e, ch.id)}
                      title={bookmarks.has(ch.id) ? 'Remove bookmark' : 'Bookmark this chapter'}
                    >
                      {bookmarks.has(ch.id) ? '🔖' : '🏷️'}
                    </button>
                    <div className={styles.cardArrow} style={{ color: meta.color }}>→</div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
