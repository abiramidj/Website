# PRD: Surgical Oncology Education Platform
## AI Quiz Question Generator — v1.0

---

## 📝 Abstract

A web-based surgical oncology education platform built from scratch for a senior cancer surgeon to teach and assess MBBS students, residents, junior consultants, and MCh fellows. The platform enables student registration, structured quiz-taking, interactive blog-based learning, and AI-assisted quiz generation. The flagship AI feature — the Quiz Question Generator — allows the surgeon-educator to generate high-quality MCQs from any topic or clinical text in seconds, reducing quiz creation time from hours to minutes and enabling consistent, fresh assessments at scale.

---

## 🎯 Business Objectives

- Enable the surgeon to publish structured, curriculum-aligned quizzes without spending hours writing questions manually
- Provide students with a credentialed, always-available learning hub for surgical oncology
- Establish the surgeon as a thought leader in oncology education through consistent blog publishing and quiz content
- Grow a registered, engaged student base that returns weekly for new content
- Replace repetitive one-on-one Q&A with a self-serve, AI-assisted learning experience

---

## 📊 KPI

| GOAL | METRIC | QUESTION |
|---|---|---|
| Student Growth | # New Registered Users | How many students sign up within first 60 days of launch? |
| Quiz Engagement | Quiz Completion Rate | What % of students who start a quiz complete it? |
| Educator Efficiency | Time to Create 10 MCQs | Does AI reduce creation time from ~2–3 hrs to < 15 min? |
| Platform Retention | Weekly Active Users (WAU) | How many students return each week? |
| Content Quality | Avg Quiz Rating (1–5) | Do students rate quiz quality ≥ 4/5 stars? |
| Blog Reach | Monthly Blog Reads | Is thought leadership content being consumed? |

---

## 🏆 Success Criteria

- **60 days post-launch:** ≥ 50 registered students; ≥ 70% quiz completion rate
- **Educator efficiency:** AI quiz generation reduces time-per-10-questions from 2–3 hours to < 15 minutes
- **Content velocity:** Surgeon publishes ≥ 4 blog posts and ≥ 5 quizzes in first 60 days (vs near-zero previously)
- **Student satisfaction:** Quiz quality rated ≥ 4.0/5 by students
- **Zero clinical errors** published — all AI questions pass surgeon review before going live
- **Surgeon time saved:** < 2 hrs/week on student Q&A (down from untracked daily interruptions)

---

## 🚶 User Journeys

### Journey 1 — The Busy Surgeon (Educator)
Dr. Sharma finishes a morning surgery. During a 20-minute break, she opens the platform, types "Generate 5 MCQs on neck dissection levels, difficulty: hard, for MCh fellows", reviews the output, edits one question, and saves all five to the question bank. She assigns them to a new quiz and schedules an email notification to all registered fellows — all in under 15 minutes.

### Journey 2 — The MBBS Student (Learner)
Ravi, a final-year MBBS student, receives an email: "New Quiz: Breast Conservation Surgery". He clicks the link, logs in, and takes the 10-question quiz. After submitting, he sees his score (7/10), reviews explanations for the 3 he got wrong, and bookmarks one blog post on surgical margins that was linked in the rationale. He comes back the following Tuesday for the next quiz.

### Journey 3 — The MCh Fellow (Advanced Learner)
Dr. Priya, a surgical fellow, logs in independently on a Sunday night. She browses the blog section, reads a case-based article, and then attempts a case-based MCQ set linked to that article. She finishes, reviews all explanations, and rates the quiz 5/5 stars.

---

## 📖 Scenarios

| # | Scenario | User | Outcome |
|---|---|---|---|
| S1 | Surgeon generates MCQs from a topic keyword | Surgeon | 5 MCQs generated in < 10 sec, ready for review |
| S2 | Surgeon pastes a clinical case note to generate questions | Surgeon | 3 case-based MCQs derived from pasted content |
| S3 | Surgeon reviews, edits, and saves questions to bank | Surgeon | Approved questions stored with topic tags |
| S4 | Student registers with email and password | Student | Account created, welcome email received |
| S5 | Student takes a published quiz | Student | Quiz completed, score shown, explanations visible |
| S6 | Student receives email notification for new quiz | Student | Clicks link, logs in, takes quiz |
| S7 | Surgeon views dashboard with student performance | Surgeon | Sees completion rates, scores, active user count |
| S8 | Surgeon publishes a blog post | Surgeon | Post live on platform, readable by all users |

