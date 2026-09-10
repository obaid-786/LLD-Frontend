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
            style={{ border: '1px solid #ddd', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}
          >
            <button
              type="button"
              className="attempt-header"
              onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fafafa', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <span>Attempt #{a.id}</span>
              {/* UPDATED: Show Problem Title */}
              <span>{a.problem_title || `Problem ${a.problem_id}`}</span>
              <span className={`status status-${(a.status || '').toLowerCase()}`}>
                {a.status}
              </span>
            </button>

            {expandedId === a.id && (
              <div className="attempt-body" style={{ padding: '20px', borderTop: '1px solid #ddd' }}>
                
                {/* NEW: Show Problem Title and Description */}
                <h3 style={{ marginTop: 0 }}>{a.problem_title || `Problem ${a.problem_id}`}</h3>
                <p style={{ fontStyle: 'italic', color: '#555', background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
                  {a.problem_description}
                </p>

                {/* UPDATED: Show full submitted answer */}
                {a.submission_content && (
                  <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h4>Your Submission</h4>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', background: '#f0f4f8', padding: '15px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                      {a.submission_content}
                    </pre>
                  </div>
                )}

                {/* Feedback View (will show scores out of 10) */}
                <FeedbackView evaluation={a.evaluation} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}