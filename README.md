# OncoCliniq

Evidence-based MCQ and clinical learning platform for surgical oncology — built for MBBS students, residents, and MCh fellows.

**Live URL:** https://website-demo-teal.vercel.app

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Routing](#routing)
- [API Reference](#api-reference)
- [Authentication & Access Control](#authentication--access-control)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)

---

## Overview

OncoCliniq is a full-stack web application that enables a surgeon-educator to publish structured quizzes, manage a question bank, write clinical blog posts, and generate MCQs using AI — all from a single admin interface. Students register, subscribe, and take quizzes in Learn or Test mode with instant feedback and performance tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, CSS Modules |
| Backend | Node.js (ESM) + Express 4 |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| AI | Anthropic Claude (`claude-sonnet`) via `@anthropic-ai/sdk` |
| Payments | Stripe — Checkout + Customer Portal + Webhooks |
| Hosting | Vercel (frontend + serverless API) |
| Storage | Supabase Storage (chapter PDF uploads) |

---

## Project Structure

```
demo1/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx              # Top navigation, theme toggle, user dropdown
│       │   ├── ProtectedRoute.jsx      # Route guards: Protected / Subscribed / Admin
│       │   └── SessionTimeoutModal.jsx # 60-second countdown warning modal
│       ├── data/
│       │   └── blogPosts.js            # Static blog content (Dr. Prag's articles)
│       ├── hooks/
│       │   ├── useAuth.jsx             # Supabase auth state, signIn/signOut/getToken
│       │   ├── useSessionTimeout.js    # 5-min idle timer with warning + logout
│       │   └── useTheme.jsx            # Light/dark mode with localStorage persistence
│       ├── lib/
│       │   └── api.js                  # All API client functions (authFetch wrapper)
│       └── pages/
│           ├── Login.jsx / Register.jsx / ForgotPassword.jsx / ResetPassword.jsx
│           ├── Dashboard.jsx           # Student home — stats, recent attempts
│           ├── Topics.jsx              # Quiz topic browser with Learn/Test mode tabs
│           ├── Quiz.jsx / QuizLearn.jsx / QuizTest.jsx
│           ├── Results.jsx             # Post-quiz score + per-question explanations
│           ├── History.jsx             # All past quiz attempts
│           ├── Blogs.jsx               # Blog listing — featured card + grid
│           ├── BlogDetail.jsx          # Full article view with prev/next navigation
│           ├── Chapters.jsx            # Library chapter browser
│           ├── ChapterDetail.jsx       # Chapter reader with PDF support
│           ├── Subscribe.jsx           # Stripe subscription plans
│           ├── SubscribeSuccess.jsx    # Post-payment confirmation
│           └── admin/
│               ├── AdminDashboard.jsx  # Platform analytics and student performance
│               ├── Generate.jsx        # AI MCQ generator (SSE streaming)
│               ├── ReviewQueue.jsx     # Approve / edit / delete generated questions
│               ├── ImportQuestions.jsx # Bulk JSON question import
│               ├── ManageChapters.jsx  # Chapter CRUD + PDF upload
│               └── ManageUsers.jsx     # User CRUD — add, edit, delete, role/subscription
├── server/                     # Express API (Node.js ESM)
│   ├── index.js                # App entry, middleware, route mounting
│   ├── lib/
│   │   ├── claude.js           # Anthropic SDK client
│   │   └── supabase.js         # Supabase admin client (service role)
│   └── routes/
│       ├── auth.js             # Profile fetch and role-based redirect
│       ├── generate.js         # AI generation endpoint (SSE)
│       ├── questions.js        # Question bank CRUD + bulk operations
│       ├── quiz.js             # Topics, start, submit, attempts, history
│       ├── blog.js             # Blog post CRUD (public read, admin write)
│       ├── chapters.js         # Chapter CRUD + PDF URL management
│       ├── import.js           # Bulk question import (JSON)
│       ├── admin.js            # Analytics, student list, user management
│       └── payments.js         # Stripe checkout, portal, webhook handler
├── vercel.json                 # Rewrites: /api/* → serverless, /* → index.html
└── package.json                # Monorepo root (npm workspaces)
```

---

## Features

### Student Features

| Feature | Description |
|---|---|
| Registration & Login | Email + password via Supabase Auth; forgot/reset password flow |
| Session Timeout | 5-minute idle detection; 60-second warning modal before auto sign-out |
| Dashboard | Personal stats: quizzes taken, topics attempted, best score |
| Quiz — Learn Mode | Instant answer reveal with explanation after each question |
| Quiz — Test Mode | Answer all questions first; results + explanations shown at the end |
| Topic & Subtopic Filter | Browse topics; expand subtopics; resume or restart in-progress sessions |
| Quiz History | Full attempt log with scores, dates, and review links |
| Blog | Read clinical articles by Dr. Prag — available to all logged-in users |
| Library | Browse and read chapter-based reference content with PDF downloads |
| Subscription | Stripe-powered monthly / annual Pro plan; Stripe Customer Portal for billing |
| Dark / Light Mode | System-aware default; persisted in localStorage |

### Admin Features

| Feature | Description |
|---|---|
| Analytics Dashboard | Platform-wide stats: active users, quiz completions, question bank size |
| AI Question Generator | Type a topic or paste clinical text → streaming MCQ generation via Claude |
| Review Queue | Approve, edit, or delete AI-generated questions before publishing |
| Bulk Import | Paste/upload JSON arrays of questions directly to the question bank |
| Chapter Management | Create, edit, delete chapters; upload PDFs to Supabase Storage |
| User Management | Full CRUD — create users with role and subscription, edit, or delete |

### AI Question Generation

The AI generator uses **Server-Sent Events (SSE)** for real-time streaming output. Each generated question is streamed to the frontend as it is produced, so the surgeon sees questions appearing one by one rather than waiting for the full batch.

- **Model:** Claude Sonnet (Anthropic)
- **Inputs:** Topic keyword or pasted clinical text, question count (1–20), difficulty (Easy / Medium / Hard), learner level (MBBS / Resident / MCh Fellow)
- **Output format:** Validated JSON — `question`, `options[4]`, `correct_index`, `rationale`, `topic_tag`
- **Guardrail:** All generated questions require surgeon review and explicit approval before reaching any student

### Stripe Payments

- Monthly and annual Pro subscription plans
- Checkout via Stripe-hosted page (`/subscribe`)
- Stripe Customer Portal for plan changes and cancellation (`Manage billing` in nav dropdown)
- Webhook events handled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Subscription status synced to Supabase `profiles` table on every webhook event

---

## Routing

### Public (no login required)
| Path | Page |
|---|---|
| `/login` | Login |
| `/register` | Registration |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset (token from email) |

### Protected (login required)
| Path | Page |
|---|---|
| `/dashboard` | Student dashboard |
| `/subscribe` | Subscription plans |
| `/subscribe/success` | Post-payment confirmation |
| `/blog` | Blog listing |
| `/blog/:slug` | Blog article |

### Subscribed (Pro plan required)
| Path | Page |
|---|---|
| `/topics` | Quiz topic browser |
| `/history` | Quiz attempt history |
| `/quiz/:topic` | Topic overview |
| `/quiz/:topic/learn` | Learn mode quiz |
| `/quiz/:topic/test` | Test mode quiz |
| `/results/:attemptId` | Quiz results |
| `/library` | Chapter library |
| `/library/:slug` | Chapter detail |

### Admin only
| Path | Page |
|---|---|
| `/admin` | Analytics dashboard |
| `/admin/generate` | AI MCQ generator |
| `/admin/review` | Review queue |
| `/admin/import` | Bulk import |
| `/admin/chapters` | Chapter management |
| `/admin/users` | User management |

---

## API Reference

Base path: `/api`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/profile` | Fetch current user profile and role |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| GET | `/quiz/topics` | List all topics with question count and attempt stats |
| POST | `/quiz/start` | Start a quiz session (returns shuffled questions) |
| POST | `/quiz/submit` | Submit answers; returns score and attempt ID |
| GET | `/quiz/attempts` | All attempts for the current user |
| GET | `/quiz/history/:topic` | Attempt history for a specific topic |

### Questions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/questions` | List questions (filter by topic, status, difficulty) |
| GET | `/questions/stats` | Question bank counts by status |
| GET | `/questions/domains` | All unique domain/topic values |
| PATCH | `/questions/:id` | Update a single question |
| DELETE | `/questions/:id` | Delete a single question |
| PATCH | `/questions/bulk/update` | Bulk status update |
| DELETE | `/questions/bulk/delete` | Bulk delete |

### AI Generation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/generate` | Stream MCQ generation via SSE (admin only) |

### Blog
| Method | Endpoint | Description |
|---|---|---|
| GET | `/blog` | List published posts (public) |
| GET | `/blog/:slug` | Get single post (public) |
| GET | `/blog/admin/all` | All posts including drafts (admin) |
| POST | `/blog` | Create post (admin) |
| PATCH | `/blog/:id` | Update post (admin) |
| DELETE | `/blog/:id` | Delete post (admin) |

### Chapters (Library)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/chapters` | List published chapters |
| GET | `/chapters/:slug` | Get single chapter |
| GET | `/chapters/admin/all` | All chapters including drafts (admin) |
| POST | `/chapters` | Create chapter (admin) |
| PATCH | `/chapters/:id` | Update chapter (admin) |
| DELETE | `/chapters/:id` | Delete chapter (admin) |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/payments/status` | Current subscription status |
| POST | `/payments/create-checkout-session` | Create Stripe checkout session |
| POST | `/payments/create-portal-session` | Create Stripe Customer Portal session |
| POST | `/payments/webhook` | Stripe webhook receiver (raw body) |

### Import
| Method | Endpoint | Description |
|---|---|---|
| POST | `/import` | Bulk import question JSON array (admin) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | Platform analytics summary |
| GET | `/admin/students` | Paginated student list with search |
| GET | `/admin/students/:id/attempts` | All quiz attempts for a student |
| GET | `/admin/users` | Paginated user list (search + role filter) |
| POST | `/admin/users` | Create user (Supabase Auth + profile) |
| PATCH | `/admin/users/:id` | Update user role and subscription |
| DELETE | `/admin/users/:id` | Delete user account and profile |

---

## Authentication & Access Control

Authentication is handled by **Supabase Auth**. On login, Supabase returns a JWT which is attached as a `Bearer` token on every API request.

The server verifies tokens using `supabaseAdmin.auth.getUser(token)` on every protected endpoint. Role and subscription checks are enforced server-side against the `profiles` table.

### Client-side route guards (`ProtectedRoute.jsx`)

| Guard | Requirement |
|---|---|
| `ProtectedRoute` | Valid Supabase session |
| `SubscribedRoute` | Session + `subscription_status` is `active` or `trialing` |
| `AdminRoute` | Session + `role` is `admin` |

### Session timeout

- Idle detection fires after **5 minutes** of no user interaction
- A 60-second countdown modal appears before auto sign-out
- Activity events (mouse, keyboard, scroll, touch) reset the timer
- The timer is paused during the warning modal to prevent race conditions

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `PORT` | Local server port (default: 3001) |
| `CLIENT_URL` | Allowed CORS origin (e.g. `https://your-app.vercel.app`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PRICE_MONTHLY` | Stripe Price ID for monthly plan |
| `STRIPE_PRICE_ANNUAL` | Stripe Price ID for annual plan |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_API_URL` | API base URL (omit in production — defaults to `window.location.origin`) |

---

## Running Locally

**Prerequisites:** Node.js 18+, npm 9+

```bash
# 1. Clone and install all dependencies
git clone <repo-url>
cd demo1
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your keys

# Create client/.env
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > client/.env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> client/.env

# 3. Start both frontend and backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API health check: http://localhost:3001/api/health

---

## Deployment

The app is deployed on **Vercel** as a monorepo.

- `client/` is built with Vite and served as a static site
- `server/index.js` is deployed as a Vercel Serverless Function
- `vercel.json` rewrites `/api/*` requests to the serverless function and all other paths to `index.html` for SPA routing

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.js" },
    { "source": "/(.*)",       "destination": "/index.html" }
  ]
}
```

Set all server environment variables in the Vercel project dashboard under **Settings → Environment Variables**. Set `CLIENT_URL` to the production Vercel URL and update the Stripe webhook endpoint in the Stripe dashboard to point to `https://your-app.vercel.app/api/payments/webhook`.

---

*OncoCliniq v1.0 — Built April 2026*
