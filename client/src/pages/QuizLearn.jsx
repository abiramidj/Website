import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { startQuiz, submitQuiz } from '../lib/api.js';
import styles from './Quiz.module.css';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizLearn() {
  const { topic } = useParams();
  const decodedTopic = decodeURIComponent(topic);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subtopicParam = searchParams.get('subtopic');
  const restart = searchParams.get('restart');

  const STORAGE_KEY = `oncoquiz_learn_${encodeURIComponent(decodedTopic)}`;

  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState({});
  const [error, setError] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    async function init() {
      if (!restart) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const data = JSON.parse(saved);
            if (data.questions?.length) {
              setQuestions(data.questions);
              setAnswers(data.answers || {});
              setCurrentIdx(data.currentIdx || 0);
              setElapsed(data.elapsed || 0);
              setRevealed(data.revealed || {});
              setPhase('quiz');
              return;
            }
          } catch {}
        }
      }
      try {
        const data = await startQuiz(decodedTopic, getToken, subtopicParam, 'learn');
        setQuestions(data.questions);
        setAnswers({});
        setCurrentIdx(0);
        setElapsed(0);
        setRevealed({});
        setPhase('quiz');
      } catch (err) {
        setError(err.message);
        setPhase('error');
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'quiz' && questions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        questions, answers, currentIdx, elapsed, revealed,
        savedAt: Date.now(),
      }));
    }
  }, [answers, currentIdx, elapsed, phase, questions, revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectAnswer(qIdx, optIdx) {
    if (revealed[qIdx]) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    setRevealed(prev => ({ ...prev, [qIdx]: true }));
  }

  async function handleSubmit() {
    clearInterval(timerRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setPhase('submitting');
    try {
      const questionIds = questions.map(q => q.id);
      const answersArr = questions.map((_, i) => answers[i] ?? -1);
      const result = await submitQuiz({ topic: decodedTopic, questionIds, answers: answersArr }, getToken);
      navigate(`/results/${result.attemptId}`, { state: result });
    } catch (err) {
      setError(err.message);
      setPhase('quiz');
    }
  }

  if (phase === 'loading') return <div className="page-loading">Loading quiz…</div>;
  if (phase === 'submitting') return <div className="page-loading">Submitting your answers…</div>;
  if (phase === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.instructionsCard}>
          <p style={{ color: 'var(--red-600)', marginBottom: '1rem' }}>{error}</p>
          <button className={styles.startBtn} onClick={() => navigate('/topics')}>← Back to Topics</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const isCurrentRevealed = !!revealed[currentIdx];

  function getOptionClass(i) {
    if (!isCurrentRevealed) {
      return `${styles.optionBtn} ${answers[currentIdx] === i ? styles.optionSelected : ''}`;
    }
    if (i === currentQ.correct) return styles.optLearnCorrect;
    if (i === answers[currentIdx]) return styles.optLearnWrong;
    return styles.optLearnDimmed;
  }

  function getSidebarBtnClass(i) {
    if (i === currentIdx) return `${styles.navBtn} ${styles.navCurrent}`;
    if (revealed[i]) {
      return answers[i] === questions[i]?.correct
        ? `${styles.navBtn} ${styles.navAnswered}`
        : `${styles.navBtn} ${styles.navWrong}`;
    }
    return styles.navBtn;
  }

  return (
    <div className={styles.page}>
      <div className={styles.progressStrip}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topTopic}>{decodedTopic}</div>
          <span className={`${styles.modeBadge} ${styles.modeBadgeLearn}`}>📖 Learn</span>
          <div className={styles.topProgress}>{answeredCount}/{totalCount} answered</div>
          <div className={`${styles.topTimer} ${elapsed > 1800 ? styles.timerUrgent : ''}`}>
            <span className={styles.timerIcon}>⏱</span>
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Questions</div>
          <div className={styles.navGrid}>
            {questions.map((_, i) => (
              <button
                key={i}
                className={getSidebarBtnClass(i)}
                onClick={() => setCurrentIdx(i)}
                title={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className={styles.sidebarLegend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotAnswered}`} /> Correct
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotWrong}`} /> Wrong
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotCurrent}`} /> Current
            </span>
          </div>
        </aside>

        <main className={styles.mainContent}>
          {currentQ && (
            <div className={styles.questionCard}>
              <div className={styles.questionMeta}>
                <span className={styles.qNum}>Question {currentIdx + 1} of {totalCount}</span>
                {currentQ.difficulty && (
                  <span className={`${styles.diffBadge} ${styles[`diff_${currentQ.difficulty}`]}`}>
                    {currentQ.difficulty}
                  </span>
                )}
                <span className={styles.learnModePill}>Learn</span>
              </div>

              <p className={styles.questionStem}>{currentQ.question}</p>

              <div className={styles.optionsList}>
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    className={getOptionClass(i)}
                    onClick={() => selectAnswer(currentIdx, i)}
                  >
                    <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                    <span className={styles.optionText}>{opt}</span>
                    {isCurrentRevealed && i === currentQ.correct && (
                      <span className={styles.optMark}>✓</span>
                    )}
                    {isCurrentRevealed && i === answers[currentIdx] && i !== currentQ.correct && (
                      <span className={styles.optMark}>✗</span>
                    )}
                  </button>
                ))}
              </div>

              {isCurrentRevealed && (
                <div className={styles.learnExplanation}>
                  <span className={styles.learnExplLabel}>Explanation</span>
                  <p>{currentQ.explanation || 'No explanation available for this question.'}</p>
                </div>
              )}

              {!isCurrentRevealed && (
                <p className={styles.learnPrompt}>Select an answer to reveal the explanation</p>
              )}

              <div className={styles.navigation}>
                <button
                  className={styles.navPrev}
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                >
                  ← Previous
                </button>

                {currentIdx < totalCount - 1 ? (
                  <button
                    className={styles.navNext}
                    onClick={() => setCurrentIdx(i => Math.min(totalCount - 1, i + 1))}
                    disabled={!isCurrentRevealed}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!isCurrentRevealed}
                  >
                    Finish & See Results
                  </button>
                )}
              </div>

              {error && <div className={styles.error}>{error}</div>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
