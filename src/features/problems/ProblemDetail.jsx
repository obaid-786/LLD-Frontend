import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getLearnerId } from '../../api/client'
import DesignEditor from '../practice/DesignEditor'
import FeedbackView from '../feedback/FeedbackView'

export default function ProblemDetail() {
  const { id } = useParams()
  const learnerId = getLearnerId()

  const [problem, setProblem] = useState(null)
  const [attemptId, setAttemptId] = useState(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(null)
  const [error, setError] = useState(null)

  // Cache the in-flight promise so Strict Mode's double-run reuses it
  const attemptPromiseRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    // Fetch problem (safe to run twice)
    api
      .getProblem(id)
      .then((p) => {
        if (!cancelled) setProblem(p)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })

    // Start (or reuse) the attempt — cached promise prevents duplicates
    if (!attemptPromiseRef.current) {
      attemptPromiseRef.current = api.startAttempt(id, learnerId)
    }

    attemptPromiseRef.current
      .then((a) => {
        // Do NOT check `cancelled` here — we want the ID to persist
        setAttemptId(a.id)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
        attemptPromiseRef.current = null // allow retry on failure
      })

    return () => {
      cancelled = true
    }
  }, [id, learnerId])

  async function handleSubmit() {
    if (!attemptId) {
      setError('Attempt is still being set up. Please wait a moment and try again.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const result = await api.submitAttempt(attemptId, content)
      setAttempt(result)
    } catch (e) {
      try {
        const fallback = await api.getAttempt(attemptId)
        if (fallback.evaluation) {
          setAttempt(fallback)
        } else {
          setError(e.message)
        }
      } catch {
        setError(e.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !problem) return <p className="error">{error}</p>
  if (!problem) return <p>Loading...</p>

  return (
    <div className="problem-detail">
      <h1>{problem.title}</h1>
      <span className="difficulty">{problem.difficulty}</span>
      <p className="description">{problem.description}</p>
      {problem.constraints && (
        <p className="constraints">
          <strong>Constraints:</strong> {problem.constraints}
        </p>
      )}

      {!attempt && (
        <>
          <DesignEditor
            content={content}
            onChange={setContent}
            onSubmit={handleSubmit}
            submitting={submitting || !attemptId}
            error={error}
          />
          {!attemptId && (
            <p className="muted" style={{ fontSize: '0.85em' }}>
              Preparing attempt…
            </p>
          )}
        </>
      )}

      {attempt && (
        <>
          <div style={{ padding: '16px', backgroundColor: '#f0f4f8', borderRadius: '8px', marginTop: '20px', marginBottom: '20px' }}>
            <h3>Your Submission</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>
              {attempt.submission_content}
            </pre>
          </div>

          <FeedbackView evaluation={attempt.evaluation} />
          <Link to="/history" className="history-link">
            View in History
          </Link>
        </>
      )}
    </div>
  )
}