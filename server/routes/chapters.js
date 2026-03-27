import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// ── Middleware ─────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user  = await verifyToken(token);
    const role  = await getUserRole(user.id);
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
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

// ── GET /api/chapters — list published chapters (students) ─────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { domain } = req.query;
    let query = supabaseAdmin
      .from('chapters')
      .select('id, title, slug, excerpt, domain, subtopic, order_index, created_at')
      .eq('published', true)
      .order('domain')
      .order('order_index');

    if (domain) query = query.eq('domain', domain);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/chapters/admin/all — list all chapters for admins ─────────────
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('id, title, slug, excerpt, domain, subtopic, order_index, published, created_at')
      .order('domain')
      .order('order_index');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/chapters/:slug — get full chapter content ─────────────────────
router.get('/:slug', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('published', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Chapter not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chapters — create chapter (admin) ────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, domain, subtopic, order_index, published } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .insert({
        title:       title.trim(),
        slug:        slugify(title),
        excerpt:     (excerpt || '').trim(),
        content:     (content || '').trim(),
        domain:      (domain || '').trim(),
        subtopic:    (subtopic || '').trim(),
        order_index: parseInt(order_index, 10) || 0,
        published:   Boolean(published),
        author_id:   req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/chapters/:id — update chapter (admin) ──────────────────────
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'excerpt', 'content', 'domain', 'subtopic', 'order_index', 'published'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Chapter not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/chapters/:id — delete chapter (admin) ─────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('chapters')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
