const BASE = (import.meta.env.VITE_API_URL || window.location.origin) + '/api';

async function authFetch(url, options = {}, getToken) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Quiz ──────────────────────────────────────────────────────────────
export function getTopics(getToken) {
  return authFetch('/quiz/topics', {}, getToken);
}

export function startQuiz(topic, getToken, subtopic = null) {
  return authFetch('/quiz/start', {
    method: 'POST',
    body: JSON.stringify({ topic, ...(subtopic ? { subtopic } : {}) }),
  }, getToken);
}

export function submitQuiz(payload, getToken) {
  return authFetch('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getToken);
}

export function getAttempts(getToken) {
  return authFetch('/quiz/attempts', {}, getToken);
}

export function getTopicHistory(topic, getToken) {
  return authFetch(`/quiz/history/${encodeURIComponent(topic)}`, {}, getToken);
}

// ── Blog ──────────────────────────────────────────────────────────────
export async function getBlogPosts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/blog${query ? '?' + query : ''}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');
  return data;
}

export async function getBlogPost(slug) {
  const res = await fetch(`${BASE}/blog/${encodeURIComponent(slug)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Post not found');
  return data;
}

export function getAdminBlogPosts(getToken) {
  return authFetch('/blog/admin/all', {}, getToken);
}

export function createBlogPost(payload, getToken) {
  return authFetch('/blog', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getToken);
}

export function updateBlogPost(id, payload, getToken) {
  return authFetch(`/blog/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, getToken);
}

export function deleteBlogPost(id, getToken) {
  return authFetch(`/blog/${id}`, { method: 'DELETE' }, getToken);
}

// ── Questions ─────────────────────────────────────────────────────────
export function getQuestions(params = {}, getToken) {
  const query = new URLSearchParams(params).toString();
  return authFetch(`/questions${query ? '?' + query : ''}`, {}, getToken);
}

export function getQuestionStats(getToken) {
  return authFetch('/questions/stats', {}, getToken);
}

export function updateQuestion(id, payload, getToken) {
  return authFetch(`/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, getToken);
}

export function bulkUpdateQuestions(ids, status, getToken) {
  return authFetch('/questions/bulk/update', {
    method: 'PATCH',
    body: JSON.stringify({ ids, status }),
  }, getToken);
}

// ── Generate (SSE) ────────────────────────────────────────────────────
export async function startGeneration(payload, getToken, onEvent) {
  const token = await getToken();
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to start generation' }));
    throw new Error(err.error || 'Generation failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    let currentEvent = null;
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (currentEvent && onEvent) {
            onEvent({ event: currentEvent, data: parsed });
          }
        } catch {
          // ignore parse errors
        }
        currentEvent = null;
      }
    }
  }
}

// ── Payments ──────────────────────────────────────────────────────────
export function getSubscriptionStatus(getToken) {
  return authFetch('/payments/status', {}, getToken);
}

export function createCheckoutSession(plan, getToken) {
  return authFetch('/payments/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }, getToken);
}

export function createPortalSession(getToken) {
  return authFetch('/payments/create-portal-session', { method: 'POST' }, getToken);
}

// ── Chapters ──────────────────────────────────────────────────────────
export function getChapters(getToken, domain = '') {
  const query = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  return authFetch(`/chapters${query}`, {}, getToken);
}

export function getChapter(slug, getToken) {
  return authFetch(`/chapters/${encodeURIComponent(slug)}`, {}, getToken);
}

export function getAdminChapters(getToken) {
  return authFetch('/chapters/admin/all', {}, getToken);
}

export function createChapter(payload, getToken) {
  return authFetch('/chapters', { method: 'POST', body: JSON.stringify(payload) }, getToken);
}

export function updateChapter(id, payload, getToken) {
  return authFetch(`/chapters/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, getToken);
}

export function deleteChapter(id, getToken) {
  return authFetch(`/chapters/${id}`, { method: 'DELETE' }, getToken);
}

// ── Import ────────────────────────────────────────────────────────────
export function importQuestions(questions, getToken) {
  return authFetch('/import', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  }, getToken);
}

// ── Admin ─────────────────────────────────────────────────────────────
export function getAdminStats(getToken) {
  return authFetch('/admin/stats', {}, getToken);
}

export function getAdminStudents(getToken, params = {}) {
  const query = new URLSearchParams(params).toString();
  return authFetch(`/admin/students${query ? '?' + query : ''}`, {}, getToken);
}

export function getStudentAttempts(userId, getToken) {
  return authFetch(`/admin/students/${userId}/attempts`, {}, getToken);
}
