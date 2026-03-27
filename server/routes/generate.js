import { Router } from 'express';
import { verifyToken, getUserRole, supabaseAdmin } from '../lib/supabase.js';
import { anthropic, buildGenerationPrompt } from '../lib/claude.js';

const router = Router();

const DOMAIN_PREFIX = {
  'Breast Cancer': 'BC',
  'GI Tumors': 'GI',
  'Surgical Techniques': 'ST',
};

function makeQuestionId(prefix, num) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${String(num).padStart(4, '0')}`;
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function validateQuestion(q) {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!q.options.every(o => typeof o === 'string' && o.trim())) return false;
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3 || !Number.isInteger(q.correct)) return false;
  if (typeof q.explanation !== 'string') return false;
  return true;
}

router.post('/', async (req, res) => {
  // Auth check
  let user;
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    user = await verifyToken(token);
    const role = await getUserRole(user.id);
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { domain, subtopic, difficulty, level, count = 10 } = req.body;

  if (!domain || !DOMAIN_PREFIX[domain]) {
    return res.status(400).json({ error: 'Invalid domain. Must be one of: Breast Cancer, GI Tumors, Surgical Techniques' });
  }

  const totalCount = Math.min(Math.max(1, parseInt(count) || 10), 50);
  const prefix = DOMAIN_PREFIX[domain];
  const BATCH_SIZE = 10;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sendSSE(res, 'start', { total: totalCount, domain, subtopic, difficulty, level });

  let globalNum = 1;
  let totalInserted = 0;
  const batches = [];

  for (let i = 0; i < totalCount; i += BATCH_SIZE) {
    batches.push(Math.min(BATCH_SIZE, totalCount - i));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchCount = batches[batchIdx];
    sendSSE(res, 'batch_start', { batch: batchIdx + 1, count: batchCount });

    const MAX_RETRIES = 2;
    let attempt = 0;
    let success = false;

    while (attempt <= MAX_RETRIES && !success) {
      try {
        const prompt = buildGenerationPrompt({ domain, subtopic, difficulty, level, count: batchCount });

        let fullText = '';
        const stream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 8000,
          thinking: { type: 'adaptive' },
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta?.type === 'text_delta'
          ) {
            fullText += chunk.delta.text;
          }
        }

        // Extract JSON array from response
        const jsonMatch = fullText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON array found in response');

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) throw new Error('Response is not an array');

        const validQuestions = parsed.filter(validateQuestion);
        if (validQuestions.length === 0) throw new Error('No valid questions in response');

        // Insert into Supabase
        const rows = validQuestions.map((q, idx) => ({
          id: makeQuestionId(prefix, globalNum + idx),
          domain,
          subtopic: subtopic || '',
          type: 'mcq',
          difficulty: difficulty || 'medium',
          level: level || 'resident',
          question: q.question.trim(),
          options: q.options.map(o => o.trim()),
          correct: q.correct,
          explanation: q.explanation.trim(),
          status: 'pending_review',
        }));

        const { error: insertError } = await supabaseAdmin
          .from('questions')
          .insert(rows);

        if (insertError) throw new Error(`DB insert error: ${insertError.message}`);

        globalNum += validQuestions.length;
        totalInserted += validQuestions.length;
        success = true;

        sendSSE(res, 'batch_done', {
          batch: batchIdx + 1,
          inserted: validQuestions.length,
          totalInserted,
        });

      } catch (err) {
        attempt++;
        if (attempt <= MAX_RETRIES) {
          sendSSE(res, 'retry', { batch: batchIdx + 1, attempt, error: err.message });
        } else {
          sendSSE(res, 'batch_error', { batch: batchIdx + 1, error: err.message });
        }
      }
    }
  }

  sendSSE(res, 'complete', { totalInserted, domain, subtopic });
  res.end();
});

export default router;
