import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import styles from './Results.module.css';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getGrade(score) {
  if (score >= 80) return { label: 'Excellent Work!', sub: 'Outstanding performance on this quiz.' };
  if (score >= 60) return { label: 'Good Job!', sub: 'Solid performance — keep it up.' };
  return { label: 'Keep Practicing', sub: 'Review the explanations below to improve.' };
}

function getBarColor(pct) {
  if (pct >= 80) return 'var(--green-500)';
  if (pct >= 60) return 'var(--amber-500)';
  return 'var(--red-500)';
}

export default function Results() {
  const { attemptId } = useParams();
  const location = useLocation();
  const { getToken } = useAuth();

  // State may come via navigate(state) or we'd need to fetch
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) {
      // If no state passed, could fetch from API — for now show message
      setLoading(false);
      setError('Result data not found. Please go back to the dashboard.');
    }
  }, []);

  if (loading) return <div className="page-loading">Loading results…</div>;
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorBox}>{error}</div>
          <Link to="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { score, correct, total, responses = [], subtopicBreakdown = [] } = data;
  const grade = getGrade(score);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Score Summary */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryTop}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNum}>{score?.toFixed(1)}%</span>
              <span className={styles.scoreLabel}>Score</span>
            </div>

            <div className={styles.summaryRight}>
              <div className={styles.gradeLabel}>{grade.label}</div>
              <div className={styles.gradeSub}>{grade.sub}</div>
              <div className={styles.metaStats}>
                <div className={styles.metaStat}>
                  <span className={styles.metaNum}>{correct}</span>
                  <span className={styles.metaLabel}>Correct</span>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaStat}>
                  <span className={styles.metaNum}>{total - correct}</span>
                  <span className={styles.metaLabel}>Incorrect</span>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaStat}>
                  <span className={styles.metaNum}>{total}</span>
                  <span className={styles.metaLabel}>Questions</span>
                </div>
              </div>

              <Link to="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
            </div>
          </div>
        </div>

        {/* Subtopic Breakdown */}
        {subtopicBreakdown.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Subtopic Breakdown</h2>
            <div className={styles.breakdownCard}>
              {subtopicBreakdown.map(st => (
                <div key={st.subtopic} className={styles.breakdownRow}>
                  <div className={styles.breakdownLabel}>{st.subtopic}</div>
                  <div className={styles.breakdownProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${st.percentage}%`,
                          background: getBarColor(st.percentage),
                        }}
                      />
                    </div>
                    <span className={styles.breakdownPct}>{st.percentage}%</span>
                    <span className={styles.breakdownFrac}>({st.correct}/{st.total})</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Question Review */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Question Review</h2>
          <div className={styles.reviewList}>
            {responses.map((r, i) => (
              <div
                key={r.questionId || i}
                className={`${styles.reviewCard} ${r.isCorrect ? styles.cardCorrect : styles.cardWrong}`}
              >
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewQNum}>Q{i + 1}</span>
                  <span className={r.isCorrect ? styles.correctTag : styles.wrongTag}>
                    {r.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  {r.subtopic && (
                    <span className={styles.subtopicTag}>{r.subtopic}</span>
                  )}
                </div>
                <p className={styles.reviewStem}>{r.question}</p>

                <div className={styles.reviewOptions}>
                  {(r.options || []).map((opt, j) => {
                    let cls = styles.reviewOpt;
                    if (j === r.correct) cls += ` ${styles.optCorrect}`;
                    else if (j === r.studentAnswer && !r.isCorrect) cls += ` ${styles.optWrong}`;
                    return (
                      <div key={j} className={cls}>
                        <span className={styles.optLbl}>{OPTION_LABELS[j]}</span>
                        <span>{opt}</span>
                        {j === r.correct && <span className={styles.correctMark}>✓</span>}
                        {j === r.studentAnswer && !r.isCorrect && <span className={styles.wrongMark}>✗</span>}
                      </div>
                    );
                  })}
                </div>

                {r.explanation && (
                  <div className={styles.explanation}>
                    <strong>Explanation:</strong> {r.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className={styles.bottomNav}>
          <Link to="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
