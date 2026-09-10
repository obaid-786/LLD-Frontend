import { useEffect, useState } from 'react'
import { api, getLearnerId } from '../../api/client'
import FeedbackView from '../feedback/FeedbackView'

export default function AttemptHistory() {
  const learnerId = getLearnerId()
  const [attempts, setAttempts] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listAttempts(learnerId)
      .then(setAttempts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [learnerId])

  if (loading) return <p>Loading attempts...</p>
  if (error) return <p className="error">Could not load attempts: {error}</p>
  if (attempts.length === 0) return <p className="muted">No attempts yet. Start a problem first.</p>

  return (
    <div>
      <h1>My Attempts</h1>
      <div className="attempt-list">
        {attempts.map((a) => (
          <div
            key={a.id}
            className="attempt-row"
            data-testid="history-row"
          >
            <button
              type="button"
              className="attempt-header"
              onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
            >
              <span>Attempt #{a.id}</span>
              <span>Problem {a.problem_id}</span>
              <span className={`status status-${(a.status || '').toLowerCase()}`}>
                {a.status}
              </span>
            </button>
            {expandedId === a.id && (
              <div className="attempt-body">
                {a.submission_content && (
                  <pre className="snippet">{a.submission_content.slice(0, 400)}</pre>
                )}
                <FeedbackView evaluation={a.evaluation} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
