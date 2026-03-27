import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { startGeneration } from '../../lib/api.js';
import styles from './Generate.module.css';

const DOMAINS = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LEVELS = ['medical_student', 'resident', 'fellow', 'attending'];

const LEVEL_LABELS = {
  medical_student: 'Medical Student',
  resident: 'Resident',
  fellow: 'Fellow',
  attending: 'Attending',
};

function LogEntry({ entry }) {
  const cls = {
    start: styles.logInfo,
    batch_start: styles.logInfo,
    batch_done: styles.logSuccess,
    batch_error: styles.logError,
    retry: styles.logWarning,
    complete: styles.logComplete,
  }[entry.event] || styles.logInfo;

  const prefix = {
    start: '▶ START',
    batch_start: '⟳ BATCH',
    batch_done: '✓ DONE',
    batch_error: '✗ ERROR',
    retry: '↺ RETRY',
    complete: '★ COMPLETE',
  }[entry.event] || entry.event.toUpperCase();

  let msg = '';
  const d = entry.data;
  if (entry.event === 'start') msg = `Generating ${d.total} questions for ${d.domain} — ${d.subtopic || 'General'}`;
  else if (entry.event === 'batch_start') msg = `Batch ${d.batch}: requesting ${d.count} questions…`;
  else if (entry.event === 'batch_done') msg = `Batch ${d.batch}: inserted ${d.inserted} questions (total: ${d.totalInserted})`;
  else if (entry.event === 'batch_error') msg = `Batch ${d.batch}: ${d.error}`;
  else if (entry.event === 'retry') msg = `Batch ${d.batch}, attempt ${d.attempt}: ${d.error}`;
  else if (entry.event === 'complete') msg = `Generation complete! ${d.totalInserted} questions added to review queue.`;
  else msg = JSON.stringify(d);

  return (
    <div className={`${styles.logEntry} ${cls}`}>
      <span className={styles.logPrefix}>{prefix}</span>
      <span className={styles.logMsg}>{msg}</span>
    </div>
  );
}

export default function Generate() {
  const { getToken } = useAuth();

  const [domain, setDomain] = useState('Breast Cancer');
  const [subtopic, setSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [level, setLevel] = useState('resident');
  const [count, setCount] = useState(10);

  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(null);
  const [error, setError] = useState('');

  function addLog(event, data) {
    setLog(prev => [...prev, { event, data, id: Date.now() + Math.random() }]);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLog([]);
    setComplete(null);
    setError('');
    setRunning(true);

    try {
      await startGeneration(
        { domain, subtopic, difficulty, level, count },
        getToken,
        ({ event, data }) => {
          addLog(event, data);
          if (event === 'complete') {
            setComplete(data);
          }
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>AI Question Generator</h1>
          <p className={styles.subtitle}>
            Use Claude to generate surgical oncology MCQs for review.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Left Panel: Form */}
          <div className={styles.formPanel}>
            <div className={styles.warning}>
              <strong>De-identification Notice:</strong> Do not include real patient names,
              case IDs, or identifying information in the subtopic or prompts.
              All generated content is for educational purposes only.
            </div>

            <form onSubmit={handleGenerate} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Domain</label>
                <select
                  className={styles.select}
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  disabled={running}
                >
                  {DOMAINS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Subtopic</label>
                <input
                  type="text"
                  className={styles.input}
                  value={subtopic}
                  onChange={e => setSubtopic(e.target.value)}
                  placeholder="e.g. Sentinel lymph node biopsy"
                  disabled={running}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Difficulty</label>
                <select
                  className={styles.select}
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  disabled={running}
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Target Level</label>
                <select
                  className={styles.select}
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  disabled={running}
                >
                  {LEVELS.map(l => (
                    <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Number of Questions: <strong>{count}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={count}
                  onChange={e => setCount(Number(e.target.value))}
                  className={styles.range}
                  disabled={running}
                />
                <div className={styles.rangeLabels}>
                  <span>1</span><span>50</span>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.generateBtn}
                disabled={running}
              >
                {running ? '⟳ Generating…' : '✦ Generate Questions'}
              </button>
            </form>
          </div>

          {/* Right Panel: Live Log */}
          <div className={styles.logPanel}>
            <div className={styles.logHeader}>
              <span>Generation Log</span>
              {running && <span className={styles.runningDot} />}
            </div>

            <div className={styles.logScroll}>
              {log.length === 0 ? (
                <div className={styles.logEmpty}>
                  Log output will appear here once generation starts.
                </div>
              ) : (
                log.map(entry => <LogEntry key={entry.id} entry={entry} />)
              )}
            </div>

            {complete && (
              <div className={styles.completeSummary}>
                <div className={styles.completeTitle}>
                  Generation Complete!
                </div>
                <p>
                  <strong>{complete.totalInserted}</strong> questions added for{' '}
                  <strong>{complete.domain}</strong>
                  {complete.subtopic ? ` — ${complete.subtopic}` : ''}.
                </p>
                <Link to="/admin/review" className={styles.reviewLink}>
                  Go to Review Queue →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