---

## 🕹️ User Flow

### Happy Path — AI Quiz Generation

1. Surgeon logs in → navigates to "Quiz Generator"
2. Enters: topic / pastes clinical text + selects count (1–20), difficulty (Easy / Medium / Hard), learner level (MBBS / Resident / MCh)
3. Clicks "Generate" → backend sends structured prompt to AI API
4. AI returns JSON array of MCQs → frontend renders formatted question cards
5. Surgeon reviews each question → edits, deletes, or regenerates individual questions
6. Clicks "Save to Question Bank" → questions stored with topic tag, difficulty, and date
7. Surgeon opens "Create Quiz" → selects questions from bank → names quiz → sets time limit
8. Clicks "Publish" → quiz goes live → email notification sent to registered students

### Happy Path — Student Quiz Flow

1. Student receives email with quiz link → clicks → redirected to login
2. Logs in (or registers) → lands on quiz page
3. Reads instructions → clicks "Start Quiz" → timer begins
4. Answers MCQs one by one → submits
5. Results page: score, correct/incorrect indicators, per-question rationale
6. Option to rate quiz (1–5 stars) → rating saved to database
7. Student can revisit completed quizzes from their dashboard

---

## 🧰 Functional Requirements

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---|---|---|---|
| Signup | Email + Password | As a student, I can register with my email and a password so I can access the platform. System validates email format, enforces min 8-char password, sends verification email. | TBD |
| Login | Email + Password | As a registered user, I can log in with my email and password. System returns JWT, redirects based on role (surgeon → admin dashboard, student → learner home). | TBD |
| Forgot Password | Email Reset | As a user, I can request a password reset link via my registered email. Link expires in 30 minutes. | TBD |
| AI Quiz Generator | Topic Input | As a surgeon, I can type a topic and select count/difficulty/level and receive MCQs instantly. Must return results in < 10 seconds. | TBD |
| AI Quiz Generator | Paste Text | As a surgeon, I can paste a clinical case and generate MCQs from it. System passes text as context to AI prompt. | TBD |
| AI Quiz Generator | Review & Edit | As a surgeon, I can edit, delete, or regenerate any individual question before saving. Changes are tracked before final save. | TBD |
| Question Bank | Save & Tag | As a surgeon, I can save approved questions with topic tag, difficulty level, and date. Questions are searchable and filterable. | TBD |
| Quiz Builder | Create & Publish | As a surgeon, I can select questions from the bank, name the quiz, set a time limit, and publish it. | TBD |
| Student Quiz | Take Quiz | As a student, I can take a published quiz with a visible timer, submit answers, and see my results with explanations immediately. | TBD |
| Blog | Read Posts | As a student, I can browse and read blog posts published by the surgeon. Posts are categorised by topic. | TBD |
| Blog | Publish Post | As a surgeon, I can create and publish blog posts with text formatting and topic tags. | TBD |
| Email Notifications | New Quiz Alert | System sends email to all registered students when a new quiz is published. Uses Gmail SMTP / newsletter integration. | TBD |
| Dashboard | Surgeon Analytics | As a surgeon, I can see: weekly active users, quiz completion rates, per-question pass/fail rates, and new registrations. | TBD |
| Dashboard | Student Progress | As a surgeon, I can view per-student quiz history: attempts, scores, and completion time. | TBD |

---

## 📐 Model Requirements

| SPECIFICATION | REQUIREMENT | RATIONALE |
|---|---|---|
| Open vs Proprietary | Proprietary (Claude Sonnet or GPT-4o) | Higher accuracy for clinical MCQ generation; better instruction-following for JSON output |
| Context Window | ≥ 16,000 tokens | Supports pasting long case notes + system prompt + few-shot examples |
| Modalities | Text only (Phase 1); Vision (Phase 2) | Phase 1 is text-based MCQs; image-based pathology Qs deferred |
| Fine Tuning Capability | Not required for v1 | Prompt engineering + few-shot examples sufficient initially |
| Latency | P50 < 8 sec, P95 < 15 sec | Surgeon is waiting in-browser; must feel responsive |
| JSON Output | Required | Frontend parses structured MCQ objects; free-text responses break rendering |
| Temperature | 0.4–0.6 | Balanced: creative distractors but clinically grounded question stems |

