import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { getAttempts } from '../lib/api.js';
import styles from './History.module.css';

const TOPIC_META = {
  'Breast Cancer':       { icon: '🩺', accent: 'linear-gradient(90deg,#fda4af,#fb7185)' },
  'GI Tumors':           { icon: '🔬', accent: 'linear-gradient(90deg,#99f6e4,#5eead4)' },
  'Surgical Techniques': { icon: '🏥', accent: 'linear-gradient(90deg,#c7d2fe,#a5b4fc)' },
};
const DEFAULT_META = { icon: '📚', accent: 'linear-gradient(90deg,#bae6fd,#7dd3fc)' };

function ScoreBadge({ score }) {
  let cls = styles.badgeGray;
  if (score >= 80) cls = styles.badgeGreen;
  else if (score >= 60) cls = styles.badgeYellow;
  else if (score > 0) cls = styles.badgeRed;
  return <span className={`${styles.badge} ${cls}`}>{score?.toFixed(1) ?? 0}%</span>;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function History() {
  const { getToken } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAttempts(getToken)
      .then(setAttempts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const bestScore = attempts.length ? Math.max(...attempts.map(a => a.score ?? 0)) : null;
  const avgScore = attempts.length
    ? (attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / attempts.length)
    : null;

  if (loading) return <div className="page-loading">Loading history…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Performance History</h1>
          <p className={styles.subtitle}>{attempts.length} quiz attempt{attempts.length !== 1 ? 's' : ''} recorded</p>
        </div>
      </div>

      {attempts.length > 0 && (
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryNum}>{attempts.length}</span>
            <span className={styles.summaryLabel}>Total Attempts</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryNum}>{bestScore?.toFixed(0)}%</span>
            <span className={styles.summaryLabel}>Best Score</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryNum}>{avgScore?.toFixed(0)}%</span>
            <span className={styles.summaryLabel}>Average Score</span>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {attempts.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📋</span>
            <p>You haven't taken any quizzes yet.</p>
            <Link to="/topics" className={styles.startLink}>Start a quiz →</Link>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(a => {
                  const meta = TOPIC_META[a.topic] || DEFAULT_META;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className={styles.topicCell}>
                          <span className={styles.topicAccent} style={{ background: meta.accent }} />
                          <span className={styles.topicIcon}>{meta.icon}</span>
                          <span className={styles.topicName}>{a.topic}</span>
                        </div>
                      </td>
                      <td><ScoreBadge score={a.score} /></td>
                      <td className={styles.correctCell}>{a.correct}/{a.total}</td>
                      <td className={styles.dateCell}>{formatDate(a.created_at)}</td>
                      <td>
                        <Link to={`/results/${a.id}`} className={styles.reviewLink}>
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
