import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { getTopics, getAttempts } from '../lib/api.js';
import styles from './Topics.module.css';

const TOPIC_META = {
  'Breast Cancer':       { icon: '🩺', accent: 'linear-gradient(90deg,#fda4af,#fb7185)', iconBg: '#fff1f2', btnBg: '#ffe4e6', btnColor: '#be123c' },
  'GI Tumors':           { icon: '🔬', accent: 'linear-gradient(90deg,#99f6e4,#5eead4)', iconBg: '#f0fdfc', btnBg: '#ccfbf1', btnColor: '#0f766e' },
  'Surgical Techniques': { icon: '🏥', accent: 'linear-gradient(90deg,#c7d2fe,#a5b4fc)', iconBg: '#f5f6ff', btnBg: '#e0e7ff', btnColor: '#4338ca' },
};
const DEFAULT_META = { icon: '📚', accent: 'linear-gradient(90deg,#bae6fd,#7dd3fc)', iconBg: '#f0f9ff', btnBg: '#dbeafe', btnColor: '#1d4ed8' };

export default function Topics() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedProgress, setSavedProgress] = useState({});
  const [subtopicsOpen, setSubtopicsOpen] = useState({});
  const [domainFilter, setDomainFilter] = useState('');

  const totalAttempts = attempts.length;
  const bestScore = attempts.length ? Math.max(...attempts.map(a => a.score ?? 0)) : null;

  useEffect(() => {
    Promise.all([getTopics(getToken), getAttempts(getToken)])
      .then(([topicData, attemptData]) => { setTopics(topicData); setAttempts(attemptData); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!topics.length) return;
    const progress = {};
    topics.forEach(t => {
      const saved = localStorage.getItem(`oncoquiz_${encodeURIComponent(t.topic)}`);
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.questions?.length) {
            progress[t.topic] = {
              answered: Object.keys(d.answers || {}).length,
              total: d.questions.length,
            };
          }
        } catch {}
      }
    });
    setSavedProgress(progress);
  }, [topics]);

  if (loading) return <div className="page-loading">Loading topics…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quiz Topics</h1>
          <p className={styles.subtitle}>{topics.length} topic{topics.length !== 1 ? 's' : ''} available — choose a topic to start</p>
        </div>
        <select
          className={styles.domainFilter}
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value)}
        >
          <option value="">All Domains</option>
          {topics.map(t => (
            <option key={t.topic} value={t.topic}>{t.topic}</option>
          ))}
        </select>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statTile}>
          <span className={styles.statNum}>{totalAttempts}</span>
          <span className={styles.statLabel}>Quizzes Taken</span>
        </div>
        <div className={styles.statTile}>
          <span className={styles.statNum}>{topics.length}</span>
          <span className={styles.statLabel}>Topics Available</span>
        </div>
        <div className={styles.statTile}>
          <span className={styles.statNum}>{bestScore !== null ? `${bestScore.toFixed(0)}%` : '—'}</span>
          <span className={styles.statLabel}>Best Score</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.topicsGrid}>
        {topics.filter(t => !domainFilter || t.topic === domainFilter).map(t => {
          const meta = TOPIC_META[t.topic] || DEFAULT_META;
          return (
            <div key={t.topic} className={styles.topicCard}>
              <div className={styles.topicRow}>
                <div className={styles.topicAccent} style={{ background: meta.accent }} />
                <div className={styles.topicContent}>
                  <div className={styles.topicIconWrap} style={{ background: meta.iconBg }}>
                    <img src="/quiz_logo.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-md)' }} />
                  </div>
                  <div className={styles.topicInfo}>
                    <h3 className={styles.topicName}>{t.topic}</h3>
                    <div className={styles.topicMeta}>
                      <div className={styles.topicStat}>
                        <span className={styles.statNum}>{t.questionCount}</span>
                        <span className={styles.statLabel}>Questions</span>
                      </div>
                      <div className={styles.topicStat}>
                        <span className={styles.statNum}>{t.attemptCount}</span>
                        <span className={styles.statLabel}>Attempts</span>
                      </div>
                      <div className={styles.topicStat}>
                        <span className={styles.statNum}>{t.bestScore ? `${t.bestScore.toFixed(0)}%` : '—'}</span>
                        <span className={styles.statLabel}>Best Score</span>
                      </div>
                    </div>
                  </div>

                  {savedProgress[t.topic] ? (
                    <div className={styles.topicActions}>
                      <p className={styles.progressHint}>
                        {savedProgress[t.topic].answered}/{savedProgress[t.topic].total} answered — in progress
                      </p>
                      <div className={styles.modeRow}>
                        <button
                          className={styles.startBtn}
                          style={{ background: meta.btnBg, color: meta.btnColor, border: `1.5px solid ${meta.btnColor}22` }}
                          onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}?mode=resume`)}
                        >
                          Resume →
                        </button>
                        <button
                          className={styles.restartBtn}
                          onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}`)}
                        >
                          Restart
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.modeRow}>
                      <button
                        className={styles.learnBtn}
                        onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}?quizMode=learn`)}
                        disabled={t.questionCount === 0}
                      >
                        📖 Learn
                      </button>
                      <button
                        className={styles.testBtn}
                        onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}?quizMode=test`)}
                        disabled={t.questionCount === 0}
                      >
                        📝 Test
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {t.subtopics?.length > 0 && (
                <div className={styles.subtopicsSection}>
                  <button
                    className={styles.subtopicsToggle}
                    onClick={() => setSubtopicsOpen(s => ({ ...s, [t.topic]: !s[t.topic] }))}
                  >
                    <span>Subtopics ({t.subtopics.length})</span>
                    <span>{subtopicsOpen[t.topic] ? '▲' : '▼'}</span>
                  </button>
                  {subtopicsOpen[t.topic] && (
                    <div className={styles.subtopicsList}>
                      {t.subtopics.map(st => (
                        <div key={st.subtopic} className={styles.subtopicRow}>
                          <div className={styles.subtopicInfo}>
                            <span className={styles.subtopicName}>{st.subtopic}</span>
                            <span className={styles.subtopicCount}>{st.questionCount}Q</span>
                          </div>
                          <div className={styles.subtopicActions}>
                            <button
                              className={styles.learnBtn}
                              onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}?quizMode=learn&subtopic=${encodeURIComponent(st.subtopic)}`)}
                            >
                              📖
                            </button>
                            <button
                              className={styles.testBtn}
                              onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}?quizMode=test&subtopic=${encodeURIComponent(st.subtopic)}`)}
                            >
                              📝
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
