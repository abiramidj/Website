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

// GET / — list questions with filters and pagination
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, domain, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from('questions').select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (domain) query = query.eq('domain', domain);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ questions: data, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats — question counts grouped by domain+status
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('domain, status');

    if (error) throw error;

    const stats = {};
    for (const row of data) {
      const key = `${row.domain}__${row.status}`;
      stats[key] = (stats[key] || 0) + 1;
    }

    // Restructure into array
    const result = [];
    const domains = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
    const statuses = ['pending_review', 'approved', 'rejected'];

    for (const domain of domains) {
      const domainStats = { domain };
      let domainTotal = 0;
      for (const status of statuses) {
        const count = stats[`${domain}__${status}`] || 0;
        domainStats[status] = count;
        domainTotal += count;
      }
      domainStats.total = domainTotal;
      result.push(domainStats);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id — update a question
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, question, options, correct, explanation } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (question !== undefined) updates.question = question;
    if (options !== undefined) updates.options = options;
    if (correct !== undefined) updates.correct = correct;
    if (explanation !== undefined) updates.explanation = explanation;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Question not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /bulk/update — bulk status update
router.patch('/bulk/update', requireAdmin, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update({ status })
      .in('id', ids)
      .select('id, status');

    if (error) throw error;

    res.json({ updated: data.length, questions: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
