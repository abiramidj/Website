import { z } from 'zod';

// ── Middleware factory ─────────────────────────────────────────────────────
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.errors.map(e => {
        const path = e.path.length ? `${e.path.join('.')}: ` : '';
        return `${path}${e.message}`;
      });
      return res.status(400).json({ error: 'Validation failed', details });
    }
    req[source] = result.data; // replace with coerced/defaulted values
    next();
  };
}

// ── Shared enums ───────────────────────────────────────────────────────────
export const DOMAINS = ['Breast Cancer', 'GI Tumors', 'Surgical Techniques'];
const DIFFICULTIES   = ['easy', 'medium', 'hard'];
const LEVELS         = ['medical_student', 'resident', 'fellow', 'attending'];
const Q_STATUSES     = ['pending_review', 'approved', 'rejected'];
const SUB_STATUSES   = ['active', 'trialing', 'inactive', 'canceled'];

// ── Quiz schemas ───────────────────────────────────────────────────────────
export const quizStartSchema = z.object({
  topic:    z.string().min(1).max(100).trim(),
  subtopic: z.string().max(100).trim().optional(),
  mode:     z.enum(['learn', 'test']),
});

export const quizSubmitSchema = z.object({
  topic:       z.string().min(1).max(100).trim(),
  questionIds: z.array(z.string().min(1)).min(1).max(20),
  answers:     z.array(z.number().int().min(0).max(3)),
}).refine(
  d => d.questionIds.length === d.answers.length,
  { message: 'questionIds and answers must have the same length' },
);

// ── Admin user schemas ─────────────────────────────────────────────────────
export const createUserSchema = z.object({
  email:               z.string().email(),
  password:            z.string().min(8).max(128),
  full_name:           z.string().min(1).max(100).trim(),
  role:                z.enum(['student', 'admin']).optional().default('student'),
  subscription_status: z.enum(SUB_STATUSES).nullable().optional(),
});

export const updateUserSchema = z.object({
  full_name:           z.string().min(1).max(100).trim().optional(),
  role:                z.enum(['student', 'admin']).optional(),
  subscription_status: z.enum(SUB_STATUSES).nullable().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'At least one field is required' });

// ── Blog schemas ───────────────────────────────────────────────────────────
export const createBlogSchema = z.object({
  title:     z.string().min(1).max(200).trim(),
  content:   z.string().min(1),
  excerpt:   z.string().max(600).trim().optional().default(''),
  topic_tag: z.string().max(100).trim().optional().default(''),
  published: z.boolean().optional().default(false),
});

export const updateBlogSchema = z.object({
  title:     z.string().min(1).max(200).trim().optional(),
  content:   z.string().min(1).optional(),
  excerpt:   z.string().max(600).trim().optional(),
  topic_tag: z.string().max(100).trim().optional(),
  published: z.boolean().optional(),
});

// ── Chapter schemas ────────────────────────────────────────────────────────
export const createChapterSchema = z.object({
  title:       z.string().min(1).max(200).trim(),
  excerpt:     z.string().max(600).trim().optional().default(''),
  content:     z.string().optional().default(''),
  domain:      z.string().max(100).trim().optional().default(''),
  subtopic:    z.string().max(100).trim().optional().default(''),
  order_index: z.number().int().min(0).optional().default(0),
  published:   z.boolean().optional().default(false),
});

export const updateChapterSchema = z.object({
  title:       z.string().min(1).max(200).trim().optional(),
  excerpt:     z.string().max(600).trim().optional(),
  content:     z.string().optional(),
  domain:      z.string().max(100).trim().optional(),
  subtopic:    z.string().max(100).trim().optional(),
  order_index: z.number().int().min(0).optional(),
  published:   z.boolean().optional(),
  pdf_url:     z.string().url().startsWith('https://').nullable().optional(),
});

// ── Question schemas ───────────────────────────────────────────────────────
export const updateQuestionSchema = z.object({
  status:      z.enum(Q_STATUSES).optional(),
  question:    z.string().min(1).optional(),
  options:     z.array(z.string().min(1)).length(4).optional(),
  correct:     z.number().int().min(0).max(3).optional(),
  explanation: z.string().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const bulkUpdateSchema = z.object({
  ids:    z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(Q_STATUSES),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

// ── Generate schema ────────────────────────────────────────────────────────
export const generateSchema = z.object({
  domain:     z.enum(DOMAINS),
  subtopic:   z.string().max(100).trim().optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  level:      z.enum(LEVELS).optional(),
  count:      z.number().int().min(1).max(50).optional().default(10),
});
