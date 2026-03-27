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

export default function Quiz() {
  const { topic } = useParams();
  const decodedTopic = decodeURIComponent(topic);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');              // 'resume' | null
  const quizModeParam = searchParams.get('quizMode'); // 'learn' | 'test' | null
  const subtopicParam = searchParams.get('subtopic'); // subtopic filter | null

  const STORAGE_KEY = `oncoquiz_${encodeURIComponent(decodedTopic)}`;

  const shouldSkipInstructions = mode === 'resume' || quizModeParam != null;

  const [phase, setPhase] = useState(shouldSkipInstructions ? 'loading' : 'instructions');
  const [activeQuizMode, setActiveQuizMode] = useState(quizModeParam || 'test');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState({}); // learn mode: { [qIdx]: true }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Auto-init on mount if mode/quizMode params present
  useEffect(() => {
    if (!shouldSkipInstructions) return;
    async function init() {
      if (mode === 'resume') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const data = JSON.parse(saved);
            if (data.questions?.length) {
              setQuestions(data.questions);
              setAnswers(data.answers || {});
              setCurrentIdx(data.currentIdx || 0);
              setElapsed(data.elapsed || 0);
              setActiveQuizMode(data.quizMode || 'test');
              setRevealed(data.revealed || {});
              setPhase('quiz');
              return;
            }
          } catch {}
        }
        // No saved data — show instructions to pick mode
        setPhase('instructions');
        return;
      }
      // quizMode param: start fresh with that mode
      handleStart(quizModeParam || 'test');
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist progress while quiz is active
  useEffect(() => {
    if (phase === 'quiz' && questions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        questions, answers, currentIdx, elapsed,
        quizMode: activeQuizMode,
        revealed,
        savedAt: Date.now(),
      }));
    }
  }, [answers, currentIdx, elapsed, phase, questions, revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart(modeToUse) {
    const resolvedMode = modeToUse || quizModeParam || 'test';
    setActiveQuizMode(resolvedMode);
    setLoading(true);
    setError('');
    try {
      const data = await startQuiz(decodedTopic, getToken, subtopicParam);
      setQuestions(data.questions);
      setAnswers({});
      setCurrentIdx(0);
      setElapsed(0);
      setRevealed({});
      setPhase('quiz');
    } catch (err) {
      setError(err.message);
      setPhase('instructions');
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIdx, optIdx) {
    if (activeQuizMode === 'learn' && revealed[qIdx]) return; // locked after reveal
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    if (activeQuizMode === 'learn') {
      setRevealed(prev => ({ ...prev, [qIdx]: true }));
    }
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

  // ── Phases ─────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return <div className="page-loading">Loading quiz…</div>;
  }

  if (phase === 'submitting') {
    return <div className="page-loading">Submitting your answers…</div>;
  }

  // Mode selection / instructions screen
  if (phase === 'instructions') {
    return (
      <div className={styles.page}>
        <div className={styles.instructionsCard}>
          <h1 className={styles.instrTitle}>{decodedTopic}</h1>
          <p className={styles.instrSubtitle}>Choose how you want to study</p>

          <div className={styles.modeSelectGrid}>
            {/* Learner card */}
            <div className={`${styles.modeCard} ${styles.modeCardLearn}`}>
              <div className={styles.modeCardIcon}>📖</div>
              <h3 className={styles.modeCardTitle}>Learner Mode</h3>
              <p className={styles.modeCardDesc}>
                See the correct answer and a full explanation immediately after each question.
                Perfect for studying new material or reinforcing concepts.
              </p>
              <button
                className={`${styles.modeCardBtn} ${styles.modeCardBtnLearn}`}
                onClick={() => handleStart('learn')}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Start Learning →'}
              </button>
            </div>

            {/* Tester card */}
            <div className={`${styles.modeCard} ${styles.modeCardTest}`}>
              <div className={styles.modeCardIcon}>📝</div>
              <h3 className={styles.modeCardTitle}>Tester Mode</h3>
              <p className={styles.modeCardDesc}>
                Answer all questions without any feedback, then review your complete results
                at the end. Simulates real exam conditions.
              </p>
              <button
                className={`${styles.modeCardBtn} ${styles.modeCardBtnTest}`}
                onClick={() => handleStart('test')}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Start Test →'}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────────────

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const isLearnMode = activeQuizMode === 'learn';
  const isCurrentRevealed = isLearnMode && !!revealed[currentIdx];

  function getOptionClass(i) {
    if (!isCurrentRevealed) {
      return `${styles.optionBtn} ${answers[currentIdx] === i ? styles.optionSelected : ''}`;
    }
    if (i === currentQ.correct_index) return styles.optLearnCorrect;
    if (i === answers[currentIdx]) return styles.optLearnWrong;
    return styles.optLearnDimmed;
  }

  function getSidebarBtnClass(i) {
    if (i === currentIdx) return `${styles.navBtn} ${styles.navCurrent}`;
    if (isLearnMode && revealed[i]) {
      return answers[i] === questions[i]?.correct_index
        ? `${styles.navBtn} ${styles.navAnswered}`
        : `${styles.navBtn} ${styles.navWrong}`;
    }
    if (answers[i] !== undefined) return `${styles.navBtn} ${styles.navAnswered}`;
    return styles.navBtn;
  }

  return (
    <div className={styles.page}>
      {/* Progress strip */}
      <div className={styles.progressStrip}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topTopic}>{decodedTopic}</div>
          <span className={`${styles.modeBadge} ${isLearnMode ? styles.modeBadgeLearn : styles.modeBadgeTest}`}>
            {isLearnMode ? '📖 Learn' : '📝 Test'}
          </span>
          <div className={styles.topProgress}>{answeredCount}/{totalCount} answered</div>
          <div className={`${styles.topTimer} ${elapsed > 1800 ? styles.timerUrgent : ''}`}>
            <span className={styles.timerIcon}>⏱</span>
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
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
              <span className={`${styles.legendDot} ${styles.dotAnswered}`} />
              {isLearnMode ? 'Correct' : 'Answered'}
            </span>
            {isLearnMode && (
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotWrong}`} /> Wrong
              </span>
            )}
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotCurrent}`} /> Current
            </span>
          </div>
        </aside>

        {/* Question card */}
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
                {isLearnMode && (
                  <span className={styles.learnModePill}>Learn</span>
                )}
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
                    {isCurrentRevealed && i === currentQ.correct_index && (
                      <span className={styles.optMark}>✓</span>
                    )}
                    {isCurrentRevealed && i === answers[currentIdx] && i !== currentQ.correct_index && (
                      <span className={styles.optMark}>✗</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Explanation — learn mode only, shown after reveal */}
              {isCurrentRevealed && (
                <div className={styles.learnExplanation}>
                  <span className={styles.learnExplLabel}>Explanation</span>
                  <p>{currentQ.explanation || 'No explanation available for this question.'}</p>
                </div>
              )}

              {/* Learn mode: hint before answering */}
              {isLearnMode && !isCurrentRevealed && (
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
                    disabled={isLearnMode && !isCurrentRevealed}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={isLearnMode && !isCurrentRevealed}
                  >
                    {isLearnMode ? 'Finish & See Results' : 'Submit Quiz'}
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
