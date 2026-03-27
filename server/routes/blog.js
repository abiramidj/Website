import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// Admin middleware
async function requireAdmin(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user = await verifyToken(token);
    const role = await getUserRole(user.id);
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80) + '-' + Date.now().toString(36);
}

// GET /admin/all — admin: list all posts (must come before /:slug)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;
    res.json({ posts: data, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — public: list published posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, topic } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, parseInt(limit) || 12);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('blog_posts')
      .select('id, title, slug, excerpt, topic_tag, published, created_at', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (topic) query = query.eq('topic_tag', topic);

    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ posts: data, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:slug — public: get one published post
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — admin: create post
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, topic_tag, published = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const slug = slugify(title);

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt: excerpt || '',
        topic_tag: topic_tag || '',
        published,
        author_id: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id — admin: update post
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, topic_tag, published } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (topic_tag !== undefined) updates.topic_tag = topic_tag;
    if (published !== undefined) updates.published = published;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — admin: delete post
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
