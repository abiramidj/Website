import { useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { importQuestions } from '../../lib/api.js';
import styles from './ImportQuestions.module.css';

const DOMAINS     = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LEVELS      = ['medical_student', 'resident', 'fellow', 'attending'];

const LEVEL_LABELS = {
  medical_student: 'Med Student',
  resident: 'Resident',
  fellow: 'Fellow',
  attending: 'Attending',
};

const TEMPLATE_JSON = JSON.stringify([
  {
    domain: 'Breast Cancer',
    subtopic: 'Staging',
    difficulty: 'medium',
    level: 'resident',
    question: 'Which TNM stage corresponds to a 2.5 cm tumour with 2 ipsilateral mobile axillary nodes and no distant metastasis?',
    options: ['Stage I', 'Stage IIA', 'Stage IIB', 'Stage IIIA'],
    correct: 1,
    explanation: 'A T2 (>2 cm, ≤5 cm) tumour with N1 (1–3 ipsilateral axillary nodes) and M0 is classified as Stage IIA.',
  },
], null, 2);

function parseCsv(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line, i) => {
    // Simple CSV parse (handles quoted fields)
    const cols = [];
    let cur = '', inQ = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQ = !inQ; }
      else if (line[c] === ',' && !inQ) { cols.push(cur); cur = ''; }
      else { cur += line[c]; }
    }
    cols.push(cur);

    const row = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] || '').trim(); });

    return {
      domain:      row.domain || '',
      subtopic:    row.subtopic || '',
      difficulty:  row.difficulty || 'medium',
      level:       row.level || 'resident',
      question:    row.question || '',
      options:     [row.option_a, row.option_b, row.option_c, row.option_d],
      correct:     parseInt(row.correct, 10),
      explanation: row.explanation || '',
    };
  });
}