---

## 🧮 Data Requirements

- **Fine tuning:** Not required for v1. Use prompt engineering with few-shot MCQ examples instead.
- **Training data:** Not applicable for v1. Evaluate with surgeon review of output quality.
- **Question bank data:** Stored in relational database (PostgreSQL recommended). Schema: question_id, stem, options[ ], correct_index, rationale, topic_tag, difficulty, level, created_by, created_at, status (draft/approved/published).
- **Student data:** user_id, name, email (hashed/secured), role, registration_date, quiz_attempts[ ].
- **Quiz attempt data:** attempt_id, user_id, quiz_id, answers[ ], score, time_taken, completed_at.
- **Privacy:** No patient data ever enters the platform. Clinical cases used for quiz generation must be de-identified before pasting. PII (student email) stored encrypted at rest.
- **Retention:** Student data retained for 2 years or until account deletion. Quiz data retained indefinitely for analytics.
- **AI API:** No data sent to AI provider should contain real patient identifiers. Surgeon must confirm de-identification before generating case-based questions.

---

## 💬 Prompt Requirements

### System Prompt Policy
```
You are a surgical oncology educator creating exam-quality MCQs for medical students and 
fellows. Generate clinically accurate, educationally sound questions. Never invent 
statistics or cite fictional studies. If the topic is outside surgical oncology, 
decline and explain. Always return ONLY valid JSON — no preamble, no markdown.
```

### User Prompt Template
```
Generate {count} MCQs on: "{topic_or_text}".
Difficulty: {difficulty}. Learner level: {level}.
Return a JSON array. Each object must include:
  - "question": string (the stem)
  - "options": array of 4 strings (A–D)
  - "correct_index": integer (0–3)
  - "rationale": string (1–2 sentences explaining the correct answer)
  - "topic_tag": string
```

### Output Format Guarantees
- Response must be valid JSON array — validated server-side before returning to frontend
- If JSON is malformed: auto-retry once with repair instruction, then surface graceful error
- Rationale must be ≤ 3 sentences
- No option should be obviously absurd — all distractors must be clinically plausible

### Refusal Handling
- If prompt requests non-oncology content: return error `{ "error": "out_of_scope" }`
- If prompt contains apparent patient identifiers: flag a warning to surgeon before processing
- Hallucination guardrail: surgeon review is mandatory before any question is published (human-in-the-loop)

---

## 🧪 Testing & Measurement

### Offline Evaluation
- **Golden set:** Surgeon manually writes 30 reference MCQs across 5 topics (Breast, GI, Head & Neck, Thyroid, Melanoma)
- **Rubric:** Each AI-generated question scored on: clinical accuracy (0/1), distractor plausibility (0–2), rationale clarity (0–2)
- **Pass threshold:** ≥ 80% of generated questions score ≥ 4/5 on rubric before launch

### Online Monitoring
- Track surgeon edit rate: if surgeon edits > 50% of generated questions, prompt needs revision
- Track surgeon rejection rate: if > 20% of questions deleted before saving, escalate to prompt review
- Track student quiz rating: if avg drops below 3.5/5, trigger content quality review
- A/B test prompt variants (temperature, few-shot count) to optimise output quality post-launch

### Alerting
- AI API error rate > 5% in 1 hour → PagerDuty / email alert to developer
- Response latency P95 > 20 sec → alert + investigate
- JSON parse failure > 3 consecutive → disable generator and notify surgeon

---

## ⚠️ Risks & Mitigations

| RISK | LIKELIHOOD | MITIGATION |
|---|---|---|
| AI generates clinically inaccurate questions | Medium | Mandatory surgeon review before any question is published. Zero auto-publish. |
| Students treat AI-generated content as authoritative ground truth | Medium | Add disclaimer on every quiz: "AI-assisted content. Always verify with standard references." |
| Surgeon pastes real patient data into AI prompt | Low–Medium | Add a de-identification warning popup before case-based generation. Log usage for audit. |
| AI API costs scale unexpectedly | Low | Cache outputs for identical topic+setting combos. Set monthly spend cap with alerts. |
| Low student adoption at launch | Medium | Use existing WhatsApp groups + email newsletter for announcement. Offer a free launch quiz. |
| Invalid JSON breaks frontend rendering | Low–Medium | Server-side JSON validation + auto-retry + graceful fallback error message. |
| Platform downtime during peak study hours | Low | Deploy on reliable hosting (Vercel / Railway / AWS). Add uptime monitoring. |

