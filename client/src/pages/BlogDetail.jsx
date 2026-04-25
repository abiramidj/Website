import { useParams, useNavigate } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts.js';
import styles from './BlogDetail.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ContentBlock({ block }) {
  switch (block.type) {
    case 'intro':
      return <p className={styles.intro}>{block.text}</p>;
    case 'h2':
      return <h2 className={styles.h2}>{block.text}</h2>;
    case 'p':
      return <p className={styles.p}>{block.text}</p>;
    case 'list':
      return (
        <ul className={styles.list}>
          {block.items.map((item, i) => (
            <li key={i} className={styles.listItem}>{item}</li>
          ))}
        </ul>
      );
    case 'callout':
      return (
        <div className={styles.callout}>
          <span className={styles.calloutIcon}>💡</span>
          <p className={styles.calloutText}>{block.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className={styles.notFound}>
        <p>Article not found.</p>
        <button className={styles.backBtn} onClick={() => navigate('/blog')}>← Back to Blog</button>
      </div>
    );
  }

  const currentIndex = BLOG_POSTS.findIndex(p => p.slug === slug);
  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Back link */}
        <button className={styles.backBtn} onClick={() => navigate('/blog')}>
          ← All articles
        </button>

        {/* Article header */}
        <header className={styles.articleHeader}>
          <div className={styles.headerMeta}>
            <span className={styles.categoryBadge}>{post.category}</span>
            <span className={styles.readTime}>{post.readMin} min read</span>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.excerpt}>{post.excerpt}</p>
          <div className={styles.authorRow}>
            <div className={styles.authorAvatar}>P</div>
            <div>
              <span className={styles.authorName}>Dr. Prag</span>
              <span className={styles.authorMeta}>Complex General Surgical Oncology & General Surgery &nbsp;·&nbsp; {formatDate(post.date)}</span>
            </div>
          </div>
          <div className={styles.tagRow}>
            {post.tags.map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </header>

        <hr className={styles.divider} />

        {/* Article body */}
        <article className={styles.article}>
          {post.content.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}
        </article>

        <hr className={styles.divider} />

        {/* Navigation */}
        <div className={styles.navRow}>
          {prevPost ? (
            <button className={styles.navCard} onClick={() => navigate(`/blog/${prevPost.slug}`)}>
              <span className={styles.navLabel}>← Previous</span>
              <span className={styles.navTitle}>{prevPost.title}</span>
            </button>
          ) : <div />}

          {nextPost ? (
            <button className={`${styles.navCard} ${styles.navCardRight}`} onClick={() => navigate(`/blog/${nextPost.slug}`)}>
              <span className={styles.navLabel}>Next →</span>
              <span className={styles.navTitle}>{nextPost.title}</span>
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
