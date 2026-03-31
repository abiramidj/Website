import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { getTopics, getAttempts } from '../lib/api.js';
import styles from './Topics.module.css';


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
  const [activeMode, setActiveMode] = useState('learn');

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
      const key = encodeURIComponent(t.topic);
      const checkSaved = (raw, mode) => {
        if (!raw) return null;
        try {
          const d = JSON.parse(raw);
          if (d.questions?.length) return { answered: Object.keys(d.answers || {}).length, total: d.questions.length, mode };
        } catch {}
        return null;
      };
      const learnProgress = checkSaved(localStorage.getItem(`oncoquiz_learn_${key}`), 'learn');
      const testProgress = checkSaved(localStorage.getItem(`oncoquiz_test_${key}`), 'test');
      if (learnProgress) progress[t.topic] = learnProgress;
      else if (testProgress) progress[t.topic] = testProgress;
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

      <div className={styles.modeTabBar}>
        <button
          className={`${styles.modeTabBtn} ${activeMode === 'learn' ? styles.modeTabLearnActive : ''}`}
          onClick={() => setActiveMode('learn')}
        >
          Learn Mode
        </button>
        <button
          className={`${styles.modeTabBtn} ${activeMode === 'test' ? styles.modeTabTestActive : ''}`}
          onClick={() => setActiveMode('test')}
        >
          Test Mode
        </button>
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
          return (
            <div key={t.topic} className={styles.topicCard}>
              <div className={styles.topicRow}>
                <div className={styles.topicAccent} />
                <div className={styles.topicContent}>
                  <div className={styles.topicIconWrap}>
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

                  {savedProgress[t.topic]?.mode === activeMode ? (
                    <div className={styles.topicActions}>
                      <p className={styles.progressHint}>
                        {savedProgress[t.topic].answered}/{savedProgress[t.topic].total} answered — in progress
                      </p>
                      <div className={styles.modeRow}>
                        <button
                          className={styles.startBtn}
                          onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}/${activeMode}`)}
                        >
                          Resume →
                        </button>
                        <button
                          className={styles.restartBtn}
                          onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}/${activeMode}?restart=1`)}
                        >
                          Restart
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className={activeMode === 'learn' ? styles.learnBtn : styles.testBtn}
                      onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}/${activeMode}`)}
                      disabled={t.questionCount === 0}
                    >
                      {activeMode === 'learn' ? '📖 Start Learning →' : '📝 Start Test →'}
                    </button>
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
                              className={activeMode === 'learn' ? styles.learnBtn : styles.testBtn}
                              onClick={() => navigate(`/quiz/${encodeURIComponent(t.topic)}/${activeMode}?subtopic=${encodeURIComponent(st.subtopic)}`)}
                            >
                              {activeMode === 'learn' ? 'Learn' : 'Test'}
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