---

## 💰 Costs

### Development (One-time)
- Frontend (React web app): ~4–6 weeks developer effort
- Backend (Node.js / Python API): ~4–6 weeks
- Database setup + auth: ~1 week
- AI integration + prompt engineering: ~1 week
- Testing + QA: ~1 week
- **Estimated total:** 8–10 weeks for a single full-stack developer

### Operational (Monthly, at 200 active users)
| Item | Estimate |
|---|---|
| AI API tokens (Claude Sonnet / GPT-4o) | ~$20–$50/month at typical usage |
| Hosting (Vercel + managed DB) | ~$20–$40/month |
| Email (Gmail SMTP / Resend) | Free–$10/month |
| Domain + SSL | ~$15/year |
| **Total Monthly** | **~$50–$100/month** |

---

## 🔗 Assumptions & Dependencies

- **[ASSUMPTION]** Platform is built with React (frontend) + Node.js or Python (backend) + PostgreSQL
- **[ASSUMPTION]** Surgeon will use Gmail SMTP for email notifications (no dedicated ESP initially)
- **[ASSUMPTION]** No mobile app in v1 — responsive web only
- **[ASSUMPTION]** Surgeon is the sole content creator and reviewer in v1; no co-admin role
- **[ASSUMPTION]** AI API provider is Claude (Anthropic) or OpenAI — decision to be made at build start
- **[ASSUMPTION]** Student cohort will be invited via existing WhatsApp / email lists initially
- **[DEPENDENCY]** AI API key procurement and billing setup before Phase 2 begins
- **[DEPENDENCY]** Domain name and hosting environment provisioned before Phase 1 ends
- **[DEPENDENCY]** Surgeon availability for: golden set creation (30 MCQs), pilot testing (Week 8), and final content approval

---

## 🔒 Compliance / Privacy / Legal

- **No patient data:** Platform must never store or transmit real patient information. De-identification is the surgeon's responsibility before pasting case content.
- **Student data (PII):** Email addresses stored encrypted at rest. Never shared with third parties.
- **DPDP Act (India):** Platform collects name and email — must display a privacy policy and obtain consent at registration.
- **Content ownership:** All quiz questions generated with AI and approved by the surgeon are owned by the surgeon / institution.
- **Medical disclaimer:** Platform must display: "This content is for educational purposes only and does not constitute clinical advice."
- **AI transparency:** Optional: display "AI-assisted" badge on quiz questions to inform learners.
- **Data retention:** Student accounts and quiz attempt data retained for 2 years. Account deletion available on request.
- **Audit log:** All AI generation requests logged (topic, settings, timestamp, user) for 90 days for quality review.

---

## 📣 GTM / Rollout Plan

### Pre-Launch (Weeks 1–7 — Build Phase)
- Surgeon writes 30 golden-set MCQs for prompt evaluation
- Developer builds and tests all 5 phases per Masterplan
- Surgeon reviews and approves first batch of AI-generated questions

### Soft Launch (Week 8)
- Invite 20–30 known students (existing WhatsApp groups, email lists)
- Publish 2 blog posts + 2 quizzes to seed content
- Collect feedback via Google Form after first quiz attempt

### Full Launch (Week 10)
- Open registration publicly (link shared on LinkedIn, medical college networks)
- Publish weekly quiz cadence (1 new quiz per week minimum)
- Email newsletter every 2 weeks with new content highlights

### Growth Phase (Month 3+)
- Add Task B: AI Student Q&A Chatbot
- Add Task C: AI Blog Post Drafter
- Explore partnerships with medical colleges for cohort onboarding
- Add analytics-driven quiz recommendations per student level

---

*PRD v1.0 — Generated by 100xEngineers OPT Coach | March 2026*
*Assumptions marked above can be revised. Feedback welcome on: Scope, Risks, and KPIs.*
