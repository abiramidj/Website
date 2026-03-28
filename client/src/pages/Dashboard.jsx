import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { getTopics, getAttempts } from '../lib/api.js';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, profile, isSubscribed, isAdmin, getToken } = useAuth();
  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const totalAttempts = attempts.length;
  const bestScore = attempts.length ? Math.max(...attempts.map(a => a.score ?? 0)) : null;

  useEffect(() => {
    async function load() {
      try {
        const [topicData, attemptData] = await Promise.all([
          getTopics(getToken),
          isSubscribed ? getAttempts(getToken) : Promise.resolve([]),
        ]);
        setTopics(topicData);
        setAttempts(attemptData);
      } catch {
        // non-critical — show what we can
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <video
          className={styles.heroBg}
          src="/homepage.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className={styles.heroInner}>
          <h1 className={styles.greeting}>Welcome back, {firstName}!</h1>
          <p className={styles.subGreeting}>
            Ready to sharpen your surgical oncology knowledge?
          </p>
        </div>
      </div>

      {/* Overview cards */}
      <div className={styles.container}>

        <div className={styles.overviewGrid}>

          {/* Quiz Topics card */}
          <div className={styles.overviewCard}>
            <div className={styles.cardIconWrap} style={{ background: '#ffe4e6', overflow: 'hidden', padding: 0 }}>
              <img src="/quiz_logo.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Quiz Topics</h2>
              <p className={styles.cardDesc}>
                {isSubscribed
                  ? `${topics.length} topic${topics.length !== 1 ? 's' : ''} — learn mode, test mode, subtopic drills`
                  : 'Practice clinical oncology questions with instant feedback'}
              </p>
            </div>
            {isSubscribed ? (
              <Link to="/topics" className={styles.cardAction}>Go to Quizzes →</Link>
            ) : (
              <Link to="/subscribe" className={styles.cardActionLocked}>Unlock with Pro →</Link>
            )}
          </div>

          {/* Chapter Library card */}
          <div className={styles.overviewCard}>
            <div className={styles.cardIconWrap} style={{ background: '#ccfbf1', overflow: 'hidden', padding: 0 }}>
              <img src="/books_logo.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Chapter Library</h2>
              <p className={styles.cardDesc}>
                {isSubscribed
                  ? 'Read surgical oncology chapters written by specialists'
                  : 'In-depth reading material on surgical oncology topics'}
              </p>
            </div>
            {isSubscribed ? (
              <Link to="/library" className={styles.cardAction}>Browse Library →</Link>
            ) : (
              <Link to="/subscribe" className={styles.cardActionLocked}>Unlock with Pro →</Link>
            )}
          </div>

          {/* Performance History card */}
          <div className={styles.overviewCard}>
            <div className={styles.cardIconWrap} style={{ background: '#e0e7ff', overflow: 'hidden', padding: 0 }}>
              <img src="/progress1.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Performance History</h2>
              <p className={styles.cardDesc}>
                {isSubscribed
                  ? `${totalAttempts} attempt${totalAttempts !== 1 ? 's' : ''} recorded — track your progress over time`
                  : 'Track scores, review past attempts, and measure improvement'}
              </p>
            </div>
            {isSubscribed ? (
              <Link to="/history" className={styles.cardAction}>View History →</Link>
            ) : (
              <Link to="/subscribe" className={styles.cardActionLocked}>Unlock with Pro →</Link>
            )}
          </div>

        </div>

        {/* About */}
        <div className={styles.aboutCard}>
          <div className={styles.aboutHeader}>
            <div className={styles.aboutAvatar} style={{ padding: 0, overflow: 'hidden' }}>
              <img src="/abtpl.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h2 className={styles.aboutName}>About OncoCliniq</h2>
              <p className={styles.aboutEmail}>Surgical Oncology Interactive Learning Platform</p>
            </div>
          </div>
          <div className={styles.aboutDivider} />
          <div className={styles.aboutSection}>
            <h3 className={styles.aboutSectionTitle}>About the Platform</h3>
            <p className={styles.aboutText}>
              OncoCliniq is an interactive learning platform designed for surgical oncology trainees and practitioners.
              [Platform description placeholder — replace with your content.]
            </p>
          </div>
          <div className={styles.aboutDivider} />
          <div className={styles.aboutSection}>
            <h3 className={styles.aboutSectionTitle}>About the Author</h3>
            <div className={styles.aboutAuthor}>
              <div className={styles.aboutAuthorAvatar} style={{ padding: 0, overflow: 'hidden' }}>
                <img src="/P1.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p className={styles.aboutAuthorName}>Dr. Pragatheeshwar Thirunavukarasu (Dr. Prag)</p>
                <p className={styles.aboutAuthorMeta}>Complex General Surgical Oncology &amp; General Surgery</p>
                <p className={styles.aboutText}>Dr. Pragatheeshwar Thirunavukarasu, known to many as Dr. Prag, is a board-certified cancer surgeon specializing in Complex General Surgical Oncology and General Surgery. Fellowship-trained in Surgical Oncology and Hepatopancreaticobiliary surgery, he focuses on advanced and complex cancers involving the liver, pancreas, bile ducts, and abdominal cavity. He is especially dedicated to treating challenging conditions such as liver metastases, advanced pancreatic and liver cancers, malignant ascites, and malignant bowel obstruction.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
