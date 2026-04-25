import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts.js';
import styles from './Blogs.module.css';

const ALL_CATEGORIES = ['All', ...Array.from(new Set(BLOG_POSTS.map(p => p.category)))];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Blogs() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = BLOG_POSTS.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const [featured, ...rest] = filtered;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.authorBadge}>
            <div className={styles.authorAvatar}>P</div>
            <div>
              <span className={styles.authorName}>Dr. Prag</span>
              <span className={styles.authorTitle}>Complex General Surgical Oncology & General Surgery</span>
            </div>
          </div>
          <h1 className={styles.title}>Clinical Insights</h1>
          <p className={styles.subtitle}>
            Evidence-based perspectives on surgical oncology — from operative technique to landmark trial analysis.
          </p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statChip}><span>{BLOG_POSTS.length}</span> posts</div>
          <div className={styles.statChip}><span>{ALL_CATEGORIES.length - 1}</span> topics</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.categoryTabs}>
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>No articles match your search.</div>
      )}

      {/* Featured post */}
      {featured && (
        <div className={styles.featuredWrap}>
          <div className={styles.featuredCard} onClick={() => navigate(`/blog/${featured.slug}`)}>
            <div className={styles.featuredMeta}>
              <span className={styles.categoryBadge}>{featured.category}</span>
              <span className={styles.featuredLabel}>Featured</span>
            </div>
            <h2 className={styles.featuredTitle}>{featured.title}</h2>
            <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
            <div className={styles.cardFooter}>
              <div className={styles.tagRow}>
                {featured.tags.slice(0, 3).map(t => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaItem}>{formatDate(featured.date)}</span>
                <span className={styles.dot} />
                <span className={styles.metaItem}>{featured.readMin} min read</span>
              </div>
            </div>
            <div className={styles.readBtn}>Read article →</div>
          </div>
        </div>
      )}

      {/* Grid of remaining posts */}
      {rest.length > 0 && (
        <div className={styles.grid}>
          {rest.map(post => (
            <div
              key={post.slug}
              className={styles.card}
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <div className={styles.cardTop}>
                <span className={styles.categoryBadge}>{post.category}</span>
              </div>
              <h3 className={styles.cardTitle}>{post.title}</h3>
              <p className={styles.cardExcerpt}>{post.excerpt}</p>
              <div className={styles.cardFooter}>
                <div className={styles.tagRow}>
                  {post.tags.slice(0, 2).map(t => (
                    <span key={t} className={styles.tag}>{t}</span>
                  ))}
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>{formatDate(post.date)}</span>
                  <span className={styles.dot} />
                  <span className={styles.metaItem}>{post.readMin} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
