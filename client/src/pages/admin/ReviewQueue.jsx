import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  getQuestions,
  updateQuestion,
  bulkUpdateQuestions,
} from '../../lib/api.js';
import styles from './ReviewQueue.module.css';

const DOMAINS = ['', 'Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
const STATUSES = ['', 'pending_review', 'approved', 'rejected'];
const STATUS_LABELS = {
  '': 'All Statuses',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function DifficultyBadge({ difficulty }) {
  const cls = {
    easy: styles.diffEasy,
    medium: styles.diffMedium,
    hard: styles.diffHard,
  }[difficulty] || styles.diffMedium;
  return <span className={`${styles.diffBadge} ${cls}`}>{difficulty}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    pending_review: styles.statusPending,
    approved: styles.statusApproved,
    rejected: styles.statusRejected,
  }[status] || styles.statusPending;
  const label = STATUS_LABELS[status] || status;
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

export default function ReviewQueue() {
  const { getToken } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [filterDomain, setFilterDomain] = useState('');

  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [editModal, setEditModal] = useState(null); // question object
  const [editData, setEditData] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    setSelected(new Set());
    try {
      const params = { page: pg, limit: LIMIT };
      if (filterStatus) params.status = filterStatus;
      if (filterDomain) params.domain = filterDomain;
      const data = await getQuestions(params, getToken);
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDomain]);

  useEffect(() => { load(1); }, [load]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map(q => q.id)));
    }
  }

  async function handleBulkStatus(status) {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateQuestions([...selected], status, getToken);
      await load(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleQuickStatus(id, status) {
    try {
      await updateQuestion(id, { status }, getToken);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    } catch (err) {
      setError(err.message);
    }
  }

  function openEdit(q) {
    setEditModal(q);
    setEditData({
      question: q.question,
      options: [...q.options],
      correct: q.correct,
      explanation: q.explanation,
    });
  }

  async function saveEdit() {
    if (!editModal) return;
    setEditSaving(true);
    try {
      const updated = await updateQuestion(editModal.id, editData, getToken);
      setQuestions(prev => prev.map(q => q.id === editModal.id ? updated : q));
      setEditModal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Review Queue</h1>
          <p className={styles.subtitle}>Approve, reject or edit AI-generated questions.</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Filters */}
        <div className={styles.filtersRow}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s] || 'All'}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
          >
            <option value="">All Domains</option>
            {DOMAINS.filter(Boolean).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <span className={styles.totalLabel}>{total} questions</span>
        </div>

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selected.size} selected</span>
            <button
              className={`${styles.bulkBtn} ${styles.bulkApprove}`}
              onClick={() => handleBulkStatus('approved')}
              disabled={bulkLoading}
            >
              ✓ Approve All
            </button>
            <button
              className={`${styles.bulkBtn} ${styles.bulkReject}`}
              onClick={() => handleBulkStatus('rejected')}
              disabled={bulkLoading}
            >
              ✗ Reject All
            </button>
            <button
              className={styles.bulkClear}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="page-loading">Loading questions…</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={questions.length > 0 && selected.size === questions.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>ID</th>
                  <th>Domain / Subtopic</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th className={styles.questionCol}>Question</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No questions found for these filters.
                    </td>
                  </tr>
                ) : (
                  questions.map(q => (
                    <tr key={q.id} className={selected.has(q.id) ? styles.rowSelected : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => toggleSelect(q.id)}
                        />
                      </td>
                      <td className={styles.idCell}>{q.id}</td>
                      <td>
                        <div className={styles.domainCell}>
                          <span className={styles.domainName}>{q.domain}</span>
                          {q.subtopic && (
                            <span className={styles.subtopicName}>{q.subtopic}</span>
                          )}
                        </div>
                      </td>
                      <td><DifficultyBadge difficulty={q.difficulty} /></td>
                      <td><StatusBadge status={q.status} /></td>
                      <td className={styles.questionCol}>
                        <span className={styles.questionTrunc}>
                          {q.question.length > 100
                            ? q.question.slice(0, 100) + '…'
                            : q.question}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.editBtn}
                            onClick={() => openEdit(q)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleQuickStatus(q.id, 'approved')}
                            title="Approve"
                            disabled={q.status === 'approved'}
                          >
                            ✓
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleQuickStatus(q.id, 'rejected')}
                            title="Reject"
                            disabled={q.status === 'rejected'}
                          >
                            ✗
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => load(page - 1)}
              disabled={page === 1 || loading}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => load(page + 1)}
              disabled={page === totalPages || loading}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className={styles.modalOverlay} onClick={() => setEditModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Question</h3>
              <button className={styles.modalClose} onClick={() => setEditModal(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Question Stem</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={editData.question}
                  onChange={e => setEditData(d => ({ ...d, question: e.target.value }))}
                />
              </div>

              {[0, 1, 2, 3].map(i => (
                <div key={i} className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Option {OPTION_LABELS[i]}
                    {editData.correct === i && (
                      <span className={styles.correctIndicator}> (Correct)</span>
                    )}
                  </label>
                  <div className={styles.optionRow}>
                    <input
                      type="text"
                      className={styles.optionInput}
                      value={editData.options[i] || ''}
                      onChange={e => {
                        const opts = [...editData.options];
                        opts[i] = e.target.value;
                        setEditData(d => ({ ...d, options: opts }));
                      }}
                    />
                    <input
                      type="radio"
                      name="correct"
                      checked={editData.correct === i}
                      onChange={() => setEditData(d => ({ ...d, correct: i }))}
                      title="Mark as correct"
                    />
                  </div>
                </div>
              ))}

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Explanation</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={editData.explanation}
                  onChange={e => setEditData(d => ({ ...d, explanation: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setEditModal(null)}
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={saveEdit}
                disabled={editSaving}
              >
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