export default function ImportQuestions() {
  const { getToken } = useAuth();
  const fileRef = useRef(null);

  const [tab, setTab]           = useState('json'); // 'json' | 'csv'
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed]     = useState(null);   // validated rows ready to submit
  const [parseError, setParseError] = useState('');
  const [result, setResult]     = useState(null);   // { inserted, questions }
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading]   = useState(false);

  function reset() {
    setParsed(null);
    setParseError('');
    setResult(null);
    setSubmitError('');
  }

  function handleParse() {
    reset();
    try {
      let rows;
      if (tab === 'json') {
        rows = JSON.parse(jsonText);
        if (!Array.isArray(rows)) throw new Error('JSON must be an array of question objects');
      } else {
        rows = parseCsv(jsonText);
      }
      if (!rows || rows.length === 0) throw new Error('No questions found');
      setParsed(rows);
    } catch (err) {
      setParseError(err.message);
    }
  }

  function handleFileLoad(e) {
    reset();
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let rows;
        if (file.name.endsWith('.json')) {
          rows = JSON.parse(ev.target.result);
          if (!Array.isArray(rows)) throw new Error('JSON must be an array');
        } else {
          rows = parseCsv(ev.target.result);
        }
        if (!rows || rows.length === 0) throw new Error('No questions found in file');
        setParsed(rows);
        setTab(file.name.endsWith('.json') ? 'json' : 'csv');
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (!parsed?.length) return;
    setSubmitError('');
    setLoading(true);
    try {
      const data = await importQuestions(parsed, getToken);
      setResult(data);
      setParsed(null);
      setJsonText('');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadTemplate() {
    setTab('json');
    setJsonText(TEMPLATE_JSON);
    reset();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Import Questions</h1>
          <p className={styles.subtitle}>Bulk-upload your own MCQs via JSON or CSV</p>
        </div>
        <button className={styles.templateBtn} onClick={loadTemplate}>
          Load example JSON
        </button>
      </div>

      {/* Format guide */}
      <div className={styles.guide}>
        <div className={styles.guideCol}>
          <h3 className={styles.guideTitle}>JSON format</h3>
          <pre className={styles.guidePre}>{`[
  {
    "domain": "Breast Cancer",       // required
    "subtopic": "Staging",           // optional
    "difficulty": "easy|medium|hard",
    "level": "medical_student|resident|fellow|attending",
    "question": "Question text…",   // required
    "options": ["A","B","C","D"],   // required, exactly 4
    "correct": 1,                   // required, 0–3 index
    "explanation": "Why B is right…"
  }
]`}</pre>
        </div>
        <div className={styles.guideCol}>
          <h3 className={styles.guideTitle}>CSV format</h3>
          <pre className={styles.guidePre}>{`domain,subtopic,difficulty,level,question,option_a,option_b,option_c,option_d,correct,explanation
Breast Cancer,Staging,medium,resident,"Question…",A,B,C,D,1,"Explanation…"`}</pre>
          <p className={styles.guideNote}>
            <strong>correct</strong> = 0-indexed (0=A, 1=B, 2=C, 3=D).<br />
            Domains: <em>Breast Cancer</em>, <em>GI Tumors</em>, <em>Surgical Techniques</em>
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className={styles.inputCard}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'json' ? styles.tabActive : ''}`}
            onClick={() => { setTab('json'); reset(); }}
          >JSON paste</button>
          <button
            className={`${styles.tab} ${tab === 'csv' ? styles.tabActive : ''}`}
            onClick={() => { setTab('csv'); reset(); }}
          >CSV paste</button>
          <button
            className={`${styles.tab} ${tab === 'file' ? styles.tabActive : ''}`}
            onClick={() => { setTab('file'); reset(); }}
          >Upload file</button>
        </div>

        {tab === 'file' ? (
          <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              className={styles.fileInput}
              onChange={handleFileLoad}
            />
            <span className={styles.dropIcon}>📂</span>
            <p className={styles.dropText}>Click to choose a <strong>.json</strong> or <strong>.csv</strong> file</p>
            <p className={styles.dropSub}>Max 200 questions per import</p>
          </div>
        ) : (
          <>
            <textarea
              className={styles.textarea}
              placeholder={tab === 'json'
                ? 'Paste a JSON array of question objects…'
                : 'Paste CSV with header row…'}
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); reset(); }}
              spellCheck={false}
            />
            <button className={styles.parseBtn} onClick={handleParse} disabled={!jsonText.trim()}>
              Parse &amp; preview
            </button>
          </>
        )}

        {parseError && <div className={styles.errorBox}><strong>Parse error:</strong> {parseError}</div>}
      </div>

      {/* Preview table */}
      {parsed && parsed.length > 0 && (
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span className={styles.previewCount}>{parsed.length} question{parsed.length !== 1 ? 's' : ''} ready to import</span>
            <div className={styles.previewActions}>
              <button className={styles.cancelBtn} onClick={reset}>Cancel</button>
              <button className={styles.importBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Importing…' : `Import ${parsed.length} questions →`}
              </button>
            </div>
          </div>

          {submitError && <div className={styles.errorBox}>{submitError}</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Domain</th>
                  <th>Subtopic</th>
                  <th>Difficulty</th>
                  <th>Level</th>
                  <th>Question</th>
                  <th>Correct answer</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((q, i) => {
                  const validDomain = DOMAINS.includes(q.domain);
                  const validCorrect = !isNaN(parseInt(q.correct, 10)) && q.correct >= 0 && q.correct <= 3;
                  const hasIssue = !validDomain || !q.question || !validCorrect ||
                    !Array.isArray(q.options) || q.options.length !== 4;
                  return (
                    <tr key={i} className={hasIssue ? styles.rowError : ''}>
                      <td className={styles.tdNum}>{i + 1}</td>
                      <td>
                        <span className={`${styles.domainBadge} ${validDomain ? styles[`domain${q.domain.replace(/\s+/g, '')}`] : styles.domainInvalid}`}>
                          {q.domain || '—'}
                        </span>
                      </td>
                      <td className={styles.tdSub}>{q.subtopic || <em className={styles.empty}>—</em>}</td>
                      <td>
                        <span className={`${styles.diffBadge} ${styles[`diff_${q.difficulty}`]}`}>
                          {q.difficulty || '—'}
                        </span>
                      </td>
                      <td className={styles.tdLevel}>{LEVEL_LABELS[q.level] || q.level || '—'}</td>
                      <td className={styles.tdQuestion}>
                        {q.question ? q.question.slice(0, 90) + (q.question.length > 90 ? '…' : '') : <em className={styles.empty}>Missing</em>}
                      </td>
                      <td className={styles.tdAnswer}>
                        {validCorrect && Array.isArray(q.options)
                          ? <><strong>{['A','B','C','D'][q.correct]}.</strong> {(q.options[q.correct] || '').slice(0, 40)}</>
                          : <em className={styles.empty}>Invalid</em>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <div>
            <p className={styles.successTitle}>{result.inserted} question{result.inserted !== 1 ? 's' : ''} imported successfully</p>
            <p className={styles.successSub}>They are now in <strong>pending review</strong> — go to <a href="/admin/review" className={styles.reviewLink}>Review Queue</a> to approve them.</p>
          </div>
        </div>
      )}
    </div>
  );
}
