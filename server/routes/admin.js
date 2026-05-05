import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';
import { validate, createUserSchema, updateUserSchema, adminListQuerySchema, adminUsersQuerySchema } from '../lib/validate.js';

const router = Router();

const TOPICS = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];

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

// GET /stats
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    // Total students
    const { count: totalStudents, error: sErr } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    if (sErr) throw sErr;

    // Total approved questions
    const { count: totalApprovedQuestions, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    if (qErr) throw qErr;

    // Total attempts
    const { count: totalAttempts, error: aErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true });
    if (aErr) throw aErr;

    // Recent attempts (last 10)
    const { data: recentAttempts, error: rErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, student_id, topic, score, total, correct, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (rErr) throw rErr;

    // Topic stats: attempts count + avg score per topic
    const { data: allAttempts, error: tErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('topic, score');
    if (tErr) throw tErr;

    const topicStatsMap = {};
    for (const topic of TOPICS) {
      topicStatsMap[topic] = { topic, attempts: 0, totalScore: 0 };
    }
    for (const a of allAttempts) {
      if (topicStatsMap[a.topic]) {
        topicStatsMap[a.topic].attempts++;
        topicStatsMap[a.topic].totalScore += a.score;
      }
    }
    const topicStats = Object.values(topicStatsMap).map(t => ({
      topic: t.topic,
      attempts: t.attempts,
      avgScore: t.attempts > 0 ? Math.round((t.totalScore / t.attempts) * 100) / 100 : 0,
    }));

    res.json({
      totalStudents,
      totalApprovedQuestions,
      totalAttempts,
      recentAttempts,
      topicStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /students — paginated list of students
router.get('/students', requireAdmin, validate(adminListQuerySchema, 'query'), async (req, res) => {
  try {
    const { page: pageNum, limit: limitNum } = req.query;
    const offset = (pageNum - 1) * limitNum;

    const { data: profiles, error: pErr, count } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, role, created_at', { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (pErr) throw pErr;

    // Get attempt stats per student
    const userIds = profiles.map(p => p.user_id);
    if (userIds.length === 0) return res.json({ students: [], total: 0, page: pageNum, limit: limitNum });

    const { data: attempts, error: aErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('student_id, score')
      .in('student_id', userIds);

    if (aErr) throw aErr;

    const statsMap = {};
    for (const a of attempts) {
      if (!statsMap[a.student_id]) statsMap[a.student_id] = { count: 0, totalScore: 0 };
      statsMap[a.student_id].count++;
      statsMap[a.student_id].totalScore += a.score;
    }

    const students = profiles.map(p => ({
      ...p,
      attemptCount: statsMap[p.user_id]?.count || 0,
      avgScore: statsMap[p.user_id]?.count
        ? Math.round((statsMap[p.user_id].totalScore / statsMap[p.user_id].count) * 100) / 100
        : 0,
    }));

    res.json({ students, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /students/:userId/attempts
router.get('/students/:userId/attempts', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, topic, score, total, correct, created_at')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── User Management ───────────────────────────────────────────────────

// GET /users — paginated list of all users with emails
router.get('/users', requireAdmin, validate(adminUsersQuerySchema, 'query'), async (req, res) => {
  try {
    const { page: pageNum, limit: limitNum, search, role } = req.query;
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, role, subscription_status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (role)   query = query.eq('role', role);
    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data: profiles, error: pErr, count } = await query;
    if (pErr) throw pErr;

    // Fetch emails from auth in parallel
    const emailMap = {};
    await Promise.all(
      (profiles || []).map(async p => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(p.user_id);
        if (user) emailMap[p.user_id] = user.email;
      })
    );

    const users = (profiles || []).map(p => ({
      ...p,
      email: emailMap[p.user_id] || '',
    }));

    res.json({ users, total: count ?? 0, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users — create a new user
router.post('/users', requireAdmin, validate(createUserSchema), async (req, res) => {
  try {
    const { email, password, full_name, role = 'student', subscription_status = null } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password and full_name are required' });
    }

    // Create auth user
    const { data: { user }, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createErr) throw createErr;

    // Upsert profile row (trigger may or may not exist)
    const { error: profErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name,
        role,
        ...(subscription_status ? { subscription_status } : {}),
      }, { onConflict: 'user_id' });
    if (profErr) throw profErr;

    res.status(201).json({ id: user.id, email: user.email, full_name, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:userId — update profile fields
router.patch('/users/:userId', requireAdmin, validate(updateUserSchema), async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, role, subscription_status } = req.body;

    const updates = {};
    if (full_name          !== undefined) updates.full_name          = full_name;
    if (role               !== undefined) updates.role               = role;
    if (subscription_status !== undefined) updates.subscription_status = subscription_status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /users/:userId — delete user from auth (cascades to profile)
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Delete profile first (in case no cascade)
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId);

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
