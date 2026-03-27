import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';

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
router.get('/stats', requireAdmin, async (req, res) => {
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
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
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

export default router;
