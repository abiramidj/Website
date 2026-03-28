import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const VALID_DIFF      = ['easy', 'medium', 'hard'];
const VALID_LEVELS    = ['medical_student', 'resident', 'fellow', 'attending'];

function domainPrefix(domain) {
  const words = domain.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return domain.substring(0, 2).toUpperCase();
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

// Generate a unique ID for a domain: BC-XXXXX-NNNN
async function generateId(domain) {
  const prefix = domainPrefix(domain) || 'XX';
  const rand   = Math.random().toString(36).substring(2, 7).toUpperCase();
  const seq    = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${rand}-${seq}`;
}

function validateRow(row, index) {
  const errors = [];
  if (!row.domain?.trim())
    errors.push(`row ${index + 1}: domain is required`);
  if (!row.question || typeof row.question !== 'string' || !row.question.trim())
    errors.push(`row ${index + 1}: question is required`);
  if (!Array.isArray(row.options) || row.options.length !== 4 || row.options.some(o => !o?.toString().trim()))
    errors.push(`row ${index + 1}: options must be an array of 4 non-empty strings`);
  const correct = parseInt(row.correct, 10);
  if (isNaN(correct) || correct < 0 || correct > 3)
    errors.push(`row ${index + 1}: correct must be 0–3`);
  if (row.difficulty && !VALID_DIFF.includes(row.difficulty))
    errors.push(`row ${index + 1}: difficulty must be easy/medium/hard`);
  if (row.level && !VALID_LEVELS.includes(row.level))
    errors.push(`row ${index + 1}: level must be medical_student/resident/fellow/attending`);
  return errors;
}

// POST /api/import  — bulk insert questions
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions must be a non-empty array' });
    }
    if (questions.length > 200) {
      return res.status(400).json({ error: 'Maximum 200 questions per import' });
    }

    // Validate all rows first
    const allErrors = questions.flatMap((q, i) => validateRow(q, i));
    if (allErrors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: allErrors });
    }

    // Build rows with generated IDs
    const rows = await Promise.all(questions.map(async (q) => ({
      id:          await generateId(q.domain),
      domain:      q.domain,
      subtopic:    (q.subtopic || '').trim(),
      type:        'mcq',
      difficulty:  q.difficulty || 'medium',
      level:       q.level || 'resident',
      question:    q.question.trim(),
      options:     q.options.map(o => o.toString().trim()),
      correct:     parseInt(q.correct, 10),
      explanation: (q.explanation || '').trim(),
      status:      'pending_review',
    })));

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(rows)
      .select('id, domain, status');

    if (error) throw error;

    res.json({ inserted: data.length, questions: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
