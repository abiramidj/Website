import { useParams, useNavigate } from 'react-router-dom';
import styles from './Quiz.module.css';

export default function Quiz() {
  const { topic } = useParams();
  const decodedTopic = decodeURIComponent(topic);
  const navigate = useNavigate();

  const encoded = encodeURIComponent(decodedTopic);

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
              onClick={() => navigate(`/quiz/${encoded}/learn`)}
            >
              Start Learning →
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
              onClick={() => navigate(`/quiz/${encoded}/test`)}
            >
              Start Test →
            </button>
          </div>
        </div>

        <button
          className={styles.startBtn}
          style={{ marginTop: '1.5rem' }}
          onClick={() => navigate('/topics')}
        >
          ← Back to Topics
        </button>
      </div>
    </div>
  );
}
