import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import generateRouter from './routes/generate.js';
import questionsRouter from './routes/questions.js';
import quizRouter from './routes/quiz.js';
import blogRouter from './routes/blog.js';
import adminRouter from './routes/admin.js';
import importRouter from './routes/import.js';
import authRouter from './routes/auth.js';
import chaptersRouter from './routes/chapters.js';
import paymentsRouter from './routes/payments.js';

const app = express();
app.set('etag', false);
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Rate limiters
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation rate limit reached, please wait a moment.' },
});

// Stripe webhook needs raw body — register BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api', defaultLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/generate', generateLimiter, generateRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/blog', blogRouter);
app.use('/api/admin', adminRouter);
app.use('/api/import', importRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/payments', paymentsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Export for Vercel serverless; also listen locally
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`OncoCliniq server running on http://localhost:${PORT}`);
  });
}

export default app;
