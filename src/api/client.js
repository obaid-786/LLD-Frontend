const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = body.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(', ')
          : `Request failed: ${res.status}`
    throw new Error(message)
  }
  return res.json()
}

// Mock user — no login; keep the same id so history stays on this browser.
export function getLearnerId() {
  let id = localStorage.getItem('learner_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('learner_id', id)
  }
  return id
}

export const api = {
  listProblems: () => request('/problems'),
  getProblem: (id) => request(`/problems/${id}`),
  startAttempt: (problemId, learnerId) =>
    request(`/attempts?problem_id=${problemId}&learner_id=${encodeURIComponent(learnerId)}`, {
      method: 'POST',
    }),
  listAttempts: (learnerId) =>
    request(`/attempts?learner_id=${encodeURIComponent(learnerId)}`),
  getAttempt: (id) => request(`/attempts/${id}`),
  submitAttempt: (id, content, format = 'text') =>
    request(`/attempts/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ content, format }),
    }),
}
