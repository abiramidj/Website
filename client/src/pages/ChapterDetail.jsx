import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { getChapter } from '../lib/api.js';
import styles from './ChapterDetail.module.css';

// ── Lightweight markdown → HTML renderer (no dependencies) ────────────────
function renderMarkdown(md) {
  if (!md) return '';
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks (``` ... ```)
    .replace(/```([^`]*?)```/gs, (_, code) =>
      `<pre><code>${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Unordered lists — wrap contiguous lines
    .replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l =>
        `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    })
    // Ordered lists
    .replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l =>
        `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    })
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Paragraphs — blank-line-separated runs of text not already wrapped in a tag
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-4]|ul|ol|pre|blockquote|hr)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
}

const DOMAIN_META = {
  'Breast Cancer':       { color: '#be123c', bg: '#fff1f2' },
  'GI Tumors':           { color: '#0f766e', bg: '#f0fdfc' },
  'Surgical Techniques': { color: '#4338ca', bg: '#eef2ff' },
};

export default function ChapterDetail() {
  const { slug } = useParams();
  const { getToken } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    getChapter(slug, getToken)
      .then(setChapter)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-loading">Loading chapter…</div>;
  if (error)   return (
    <div className={styles.errorPage}>
      <p className={styles.errorMsg}>{error}</p>
      <Link to="/library" className={styles.backLink}>← Back to Library</Link>
    </div>
  );
  if (!chapter) return null;

  const meta = DOMAIN_META[chapter.domain] || { color: '#1d4ed8', bg: '#eff6ff' };
  const html = renderMarkdown(chapter.content);

  return (
    <div className={styles.page}>
      {/* Chapter header */}
      <div className={styles.header} style={{ '--accent': meta.color, '--accent-bg': meta.bg }}>
        <div className={styles.headerInner}>
          <Link to="/library" className={styles.backLink}>← Library</Link>
          <div className={styles.meta}>
            {chapter.domain && (
              <span className={styles.domainTag} style={{ color: meta.color, background: meta.bg }}>
                {chapter.domain}
              </span>
            )}
            {chapter.subtopic && (
              <span className={styles.subtopicTag}>{chapter.subtopic}</span>
            )}
          </div>
          <h1 className={styles.title}>{chapter.title}</h1>
          {chapter.excerpt && <p className={styles.excerpt}>{chapter.excerpt}</p>}
          <p className={styles.dateLine}>
            Published {new Date(chapter.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={styles.contentWrap}>
        <article
          className={styles.article}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Footer nav */}
        <div className={styles.footer}>
          <Link to="/library" className={styles.footerBack}>← Back to Library</Link>
        </div>
      </div>
    </div>
  );
}
