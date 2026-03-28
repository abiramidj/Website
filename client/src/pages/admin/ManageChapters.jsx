import { useEffect, useState } from 'react';
import { useAuth, supabase } from '../../hooks/useAuth.jsx';
import { getAdminChapters, createChapter, updateChapter, deleteChapter, uploadChapterPdf } from '../../lib/api.js';
import styles from './ManageChapters.module.css';

const DOMAINS = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];

const EMPTY_FORM = {
  title: '', excerpt: '', content: '', domain: 'Breast Cancer',
  subtopic: '', order_index: 0, published: false,
};

function ChapterForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initial || {}) });
  const [pdfFile, setPdfFile] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.formCard}>
      <div className={styles.formRow}>
        <div className={styles.field} style={{ flex: 2 }}>
          <label className={styles.label}>Title *</label>
          <input className={styles.input} value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="Chapter title" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Domain</label>
          <select className={styles.input} value={form.domain} onChange={e => set('domain', e.target.value)}>
            {DOMAINS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className={styles.field} style={{ maxWidth: 160 }}>
          <label className={styles.label}>Subtopic</label>
          <input className={styles.input} value={form.subtopic}
            onChange={e => set('subtopic', e.target.value)} placeholder="e.g. Staging" />
        </div>
        <div className={styles.field} style={{ maxWidth: 90 }}>
          <label className={styles.label}>Order</label>
          <input className={styles.input} type="number" min={0} value={form.order_index}
            onChange={e => set('order_index', parseInt(e.target.value, 10) || 0)} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Short excerpt (shown on library page)</label>
        <input className={styles.input} value={form.excerpt}
          onChange={e => set('excerpt', e.target.value)} placeholder="One-line summary…" />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Content (Markdown supported)</label>
        <div className={styles.editorWrap}>
          <div className={styles.editorToolbar}>
            <span className={styles.toolbarHint}>Supports: # headings, **bold**, *italic*, - lists, `code`, ``` code blocks ```, &gt; blockquotes</span>
          </div>
          <textarea
            className={styles.editor}
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder={`# Chapter Title\n\nWrite your chapter content here using Markdown…\n\n## Section Heading\n\nParagraph text with **bold** and *italic* formatting.\n\n- Bullet point one\n- Bullet point two\n\n> Key clinical pearl or callout text`}
            spellCheck={false}
          />
        </div>
        <span className={styles.hint}>{form.content.length} characters · {form.content.split('\n').length} lines</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Chapter PDF (optional)</label>
        {initial?.pdf_url && !pdfFile && (
          <p className={styles.hint}>
            Current: <a href={initial.pdf_url} target="_blank" rel="noopener noreferrer">View PDF</a>
          </p>
        )}
        <input
          type="file"
          accept="application/pdf"
          className={styles.input}
          onChange={e => setPdfFile(e.target.files[0] || null)}
        />
        {pdfFile && <span className={styles.hint}>Selected: {pdfFile.name}</span>}
      </div>

      <div className={styles.formFooter}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} />
          <span className={styles.toggleLabel}>
            {form.published ? '✓ Published (visible to students)' : 'Draft (hidden from students)'}
          </span>
        </label>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={saving}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => onSave(form, pdfFile)} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Create chapter'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageChapters() {
  const { getToken } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState('list'); // 'list' | 'new' | 'edit'
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');
  const [deleting, setDeleting] = useState(null);

  async function load() {
    try {
      const data = await getAdminChapters(getToken);
      setChapters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form, pdfFile) {
    setSaving(true);
    setSaveErr('');
    try {
      let saved = editing
        ? await updateChapter(editing.id, form, getToken)
        : await createChapter(form, getToken);

      if (pdfFile) {
        const pdf_url = await uploadChapterPdf(saved.id, pdfFile, supabase);
        saved = await updateChapter(saved.id, { pdf_url }, getToken);
      }

      setChapters(chs => editing
        ? chs.map(c => c.id === saved.id ? saved : c)
        : [...chs, saved]);
      setMode('list');
      setEditing(null);
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ch) {
    if (!window.confirm(`Delete "${ch.title}"? This cannot be undone.`)) return;
    setDeleting(ch.id);
    try {
      await deleteChapter(ch.id, getToken);
      setChapters(chs => chs.filter(c => c.id !== ch.id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublished(ch) {
    try {
      const updated = await updateChapter(ch.id, { published: !ch.published }, getToken);
      setChapters(chs => chs.map(c => c.id === updated.id ? updated : c));
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  }

  if (loading) return <div className="page-loading">Loading chapters…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Chapters</h1>
          <p className={styles.subtitle}>{chapters.length} chapter{chapters.length !== 1 ? 's' : ''} · {chapters.filter(c => c.published).length} published</p>
        </div>
        {mode === 'list' && (
          <button className={styles.newBtn} onClick={() => { setMode('new'); setEditing(null); setSaveErr(''); }}>
            + New chapter
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {(mode === 'new' || mode === 'edit') && (
        <>
          <h2 className={styles.formTitle}>{mode === 'edit' ? `Editing: ${editing?.title}` : 'New Chapter'}</h2>
          {saveErr && <div className={styles.error}>{saveErr}</div>}
          <ChapterForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setMode('list'); setEditing(null); setSaveErr(''); }}
            saving={saving}
          />
        </>
      )}

      {mode === 'list' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Domain</th>
                <th>Subtopic</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chapters.length === 0 && (
                <tr><td colSpan={6} className={styles.emptyRow}>No chapters yet — create your first one.</td></tr>
              )}
              {chapters.map(ch => (
                <tr key={ch.id}>
                  <td className={styles.tdTitle}>{ch.title}</td>
                  <td>
                    <span className={`${styles.domainBadge} ${styles[`domain_${ch.domain?.replace(/\s+/g, '_')}`]}`}>
                      {ch.domain || '—'}
                    </span>
                  </td>
                  <td className={styles.tdSub}>{ch.subtopic || <em className={styles.na}>—</em>}</td>
                  <td className={styles.tdOrder}>{ch.order_index}</td>
                  <td>
                    <button
                      className={`${styles.statusBtn} ${ch.published ? styles.statusPublished : styles.statusDraft}`}
                      onClick={() => togglePublished(ch)}
                      title="Click to toggle"
                    >
                      {ch.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className={styles.tdActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => { setEditing(ch); setMode('edit'); setSaveErr(''); }}
                    >Edit</button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(ch)}
                      disabled={deleting === ch.id}
                    >{deleting === ch.id ? '…' : 'Delete'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
