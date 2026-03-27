import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const TOPICS = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
const QUIZ_SIZE = 20;

// Auth middleware
async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
}

// GET /topics — topic list with question counts and student progress
router.get('/topics', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get approved question counts per topic + subtopic
    const { data: qCounts, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('domain, subtopic')
      .eq('status', 'approved');

    if (qErr) throw qErr;

    const countByDomain = {};
    const subtopicsByDomain = {};
    for (const q of qCounts) {
      countByDomain[q.domain] = (countByDomain[q.domain] || 0) + 1;
      if (!subtopicsByDomain[q.domain]) subtopicsByDomain[q.domain] = {};
      const st = q.subtopic || 'General';
      subtopicsByDomain[q.domain][st] = (subtopicsByDomain[q.domain][st] || 0) + 1;
    }

    // Get progress summaries for this student
    const { data: progress, error: pErr } = await supabaseAdmin
      .from('progress_summary')
      .select('*')
      .eq('student_id', userId);

    if (pErr) throw pErr;

    const progressByTopic = {};
    for (const p of progress) {
      progressByTopic[p.topic] = p;
    }

    const topics = TOPICS.map(topic => ({
      topic,
      questionCount: countByDomain[topic] || 0,
      attemptCount: progressByTopic[topic]?.attempt_count || 0,
      bestScore: progressByTopic[topic]?.best_score || 0,
      lastAttempted: progressByTopic[topic]?.last_attempted || null,
      subtopics: Object.entries(subtopicsByDomain[topic] || {})
        .map(([subtopic, count]) => ({ subtopic, questionCount: count }))
        .sort((a, b) => a.subtopic.localeCompare(b.subtopic)),
    }));

    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /start — start a quiz session
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { topic, subtopic } = req.body;
    const userId = req.user.id;

    if (!TOPICS.includes(topic)) {
      return res.status(400).json({ error: `Invalid topic. Must be one of: ${TOPICS.join(', ')}` });
    }

    // Get all approved questions for this topic (optionally filtered by subtopic)
    let query = supabaseAdmin
      .from('questions')
      .select('id, question, options, domain, subtopic, difficulty')
      .eq('domain', topic)
      .eq('status', 'approved');
    if (subtopic) query = query.eq('subtopic', subtopic);
    const { data: allQuestions, error: qErr } = await query;

    if (qErr) throw qErr;
    if (!allQuestions || allQuestions.length === 0) {
      return res.status(404).json({ error: 'No approved questions available for this topic' });
    }

    // Get previously seen question IDs for this student+topic
    const { data: attempts, error: aErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('question_ids')
      .eq('student_id', userId)
      .eq('topic', topic);

    if (aErr) throw aErr;

    const seenIds = new Set();
    for (const attempt of attempts || []) {
      const ids = Array.isArray(attempt.question_ids) ? attempt.question_ids : [];
      ids.forEach(id => seenIds.add(id));
    }

    // Prefer unseen questions
    const unseen = allQuestions.filter(q => !seenIds.has(q.id));
    const seen = allQuestions.filter(q => seenIds.has(q.id));

    // Shuffle helper
    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    let selected = [];
    const shuffledUnseen = shuffle(unseen);
    const shuffledSeen = shuffle(seen);

    if (shuffledUnseen.length >= QUIZ_SIZE) {
      selected = shuffledUnseen.slice(0, QUIZ_SIZE);
    } else {
      selected = [...shuffledUnseen, ...shuffledSeen].slice(0, QUIZ_SIZE);
    }

    // Return questions WITHOUT correct answer or explanation
    const questions = selected.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      domain: q.domain,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
    }));

    res.json({ questions, topic, total: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /submit — score and store quiz attempt
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { topic, questionIds, answers } = req.body;
    const userId = req.user.id;

    if (!TOPICS.includes(topic)) {
      return res.status(400).json({ error: 'Invalid topic' });
    }
    if (!Array.isArray(questionIds) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'questionIds and answers must be arrays' });
    }

    // Fetch the actual questions with correct answers
    const { data: questions, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('id, question, options, correct, explanation, subtopic')
      .in('id', questionIds);

    if (qErr) throw qErr;

    const questionMap = {};
    for (const q of questions) {
      questionMap[q.id] = q;
    }

    // Score
    let correctCount = 0;
    const responses = [];
    const subtopicMap = {};

    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i];
      const q = questionMap[qId];
      if (!q) continue;

      const studentAnswer = answers[i];
      const isCorrect = studentAnswer === q.correct;
      if (isCorrect) correctCount++;

      responses.push({
        questionId: qId,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        subtopic: q.subtopic,
        studentAnswer,
        isCorrect,
      });

      // Subtopic breakdown
      const st = q.subtopic || 'General';
      if (!subtopicMap[st]) subtopicMap[st] = { correct: 0, total: 0 };
      subtopicMap[st].total++;
      if (isCorrect) subtopicMap[st].correct++;
    }

    const total = responses.length;
    const score = total > 0 ? Math.round((correctCount / total) * 10000) / 100 : 0;

    // Insert quiz attempt
    const { data: attempt, error: insertErr } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        student_id: userId,
        topic,
        score,
        total,
        correct: correctCount,
        question_ids: questionIds,
        responses,
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    // Upsert progress summary
    const { data: existing } = await supabaseAdmin
      .from('progress_summary')
      .select('best_score, attempt_count')
      .eq('student_id', userId)
      .eq('topic', topic)
      .single();

    const bestScore = existing ? Math.max(existing.best_score, score) : score;
    const attemptCount = existing ? existing.attempt_count + 1 : 1;

    await supabaseAdmin
      .from('progress_summary')
      .upsert({
        student_id: userId,
        topic,
        best_score: bestScore,
        attempt_count: attemptCount,
        last_attempted: new Date().toISOString(),
      }, { onConflict: 'student_id,topic' });

    // Subtopic breakdown array
    const subtopicBreakdown = Object.entries(subtopicMap).map(([subtopic, stats]) => ({
      subtopic,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    res.json({
      attemptId: attempt.id,
      score,
      correct: correctCount,
      total,
      responses,
      subtopicBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/:topic — attempt history for student+topic
router.get('/history/:topic', requireAuth, async (req, res) => {
  try {
    const { topic } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, topic, score, total, correct, created_at')
      .eq('student_id', userId)
      .eq('topic', topic)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /attempts — all attempts for the logged-in student
router.get('/attempts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, topic, score, total, correct, created_at')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
